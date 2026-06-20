import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBranches, useBookSiteVisit, useCreateLead } from "@/lib/queries";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ branch: z.string().optional() });

export const Route = createFileRoute("/_public/book-visit")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Book a Site Visit — Aztech Co-Works" },
      { name: "description", content: "Schedule a 30-minute tour at any Aztech Co-Works branch in Coimbatore." },
    ],
  }),
  component: BookVisit,
});

const SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM",
];

function BookVisit() {
  const search = Route.useSearch();
  const { data: branches = [] } = useBranches();
  const bookSiteVisit = useBookSiteVisit();
  const createLead = useCreateLead();
  const navigate = useNavigate();

  const defaultBranch = useMemo(
    () => branches.find((b) => b.slug === search.branch)?.id ?? branches[0]?.id,
    [branches, search.branch],
  );

  const [branchId, setBranchId] = useState(defaultBranch);
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [slot, setSlot] = useState(SLOTS[0]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const onSelfServe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;
    bookSiteVisit.mutate(
      {
        ...form,
        source: "website",
        branchId,
        scheduledAt: new Date(`${date} ${slot}`).toISOString(),
        mode: "self_serve",
      },
      {
        onSuccess: () => {
          toast.success(`Visit confirmed for ${date} at ${slot}.`);
          setForm({ name: "", email: "", phone: "" });
          navigate({ to: "/" });
        },
      },
    );
  };

  const onRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;
    createLead.mutate(
      {
        ...form,
        source: "website",
        branchId,
        message: `Requested a visit — please confirm a slot`,
      },
      {
        onSuccess: () => {
          toast.success("Got it! Our sales team will call you to confirm a slot.");
          setForm({ name: "", email: "", phone: "" });
        },
      },
    );
  };

  return (
      <main className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        <Badge variant="outline" className="mb-3">Free · 30 minutes</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Book a site visit</h1>
        <p className="mt-2 text-muted-foreground">
          Tour any of our 5 Coimbatore branches. Bring your laptop — try the space for an hour.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Choose how you want to schedule</CardTitle>
            <CardDescription>Self-serve picker or have our team confirm a slot for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="self">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="self"><CheckCircle2 className="mr-1.5 h-4 w-4" /> Self-serve</TabsTrigger>
                <TabsTrigger value="req"><Clock className="mr-1.5 h-4 w-4" /> Request a visit</TabsTrigger>
              </TabsList>
              <TabsContent value="self" className="mt-6">
                <form onSubmit={onSelfServe} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Branch</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2">Pick a time slot</Label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {SLOTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlot(s)}
                          className={`rounded-md border px-3 py-2 text-sm transition ${
                            slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Phone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <Button type="submit" className="md:col-span-2" size="lg">
                    <Calendar className="mr-1.5 h-4 w-4" /> Confirm visit
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="req" className="mt-6">
                <form onSubmit={onRequest} className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Preferred branch</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <Button type="submit" className="md:col-span-2" size="lg">Request a callback</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
  );
}

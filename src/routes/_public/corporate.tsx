import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLead, useBranches } from "@/lib/queries";
import { Building2, Rocket, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/corporate")({
  head: () => ({
    meta: [
      { title: "Corporate Workspace Solutions in Coimbatore | Aztech Co-Works" },
      { name: "description", content: "Managed offices, team workspaces, and enterprise-grade SLAs for IT companies, startups, agencies, and remote teams." },
    ],
  }),
  component: CorporatePage,
});

function CorporatePage() {
  const createLead = useCreateLead();
  const { data: branches = [] } = useBranches();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    teamSize: 10,
    timeline: "1_month" as "immediate" | "1_month" | "3_months" | "exploring",
    branchId: branches[0]?.id ?? "",
    message: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate(
      {
        name: form.name,
        email: form.email,
        phone: form.phone,
        source: "corporate",
        branchId: form.branchId,
        teamSize: form.teamSize,
        timeline: form.timeline,
        message: form.message,
        customFields: { company: form.company },
      },
      {
        onSuccess: () => {
          toast.success("Thanks! Our enterprise team will reach out within 1 business hour.");
          setForm({ ...form, name: "", company: "", email: "", phone: "", message: "" });
        },
      },
    );
  };

  return (
      <main>
        <section className="bg-hero py-20 text-white">
          <div className="container mx-auto grid gap-10 px-4 md:grid-cols-2 md:px-6 md:items-center">
            <div>
              <Badge className="border-white/20 bg-white/10 text-white">For teams of 10–200</Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                Managed offices for teams that move fast.
              </h1>
              <p className="mt-4 max-w-xl text-white/75">
                Move-in ready in 30 days. Custom build-outs. Dedicated reception. Enterprise-grade SLAs.
                Pay one bill — we handle everything else.
              </p>
              <div className="mt-8 grid max-w-md grid-cols-2 gap-4 text-sm">
                <Pillar icon={Building2} title="Custom build-outs" />
                <Pillar icon={Users} title="Dedicated reception" />
                <Pillar icon={ShieldCheck} title="Enterprise SLAs" />
                <Pillar icon={Rocket} title="30-day move-in" />
              </div>
            </div>
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>Get a custom proposal</CardTitle>
                <CardDescription>Share your needs. We'll come back with options & pricing.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Company</Label><Input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                  <div><Label>Work email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Team size</Label><Input type="number" min={1} value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: Number(e.target.value) })} /></div>
                  <div>
                    <Label>Move-in</Label>
                    <Select value={form.timeline} onValueChange={(v) => setForm({ ...form, timeline: v as typeof form.timeline })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediately</SelectItem>
                        <SelectItem value="1_month">In 1 month</SelectItem>
                        <SelectItem value="3_months">In 3 months</SelectItem>
                        <SelectItem value="exploring">Just exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Preferred branch</Label>
                    <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Requirements</Label>
                    <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <Button type="submit" className="sm:col-span-2">Request proposal</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Trusted by teams across India</h2>
          <p className="mt-2 text-muted-foreground">From seed-stage startups to public companies.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {["IT services", "Product startups", "Creative agencies", "Remote-first teams"].map((s) => (
              <Card key={s}>
                <CardHeader>
                  <CardTitle className="text-base">{s}</CardTitle>
                  <CardDescription>Custom workspace solutions tailored to your team.</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>
  );
}

function Pillar({ icon: Icon, title }: { icon: typeof Building2; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <Icon className="h-4 w-4 text-accent" />
      <span className="text-sm">{title}</span>
    </div>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useStore, unsplash, inr, whatsappLink, seatTypeLabels } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/branches/$slug")({
  ssr: false,
  component: BranchDetail,
});

function BranchDetail() {
  const { slug } = Route.useParams();
  const branch = useStore((s) => s.branches.find((b) => b.slug === slug));
  const seatInventory = useStore(useShallow((s) => s.seatInventory.filter((si) => si.branchId === branch?.id)));
  const rooms = useStore(useShallow((s) => s.meetingRooms.filter((m) => m.branchId === branch?.id)));
  const plans = useStore((s) => s.plans);
  const addLead = useStore((s) => s.addLead);
  const [form, setForm] = useState({ name: "", email: "", phone: "", planId: "", message: "" });

  if (!branch) throw notFound();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addLead({
      ...form,
      source: "website",
      branchId: branch.id,
      planId: form.planId || undefined,
    });
    toast.success("Got it! Our team will reach out shortly.");
    setForm({ name: "", email: "", phone: "", planId: "", message: "" });
  };

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative h-[420px] overflow-hidden">
          <img src={unsplash(branch.photo, 1800, 900)} alt={branch.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-10 text-white md:px-6">
            <Badge className="border-white/20 bg-white/10 text-white backdrop-blur">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> {branch.availableSeats} seats available
            </Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{branch.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-white/80"><MapPin className="h-4 w-4" />{branch.address}</p>
          </div>
        </section>

        <section className="container mx-auto grid gap-10 px-4 py-12 md:px-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">About this branch</h2>
              <p className="mt-3 text-muted-foreground">{branch.description}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {branch.hours}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {branch.phone}</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Available workspaces</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {seatInventory.map((si) => (
                  <Card key={si.type}>
                    <CardHeader>
                      <CardTitle className="text-base">{seatTypeLabels[si.type]}</CardTitle>
                      <CardDescription>
                        {si.available} of {si.total} available
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inr(si.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Meeting rooms</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {rooms.map((r) => (
                  <Card key={r.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{r.name}</CardTitle>
                      <CardDescription>Seats {r.capacity}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-lg font-semibold">{inr(r.hourlyPrice)}<span className="text-xs font-normal text-muted-foreground">/hour</span></CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Amenities</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {branch.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success" /> {a}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Location</h2>
              <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
                <iframe
                  title={`${branch.name} map`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(branch.address)}&output=embed`}
                  className="h-full w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Enquire about {branch.name}</CardTitle>
                <CardDescription>We'll respond within 30 minutes during working hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (WhatsApp)</Label>
                    <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                      <SelectTrigger><SelectValue placeholder="What are you looking for?" /></SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="msg">Message</Label>
                    <Textarea id="msg" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <Button className="w-full" type="submit">Send enquiry</Button>
                  <a
                    href={whatsappLink(`Hi! I'd like to enquire about ${branch.name}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-success text-success-foreground py-2 text-sm font-medium transition hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp us
                  </a>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/book-visit" search={{ branch: branch.slug }}>
                      Book a site visit <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

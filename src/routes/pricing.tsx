import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useStore, inr, seatTypeLabels } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Aztech Co-Works Coimbatore" },
      { name: "description", content: "Transparent monthly pricing for Hot Desks, Dedicated Desks, Private Cabins, Team Offices, and Meeting Rooms." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const plans = useStore((s) => s.plans);
  const branches = useStore(useShallow((s) => s.branches.filter((b) => b.isActive)));
  const [planId, setPlanId] = useState(plans[1]?.id ?? plans[0]?.id);
  const [branchId, setBranchId] = useState(branches[0]?.id);
  const [seats, setSeats] = useState(1);
  const [months, setMonths] = useState(1);
  const plan = plans.find((p) => p.id === planId)!;
  const subtotal = plan ? plan.basePrice * seats * months : 0;
  const gst = Math.round(subtotal * (plan?.gstRate ?? 18) / 100);
  const total = subtotal + gst;

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">Pricing</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Built for every kind of team</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            All-inclusive monthly pricing. Switch plans anytime. GST extra at {18}%.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <Card key={p.id} className={`flex flex-col ${i === 1 ? "border-accent/40 shadow-glow" : ""}`}>
              {i === 1 && <Badge className="absolute -top-3 right-4 bg-accent text-accent-foreground">Most popular</Badge>}
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
                <div className="mt-3 text-3xl font-bold">{inr(p.basePrice)}<span className="text-sm font-normal text-muted-foreground"> / seat / mo</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full" variant={i === 1 ? "default" : "outline"}>
                  <Link to="/auth">Start membership <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-16">
          <CardHeader>
            <CardTitle>Pricing calculator</CardTitle>
            <CardDescription>Estimate your monthly investment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Plan</Label>
                    <Select value={planId} onValueChange={setPlanId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {seatTypeLabels[p.seatType]} · {inr(p.basePrice)}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <Label>Seats</Label>
                    <span className="font-mono font-medium">{seats}</span>
                  </div>
                  <Slider min={1} max={20} step={1} value={[seats]} onValueChange={(v) => setSeats(v[0])} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <Label>Months</Label>
                    <span className="font-mono font-medium">{months}</span>
                  </div>
                  <Slider min={1} max={12} step={1} value={[months]} onValueChange={(v) => setMonths(v[0])} />
                </div>
              </div>
              <div className="rounded-xl border bg-secondary/40 p-6">
                <div className="text-sm text-muted-foreground">Estimated total</div>
                <div className="mt-1 text-4xl font-bold tracking-tight">{inr(total)}</div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <Row label="Subtotal" value={inr(subtotal)} />
                  <Row label={`GST @ ${plan?.gstRate ?? 18}%`} value={inr(gst)} />
                  <div className="my-2 border-t" />
                  <Row label="Total" value={inr(total)} bold />
                </div>
                <Button asChild className="mt-5 w-full">
                  <Link to="/auth">Start membership</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

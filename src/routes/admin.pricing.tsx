import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, inr, type Plan, type SeatType } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pricing")({
  ssr: false,
  component: AdminPricing,
});

const seatTypes: SeatType[] = ["hot_desk", "dedicated", "cabin", "team_office"];

function AdminPricing() {
  const plans = useStore((s) => s.plans);
  const upsertPlan = useStore((s) => s.upsertPlan);
  const deletePlan = useStore((s) => s.deletePlan);
  const coupons = useStore((s) => s.coupons);
  const upsertCoupon = useStore((s) => s.upsertCoupon);
  const deleteCoupon = useStore((s) => s.deleteCoupon);
  const [coupon, setCoupon] = useState({ code: "", discountPct: 10, validUntil: "2026-12-31" });

  const addPlan = () => {
    const id = `pl_${Math.random().toString(36).slice(2, 8)}`;
    upsertPlan({
      id,
      name: "New plan",
      seatType: "hot_desk",
      basePrice: 5000,
      gstRate: 18,
      description: "Describe this plan.",
      features: ["Feature 1", "Feature 2"],
    });
    toast.success("Plan added — edit details below.");
  };

  return (
    <>
      <PageHeader
        title="Pricing & plans"
        description="Add, edit, or remove plans and coupons without touching code."
        actions={<Button onClick={addPlan}><Plus className="mr-1 h-4 w-4" /> Add plan</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <PlanEditor
            key={p.id}
            plan={p}
            onSave={(np) => { upsertPlan(np); toast.success(`Saved ${np.name}`); }}
            onDelete={() => {
              if (confirm(`Delete plan "${p.name}"? This cannot be undone.`)) {
                deletePlan(p.id);
                toast.success(`Deleted ${p.name}`);
              }
            }}
          />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coupon codes</CardTitle>
          <CardDescription>Promotional discounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {coupons.map((c) => (
              <Badge key={c.code} variant="secondary" className="gap-2 text-xs">
                {c.code} · {c.discountPct}% · until {c.validUntil}
                <button
                  onClick={() => { deleteCoupon(c.code); toast.success(`Removed ${c.code}`); }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${c.code}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {coupons.length === 0 && <span className="text-sm text-muted-foreground">No coupons yet.</span>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              upsertCoupon(coupon);
              toast.success("Coupon saved");
              setCoupon({ code: "", discountPct: 10, validUntil: "2026-12-31" });
            }}
            className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <Input required placeholder="LAUNCH26" value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} />
            <Input type="number" min={1} max={100} value={coupon.discountPct} onChange={(e) => setCoupon({ ...coupon, discountPct: Number(e.target.value) })} />
            <Input type="date" value={coupon.validUntil} onChange={(e) => setCoupon({ ...coupon, validUntil: e.target.value })} />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function PlanEditor({ plan, onSave, onDelete }: { plan: Plan; onSave: (p: Plan) => void; onDelete: () => void }) {
  const [p, setP] = useState(plan);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">{p.name}<Badge variant="secondary">{inr(p.basePrice)}</Badge></CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div><Label>Name</Label><Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Seat type</Label>
            <Select value={p.seatType} onValueChange={(v) => setP({ ...p, seatType: v as SeatType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {seatTypes.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>GST %</Label><Input type="number" value={p.gstRate} onChange={(e) => setP({ ...p, gstRate: Number(e.target.value) })} /></div>
        </div>
        <div><Label>Base price (₹)</Label><Input type="number" value={p.basePrice} onChange={(e) => setP({ ...p, basePrice: Number(e.target.value) })} /></div>
        <div><Label>Description</Label><Textarea value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} rows={2} /></div>
        <div><Label>Features (one per line)</Label>
          <Textarea value={p.features.join("\n")} onChange={(e) => setP({ ...p, features: e.target.value.split("\n").filter(Boolean) })} rows={4} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(p)} className="flex-1">Save</Button>
          <Button variant="destructive" size="icon" onClick={onDelete} aria-label="Delete plan">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

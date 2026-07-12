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
import { toast } from "sonner";
import { usePlans, useUpsertPlan, useDeletePlan } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { Plan, SeatType } from "@/types";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/pricing")({
  component: AdminPricing,
});

const seatTypes: SeatType[] = ["hot_desk", "dedicated", "cabin", "team_office", "enterprise"];

function AdminPricing() {
  const { data: plans = [] } = usePlans();
  const upsertPlanMutation = useUpsertPlan();
  const deletePlanMutation = useDeletePlan();
  // Coupons — still using local store for now (Phase 5 will move to API)
  const coupons = useStore((s) => s.coupons);
  const upsertCoupon = useStore((s) => s.upsertCoupon);
  const deleteCoupon = useStore((s) => s.deleteCoupon);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(10);
  const [couponUntil, setCouponUntil] = useState("2026-12-31");

  const addPlan = () => {
    const id = `pl_${Math.random().toString(36).slice(2, 8)}`;
    upsertPlanMutation.mutate(
      { id, name: "New plan", seatType: "hot_desk", basePrice: 5000, gstRate: 18, description: "Describe this plan.", features: ["Feature 1", "Feature 2"] },
      { onSuccess: () => toast.success("Plan added — edit details below.") },
    );
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
            onSave={(np) => upsertPlanMutation.mutate(np, { onSuccess: () => toast.success(`Saved ${np.name}`) })}
            onDelete={() => {
              if (confirm(`Delete plan "${p.name}"? This cannot be undone.`)) {
                deletePlanMutation.mutate(p.id, { onSuccess: () => toast.success(`Deleted ${p.name}`) });
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
                {c.code} · {c.discountType === "percentage" ? `${c.discountValue}%` : c.discountType === "flat" ? `₹${c.discountValue}` : `${c.discountValue} days`} · until {c.validUntil.slice(0, 10)}
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
              upsertCoupon({
                id: `cp_${Math.random().toString(36).slice(2, 8)}`, code: couponCode, description: "",
                discountType: "percentage", discountValue: couponDiscount,
                serviceScope: "all", allowedPlanIds: [], allowedBranchIds: [], allowedSeatTypes: [],
                minOrderValue: 0, minDurationMonths: 0, firstPurchaseOnly: false,
                maxUsesTotal: 0, maxUsesPerUser: 1, currentUsesTotal: 0,
                stackable: false, isReferralCoupon: false,
                validFrom: new Date().toISOString(), validUntil: couponUntil, status: "active",
                createdBy: "u_super", createdAt: new Date().toISOString(),
              });
              toast.success("Coupon saved");
              setCouponCode(""); setCouponDiscount(10); setCouponUntil("2026-12-31");
            }}
            className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <Input required placeholder="LAUNCH26" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
            <Input type="number" min={1} max={100} value={couponDiscount} onChange={(e) => setCouponDiscount(Number(e.target.value))} />
            <Input type="date" value={couponUntil} onChange={(e) => setCouponUntil(e.target.value)} />
            <Button type="submit">Add</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Quick add — for full coupon management (service scope, limits, etc.) use the dedicated Coupons page (coming soon).</p>
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

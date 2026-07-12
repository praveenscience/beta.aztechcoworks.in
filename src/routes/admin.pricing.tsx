import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
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
          <CardDescription>Manage promotional discounts, referral codes, and offers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/admin/coupons">Manage coupons <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
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

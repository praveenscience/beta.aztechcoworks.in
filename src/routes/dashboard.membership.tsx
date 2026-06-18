import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore, inr, seatTypeLabels } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/membership")({
  component: MembershipPage,
});

function MembershipPage() {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const plans = useStore((s) => s.plans);
  const branches = useStore(useShallow((s) => s.branches.filter((b) => b.isActive)));
  const memberships = useStore(useShallow((s) => s.memberships.filter((m) => m.userId === me?.id)));
  const createMembership = useStore((s) => s.createMembership);
  const cancelMembership = useStore((s) => s.cancelMembership);

  const [planId, setPlanId] = useState(plans[1]?.id);
  const [branchId, setBranchId] = useState(branches[0]?.id);
  const [seats, setSeats] = useState(1);

  if (!me) return null;
  const active = memberships.find((m) => m.status === "active");

  const subscribe = () => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || !branchId) return;
    createMembership({
      userId: me.id,
      planId,
      branchId,
      seats,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
    const total = Math.round(plan.basePrice * seats * 1.18);
    toast.success(`Membership activated! ${inr(total)} charged (demo).`);
  };

  return (
    <>
      <PageHeader title="Membership" description="Manage your plan, seats, and team." />

      {active ? (
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {plans.find((p) => p.id === active.planId)?.name} at {branches.find((b) => b.id === active.branchId)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Seats" value={String(active.seats)} />
              <Field label="Start date" value={active.startDate} />
              <Field label="Renews" value={active.endDate} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setSeats(active.seats + 1); subscribe(); }}>Add seat</Button>
              <Button variant="outline" onClick={() => toast.message("Upgrade flow opens (demo)")}>Upgrade</Button>
              <Button variant="destructive" onClick={() => { cancelMembership(active.id); toast.success("Membership cancelled."); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Start a membership</CardTitle>
            <CardDescription>Pick a plan, branch, and number of seats. We'll charge instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Plan</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {inr(p.basePrice)}/mo</SelectItem>)}
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
              <div><Label>Seats</Label><Input type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} /></div>
            </div>
            <Button onClick={subscribe} className="mt-5" size="lg">Subscribe</Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Membership history</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Plan</th><th>Branch</th><th>Seats</th><th>Status</th></tr></thead>
            <tbody>
              {memberships.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="py-3">{plans.find((p) => p.id === m.planId)?.name}</td>
                  <td>{branches.find((b) => b.id === m.branchId)?.name}</td>
                  <td>{m.seats}</td>
                  <td><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

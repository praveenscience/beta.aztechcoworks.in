import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMe, useMyMemberships, usePlans, useBranches, useCreateMembership, useCancelMembership, useCreateInvoice } from "@/lib/queries";
import { inr } from "@/lib/format";
import { payInvoice } from "@/lib/razorpay";
import { CouponInput, type ValidatedCoupon } from "@/components/coupon-input";

export const Route = createFileRoute("/dashboard/membership")({
  component: MembershipPage,
});

function MembershipPage() {
  const { data: me } = useMe();
  const { data: plans = [] } = usePlans();
  const { data: allBranches = [] } = useBranches();
  const branches = allBranches.filter((b) => b.isActive);
  const { data: memberships = [] } = useMyMemberships();
  const createMembershipMutation = useCreateMembership();
  const cancelMembershipMutation = useCancelMembership();
  const createInvoiceMutation = useCreateInvoice();
  const [paying, setPaying] = useState(false);

  const [planId, setPlanId] = useState(plans[1]?.id);
  const [branchId, setBranchId] = useState(branches[0]?.id);
  const [seats, setSeats] = useState(1);
  const [coupon, setCoupon] = useState<ValidatedCoupon | null>(null);

  if (!me) return null;
  const active = memberships.find((m) => m.status === "active");

  const plan = plans.find((p) => p.id === planId);
  const baseSubtotal = plan ? plan.basePrice * seats : 0;
  const discount = coupon?.discountAmount ?? 0;
  const subtotalAfterDiscount = Math.max(0, baseSubtotal - discount);
  const gstRate = plan?.gstRate ?? 18;
  const computedGst = Math.round(subtotalAfterDiscount * (gstRate / 100));
  const computedTotal = subtotalAfterDiscount + computedGst;

  const subscribe = async () => {
    if (!plan || !branchId) return;
    const subtotal = subtotalAfterDiscount;
    const gst = computedGst;
    const total = computedTotal;

    setPaying(true);
    try {
      // 1. Create membership (pending until paid)
      const membership = await new Promise<any>((resolve, reject) => {
        createMembershipMutation.mutate(
          {
            userId: me.id,
            planId,
            branchId,
            seats,
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          },
          { onSuccess: resolve, onError: reject },
        );
      });

      // 2. Create invoice
      const invoice = await new Promise<any>((resolve, reject) => {
        createInvoiceMutation.mutate(
          { userId: me.id, membershipId: membership.id, couponId: coupon?.couponId, discountAmount: discount, subtotal, gst, total },
          { onSuccess: resolve, onError: reject },
        );
      });

      // 3. Pay via Razorpay
      await payInvoice(invoice.id, { name: me.name, email: me.email, phone: me.phone });
      toast.success(`Membership activated! ${inr(total)} paid including GST.`);
    } catch (err: any) {
      if (err.message === "Payment cancelled") {
        toast.info("Payment cancelled. Complete payment from your Invoices page to activate.");
      } else {
        toast.error(err.message || "Subscription failed");
      }
    } finally {
      setPaying(false);
    }
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
              <Button variant="destructive" onClick={() => cancelMembershipMutation.mutate(active.id, { onSuccess: () => toast.success("Membership cancelled.") })}>Cancel</Button>
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

            {/* Coupon */}
            <div className="mt-4">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Have a coupon?</Label>
              <CouponInput
                serviceScope="membership"
                planId={planId}
                branchId={branchId}
                seatType={plan?.seatType}
                subtotal={baseSubtotal}
                onApplied={setCoupon}
              />
            </div>

            {/* Price breakdown */}
            {plan && (
              <div className="mt-4 space-y-1 rounded-lg border bg-secondary/40 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({seats} × {inr(plan.basePrice)})</span><span>{inr(baseSubtotal)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400"><span>Discount ({coupon?.code})</span><span>−{inr(discount)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">GST ({gstRate}%)</span><span>{inr(computedGst)}</span></div>
                <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{inr(computedTotal)}</span></div>
              </div>
            )}

            <Button onClick={subscribe} className="mt-5" size="lg" disabled={paying}>
              {paying ? "Processing payment..." : `Subscribe & pay ${plan ? inr(computedTotal) : ""}`}
            </Button>
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

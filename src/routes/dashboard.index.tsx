import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard-shell";
import { Calendar, QrCode, Receipt, Gift, Building2, Sparkles, Clock, CheckCircle2, Tag } from "lucide-react";
import { useMe, useBranches, useMyMemberships, useMyInvoices, useMyBookings, usePlans, useMyDeals } from "@/lib/queries";
import { inr } from "@/lib/format";
import type { UserDeal } from "@/types";

export const Route = createFileRoute("/dashboard/")({
  component: MemberOverview,
});

function MemberOverview() {
  const { data: me } = useMe();
  const { data: branches = [] } = useBranches();
  const { data: memberships = [] } = useMyMemberships();
  const { data: invoices = [] } = useMyInvoices();
  const { data: bookings = [] } = useMyBookings();
  const { data: plans = [] } = usePlans();
  const { data: deals = [] } = useMyDeals();
  if (!me) return null;

  const activeMemberships = memberships.filter((m) => m.status === "active");
  const activePlan = plans.find((p) => p.id === activeMemberships[0]?.planId);
  const branch = branches.find((b) => b.id === activeMemberships[0]?.branchId);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${me.name.split(" ")[0]}`}
        description="Your workspace at a glance."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Active plan" value={activePlan?.name ?? "None"} sub={branch?.name} />
        <KpiCard label="This month" value={inr(invoices.filter((i) => new Date(i.issuedAt).getMonth() === new Date().getMonth()).reduce((s, i) => s + i.total, 0))} sub="Paid invoices" />
        <KpiCard label="Bookings" value={String(bookings.length)} sub="Lifetime" />
        <KpiCard label="Referral code" value={me.referralCode} sub="Share & earn" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your member QR</CardTitle>
            <CardDescription>Show this at reception for instant entry.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            <div className="grid h-32 w-32 place-items-center rounded-xl bg-foreground text-background">
              <QrCode className="h-16 w-16" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Member ID</div>
              <div className="font-mono text-lg">{me.id.toUpperCase()}</div>
              <div className="mt-2 text-xs text-muted-foreground">{branch?.name ?? "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Get things done in one tap.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <QuickAction to="/dashboard/bookings" icon={Calendar} label="Book a room" />
            <QuickAction to="/dashboard/visitors" icon={QrCode} label="Pre-register visitor" />
            <QuickAction to="/dashboard/invoices" icon={Receipt} label="Download invoice" />
            <QuickAction to="/dashboard/referrals" icon={Gift} label="Refer a friend" />
            <QuickAction to="/dashboard/membership" icon={Building2} label="Manage plan" />
          </CardContent>
        </Card>
      </div>

      {/* My Deals */}
      {deals.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Deals for you</CardTitle>
            <CardDescription>Exclusive offers assigned to your account. Apply at checkout!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent invoices</CardTitle>
          <CardDescription>Last 5 invoices generated on your membership.</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Number</th><th>Date</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="py-3 font-mono">{i.number}</td>
                  <td>{new Date(i.issuedAt).toLocaleDateString("en-IN")}</td>
                  <td className="font-semibold">{inr(i.total)}</td>
                  <td><Badge variant={i.status === "paid" ? "default" : "secondary"} className={i.status === "paid" ? "bg-success text-success-foreground hover:bg-success" : ""}>{i.status}</Badge></td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Calendar; label: string }) {
  return (
    <Button asChild variant="outline" className="h-auto justify-start gap-2 py-3">
      <Link to={to}><Icon className="h-4 w-4" /> {label}</Link>
    </Button>
  );
}

function DealCard({ deal }: { deal: UserDeal }) {
  const c = deal.coupon;
  if (!c) return null;

  const isAvailable = deal.status === "available";
  const isUsed = deal.status === "used";

  const discountText =
    c.discountType === "percentage" ? `${c.discountValue}% OFF` :
    c.discountType === "flat" ? `${inr(c.discountValue)} OFF` :
    `${c.discountValue} FREE DAYS`;

  const scopeLabel =
    c.serviceScope === "all" ? "All services" :
    c.serviceScope === "membership" ? "Memberships" :
    c.serviceScope === "meeting_room" ? "Meeting rooms" :
    "Day passes";

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 p-4 transition ${
      isAvailable ? "border-amber-300 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-950/20" :
      isUsed ? "border-muted bg-muted/30 opacity-60" :
      "border-muted bg-muted/20 opacity-40"
    }`}>
      {/* Status badge */}
      <div className="mb-2 flex items-center justify-between">
        <Badge variant={isAvailable ? "default" : "secondary"} className={isAvailable ? "bg-amber-500 hover:bg-amber-600" : ""}>
          {isAvailable && <Tag className="mr-1 h-3 w-3" />}
          {isUsed && <CheckCircle2 className="mr-1 h-3 w-3" />}
          {deal.status === "expired" && <Clock className="mr-1 h-3 w-3" />}
          {deal.status}
        </Badge>
        {deal.expiresAt && isAvailable && (
          <span className="text-[11px] text-muted-foreground">
            Expires {new Date(deal.expiresAt).toLocaleDateString("en-IN")}
          </span>
        )}
      </div>

      {/* Discount highlight */}
      <div className="text-xl font-bold tracking-tight">{discountText}</div>
      <div className="mt-0.5 text-sm text-muted-foreground">{scopeLabel}</div>

      {/* Code */}
      {isAvailable && (
        <div className="mt-3 flex items-center gap-2">
          <code className="rounded bg-background px-2 py-1 font-mono text-sm font-semibold tracking-wider">{c.code}</code>
          <span className="text-xs text-muted-foreground">Use at checkout</span>
        </div>
      )}

      {/* Used date */}
      {isUsed && deal.usedAt && (
        <div className="mt-2 text-xs text-muted-foreground">
          Used on {new Date(deal.usedAt).toLocaleDateString("en-IN")}
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard-shell";
import { useShallow } from "zustand/react/shallow";
import { Calendar, QrCode, Receipt, Gift, Building2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({
  component: MemberOverview,
});

function MemberOverview() {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const memberships = useStore(useShallow((s) => s.memberships.filter((m) => m.userId === me?.id && m.status === "active")));
  const bookings = useStore(useShallow((s) => s.bookings.filter((b) => b.userId === me?.id)));
  const invoices = useStore(useShallow((s) => s.invoices.filter((i) => i.userId === me?.id)));
  const plans = useStore((s) => s.plans);
  const branches = useStore((s) => s.branches);
  if (!me) return null;

  const activePlan = plans.find((p) => p.id === memberships[0]?.planId);
  const branch = branches.find((b) => b.id === memberships[0]?.branchId);

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

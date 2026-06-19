import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useShallow } from "zustand/react/shallow";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/staff/branch")({
  component: BranchOps,
});

function BranchOps() {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const branches = useStore((s) => s.branches);
  const branch = branches.find((b) => b.id === me?.branchId) ?? branches[0];
  const seatInv = useStore(useShallow((s) => s.seatInventory.filter((si) => si.branchId === branch?.id)));
  const bookings = useStore(useShallow((s) => s.bookings.filter((b) => b.branchId === branch?.id)));
  const memberships = useStore(useShallow((s) => s.memberships.filter((m) => m.branchId === branch?.id)));

  if (!branch) return null;
  const occupancy = Math.round(((branch.totalSeats - branch.availableSeats) / branch.totalSeats) * 100);
  const revenue = bookings.reduce((s, b) => s + b.amount, 0);

  const chartData = seatInv.map((si) => ({
    type: si.type.replace("_", " "),
    occupied: si.total - si.available,
    total: si.total,
  }));

  return (
    <>
      <PageHeader title={`Branch operations — ${branch.name}`} description="Occupancy, revenue, and resources for your branch." />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Occupancy" value={`${occupancy}%`} />
        <Kpi label="Total seats" value={String(branch.totalSeats)} />
        <Kpi label="Available" value={String(branch.availableSeats)} />
        <Kpi label="Active members" value={String(memberships.filter((m) => m.status === "active").length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Seat utilization</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="type" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                  <Bar dataKey="occupied" fill="var(--color-chart-1)" radius={4} />
                  <Bar dataKey="total" fill="var(--color-chart-2)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Inventory breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {seatInv.map((si) => (
              <div key={si.type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="capitalize">{si.type.replace("_", " ")}</span>
                  <span className="text-muted-foreground">{si.total - si.available} / {si.total} · {inr(si.monthlyPrice)}/mo</span>
                </div>
                <Progress value={((si.total - si.available) / si.total) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="pt-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </CardContent></Card>
  );
}

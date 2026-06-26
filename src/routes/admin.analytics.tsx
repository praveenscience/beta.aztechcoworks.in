import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLeads, useAllBranches, useAllInvoices, useUsers, useAllMemberships } from "@/lib/queries";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({
  component: Analytics,
});

function Analytics() {
  const { data: branches = [] } = useAllBranches();
  const { data: leads = [] } = useLeads();
  const { data: invoices = [] } = useAllInvoices();
  const { data: memberships = [] } = useAllMemberships();

  const totalSeats = branches.reduce((s, b) => s + b.totalSeats, 0);
  const occupied = branches.reduce((s, b) => s + (b.totalSeats - b.availableSeats), 0);
  const occupancyPct = totalSeats ? Math.round((occupied / totalSeats) * 100) : 0;
  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const won = leads.filter((l) => l.stage === "won").length;
  const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;

  const branchPerf = branches.map((b) => ({
    name: b.name.replace("Aztech ", ""),
    occupancy: Math.round(((b.totalSeats - b.availableSeats) / b.totalSeats) * 100),
    seats: b.totalSeats - b.availableSeats,
  }));

  const monthly = [
    { m: "Jan", revenue: 4200000 }, { m: "Feb", revenue: 4600000 },
    { m: "Mar", revenue: 5100000 }, { m: "Apr", revenue: 5500000 },
    { m: "May", revenue: 5900000 }, { m: "Jun", revenue: 6800000 },
  ];

  return (
    <>
      <PageHeader title="CEO dashboard" description="Real-time view of revenue, occupancy, sales, and growth." />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total leads" value={String(leads.length)} />
        <Kpi label="Conversion" value={`${conversion}%`} />
        <Kpi label="Occupancy" value={`${occupancyPct}%`} />
        <Kpi label="Active members" value={String(memberships.filter((m) => m.status === "active").length)} />
        <Kpi label="Revenue (lifetime)" value={inr(revenue)} />
        <Kpi label="LTV (est)" value={inr(102000)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly revenue trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `${v / 100000}L`} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Branch occupancy</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={branchPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Legend />
                <Bar dataKey="occupancy" fill="var(--color-chart-1)" radius={4} name="Occupancy %" />
              </BarChart>
            </ResponsiveContainer>
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
      <div className="mt-1 text-xl font-bold tracking-tight">{value}</div>
    </CardContent></Card>
  );
}

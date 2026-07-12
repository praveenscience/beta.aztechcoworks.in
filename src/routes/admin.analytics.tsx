import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLeads, useAllBranches, useAllInvoices, useAllMemberships, useUserActivity } from "@/lib/queries";
import { inr } from "@/lib/format";
import { roleLabels } from "@/lib/format";
import { BarChart3, Users, Activity } from "lucide-react";
import type { Role } from "@/types";

export const Route = createFileRoute("/admin/analytics")({
  component: Analytics,
});

function Analytics() {
  return (
    <>
      <PageHeader title="Analytics" description="Revenue, occupancy, user activity, and growth metrics." />
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="mr-1.5 h-3.5 w-3.5" /> User activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="activity"><UserActivityTab /></TabsContent>
      </Tabs>
    </>
  );
}

function OverviewTab() {
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

function UserActivityTab() {
  const { data, isLoading } = useUserActivity();

  if (isLoading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading activity data...</div>;
  if (!data) return <div className="py-12 text-center text-sm text-muted-foreground">No activity data available.</div>;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Total actions (30d)" value={String(data.totalActions)} />
        <Kpi label="Active users" value={String(data.activeUsers)} />
        <Kpi label="Avg actions/user" value={data.activeUsers ? String(Math.round(data.totalActions / data.activeUsers)) : "0"} />
        <Kpi label="Top action" value={Object.keys(data.actionBreakdown)[0] ?? "—"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Daily activity chart */}
        <Card>
          <CardHeader><CardTitle>Daily activity (30 days)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="actions" fill="var(--color-chart-2)" radius={3} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly pattern</CardTitle>
            <CardDescription>When users are most active during the day</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.hourlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="actions" fill="var(--color-chart-3)" radius={3} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top users table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Most active users</CardTitle>
          <CardDescription>Top users by action count in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">User</th>
                  <th className="pr-3">Role</th>
                  <th className="pr-3">Actions</th>
                  <th className="pr-3">Top action</th>
                  <th className="pr-3">Last active</th>
                </tr>
              </thead>
              <tbody>
                {data.userActivity.slice(0, 20).map((u) => {
                  const topAction = Object.entries(u.actions).sort(([, a], [, b]) => b - a)[0];
                  return (
                    <tr key={u.userId} className="border-t">
                      <td className="py-3 pr-3">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="pr-3"><Badge variant="secondary">{roleLabels[u.role as Role] ?? u.role}</Badge></td>
                      <td className="pr-3 font-mono font-semibold">{u.totalActions}</td>
                      <td className="pr-3 text-xs">{topAction ? `${topAction[0]} (${topAction[1]})` : "—"}</td>
                      <td className="pr-3 text-xs text-muted-foreground">{new Date(u.lastActive).toLocaleString("en-IN")}</td>
                    </tr>
                  );
                })}
                {data.userActivity.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No activity recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity feed */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Last 50 actions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <span className="font-medium">{a.userName}</span>
                    {" "}
                    <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                    {" "}
                    <span className="text-muted-foreground">{a.entityType}</span>
                    {a.entityId && <span className="ml-1 font-mono text-xs text-muted-foreground">{a.entityId}</span>}
                  </div>
                  {a.detail && <div className="mt-0.5 text-xs text-muted-foreground">{a.detail}</div>}
                </div>
                <div className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">No recent activity.</div>
            )}
          </div>
        </CardContent>
      </Card>
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

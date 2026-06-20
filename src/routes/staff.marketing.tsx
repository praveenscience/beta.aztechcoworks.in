import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeads, useBlog, useTestimonials } from "@/lib/queries";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/staff/marketing")({
  component: MarketingPage,
});

function MarketingPage() {
  const { data: leads = [] } = useLeads();
  const { data: blog = [] } = useBlog();
  // useTestimonials available but not displayed yet in the current UI
  // const { data: testimonials = [] } = useTestimonials();

  const bySource = ["website", "whatsapp", "walk_in", "referral", "corporate"].map((src) => ({
    name: src,
    value: leads.filter((l) => l.source === src).length,
  }));

  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

  return (
    <>
      <PageHeader title="Marketing" description="Lead sources, campaign performance, and the blog." />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Total leads" value={String(leads.length)} />
        <Kpi label="Website" value={String(leads.filter((l) => l.source === "website").length)} />
        <Kpi label="WhatsApp" value={String(leads.filter((l) => l.source === "whatsapp").length)} />
        <Kpi label="Referrals" value={String(leads.filter((l) => l.source === "referral").length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads by source</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={bySource} dataKey="value" nameKey="name" outerRadius={90} label>
                    {bySource.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Blog posts ({blog.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {blog.map((b) => (
              <div key={b.id} className="rounded-lg border p-3 text-sm">
                <div className="font-semibold">{b.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(b.publishedAt).toLocaleDateString("en-IN")} · {b.tags.join(", ")}</div>
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

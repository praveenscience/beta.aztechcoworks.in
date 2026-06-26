# Day 22: The CEO Analytics Dashboard — Revenue Trends, Occupancy Comparisons, and the 6-KPI Rule

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #analytics #dashboard #ceo #recharts

---

The CEO of a coworking business needs to answer: "Are we growing?" The analytics dashboard gives them 6 numbers and 2 charts to find out.

## The 6-KPI Rule

I have a rule for executive dashboards: no more than 6 KPIs. More than 6 and you're reading, not glancing. A dashboard should be scannable in 3 seconds.

```tsx
<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
  <Kpi label="Total leads" value={String(leads.length)} />
  <Kpi label="Conversion" value={`${conversion}%`} />
  <Kpi label="Occupancy" value={`${occupancyPct}%`} />
  <Kpi label="Active members" value={String(activeCount)} />
  <Kpi label="Revenue (lifetime)" value={inr(revenue)} />
  <Kpi label="LTV (est)" value={inr(102000)} />
</div>
```

Six cards in a row on desktop, 3x2 on tablet, 2x3 on mobile. Each card has a label and a value. That's it.

**Total leads** — How big is our pipeline?
**Conversion** — What percentage of leads become members?
**Occupancy** — How full are we across all branches?
**Active members** — How many paying members right now?
**Revenue (lifetime)** — Total paid invoices, ever.
**LTV (est)** — Estimated lifetime value per member.

Three of these are growth metrics (leads, conversion, revenue). Two are health metrics (occupancy, members). One is a projection (LTV). Together, they tell the story.

## Revenue Trend Chart

A line chart showing monthly revenue:

```tsx
<LineChart data={monthly}>
  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
  <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
  <YAxis tickFormatter={(v) => `${v / 100000}L`} />
  <Tooltip formatter={(v: number) => inr(v)} />
  <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)"
        strokeWidth={2.5} dot={{ r: 4 }} />
</LineChart>
```

The Y-axis uses "L" (lakhs) formatting because Indian business revenue is discussed in lakhs, not millions. `45L` is clearer than `₹45,00,000` on a chart axis.

The line uses the brand accent color (gold) with a 2.5px stroke and visible dots at each data point. The tooltip shows the full INR-formatted value on hover.

The chart answers: "Is revenue going up?" One glance. Trend line goes up-right = yes. Done.

## Branch Occupancy Comparison

A bar chart comparing occupancy across all 6 branches:

```tsx
const branchPerf = branches.map((b) => ({
  name: b.name.replace("Aztech ", ""),
  occupancy: Math.round(((b.totalSeats - b.availableSeats) / b.totalSeats) * 100),
  seats: b.totalSeats - b.availableSeats,
}));

<BarChart data={branchPerf}>
  <Bar dataKey="occupancy" fill="var(--color-chart-1)" radius={4} name="Occupancy %" />
</BarChart>
```

Six bars, one per branch. Branch names have "Aztech " stripped for readability on the X-axis. Bars have rounded corners (`radius={4}`) for visual polish.

This chart answers: "Which branches are underperforming?" If Brookfields is at 92% and ATT Colony is at 58%, the CEO knows where to focus sales efforts.

## The Data Layer

```tsx
const { data: branches = [] } = useAllBranches();
const { data: leads = [] } = useLeads();
const { data: invoices = [] } = useAllInvoices();
const { data: memberships = [] } = useAllMemberships();
```

Four API calls. All data comes from the server. The KPIs are computed client-side:

```tsx
const totalSeats = branches.reduce((s, b) => s + b.totalSeats, 0);
const occupied = branches.reduce((s, b) => s + (b.totalSeats - b.availableSeats), 0);
const occupancyPct = totalSeats ? Math.round((occupied / totalSeats) * 100) : 0;

const revenue = invoices
  .filter((i) => i.status === "paid")
  .reduce((s, i) => s + i.total, 0);

const won = leads.filter((l) => l.stage === "won").length;
const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;
```

Simple reduces and filters. No complex aggregation. The data sets are small enough (hundreds of leads, hundreds of invoices) that client-side computation is instant.

## Recharts: The 348KB Trade-off

Recharts is 348KB — the single largest dependency in the app. The next largest is React itself at 355KB.

But it's code-split. The `admin.analytics` route loads Recharts only when the CEO visits `/admin/analytics`. Members, receptionists, and sales execs never download it.

Could I use a lighter charting library? Yes. Chart.js, uPlot, or even pure SVG would be smaller. But Recharts gives me:

- Declarative React components (`<LineChart>`, `<BarChart>`, `<Bar>`, `<Line>`)
- Responsive containers that resize with the viewport
- Tooltips, legends, and grid lines out of the box
- CSS variable support for theming

For 2 charts on 1 page that only 1 user role sees, 348KB of code-split JavaScript is an acceptable trade-off.

## What I'd Add

For a production CEO dashboard, I'd add:

1. **Time range selector** — "Last 30 days", "Last 90 days", "This year"
2. **Revenue by branch** — Stacked bar chart showing which branches contribute most
3. **MoM growth rate** — Not just the trend, but the percentage change
4. **Lead source breakdown** — Pie chart showing where leads come from
5. **Churn rate** — Members who cancelled vs. total

These are Phase 2 features. The current dashboard gives the CEO the "pulse check" view: are we growing, are we full, are we converting? The deeper analysis can come later.

## Admin-Only Access

The analytics dashboard is restricted to `super_admin`:

```typescript
router.get("/all-branches", (req, res) => {
  const user = req._user;
  if (user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(db.branches.all());
});
```

Branch managers see their own branch ops page. Sales managers see the pipeline. Only the CEO sees the cross-branch analytics. Data access matches organizational responsibility.

---

**Tomorrow:** Day 23 — Admin User Management: Inline Role Editing and the "Add Team Member" Flow

**Image suggestions:**
- SCREENSHOT: CEO analytics dashboard with 6 KPIs and both charts
- SCREENSHOT: The revenue trend line chart
- SCREENSHOT: The branch occupancy bar chart
- SCREENSHOT: Mobile view of the 6 KPIs stacked

**LinkedIn post:**

> The CEO dashboard rule: no more than 6 KPIs.
>
> More than 6 and you're reading, not scanning.
>
> My 6:
> 1. Total leads (pipeline size)
> 2. Conversion rate (pipeline health)
> 3. Occupancy (capacity utilization)
> 4. Active members (current customers)
> 5. Revenue (lifetime paid)
> 6. LTV estimate (projected value)
>
> 3 growth metrics + 2 health metrics + 1 projection.
>
> Below: revenue trend line + branch occupancy comparison bar chart.
>
> The CEO opens this page → 3 seconds → "We're growing, Brookfields is full, ATT Colony needs attention."
>
> Executive dashboards aren't about data. They're about decisions.
>
> Day 22 of 45: [link]

**X post:**

> CEO dashboard: 6 KPIs + 2 charts. That's it.
>
> Leads. Conversion. Occupancy. Members. Revenue. LTV.
>
> Revenue line goes up-right = good.
> Branch bar chart shows which locations need attention.
>
> 3 seconds to answer: "Are we growing?"
>
> Day 22/45

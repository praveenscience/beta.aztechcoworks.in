# Day 21: Branch Operations Dashboard — Occupancy Charts and the Branch Manager's View

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #dashboard #recharts #react #operations

---

A branch manager doesn't care about the sales pipeline. They don't need to see invoices. They need to know one thing: how full is my branch?

## The Branch Ops Page

`/staff/branch` — filtered to the current user's branch automatically:

```tsx
const { data: me } = useMe();
const { data: branches = [] } = useBranches();
const branch = branches.find((b) => b.id === me?.branchId) ?? branches[0];
```

The page shows the branch manager's branch. Not all branches. Not a branch picker. Their branch.

## The KPI Row

Four numbers across the top:

```tsx
<Kpi label="Occupancy" value={`${occupancy}%`} />
<Kpi label="Total seats" value={String(branch.totalSeats)} />
<Kpi label="Available" value={String(branch.availableSeats)} />
<Kpi label="Active members" value={String(activeMembers)} />
```

Occupancy is calculated:

```tsx
const occupancy = Math.round(
  ((branch.totalSeats - branch.availableSeats) / branch.totalSeats) * 100
);
```

A branch manager opens this page in the morning and sees: "87% occupied, 33 seats available, 192 active members." That's the health check.

## Seat Utilization Chart

A Recharts BarChart shows occupancy by seat type:

```tsx
const chartData = seatInv.map((si) => ({
  type: si.type.replace("_", " "),
  occupied: si.total - si.available,
  total: si.total,
}));

<BarChart data={chartData}>
  <Bar dataKey="occupied" fill="var(--color-chart-1)" />
  <Bar dataKey="total" fill="var(--color-chart-2)" />
</BarChart>
```

Two bars per seat type: occupied (filled color) and total (muted color). At a glance, the branch manager sees: "Hot desks are 90% full. Cabins are only 55% full. We should push cabin sales."

The chart uses CSS custom properties for colors (`var(--color-chart-1)`), so it automatically adapts to light/dark mode.

## Inventory Breakdown

Below the chart, a detailed breakdown with progress bars:

```tsx
{seatInv.map((si) => (
  <div key={si.type}>
    <div className="flex items-center justify-between text-sm">
      <span className="capitalize">{si.type.replace("_", " ")}</span>
      <span className="text-muted-foreground">
        {si.total - si.available} / {si.total} · {inr(si.monthlyPrice)}/mo
      </span>
    </div>
    <Progress value={((si.total - si.available) / si.total) * 100} />
  </div>
))}
```

Each seat type gets a row:
- Name (hot desk, dedicated, cabin, team office)
- Occupancy fraction (35 / 80)
- Monthly price
- Progress bar

The progress bar is a visual cue: green filling from left = healthy occupancy. Mostly empty = under-utilized. Completely full = time to expand.

## The Data Sources

The branch ops page pulls from 3 API endpoints:

```tsx
const { data: allSeatInv = [] } = useSeatInventory();
const { data: allBookings = [] } = useAllBookings();
const { data: allMemberships = [] } = useAllMemberships();

const seatInv = allSeatInv.filter((si) => si.branchId === branch?.id);
const bookings = allBookings.filter((b) => b.branchId === branch?.id);
const memberships = allMemberships.filter((m) => m.branchId === branch?.id);
```

Fetch all data, filter client-side by branch. This works because there are only 6 branches and the data sets are small. For a 100-branch operation, you'd want server-side filtering with a `branchId` query parameter.

## Revenue from Bookings

The page also shows booking revenue for the branch:

```tsx
const revenue = bookings.reduce((s, b) => s + b.amount, 0);
```

This is the sum of all meeting room bookings and day passes. It's a secondary metric — the primary revenue comes from memberships — but it tells the branch manager how much the meeting rooms are earning.

## What Makes a Good Branch Manager Dashboard

1. **Immediate answers.** No clicking through tabs or filters. The occupancy percentage is visible without scrolling.

2. **Actionable data.** "Cabins are 55% full" → Action: tell sales to push cabin plans. "Hot desks are 95% full" → Action: consider capping hot desk sales for this branch.

3. **Visual hierarchy.** KPIs first (numbers), chart second (comparison), detail third (breakdown). High-level to low-level.

4. **No noise.** The branch manager doesn't see other branches (they're not their responsibility). They don't see individual member data (that's privacy-sensitive). They see aggregated metrics for their branch.

## The 90-Line Component

The entire branch ops page is 90 lines of code. KPI calculations, chart data transformation, and JSX layout. No complex state management. No effects. Just hooks and rendering.

```
Lines 1-10:   Imports
Lines 11-23:  Data hooks and filtering
Lines 24-32:  KPI calculations
Lines 33-40:  Chart data transformation
Lines 41-80:  JSX (KPIs, chart, breakdown)
Lines 81-90:  Kpi sub-component
```

A dashboard page that a branch manager checks every morning, implemented in 90 lines, pulling from API endpoints that also serve the CEO dashboard and the member portal.

---

**Tomorrow:** Day 22 — The CEO Analytics Dashboard: Revenue Trends, Occupancy Comparisons, and the 6-KPI Rule

**Image suggestions:**
- SCREENSHOT: Branch operations page with KPIs, seat utilization chart, and progress bars
- SCREENSHOT: The seat utilization bar chart showing occupied vs total
- SCREENSHOT: The progress bar breakdown showing each seat type

**LinkedIn post:**

> A branch manager's dashboard should answer one question: "How full is my branch?"
>
> The page shows:
> - 4 KPIs: Occupancy %, total seats, available, active members
> - Bar chart: Occupancy by seat type (hot desk, dedicated, cabin, team office)
> - Progress bars: Detailed breakdown with pricing
>
> The entire page is 90 lines of code.
>
> Design principles:
> 1. Immediate answers (no clicking through tabs)
> 2. Actionable data ("cabins 55% full" → push cabin sales)
> 3. Visual hierarchy (KPIs → chart → detail)
> 4. No noise (only their branch, no individual data)
>
> A good dashboard isn't about showing more data. It's about showing the right data without asking.
>
> Day 21 of 45: [link]

**X post:**

> Branch manager dashboard: 90 lines of code.
>
> 4 KPIs (occupancy, seats, available, members)
> 1 bar chart (seat type utilization)
> 4 progress bars (detailed breakdown)
>
> Opens in the morning → "87% full, push cabin sales" → done.
>
> Day 21/45

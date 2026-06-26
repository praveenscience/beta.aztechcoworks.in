# Day 15: The Member Dashboard — A Portal That Members Actually Use

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #dashboard #react #ux #memberportal

---

A member logs in. What should they see?

Not a wall of features. Not a complex navigation tree. Not an admin panel pretending to be a user portal.

They should see: their plan, their QR code, their invoices, and 5 buttons that do things.

## The Overview Page

The member dashboard overview (`/dashboard`) shows 4 KPI cards and 2 action panels:

**KPI row:**
- Active plan name (e.g., "Dedicated Desk") + branch name
- This month's paid invoices total
- Lifetime booking count
- Referral code (shareable)

```tsx
<div className="grid gap-4 md:grid-cols-4">
  <KpiCard label="Active plan" value={activePlan?.name ?? "None"} sub={branch?.name} />
  <KpiCard label="This month" value={inr(thisMonthTotal)} sub="Paid invoices" />
  <KpiCard label="Bookings" value={String(bookings.length)} sub="Lifetime" />
  <KpiCard label="Referral code" value={me.referralCode} sub="Share & earn" />
</div>
```

Four numbers. Four glanceable insights. A member opens the dashboard, spends 2 seconds, and knows their status.

**Left panel: QR code**

Every member gets a QR code that's their entry pass. Show it at reception → instant check-in.

```tsx
<div className="grid h-32 w-32 place-items-center rounded-xl bg-foreground text-background">
  <QrCode className="h-16 w-16" />
</div>
<div>
  <div className="text-xs uppercase tracking-wider text-muted-foreground">Member ID</div>
  <div className="font-mono text-lg">{me.id.toUpperCase()}</div>
  <div className="mt-2 text-xs text-muted-foreground">{branch?.name ?? "—"}</div>
</div>
```

Currently using a Lucide icon as placeholder. In production, this will be a real QR code generated from the member ID that the reception app can scan.

**Right panel: Quick actions**

Five buttons that link to the most common tasks:

```tsx
<QuickAction to="/dashboard/bookings" icon={Calendar} label="Book a room" />
<QuickAction to="/dashboard/visitors" icon={QrCode} label="Pre-register visitor" />
<QuickAction to="/dashboard/invoices" icon={Receipt} label="Download invoice" />
<QuickAction to="/dashboard/referrals" icon={Gift} label="Refer a friend" />
<QuickAction to="/dashboard/membership" icon={Building2} label="Manage plan" />
```

Each is a `<Link>` styled as a button. Click → navigate. No dropdown menus. No "more options." Five things a member needs. Five buttons.

**Bottom section: Recent invoices**

A table showing the last 5 invoices with number, date, amount, and status badge (green "paid" or gray "pending"):

```tsx
{invoices.slice(0, 5).map((i) => (
  <tr key={i.id}>
    <td className="font-mono">{i.number}</td>
    <td>{new Date(i.issuedAt).toLocaleDateString("en-IN")}</td>
    <td className="font-semibold">{inr(i.total)}</td>
    <td>
      <Badge variant={i.status === "paid" ? "default" : "secondary"}
             className={i.status === "paid" ? "bg-success" : ""}>
        {i.status}
      </Badge>
    </td>
  </tr>
))}
```

Members always want to know: "Is my last invoice paid?" This answers it at a glance.

## The Data Layer

The overview page makes 6 API calls via TanStack Query:

```tsx
const { data: me } = useMe();                    // Current user
const { data: branches = [] } = useBranches();    // All branches
const { data: memberships = [] } = useMyMemberships(); // User's memberships
const { data: invoices = [] } = useMyInvoices();  // User's invoices
const { data: bookings = [] } = useMyBookings();  // User's bookings
const { data: plans = [] } = usePlans();          // All plans (for plan name)
```

Six hooks. Six concurrent API calls. TanStack Query deduplicates and caches them. Navigate away and back → instant data (from cache), no loading spinner.

The computed values are trivial:

```tsx
const activeMemberships = memberships.filter((m) => m.status === "active");
const activePlan = plans.find((p) => p.id === activeMemberships[0]?.planId);
const branch = branches.find((b) => b.id === activeMemberships[0]?.branchId);
```

No derived state library. Just `.filter()` and `.find()`. Runs in microseconds.

## The Sidebar Navigation

Members see 7 sidebar items:

1. **Overview** — The dashboard home
2. **Bookings** — Book meeting rooms
3. **Membership** — View/manage plan
4. **Invoices** — View/download invoices
5. **Visitors** — Pre-register guests
6. **Community** — Member directory
7. **Referrals** — Share code, track rewards

Staff roles see additional items (Reception, Sales, Branch Ops). Admin sees everything. But a member sees only what's relevant to them.

The sidebar is built with role-conditional rendering:

```tsx
const memberItems = [
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { to: "/dashboard/membership", label: "Membership", icon: CreditCard },
  // ...
];

// Staff items only show for staff+ roles
const staffItems = isStaff(me.role) ? [
  { to: "/staff/reception", label: "Reception", icon: Users },
  // ...
] : [];
```

## Design Decisions

**Why KPI cards instead of a chart?** Members don't need trends. They need current status. "What's my plan?" "How much did I pay this month?" "How many bookings have I made?" KPI cards answer these in 2 seconds. A chart would add cognitive load for zero insight.

**Why show the referral code on the overview?** Because it's the most under-used feature and the highest-ROI action a member can take. Putting it on the main dashboard increases visibility. If it were buried in `/dashboard/referrals`, nobody would see it.

**Why 5 quick actions, not 3 or 7?** Five is the sweet spot. Three feels sparse. Seven causes decision paralysis. Five buttons in a 2-column grid is visually clean and covers the core workflows.

**Why recent invoices on the overview?** Because "Is my invoice paid?" is the #2 question members ask (after "What's my WiFi password?"). Showing the last 5 invoices preempts a support request.

## The Mobile Experience

On mobile, the sidebar collapses into a Sheet drawer triggered by a hamburger menu. The dashboard content fills the full width. KPI cards stack vertically (1 column instead of 4). The quick action buttons remain in a 2-column grid.

The responsive classes:

```tsx
<div className="grid gap-4 md:grid-cols-4">
  {/* 1 column on mobile, 4 on desktop */}
</div>

<div className="grid grid-cols-2 gap-2">
  {/* Always 2 columns for quick actions */}
</div>
```

Tailwind's responsive prefixes (`md:`) handle the breakpoints. No separate mobile component. No conditional rendering. Same component, different layout.

---

**Tomorrow:** Day 16 — The Meeting Room Booking Engine: 160 Lines of Code

**Image suggestions:**
- SCREENSHOT: The member dashboard overview with KPI cards, QR code, and quick actions
- SCREENSHOT: The quick actions panel (5 buttons)
- SCREENSHOT: The recent invoices table with paid/pending badges
- SCREENSHOT: Mobile view of the dashboard

**LinkedIn post:**

> A member logs into the coworking dashboard. What should they see?
>
> My answer: 4 numbers, 1 QR code, 5 buttons, 5 invoices.
>
> KPIs: Active plan, monthly total, booking count, referral code
> QR: Entry pass for reception check-in
> Actions: Book room, register visitor, download invoice, refer, manage plan
> Invoices: Last 5 with paid/pending status
>
> That's it. No charts. No analytics. No feature tour.
>
> A member dashboard should answer two questions in 2 seconds:
> 1. "Am I good?" (plan active, invoices paid)
> 2. "What can I do?" (5 buttons)
>
> Everything else is one click away. Nothing requires scrolling.
>
> Day 15 of 45: [link]

**X post:**

> Member dashboard design:
>
> 4 KPI cards: plan, spend, bookings, referral code
> 1 QR code: entry pass
> 5 action buttons: book, visit, invoice, refer, manage
> 5 recent invoices: paid/pending badges
>
> Answer "Am I good?" and "What can I do?" in 2 seconds. That's it.
>
> Day 15/45

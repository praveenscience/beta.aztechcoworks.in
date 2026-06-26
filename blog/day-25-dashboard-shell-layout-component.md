# Day 25: The DashboardShell — One Layout Component for 9 Different Roles

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #react #layout #sidebar #responsive

---

9 user roles. 27 authenticated routes. One layout component that adapts to all of them.

## What DashboardShell Does

`DashboardShell` is the shared chrome around every authenticated page:

- **Sidebar** — Navigation links, role-aware (members see 7 items, admins see 15)
- **Top bar** — Page title, user avatar, logout button
- **Mobile drawer** — Sheet-based sidebar on screens under 768px
- **Content area** — Where the actual page renders via `<Outlet />`

```tsx
function DashboardShell() {
  const { data: me } = useMe();
  if (!me) return <Navigate to="/auth" />;

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r bg-sidebar">
        <SidebarNav user={me} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={me} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

The `<Outlet />` from TanStack Router renders whatever child route matches. The DashboardShell doesn't know or care whether it's rendering the member overview, the sales pipeline, or the CEO analytics. It just provides the frame.

## Role-Aware Navigation

The sidebar builds its navigation items based on the user's role:

```tsx
function SidebarNav({ user }: { user: SafeUser }) {
  const items = [
    // Everyone gets these
    { to: "/dashboard", label: "Overview", icon: Home },
    { to: "/dashboard/bookings", label: "Bookings", icon: Calendar },
    { to: "/dashboard/membership", label: "Membership", icon: CreditCard },
    { to: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { to: "/dashboard/visitors", label: "Visitors", icon: QrCode },
    { to: "/dashboard/community", label: "Community", icon: Users },
    { to: "/dashboard/referrals", label: "Referrals", icon: Gift },
  ];

  // Staff roles
  if (isStaffOrAbove(user.role)) {
    items.push(
      { to: "/staff/reception", label: "Reception", icon: Building },
    );
  }
  if (isSalesOrAbove(user.role)) {
    items.push(
      { to: "/staff/sales", label: "Sales", icon: Target },
    );
  }
  if (isBranchManagerOrAbove(user.role)) {
    items.push(
      { to: "/staff/branch", label: "Branch ops", icon: Activity },
    );
  }

  // Admin only
  if (user.role === "super_admin") {
    items.push(
      { to: "/admin/analytics", label: "Analytics", icon: BarChart },
      { to: "/admin/users", label: "Users", icon: Shield },
      { to: "/admin/branches", label: "Branches", icon: Map },
      { to: "/admin/pricing", label: "Pricing", icon: DollarSign },
    );
  }

  return (
    <nav className="space-y-1 px-3 py-4">
      {items.map((item) => (
        <Link key={item.to} to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                         text-muted-foreground hover:bg-accent/10 hover:text-foreground
                         [&.active]:bg-accent/10 [&.active]:text-foreground">
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

The TanStack Router `<Link>` component automatically adds an `active` class when the current URL matches. The CSS `[&.active]` selector highlights the current page in the sidebar.

## Mobile Sidebar with Sheet

On mobile, the sidebar is hidden and replaced with a hamburger menu that opens a Sheet drawer:

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-72 p-0">
    <SidebarNav user={me} />
  </SheetContent>
</Sheet>
```

Same `SidebarNav` component. Different container. On desktop, it's inside an `<aside>`. On mobile, it's inside a `<SheetContent>`.

The Sheet handles:
- Slide-in animation from the left
- Overlay that dims the background
- Click-outside to close
- Escape key to close
- Focus trapping (keyboard navigation stays inside the drawer)
- Aria attributes for screen readers

All of this is built into shadcn's Sheet component (via Radix's Dialog primitive). I didn't implement any of it.

## The PageHeader Component

Every dashboard page starts with a PageHeader:

```tsx
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

Used on every page:

```tsx
<PageHeader
  title="Sales pipeline"
  description="Manage every lead from inquiry to membership."
  actions={<FilterDropdown />}
/>
```

Consistent heading style across 27 pages. The `actions` slot allows each page to add buttons or filters in the header area.

## Auth Guard

The DashboardShell includes the authentication guard:

```tsx
const { data: me, isLoading } = useMe();
if (isLoading) return <Skeleton />;
if (!me) return <Navigate to="/auth" />;
```

If there's no session, redirect to `/auth`. If the session is loading, show a skeleton. If the user exists, render the dashboard.

This runs on every navigation because `useMe()` is cached — TanStack Query returns the cached user instantly and revalidates in the background. The auth check is effectively free after the first load.

## The Layout Route Files

Each section has its own layout route that wraps DashboardShell:

```tsx
// dashboard.tsx
export const Route = createFileRoute("/dashboard")({
  component: () => (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  ),
});

// staff.tsx — same pattern
// admin.tsx — same pattern
```

All three use the same DashboardShell. The sidebar items differ based on the user's role. The content area renders the child route.

One component. Three layout routes. Nine roles. Twenty-seven pages.

---

**Tomorrow:** Day 26 — Building the Express Backend: From In-Memory Store to Real API

**Image suggestions:**
- SCREENSHOT: The desktop sidebar showing admin navigation items
- SCREENSHOT: The mobile Sheet sidebar open
- SCREENSHOT: The PageHeader component with title and action buttons
- DIAGRAM: DashboardShell structure showing sidebar, top bar, and content area

**LinkedIn post:**

> One layout component for 9 user roles and 27 pages.
>
> DashboardShell:
> - Sidebar: role-aware (7 items for members, 15 for admin)
> - Top bar: user avatar + logout
> - Mobile: Sheet drawer from left
> - Content: <Outlet /> renders any child route
>
> The same SidebarNav component renders in:
> - Desktop: <aside> (always visible)
> - Mobile: <SheetContent> (slide-in drawer)
>
> Same component. Different container. The Sheet handles animation, overlay, focus trapping, keyboard nav, and aria — all from Radix's Dialog primitive.
>
> TanStack Router's <Link> auto-adds an "active" class. CSS [&.active] highlights the current page.
>
> Auth guard: useMe() is cached. No session = redirect. Loading = skeleton. The check is free after first load.
>
> Day 25 of 45: [link]

**X post:**

> DashboardShell: 1 component, 9 roles, 27 pages.
>
> Desktop: sidebar always visible.
> Mobile: Sheet drawer.
> Same SidebarNav component, different container.
>
> Active link highlighting: TanStack Router adds the class. CSS does the rest.
>
> Day 25/45

import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { dashboardHomeFor } from "@/components/site-chrome";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Receipt,
  Gift,
  QrCode,
  ScanLine,
  KanbanSquare,
  Wallet,
  Megaphone,
  ListTree,
  Workflow,
  BarChart3,
  Sparkles,
  LogOut,
  CircleUser,
  Menu,
  Settings,
  Tag,
  Globe,
  Database,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMe, useLogout } from "@/lib/queries";
import type { Role } from "@/types";
import { roleLabels } from "@/lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navsByRole: Record<Role, NavItem[]> = {
  visitor: [],
  member: [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/bookings", label: "Bookings", icon: Calendar },
    { to: "/dashboard/membership", label: "Membership", icon: Building2 },
    { to: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { to: "/dashboard/visitors", label: "Visitors", icon: QrCode },
    { to: "/dashboard/referrals", label: "Referrals", icon: Gift },
    { to: "/dashboard/community", label: "Community", icon: Users },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  reception: [
    { to: "/staff/reception", label: "Reception desk", icon: ScanLine },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  sales_exec: [
    { to: "/staff/sales", label: "Pipeline", icon: KanbanSquare },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  sales_manager: [
    { to: "/staff/sales", label: "Pipeline", icon: KanbanSquare },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  branch_manager: [
    { to: "/staff/branch", label: "Branch ops", icon: Building2 },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  finance: [
    { to: "/staff/finance", label: "Finance", icon: Wallet },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  marketing: [
    { to: "/staff/marketing", label: "Marketing", icon: Megaphone },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  super_admin: [
    { to: "/admin/branches", label: "Branches", icon: Building2 },
    { to: "/admin/pricing", label: "Pricing & plans", icon: Wallet },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/admin/users", label: "Users & roles", icon: Users },
    { to: "/admin/forms", label: "Forms", icon: ListTree },
    { to: "/admin/workflows", label: "Workflows", icon: Workflow },
    { to: "/admin/site", label: "Site settings", icon: Globe },
    { to: "/admin/data", label: "Data", icon: Database },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/staff/sales", label: "Sales pipeline", icon: KanbanSquare },
    { to: "/staff/reception", label: "Reception", icon: ScanLine },
    { to: "/staff/finance", label: "Finance", icon: Wallet },
    { to: "/staff/marketing", label: "Marketing", icon: Megaphone },
    { to: "/staff/branch", label: "Branch ops", icon: Building2 },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
};

export function DashboardShell() {
  const { data: me, isLoading } = useMe();
  const logout = useLogout();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a demo role on the sign-in page to explore this dashboard.
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const items = navsByRole[me.role] ?? [];
  const initials = me.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  const sidebarNav = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {items.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.to || pathname.startsWith(it.to + "/");
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarFooter = (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-lg p-2">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{me.name}</div>
          <div className="truncate text-[11px] text-sidebar-foreground/60">{roleLabels[me.role]}</div>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/">Site</Link>
        </Button>
        <Button onClick={() => logout.mutate()} variant="ghost" size="icon" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen grid-cols-1 bg-secondary/30 lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-gradient text-accent-foreground shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Aztech</div>
            <div className="text-[11px] text-sidebar-foreground/60">Co-Works OS</div>
          </div>
        </div>
        {sidebarNav()}
        {sidebarFooter}
      </aside>

      <main className="min-w-0">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-sidebar p-0 text-sidebar-foreground">
                <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-gradient text-accent-foreground shadow-soft">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">Aztech</div>
                    <div className="text-[11px] text-sidebar-foreground/60">Co-Works OS</div>
                  </div>
                </div>
                {sidebarNav(() => setOpen(false))}
                {sidebarFooter}
              </SheetContent>
            </Sheet>
            <Badge variant="secondary" className="hidden lg:inline-flex">
              {roleLabels[me.role]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to={dashboardHomeFor(me.role)}>
                <CircleUser className="mr-1.5 h-4 w-4" /> Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Switch role</Link>
            </Button>
          </div>
        </div>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

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
    <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}


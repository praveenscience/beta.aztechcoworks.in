# Day 6: Nine User Roles — How RBAC Works Without a Library

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #rbac #security #typescript #backend

---

This coworking platform has 9 user roles. Not 3 ("user, admin, superadmin"). Not 5. Nine.

```typescript
export type Role =
  | "visitor"
  | "member"
  | "reception"
  | "sales_exec"
  | "sales_manager"
  | "branch_manager"
  | "finance"
  | "marketing"
  | "super_admin";
```

Each role sees a different dashboard, accesses different data, and can perform different actions. And the entire RBAC system is 3 functions totaling about 40 lines of code.

No CASL. No casbin. No `@roles/guard`. Three functions.

## The Three Functions

### 1. `requireAuth` — Is there a session?

```typescript
export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
```

Applied to every dashboard route. If you don't have a session cookie, you get a 401. Period.

### 2. `requireRole` — Do you have the right role?

```typescript
export function requireRole(...roles: Role[]) {
  return (req, res, next) => {
    const user = db.users.find(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

Used on admin-only endpoints:

```typescript
router.post("/plans", requireRole("super_admin"), validate(planUpsertSchema), handler);
router.post("/users", requireRole("super_admin"), validate(userCreateSchema), handler);
router.delete("/plans/:id", requireRole("super_admin"), handler);
```

### 3. Inline role checks — For finer-grained access

Some endpoints are available to multiple roles but return different data:

```typescript
router.get("/leads", (req, res) => {
  const user = req._user;
  const allLeads = db.leads.all();

  if (user.role === "sales_exec") {
    // Sales execs only see their own leads
    res.json(allLeads.filter((l) => l.ownerId === user.id));
  } else {
    // Managers and admins see all leads
    res.json(allLeads);
  }
});
```

That's it. Three patterns. They cover every authorization scenario in the app.

## What Each Role Actually Sees

Here's the mapping between roles and what they can access:

| Feature | member | reception | sales_exec | sales_mgr | branch_mgr | finance | marketing | super_admin |
|---------|--------|-----------|------------|-----------|------------|---------|-----------|-------------|
| Own dashboard | x | x | x | x | x | x | x | x |
| Own memberships | x | x | x | x | x | x | x | x |
| Own bookings | x | x | x | x | x | x | x | x |
| Own invoices | x | x | x | x | x | x | x | x |
| Community | x | x | x | x | x | x | x | x |
| Visitor check-in | | x | | | x | | | x |
| Walk-in leads | | x | x | x | | | | x |
| Sales pipeline | | | x (own) | x (all) | | | | x (all) |
| Lead detail | | | x (own) | x (all) | | | | x (all) |
| Tasks | | | x (own) | x (all) | x (all) | | | x (all) |
| Branch operations | | | | | x | | | x |
| All invoices | | | | | | x | | x |
| All memberships | | | | | x | | | x |
| Marketing tools | | | | | | | x | x |
| User management | | | | | | | | x |
| Branch CRUD | | | | | | | | x |
| Plan CRUD | | | | | | | | x |
| CEO analytics | | | | | | | | x |

## Client-Side Role Gating

The backend enforces authorization. But the frontend also needs to know what to show. The sidebar navigation is role-aware:

```tsx
// In DashboardShell
const navItems = [
  // Everyone sees these
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { to: "/dashboard/membership", label: "Membership", icon: CreditCard },

  // Staff roles
  ...(["reception", "sales_exec", "sales_manager", "branch_manager", "super_admin"].includes(me.role) ? [
    { to: "/staff/reception", label: "Reception", icon: Users },
  ] : []),

  ...(["sales_exec", "sales_manager", "super_admin"].includes(me.role) ? [
    { to: "/staff/sales", label: "Sales pipeline", icon: Target },
  ] : []),

  // Admin only
  ...(me.role === "super_admin" ? [
    { to: "/admin/analytics", label: "Analytics", icon: BarChart },
    { to: "/admin/users", label: "Users", icon: Shield },
    { to: "/admin/branches", label: "Branches", icon: Building },
    { to: "/admin/pricing", label: "Pricing", icon: DollarSign },
  ] : []),
];
```

A member sees 5 sidebar items. A super admin sees 15. The component is the same. The data changes based on role.

## Why Not a Library?

I considered CASL (a popular JavaScript authorization library) and casbin (a full policy engine). Here's why I didn't use either:

**1. The permission model is simple.** It's role-based, not attribute-based. I don't have "user X can edit lead Y only if they're in the same branch and the lead was created less than 7 days ago." I have "sales execs see their own leads, managers see all leads."

**2. The roles are hierarchical.** super_admin > branch_manager > sales_manager > sales_exec > member. Higher roles generally have more access. There aren't cross-cutting permissions that would benefit from a policy matrix.

**3. Nine roles is manageable.** If I had 50 roles with overlapping permissions, I'd want a policy engine. With 9, I can fit the entire permission model in my head and in the table above.

**4. The code is readable.** `requireRole("super_admin")` is self-documenting. `if (user.role === "sales_exec") filter(...)` is self-documenting. A CASL policy file would add indirection without adding clarity.

## The Hard Part

The hardest part of RBAC isn't the code. It's the decisions.

Should a branch manager be able to see leads for their branch? (Yes.) Should they be able to reassign leads to a different owner? (No, that's sales_manager.) Should a finance user see member contact details? (No, just invoices.) Should a receptionist create leads? (Yes, for walk-ins.)

These aren't technical decisions. They're business decisions. Every `includes(user.role)` check represents a conversation about who has access to what information and why.

The code is 40 lines. The conversations that shaped those 40 lines took longer than writing them.

## The Pattern

If you're building a role-based system:

1. Define roles as a TypeScript union type (not string enums — union types give better autocomplete and exhaustiveness checking)
2. Use middleware for endpoint-level authorization (`requireRole`)
3. Use inline checks for data-level filtering ("show only your leads")
4. Mirror authorization logic in the UI (hide sidebar items, disable buttons)
5. Always enforce on the backend — client-side checks are UX, not security

Start simple. Add complexity only when the permission model demands it. You can always graduate to a policy engine. You can't always un-graduate from one.

---

**Tomorrow:** Day 7 — The Homepage as a Sales Machine: Real-Time Data on a Marketing Page

**Image suggestions:**
- SCREENSHOT: The DashboardShell sidebar showing different items for different roles
- SCREENSHOT: A super admin's sidebar vs. a member's sidebar (side by side)
- DIAGRAM: The role hierarchy showing which roles can access which features
- CODE SCREENSHOT: The requireRole middleware function

**LinkedIn post:**

> 9 user roles in one platform. Zero RBAC libraries.
>
> The entire authorization system is 3 functions:
>
> 1. requireAuth() — is there a session? (401 if no)
> 2. requireRole("super_admin") — right role? (403 if no)
> 3. Inline checks — sales execs see own leads, managers see all
>
> 40 lines of code. Covers every permission scenario across 33 routes.
>
> Why not CASL or casbin? Because the model is simple. Roles are hierarchical. 9 roles fit in my head.
>
> The hard part wasn't the code. It was the conversations about who should see what.
>
> "Should a branch manager reassign leads?" No, that's sales_manager.
> "Should finance see member contacts?" No, just invoices.
> "Should reception create leads?" Yes, for walk-ins.
>
> Start simple. Graduate to a policy engine when you need one. Not before.
>
> Day 6 of 45: [link]

**X post:**

> 9 user roles. 0 RBAC libraries. 3 functions. 40 lines.
>
> requireAuth() -> 401
> requireRole("super_admin") -> 403
> Inline filter -> sales_exec sees own leads only
>
> The code is trivial. The business conversations that shaped it weren't.
>
> Day 6/45 #buildinpublic

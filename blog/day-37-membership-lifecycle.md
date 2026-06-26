# Day 37: The Membership Lifecycle — Join, Pay, Cancel, Renew

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #membership #saas #billing #coworking

---

A membership is the core revenue unit of a coworking business. Everything flows from it — invoicing, access control, seat allocation, revenue analytics. The data model needs to be right.

## The Membership Entity

```typescript
export interface Membership {
  id: string;
  userId: string;      // Who
  planId: string;       // What plan
  branchId: string;     // Where
  seats: number;        // How many desks
  status: "active" | "cancelled" | "pending";
  startDate: string;    // When it begins
  endDate: string;      // When it ends
}
```

Eight fields. Clean. The `userId` links to the member. The `planId` links to the pricing plan. The `branchId` links to the location. Together, they answer: "Who is paying for what, where, and until when?"

## Creating a Membership

From the member portal (`/dashboard/membership`), a member can sign up for a plan:

```tsx
const createMembership = useCreateMembership();

createMembership.mutate({
  userId: me.id,
  planId: selectedPlan.id,
  branchId: selectedBranch,
  seats: seatCount,
  startDate: new Date().toISOString(),
  endDate: endDate.toISOString(),
});
```

The backend creates the membership with `status: "active"` and returns it. TanStack Query invalidates the membership cache, and the dashboard updates to show the new plan.

## Cancellation

```tsx
const cancelMembership = useCancelMembership();

cancelMembership.mutate(membership.id, {
  onSuccess: () => toast.success("Membership cancelled"),
});
```

The backend:

```typescript
router.patch("/memberships/:id/cancel", (req, res) => {
  const membership = db.memberships.update(req.params.id, { status: "cancelled" });
  if (!membership) return res.status(404).json({ error: "Membership not found" });
  res.json(membership);
});
```

One status change. The membership still exists in the database (for billing history and analytics), but `status: "cancelled"` means the member no longer has access.

## The Member's View

The membership page shows:

- Current plan name and price
- Branch name
- Start and end dates
- Status badge (green "active" or gray "cancelled")
- "Cancel membership" button

If no active membership: a plan selection interface with all available plans and a "Subscribe" button.

## The Admin's View

The super admin sees all memberships across all branches:

```tsx
const { data: memberships = [] } = useAllMemberships();
```

This powers the CEO analytics dashboard's "Active members" KPI:

```tsx
const activeCount = memberships.filter((m) => m.status === "active").length;
```

And the branch manager's active member count:

```tsx
const branchMemberships = allMemberships.filter((m) => m.branchId === branch.id);
const activeMembers = branchMemberships.filter((m) => m.status === "active").length;
```

## What's Missing (Production TODOs)

1. **Razorpay integration** — Payment before activation
2. **Auto-renewal** — Monthly recurring charges
3. **Proration** — Mid-month plan changes
4. **Upgrade/downgrade** — Plan switching flow
5. **Grace period** — Days after expiry before access revocation

The current model handles the core lifecycle. Payment integration and auto-renewal are the next phase.

---

**Tomorrow:** Day 38 — The Invoice System: GST, Indian Numbering, and Financial Data

**LinkedIn post:**

> The membership entity: 8 fields that drive the entire coworking business.
>
> userId (who) + planId (what) + branchId (where) + seats (how many) + status (active/cancelled) + dates
>
> Creating: POST → status: "active"
> Cancelling: PATCH → status: "cancelled" (record preserved for billing history)
>
> Simple status model. No state machine library. No workflow engine. Three statuses.
>
> Day 37 of 45: [link]

**X post:**

> Membership lifecycle: active → cancelled. Two states. One PATCH endpoint.
>
> The record stays in the database forever. Billing history. Analytics. Audit trail.
>
> Sometimes the simplest model is the correct model.
>
> Day 37/45

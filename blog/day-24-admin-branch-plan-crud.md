# Day 24: Admin Branch & Plan CRUD — Editing Business Data Without Touching Code

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #admin #crud #react #saas

---

The business team should never need to open a code editor to change a plan's price or add a new branch. That's what admin panels are for.

## Branch Management

The admin branches page (`/admin/branches`) lets the super admin add new branches and edit existing ones. Each branch is a form with:

- Name, slug (auto-generated from name)
- Address, city, phone
- Operating hours
- Total seats, available seats
- Active/inactive toggle
- Photo URL
- Description

The upsert pattern handles both create and update:

```tsx
export function useUpsertBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Branch) => {
      const isNew = !data.id || (data.id.startsWith("br_") && data.id.length < 8);
      return isNew
        ? api.post<Branch>("/api/dashboard/branches", data)
        : api.patch<Branch>(`/api/dashboard/branches/${data.id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "all-branches"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
```

If the branch has no ID (or a temporary ID), it's a POST (create). If it has a real ID, it's a PATCH (update). The component doesn't care — it just calls `upsertBranch.mutate(branchData)`.

On success, both the admin branch list AND the public branch list are invalidated. The homepage shows updated branch data within seconds.

## Plan Management

The admin pricing page (`/admin/pricing`) is more elaborate because plans have editable feature lists.

Each plan gets a card-based editor:

```tsx
function PlanEditor({ plan, onSave, onDelete }) {
  const [p, setP] = useState(plan);
  return (
    <Card>
      <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      <Select value={p.seatType} onValueChange={(v) => setP({ ...p, seatType: v })}>
        {seatTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
      </Select>
      <Input type="number" value={p.basePrice} onChange={...} />
      <Input type="number" value={p.gstRate} onChange={...} />
      <Textarea value={p.description} onChange={...} />
      <Textarea
        value={p.features.join("\n")}
        onChange={(e) => setP({ ...p, features: e.target.value.split("\n").filter(Boolean) })}
      />
      <Button onClick={() => onSave(p)}>Save</Button>
      <Button variant="destructive" onClick={onDelete}>Delete</Button>
    </Card>
  );
}
```

Features are stored as a string array. The editor uses a Textarea where each line is a feature. Split on newlines, filter empty lines, save as array. Simple and intuitive — the admin types one feature per line.

## Adding a Plan

The "Add plan" button creates a new plan with defaults:

```tsx
const addPlan = () => {
  const id = `pl_${Math.random().toString(36).slice(2, 8)}`;
  upsertPlanMutation.mutate({
    id,
    name: "New plan",
    seatType: "hot_desk",
    basePrice: 5000,
    gstRate: 18,
    description: "Describe this plan.",
    features: ["Feature 1", "Feature 2"],
  });
};
```

A new card appears with sensible defaults. The admin edits the name, price, and features, then clicks Save.

## Deleting a Plan

The delete button has a confirmation:

```tsx
if (confirm(`Delete plan "${p.name}"? This cannot be undone.`)) {
  deletePlanMutation.mutate(p.id);
}
```

Yes, I used `confirm()`. The native browser dialog. For an admin panel used by exactly one person, it's the right choice. No custom modal component. No state management for dialog visibility. One line of code.

The backend:

```typescript
router.delete("/plans/:id", requireRole("super_admin"), (req, res) => {
  db.plans.delete(req.params.id);
  res.json({ ok: true });
});
```

## Coupon Management

Coupons live in a separate section on the same page. They're still client-side only (Zustand + localStorage) because there's no backend API for coupons yet:

```tsx
const coupons = useStore((s) => s.coupons);
const upsertCoupon = useStore((s) => s.upsertCoupon);
const deleteCoupon = useStore((s) => s.deleteCoupon);
```

The coupon form captures: code, discount percentage, valid-until date. Coupons display as badges with a delete button:

```tsx
{coupons.map((c) => (
  <Badge key={c.code} variant="secondary">
    {c.code} · {c.discountPct}% · until {c.validUntil}
    <button onClick={() => deleteCoupon(c.code)}>
      <Trash2 className="h-3 w-3" />
    </button>
  </Badge>
))}
```

When coupons get a backend API, this Zustand code becomes TanStack Query. The UI stays identical.

## The Slug Generation

When creating a branch, the slug is auto-generated:

```typescript
slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-")
```

"Aztech Brookfields" → "aztech-brookfields"
"RS Puram East" → "rs-puram-east"

The admin can override the slug, but the default is usually correct. The slug becomes the URL: `/branches/aztech-brookfields`.

## Backend Validation

All admin mutations go through Zod validation:

```typescript
const branchUpsertSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  phone: z.string().min(10),
  totalSeats: z.number().int().positive(),
  // ...
});

const planUpsertSchema = z.object({
  name: z.string().min(2),
  seatType: z.enum(["hot_desk", "dedicated", "cabin", "team_office", "enterprise"]),
  basePrice: z.number().positive(),
  gstRate: z.number().min(0).max(100),
  features: z.array(z.string()),
  // ...
});
```

Even the super admin can't submit invalid data. A plan with a negative price? Zod rejects it. A branch with no address? Rejected. The validation is the safety net.

## Why Admin Panels Matter

An admin panel that works means:

1. **No developer dependency.** The business team changes prices without a code deploy.
2. **Instant updates.** Change a plan's price → the pricing page, the booking form, and the invoicing system all reflect it immediately.
3. **Audit trail.** Every change goes through the API. In a future version, an audit log can track who changed what and when.
4. **Error prevention.** Zod validation prevents invalid data at the source. No "someone entered -500 as the price" issues.

The admin panel is the interface between the business team and the database. It should be boring, reliable, and obvious. This one is.

---

**Tomorrow:** Day 25 — The DashboardShell: One Layout Component for 9 Different Roles

**Image suggestions:**
- SCREENSHOT: The admin pricing page with plan editor cards
- SCREENSHOT: A plan editor showing the feature list textarea
- SCREENSHOT: The coupon badges with delete buttons
- SCREENSHOT: The admin branches page with the branch form

**LinkedIn post:**

> The business team should never open a code editor to change a price.
>
> The admin panel lets the super admin:
> - Add/edit branches (name, address, seats, photo)
> - Add/edit/delete plans (name, price, features, seat type)
> - Add coupon codes (code, discount %, expiry)
> - Add/edit users (name, email, role, branch)
>
> Plan features are a Textarea. One feature per line. Split on newlines. Save as array.
>
> The delete confirmation? `confirm("Delete plan?")` — the native browser dialog. For an admin panel used by one person, it's the right choice. One line of code.
>
> Admin panels should be boring, reliable, and obvious. No design awards. Just works.
>
> Day 24 of 45: [link]

**X post:**

> Admin plan editor: Textarea for features. One per line. Split on "\n". Array.
>
> Delete button: confirm("Delete?") — native browser dialog.
>
> For an admin panel used by 1 person, boring and reliable beats clever and fragile.
>
> Day 24/45

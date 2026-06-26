# Day 38: The Invoice System — GST, Indian Numbering, and Financial Data

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #invoicing #gst #india #fintech

---

Invoicing in India isn't just "amount × quantity." There's GST (Goods and Services Tax), HSN codes, GSTIN numbers, and a numbering format that tax authorities can audit. The data model reflects all of this.

## The Invoice Entity

```typescript
export interface Invoice {
  id: string;
  number: string;        // "INV-2026-0001" format
  userId: string;        // Billed to
  bookingId?: string;    // For booking invoices
  membershipId?: string; // For membership invoices
  subtotal: number;      // Before tax
  gst: number;           // 18% of subtotal
  total: number;         // subtotal + gst
  status: "paid" | "pending" | "refunded";
  issuedAt: string;
}
```

The `subtotal`, `gst`, and `total` are stored separately because Indian tax compliance requires line-item GST breakdowns. You can't just store the total and work backwards.

## The `inr()` Formatter

Every financial number in the app uses the Indian numbering system:

```typescript
export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
```

- `inr(8500)` → `"₹8,500"`
- `inr(150000)` → `"₹1,50,000"`
- `inr(6800000)` → `"₹68,00,000"`

The Indian system uses commas after the thousands place, then every two digits. ₹1,50,000 (one lakh fifty thousand) is correct. ₹150,000 (western format) looks wrong to Indian eyes and would confuse the finance team.

## The Finance Dashboard

Finance users (`role: "finance"`) see all invoices:

```typescript
router.get("/invoices", (req, res) => {
  const user = req._user;
  if (!["super_admin", "finance"].includes(user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(db.invoices.all());
});
```

Members see only their own:

```typescript
router.get("/me/invoices", (req, res) => {
  res.json(db.invoices.byUser(req.session.userId));
});
```

Same data, different access levels. The query is the same SQL. The authorization determines the scope.

## Revenue Analytics

The CEO dashboard aggregates invoice data:

```tsx
const revenue = invoices
  .filter((i) => i.status === "paid")
  .reduce((s, i) => s + i.total, 0);
```

Only paid invoices count toward revenue. Pending and refunded are excluded. Simple filter + reduce.

## Status Badges

```tsx
<Badge
  variant={i.status === "paid" ? "default" : "secondary"}
  className={i.status === "paid" ? "bg-success text-success-foreground" : ""}
>
  {i.status}
</Badge>
```

Paid = green badge. Pending = gray badge. Refunded = gray badge. Visual distinction at a glance.

## What's Next for Invoicing

1. **PDF generation** — Downloadable invoices with company letterhead, GSTIN, and HSN codes
2. **Razorpay payment links** — "Pay now" button that opens Razorpay checkout
3. **Auto-generation** — Monthly invoices created automatically from active memberships
4. **Email delivery** — Invoice PDFs emailed to members on generation
5. **Credit notes** — For cancellations and refunds

The current system tracks the financial data. The next phase makes it actionable.

---

**Tomorrow:** Day 39 — The Community Directory: Building Social Features for Members

**LinkedIn post:**

> Invoicing for India requires Indian formatting:
>
> ₹1,50,000 not ₹150,000
>
> The Intl.NumberFormat("en-IN") API handles it natively. One function. Every price in the app.
>
> Plus: GST stored separately (subtotal + gst + total), invoice numbering for tax compliance, and role-based access (finance sees all, members see their own).
>
> Day 38 of 45: [link]

**X post:**

> Indian currency formatting: ₹1,50,000 (not ₹150,000).
>
> Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
>
> One function. Every price. Correct for Indian tax compliance and Indian eyes.
>
> Day 38/45

# Day 10: The Pricing Page — Transparent Plans, GST Math, and "Contact Us" Is a Conversion Killer

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #pricing #saas #ux #india

---

"Contact us for pricing" is the five most expensive words on a coworking website.

Every competitor in Coimbatore does it. They show pretty photos, list amenities, and then: "Get in touch for customized pricing." Translation: we'll call you 14 times, you'll ghost us 13 times, and maybe on the 14th call you'll learn that a hot desk costs ₹6,500/month.

We just put the price on the page.

## The Plans

Five plans, clearly laid out:

| Plan | Type | Price/month | Target |
|------|------|-------------|--------|
| Hot Desk | Shared, any available desk | ₹6,500 | Freelancers, day traders |
| Dedicated Desk | Fixed desk, personalized | ₹8,500 | Remote workers, solopreneurs |
| Private Cabin | Lockable, 2-6 pax | ₹18,000 | Small teams, consultants |
| Team Office | 6-15 pax, branded | ₹45,000 | Growing startups, agencies |
| Enterprise Floor | 30-150+ seats, custom | ₹1,50,000 | IT companies, large teams |

Each plan is a card with:
- Plan name and type
- Price in large, bold INR formatting
- "per seat / month + 18% GST" in small text
- Feature list with checkmarks
- CTA button

The second plan (Dedicated Desk) gets a "Most popular" badge and a highlighted border:

```tsx
{plans.map((p, i) => (
  <Card className={i === 1 ? "border-accent/40 shadow-glow" : ""}>
    {i === 1 && (
      <Badge className="absolute -top-3 right-4 bg-accent">
        Most popular
      </Badge>
    )}
    {/* ... */}
  </Card>
))}
```

Is the Dedicated Desk actually the most popular? Yes. But also, highlighting the second-cheapest option anchors the decision. The Hot Desk looks basic by comparison. The Cabin looks expensive. The Dedicated Desk is "just right."

## Data-Driven Plans

The plans aren't hardcoded in the component. They come from the database via the `usePlans()` hook:

```tsx
const { data: plans = [] } = usePlans();
```

This means the super admin can add, edit, or remove plans from the admin panel without touching code. Change the Hot Desk price to ₹7,000? Edit it in `/admin/pricing`. The homepage, the pricing page, and the booking flow all update immediately.

The plan entity:

```typescript
export interface Plan {
  id: string;
  name: string;
  seatType: SeatType;
  basePrice: number;
  gstRate: number;
  description: string;
  features: string[];
}
```

Features are stored as a string array: `["Shared desk, any available", "1 Gbps WiFi", "Power backup", "Cafeteria access", "Community events"]`. The component maps over them with checkmark icons. Adding a feature is adding a string to an array.

## The GST Transparency

In India, GST (Goods and Services Tax) is 18% on coworking services. Many competitors quote prices "exclusive of GST" in fine print, so the ₹6,500 desk actually costs ₹7,670.

We show both:

```tsx
<div className="text-3xl font-bold tracking-tight">{inr(p.basePrice)}</div>
<div className="text-xs text-muted-foreground">
  per seat / month · +{p.gstRate}% GST
</div>
```

The base price is prominent. The GST rate is visible but secondary. On the booking page, the total with GST is calculated live:

```tsx
const amount = room.hourlyPrice * hours;
// Display
<div className="text-2xl font-bold">{inr(Math.round(amount * 1.18))}</div>
```

No surprises at checkout. No "Oh, there's tax on top of that?" moments. Trust is built in the details.

## The `inr()` Helper

Every price in the app uses the same formatting function:

```typescript
export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
```

`inr(8500)` → "₹8,500"
`inr(150000)` → "₹1,50,000"

The `en-IN` locale uses the Indian numbering system (lakhs and crores), not the Western system (millions). ₹1,50,000 is correct for India. ₹150,000 looks wrong to Indian eyes.

One function. Used in the pricing page, booking form, invoice tables, sales pipeline, CEO dashboard. Consistent formatting everywhere.

## The Enterprise CTA

After the 4 regular plans, there's a dark CTA section:

```
Need 30-150+ seats for your enterprise team?

Custom build-outs, dedicated reception, enterprise SLAs,
and zero brokerage. Move-in ready in 30 days.

[Talk to sales]  [See pricing]
```

This catches the enterprise prospects who scrolled past the plans thinking "these are for small teams." The "Talk to sales" button links to `/corporate`, which has the full enterprise lead form.

The pricing page serves both audiences: self-serve members who'll pick a plan and sign up, and enterprise prospects who need a conversation. Neither gets lost.

## What Happens After Pricing

The pricing page has two exit paths:

1. **"See details" button** → Goes to the branch detail page where they can see availability and book a site visit. For prospects who are almost ready.

2. **"Talk to sales" button** → Goes to the corporate page with the enterprise form. For prospects who need custom proposals.

No dead end. Every plan card has a button. Every button leads somewhere productive. The page is a decision tree, not a brochure.

## Why Transparent Pricing Wins

In a market where every competitor hides pricing behind a "contact us" form, showing prices publicly does three things:

1. **Qualifies leads automatically.** If someone books a site visit after seeing ₹8,500/month, they're not going to be shocked at the price. The sales team spends time closing, not educating.

2. **Builds trust instantly.** "If they're showing the price, they're confident in it." Opacity breeds suspicion.

3. **Reduces the sales cycle.** The prospect arrives at the site visit already knowing the price, the plan, and the features. The visit is a confirmation, not a discovery. Close rates go up. Cycle times go down.

The competitor who hides pricing thinks they're protecting their margin. They're actually protecting their competitors — because the prospect will check 3 other spaces before committing to a call, and one of those spaces has its pricing on the website.

That space is us.

---

**Tomorrow:** Day 11 — State Management Without Redux: The Three-Layer Pattern

**Image suggestions:**
- SCREENSHOT: The pricing page with all plan cards and the enterprise CTA
- SCREENSHOT: The plan card showing price, GST note, and feature list
- SCREENSHOT: The admin pricing page showing plan editor
- SCREENSHOT: A booking form showing live GST calculation

**LinkedIn post:**

> "Contact us for pricing" is the five most expensive words on a coworking website.
>
> Every competitor in my market does it. Show photos, list amenities, then: "Get in touch for customized pricing."
>
> We put the price on the page.
>
> Hot Desk: ₹6,500/mo
> Dedicated: ₹8,500/mo
> Cabin: ₹18,000/mo
> Team Office: ₹45,000/mo
>
> + 18% GST. Clearly stated. No surprises.
>
> Why this works:
> 1. Qualifies leads automatically (no price shock at the visit)
> 2. Builds trust instantly (opacity breeds suspicion)
> 3. Reduces sales cycle (prospect already knows the price)
>
> The competitor hiding pricing thinks they're protecting margin. They're protecting their competitors.
>
> Day 10 of 45: [link]

**X post:**

> "Contact us for pricing" is a conversion killer.
>
> We show prices. ₹6,500 - ₹1,50,000/mo. GST clearly stated.
>
> Result: Prospects arrive at site visits pre-qualified. They know the price. The visit is a confirmation, not a discovery.
>
> Close rates up. Cycle times down. Trust from pixel one.
>
> Day 10/45

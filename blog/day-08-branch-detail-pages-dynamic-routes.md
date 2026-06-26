# Day 8: Branch Detail Pages — Dynamic Routes, Seat Inventory, and the Site Visit Funnel

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #react #dynamicroutes #ux #coworking

---

Every branch has its own page. `/branches/brookfields`, `/branches/rs-puram`, `/branches/ram-nagar`. Six branches, six URLs, one component.

This is where a potential member goes to decide: "Is this the right branch for me?"

## The Dynamic Route

The file is `_public/branches.$slug.tsx`. The `$slug` becomes a typed route parameter:

```tsx
export const Route = createFileRoute("/_public/branches/$slug")({
  component: BranchDetail,
});

function BranchDetail() {
  const { slug } = Route.useParams();
  const { data: branch } = useBranch(slug);
  // ...
}
```

`useBranch(slug)` calls `GET /api/branches/brookfields`. The backend looks up the branch by slug, and returns it enriched with seat inventory and meeting rooms:

```typescript
// Server response
{
  id: "br_bk",
  name: "Aztech Brookfields",
  slug: "brookfields",
  address: "Dr Krishnasamy Mudaliyar Rd, Brookfields",
  totalSeats: 250,
  availableSeats: 147,
  seatInventory: [
    { type: "hot_desk", total: 80, available: 45, monthlyPrice: 6500 },
    { type: "dedicated", total: 100, available: 62, monthlyPrice: 8500 },
    { type: "cabin", total: 40, available: 22, monthlyPrice: 18000 },
    { type: "team_office", total: 30, available: 18, monthlyPrice: 45000 },
  ],
  meetingRooms: [
    { id: "mr_1", name: "Nila", capacity: 8, hourlyPrice: 500 },
    { id: "mr_2", name: "Kaveri", capacity: 20, hourlyPrice: 1200 },
  ],
  amenities: ["1 Gbps WiFi", "Power backup", "Cafeteria", "Phone booths", ...],
  // ...
}
```

One API call. All the data a prospect needs.

## What the Page Shows

The branch detail page is divided into clear sections:

**1. Hero with branch photo and key stats**
- Branch name, address, city
- Operating hours
- Phone number (clickable on mobile)
- Total seats and availability

**2. Seat inventory breakdown**
- A table/grid showing each seat type (hot desk, dedicated, cabin, team office)
- Available count vs. total count
- Monthly price per seat
- This answers the #1 question prospects have: "What's available, and how much?"

**3. Meeting rooms**
- Room names, capacity, hourly price
- This drives the booking page — members can book from here

**4. Amenities list**
- Everything included: WiFi speed, coffee, power backup, parking, printer access, phone booths
- Badge-style display so it's scannable

**5. Call to action**
- "Book a site visit" button → navigates to `/book-visit` with the branch pre-selected
- WhatsApp button with pre-filled message mentioning the branch name

## The Site Visit Funnel

The "Book a site visit" page is the most important lead capture form on the entire site. Here's how it works:

A prospect fills out: name, email, phone, preferred branch (pre-selected if they came from a branch page), preferred date, and visit mode (self-serve walk-in or guided tour).

On submit, it hits `POST /api/site-visits` which creates two things atomically:

1. **A Lead** — with source "website", stage "new", and a score of 50
2. **A SiteVisit** — linked to the lead, with status "scheduled"

```typescript
router.post("/site-visits", validate(siteVisitSchema), (req, res) => {
  const lead = {
    id: uid("ld"),
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    source: "website",
    score: 50,
    stage: "new",
    createdAt: new Date().toISOString(),
  };
  db.leads.insert(lead);

  const visit = {
    id: uid("sv"),
    leadId: lead.id,
    branchId: req.body.branchId,
    scheduledAt: req.body.date,
    status: "scheduled",
    mode: req.body.mode ?? "self_serve",
  };
  db.siteVisits.insert(visit);

  res.status(201).json({ lead, visit });
});
```

The sales team sees the new lead instantly in their Kanban pipeline. The site visit appears in the reception desk's scheduled visits. No manual data entry. No email-to-CRM copy-paste.

This is the core loop: **marketing page → site visit form → CRM lead → sales pipeline → member**.

## The Slug Pattern

Each branch has a human-readable slug:

| Branch | Slug |
|--------|------|
| Aztech Brookfields | `brookfields` |
| Aztech RS Puram | `rs-puram` |
| Aztech RS Puram East | `rs-puram-east` |
| Aztech Ram Nagar | `ram-nagar` |
| Aztech ATT Colony | `att-colony` |
| Aztech Saibaba Colony | `saibaba-colony` |

The backend lookup checks both slug and ID:

```typescript
const b = mock.branches.find((r) => r.slug === p[0] || r.id === p[0]);
```

So both `/branches/brookfields` and `/branches/br_bk` work. The slug is for humans and SEO. The ID is for internal links.

## Lazy Loading Images

Branch photos use the `loading="lazy"` attribute:

```tsx
<img
  src={unsplash(b.photo, 800, 500)}
  alt={b.name}
  loading="lazy"
  width={800}
  height={500}
/>
```

Currently using Unsplash placeholder images (a coworking photo keyed by ID). These will be replaced with real branch photos before launch. The `unsplash()` helper generates optimized URLs with width/height parameters so Unsplash serves the right size.

Setting explicit `width` and `height` prevents layout shift — the browser reserves space before the image loads.

## SEO for Branch Pages

Each branch page gets its own meta tags:

```tsx
head: () => ({
  meta: [
    { title: `${branch.name} — Coworking in ${branch.city} | Aztech Co-Works` },
    { name: "description", content: `${branch.totalSeats} seats, ${branch.availableSeats} available now. ${branch.address}. Hot desks from ₹6,500/month.` },
    { property: "og:title", content: branch.name },
  ],
})
```

When someone shares the Brookfields page on LinkedIn or WhatsApp, the preview shows the branch name, seat count, and pricing. Not a generic "Aztech Co-Works" title.

## The All-Branches Index

Before the detail page, there's `/branches` — the index page that lists all 6 branches. It's essentially the branch section from the homepage but as a full page, with more detail per card and filtering by city (currently just Coimbatore, but ready for expansion).

The navigation flow: Homepage → "All branches" button → Branch index → Click a branch → Branch detail → "Book a site visit" → Lead captured.

Each step answers a question:
1. "Is this legit?" (Homepage with live data)
2. "Where are they?" (Branch index with addresses)
3. "What's available at this location?" (Branch detail with inventory)
4. "How do I see it in person?" (Site visit form)

Four steps from stranger to lead. No dead ends. No "email us." Just a funnel that works.

---

**Tomorrow:** Day 9 — The Corporate Landing Page: How a B2B Lead Form Feeds Directly Into a Sales CRM

**Image suggestions:**
- SCREENSHOT: Branch detail page showing seat inventory and meeting rooms
- SCREENSHOT: The "Book a site visit" form with branch pre-selected
- SCREENSHOT: All-branches index page showing 6 branch cards
- DIAGRAM: The funnel flow: Homepage → Branches → Detail → Site Visit → CRM Lead

**LinkedIn post:**

> Every coworking branch page answers one question: "What's available, and how much?"
>
> The page shows:
> - Seat inventory by type (hot desk, dedicated, cabin, team office)
> - Available count vs. total
> - Monthly price per seat
> - Meeting rooms with capacity and hourly rate
> - Amenities list
>
> Then: "Book a site visit" → creates a CRM lead + scheduled visit automatically.
>
> No email. No "someone will get back to you." The sales team sees the lead in their pipeline instantly.
>
> 4 steps from stranger to lead:
> Homepage → Branch list → Branch detail → Site visit form
>
> No dead ends. Just a funnel that works.
>
> Day 8 of 45: [link]

**X post:**

> Each branch page on the coworking platform:
>
> - Live seat availability by type
> - Meeting rooms with pricing
> - One-click "Book a site visit"
>
> Form submit → creates CRM Lead + SiteVisit atomically.
>
> Sales team sees it in their Kanban pipeline within seconds. Zero manual data entry.
>
> Day 8/45

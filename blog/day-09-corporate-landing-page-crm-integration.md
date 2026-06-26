# Day 9: The Corporate Landing Page — When a Lead Form Is Actually a CRM Intake

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #b2b #leadgen #react #crm

---

The corporate page isn't a landing page. It's a CRM intake form wearing a nice suit.

When an enterprise prospect fills it out, they don't know they're creating a Lead object with `source: "corporate"`, a score of 50, and a pipeline stage of "new." They think they're "requesting a proposal."

They are. But they're also entering the sales pipeline.

## The B2B Challenge

Coworking spaces have two customer types:

1. **B2C members** — Individuals who want a hot desk or dedicated desk. They self-serve. Pick a plan, pay online, show up.

2. **B2B enterprises** — Companies that need 30-150+ seats. Custom build-outs. Dedicated floors. Enterprise SLAs. Negotiated pricing. 6-month sales cycles.

The B2C members find us through Google, word-of-mouth, or WhatsApp. They convert on the pricing page.

The B2B prospects need a different experience. They need to see that we're a serious enterprise workspace provider, not just a "WeWork for freelancers."

## The Page Structure

The corporate page has 3 sections:

**Section 1: Hero with Lead Capture**

Split layout. Left side has the value proposition:
- "Managed enterprise floors. Zero brokerage."
- "Move-in ready in 30 days"
- Four pillars: Custom build-outs, Dedicated reception, Enterprise SLAs, 30-day move-in

Right side has the form. Right there in the hero. No scrolling to find the CTA.

**Section 2: The Platform Pillars**

Four cards explaining what makes this different from just renting a floor:
- **Self-Serve B2C Ecosystem** — Members manage themselves
- **Enterprise Admin Portal** — White-labeled dashboards for corporate clients
- **Community Management** — Events, referrals, member directory
- **Lead-to-Lease Engine** — Sales pipeline built into the platform

This section sells the tech, not the space. Enterprise clients buy infrastructure, not desks.

**Section 3: Industry Segments**

IT services, Product startups, Creative agencies, Remote-first teams. Shows that we understand different workspace needs.

## The Form Fields

The enterprise form captures everything the sales team needs for a first call:

```tsx
const [form, setForm] = useState({
  name: "",           // Decision maker
  company: "",        // Company name
  email: "",          // Work email (not gmail)
  phone: "",          // Direct line
  teamSize: 10,       // How many seats
  timeline: "1_month", // When do they need it
  branchId: "",       // Which location
  message: "",        // Free-form requirements
});
```

Each field is there for a reason:

- **teamSize** → Determines pricing tier and which branches can accommodate them
- **timeline** → Determines urgency and follow-up cadence (immediate = call today, exploring = nurture)
- **branchId** → Determines which branch manager to loop in
- **message** → Often contains gold: "We need a dedicated floor with server room access" tells sales exactly what to propose

## What Happens on Submit

```tsx
const submit = (e: React.FormEvent) => {
  e.preventDefault();
  createLead.mutate({
    name: form.name,
    email: form.email,
    phone: form.phone,
    source: "corporate",
    branchId: form.branchId,
    teamSize: form.teamSize,
    timeline: form.timeline,
    message: form.message,
    customFields: { company: form.company },
  });
};
```

The `useCreateLead()` hook calls `POST /api/leads`. The backend creates a Lead with:

- `source: "corporate"` (so the sales team knows it's an enterprise inquiry)
- `stage: "new"` (enters the top of the pipeline)
- `score: 50` (base score, will increase based on team size and timeline)
- `customFields: { company }` (visible on the lead detail page)

The sales manager's pipeline immediately shows a new lead card with the company name, team size, and preferred branch. They can see the timeline, read the requirements, and call the prospect within minutes.

No email notification delay. No "check the shared inbox." No "I'll forward this to sales." The CRM IS the inbox.

## The Success State

After submission:

```tsx
onSuccess: () => {
  toast.success("Thanks! Our enterprise team will reach out within 1 business hour.");
  setForm({ ...form, name: "", company: "", email: "", phone: "", message: "" });
}
```

The toast message sets an expectation: "1 business hour." This isn't just marketing. The sales team actually sees the lead in their pipeline. If they have the dashboard open, the new lead card appears via TanStack Query's refetch interval.

## Why Not a Separate CRM?

Most businesses have a website form that sends an email, which someone copies into Salesforce, which triggers an assignment rule, which creates a task, which someone eventually sees.

That's 5 steps and at least 2 manual operations.

Ours is 1 step: form submit → CRM lead. The website IS the CRM intake. The form fields map directly to Lead entity fields. There's no translation layer, no email parsing, no CSV import.

This is possible because we own the entire stack. The website, the API, and the CRM are one codebase. The corporate form and the sales pipeline read from the same database.

## The Source Field

The `source` field on every Lead matters more than it looks:

```typescript
export type LeadSource = "website" | "whatsapp" | "walk_in" | "referral" | "corporate";
```

- **website** — Came through the site visit form or blog CTA
- **whatsapp** — Came through the WhatsApp button
- **walk_in** — Receptionist entered them at the desk
- **referral** — Used a member's referral code
- **corporate** — Enterprise inquiry from the corporate page

The sales pipeline can filter by source. The analytics dashboard can show conversion rates by source. The CEO dashboard can see: "Corporate leads convert at 35%, website leads at 12%, walk-ins at 25%."

One field. Massive insight.

## The Lead Score Boost

Corporate leads automatically get a higher base score than website leads. When a lead has `teamSize >= 30` and `timeline === "immediate"`, the score jumps to 80+. The sales pipeline sorts high-score leads to the top.

A freelancer filling out a site visit form for one hot desk: score 50.
A CTO filling out the enterprise form for 80 seats with immediate move-in: score 95.

Both are leads. One gets a call today.

---

**Tomorrow:** Day 10 — The Pricing Page: Transparent Plans, GST Math, and Why "Contact Us for Pricing" Is a Conversion Killer

**Image suggestions:**
- SCREENSHOT: The corporate page hero with the lead capture form
- SCREENSHOT: The 4 platform pillars section
- SCREENSHOT: A new corporate lead appearing in the sales pipeline Kanban
- DIAGRAM: Corporate form → POST /api/leads → CRM Pipeline → Sales call

**LinkedIn post:**

> The corporate landing page isn't a landing page. It's a CRM intake form.
>
> When an enterprise prospect fills out the form, they're not "requesting a proposal."
>
> They're creating a Lead object with:
> - source: "corporate"
> - stage: "new"
> - score based on team size + timeline
> - customFields: { company }
>
> The sales manager sees it in their Kanban pipeline within seconds.
>
> No email-to-CRM copy-paste. No "I'll forward this to sales." The form fields map directly to CRM entity fields because it's all one codebase.
>
> Website → API → CRM. One step. Zero manual operations.
>
> This is the advantage of owning your entire stack.
>
> Day 9 of 45: [link]

**X post:**

> The corporate page form creates a CRM Lead with source: "corporate" and a score based on team size.
>
> 80 seats + immediate timeline = score 95. Sales calls today.
> 5 seats + "just exploring" = score 45. Nurture sequence.
>
> One form. One API call. Zero manual data entry. The website IS the CRM.
>
> Day 9/45

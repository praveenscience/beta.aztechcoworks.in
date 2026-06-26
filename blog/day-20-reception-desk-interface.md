# Day 20: The Reception Desk — Walk-In Leads, Site Visits, and the Frontline Interface

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #reception #ux #coworking #frontline

---

The receptionist is the most important user in the system. Not the admin. Not the sales manager. The person sitting at the front desk who's the first face every visitor, lead, and member sees.

Their interface needs to be dead simple. No training manual. No "let me figure out which menu that's under." Three things, three sections, zero confusion.

## What a Receptionist Does

In a coworking space, the receptionist handles:

1. **Walk-in leads** — Someone walks in, says "I'm looking for office space." The receptionist captures their info and they enter the sales pipeline.

2. **Scheduled site visits** — "I have a visit booked for 10 AM." The receptionist looks up the visit and guides them.

3. **Visitor check-in** — "I'm here to meet Priya from TechCorp." The receptionist finds the pre-registered visitor and checks them in.

Three workflows. The reception page has three sections.

## Section 1: Walk-In Lead Capture

A form at the top of the page:

```tsx
<form onSubmit={handleNewLead}>
  <Input placeholder="Name" required />
  <Input placeholder="Phone" required />
  <Input placeholder="Email" type="email" />
  <Select>
    <SelectItem value="hot_desk">Hot Desk</SelectItem>
    <SelectItem value="dedicated">Dedicated</SelectItem>
    <SelectItem value="cabin">Cabin</SelectItem>
  </Select>
  <Button type="submit">Add lead</Button>
</form>
```

The form creates a Lead with `source: "walk_in"`. This immediately appears in the sales pipeline. No separate system. No "I'll email the sales team."

The receptionist asks three questions: name, phone, what are you looking for? Types it in. Done. The sales exec sees a new lead card in their Kanban within seconds.

## Section 2: Today's Site Visits

A list of scheduled site visits for today:

```tsx
{siteVisits
  .filter(sv => isToday(sv.scheduledAt))
  .map(sv => {
    const lead = leads.find(l => l.id === sv.leadId);
    return (
      <tr key={sv.id}>
        <td>{lead?.name}</td>
        <td>{lead?.phone}</td>
        <td>{formatTime(sv.scheduledAt)}</td>
        <td><Badge>{sv.status}</Badge></td>
      </tr>
    );
  })}
```

The receptionist sees who's expected today, when they're coming, and their contact info. When the visitor arrives, they can mark the visit as "completed."

This list is populated by the site visit form on the website (`/book-visit`) and by the corporate lead form (`/corporate`). The data flows naturally: prospect fills form → site visit created → reception sees it.

## Section 3: Visitor Management

Pre-registered visitors (registered by members through their portal) appear here with check-in/check-out buttons.

This is the same data shown on the member's visitor page, but from the receptionist's perspective. Members pre-register. Receptionists process.

## The Role-Based Access

The reception page is available to users with roles: `reception`, `branch_manager`, `super_admin`.

A sales exec can't access it (they don't need walk-in lead capture — they have the pipeline). A finance user can't access it. A member certainly can't.

The backend enforces this:

```typescript
router.get("/leads", (req, res) => {
  const user = req._user;
  if (user.role === "sales_exec") {
    res.json(allLeads.filter((l) => l.ownerId === user.id));
  } else {
    res.json(allLeads);
  }
});
```

The receptionist sees all leads (to find walk-in duplicates). The sales exec sees only their leads (to focus).

## Design for the Environment

Reception interfaces have unique constraints:

**Interruptions are constant.** The receptionist is talking to someone, the phone rings, another visitor walks in. The interface can't require focus. Each section is self-contained. You can start entering a walk-in lead, get interrupted, and come back to it.

**Speed matters.** A queue of people at the front desk means every second counts. The walk-in form has 4 fields. The check-in button is one click. No confirmation dialogs. No "Are you sure?" modals.

**Errors are visible.** If the receptionist enters a duplicate lead (same phone number), the sales team will see it in the pipeline and can merge. Better a duplicate than a missed lead.

**Mobile must work.** Some receptionists use a tablet on the desk rather than a full computer. The responsive grid stacks vertically on smaller screens. All form fields are full-width. Buttons are large enough for touch.

## The Data Connection

The reception page is the intersection point of three systems:

1. **CRM** — Walk-in leads feed into the sales pipeline
2. **Visitor Management** — Check-ins feed the visitor log
3. **Site Visits** — Scheduled visits connect to leads

These three systems share the same database. The receptionist's walk-in lead and the website's online lead are the same entity. The pre-registered visitor and the reception check-in are the same record.

No sync. No import. No "update the spreadsheet." One database, multiple views.

## What the Receptionist Doesn't See

The reception page deliberately hides:

- Lead scores (not relevant for check-in)
- Pipeline stages (that's the sales team's concern)
- Financial data (that's finance's domain)
- Analytics (that's management's dashboard)
- User management (that's admin's territory)

The interface shows exactly what the receptionist needs. Nothing more. Reducing cognitive load isn't about dumbing things down — it's about respecting the user's actual workflow.

---

**Tomorrow:** Day 21 — Branch Operations Dashboard: Occupancy Charts, Seat Utilization, and the Branch Manager's View

**Image suggestions:**
- SCREENSHOT: The reception page showing all three sections
- SCREENSHOT: The walk-in lead capture form
- SCREENSHOT: Today's site visits list
- DIAGRAM: Data flow: Walk-in → Lead form → Sales pipeline

**LinkedIn post:**

> The receptionist is the most important user in the entire coworking platform.
>
> Not the admin. Not the sales manager. The person at the front desk.
>
> Their interface has 3 sections:
> 1. Walk-in lead capture (4 fields, one button)
> 2. Today's site visits (who's expected, when)
> 3. Visitor check-in/check-out (one tap each)
>
> Design constraints for reception UIs:
> - Interruptions are constant → each section is self-contained
> - Speed matters → minimum fields, no confirmation dialogs
> - Mobile must work → tablet on desk is common
>
> The hardest part: deciding what to NOT show.
>
> No lead scores. No pipeline stages. No financial data. No analytics.
>
> Reducing cognitive load isn't dumbing down. It's respecting the workflow.
>
> Day 20 of 45: [link]

**X post:**

> Reception desk interface for a coworking space:
>
> 3 sections:
> 1. Walk-in lead form (4 fields)
> 2. Today's site visits
> 3. Visitor check-in
>
> Design rule: what you HIDE matters more than what you show.
>
> No scores. No pipeline. No financials. Just what the receptionist needs.
>
> Day 20/45

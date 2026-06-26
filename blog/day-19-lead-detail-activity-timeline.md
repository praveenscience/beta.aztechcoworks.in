# Day 19: Lead Detail Page — Activity Timeline, Tasks, and the Full Story of a Deal

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #crm #react #activityfeed #sales

---

The Kanban board shows where a lead is. The detail page shows how they got there.

## The Lead Detail Route

`/staff/sales/$leadId` — a dynamic route that loads a single lead with all their activities:

```tsx
const { leadId } = Route.useParams();
const { data: lead } = useLead(leadId);
```

The `useLead()` hook calls `GET /api/dashboard/leads/:id`, which returns the lead plus their activity timeline:

```typescript
res.json({
  ...lead,
  activities: db.leadActivities.byLead(lead.id),
});
```

One API call. The lead data and all activities in one response.

## The Activity Timeline

Every interaction with a lead is recorded as a `LeadActivity`:

```typescript
export interface LeadActivity {
  id: string;
  leadId: string;
  type: "note" | "stage_change" | "email" | "whatsapp" | "call" | "task";
  description: string;
  actorId?: string;
  createdAt: string;
}
```

The timeline renders as a vertical list, most recent first:

```tsx
{activities.map((a) => (
  <div key={a.id} className="flex gap-3 border-l-2 border-border pl-4 pb-4">
    <div>
      <div className="text-sm">{a.description}</div>
      <div className="text-xs text-muted-foreground">
        {actor?.name ?? "System"} · {timeAgo(a.createdAt)}
      </div>
    </div>
  </div>
))}
```

Example timeline for a lead:

```
Today, 2:15 PM    — Priya added a note: "Visited Brookfields branch. Loved the cabin area."
Today, 10:30 AM   — Stage changed: site_visit → proposal
Yesterday, 4:00 PM — Ravi called: "Interested in 10 dedicated desks"
3 days ago         — Lead created from website form
```

The timeline tells the story of the deal. Anyone on the sales team can pick up where someone else left off.

## Adding Activities

Below the timeline, a form lets the sales exec log any type of interaction:

```tsx
<Select value={type} onValueChange={(v) => setType(v)}>
  <SelectItem value="note">Note</SelectItem>
  <SelectItem value="call">Phone call</SelectItem>
  <SelectItem value="email">Email sent</SelectItem>
  <SelectItem value="whatsapp">WhatsApp</SelectItem>
</Select>
<Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
<Button onClick={submit}>Add</Button>
```

The mutation:

```tsx
const createActivity = useCreateLeadActivity();

createActivity.mutate({
  leadId: lead.id,
  type,
  description,
}, {
  onSuccess: () => {
    toast.success("Activity logged");
    setDescription("");
  },
});
```

The activity is stored, the timeline refetches (TanStack Query invalidation), and the new entry appears at the top.

## Task Creation

From the lead detail page, the sales exec can create follow-up tasks:

```tsx
const createTask = useCreateTask();

createTask.mutate({
  leadId: lead.id,
  assigneeId: me.id,
  title: `Follow up with ${lead.name}`,
  dueAt: tomorrow.toISOString(),
  done: false,
});
```

Tasks appear in the task list at `/staff/sales` and can be marked done. They're linked to the lead via `leadId`, so the task context is always clear.

## Stage Transitions

The lead's current stage is shown with a dropdown that allows direct transitions:

```tsx
<Select value={lead.stage} onValueChange={(v) => {
  updateLead.mutate({ id: lead.id, stage: v as LeadStage });
}}>
  {STAGES.map((s) => (
    <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
  ))}
</Select>
```

Change the stage → mutation fires → backend updates → the Kanban board at `/staff/sales` reflects the change immediately (via cache invalidation).

When a lead is moved to "lost," the UI could prompt for a `lostReason`:

```typescript
export interface Lead {
  // ...
  lostReason?: string; // "Went with competitor", "Budget too high", etc.
}
```

Lost reasons are gold for business intelligence. "Why are we losing deals?" is answerable with one query:

```sql
SELECT lostReason, COUNT(*) FROM leads WHERE stage = 'lost' GROUP BY lostReason
```

## The Lead Summary Card

At the top of the detail page, a card summarizes the lead:

- Name, email, phone (clickable)
- Source badge (website, corporate, referral, walk-in)
- Score badge (color-coded)
- Current stage
- Budget (if known)
- Team size (if known)
- Timeline (immediate, 1 month, 3 months, exploring)
- Owner name
- Created date

All in one card. The sales exec glances at it before a call and knows everything: "This is a corporate lead referred by an existing member, team of 15, budget ₹1.2L/month, currently in proposal stage, created 2 weeks ago."

## Why Build It In-House

The CRM is 3 pages of code:
1. **Pipeline page** — Kanban + table views, filtering, KPIs (~170 lines)
2. **Lead detail page** — Activity timeline, task creation, stage changes (~150 lines)
3. **API endpoints** — Lead CRUD, activity creation, task CRUD (~100 lines)

Total: ~420 lines for a functional CRM.

HubSpot Free would give me more features. But it wouldn't give me:
- Zero-latency integration with the website forms
- Same-database access to member and invoice data
- WhatsApp deep links with pre-filled messages
- Custom scoring algorithm tuned to coworking sales
- No per-seat pricing that scales with the sales team

420 lines vs. a monthly SaaS subscription. For a single-product company, the math works.

---

**Tomorrow:** Day 20 — The Reception Desk: Walk-In Leads, Site Visits, and the Frontline Interface

**Image suggestions:**
- SCREENSHOT: Lead detail page showing activity timeline
- SCREENSHOT: The activity logging form with type dropdown
- SCREENSHOT: Lead summary card with score, source, and budget
- SCREENSHOT: Stage transition dropdown on the lead detail page

**LinkedIn post:**

> The lead detail page in our CRM tells the full story of a deal:
>
> Activity timeline:
> - "Visited Brookfields. Loved the cabins." (note)
> - Stage: site_visit → proposal (transition)
> - "Interested in 10 dedicated desks" (call log)
> - Lead created from website form (auto)
>
> Anyone on the team can pick up where someone left off.
>
> The entire CRM is ~420 lines of code:
> - Pipeline page (170 lines)
> - Lead detail page (150 lines)
> - API endpoints (100 lines)
>
> No HubSpot. No per-seat pricing. No integration lag.
>
> For a single-product company, building the CRM in-house cost less than a year of CRM subscription.
>
> Day 19 of 45: [link]

**X post:**

> CRM activity timeline for a coworking lead:
>
> 2:15 PM — Note: "Loved the cabins at Brookfields"
> 10:30 AM — Stage: site_visit → proposal
> Yesterday — Call: "Needs 10 dedicated desks"
> 3 days ago — Created from website form
>
> Full deal history. One page. ~150 lines of code.
>
> Day 19/45

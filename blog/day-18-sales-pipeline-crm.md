# Day 18: The Sales Pipeline — Building a CRM Inside a Coworking Platform

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #crm #kanban #react #sales

---

Most coworking spaces use Zoho or HubSpot for their CRM. Then they manually copy lead data from the website to the CRM, from the CRM to a spreadsheet for the sales meeting, and from the spreadsheet to WhatsApp to message the lead.

Ours is built in. The website, the CRM, and the messaging are one system.

## The Kanban Board

The sales pipeline at `/staff/sales` shows leads across 8 stages:

```
New → Contacted → Qualified → Site Visit → Proposal → Negotiation → Won → Lost
```

Each stage is a vertical column. Each lead is a card showing name, email, budget, source, score, and a WhatsApp icon.

```tsx
const STAGES: LeadStage[] = [
  "new", "contacted", "qualified", "site_visit",
  "proposal", "negotiation", "won", "lost"
];

{STAGES.map((stage) => {
  const stageLeads = visible.filter((l) => l.stage === stage);
  return (
    <div key={stage} className="min-w-[280px] flex-1">
      <div className="text-sm font-semibold">{stageLabels[stage]}</div>
      <Badge variant="secondary">{stageLeads.length}</Badge>
      {stageLeads.map((l) => (
        <Link to="/staff/sales/$leadId" params={{ leadId: l.id }}>
          <Card className="transition hover:shadow-soft">
            <div className="text-sm font-semibold">{l.name}</div>
            <Badge>{l.score}</Badge>
            <div className="text-xs">{l.email}</div>
            {l.budget && <div className="font-mono">{inr(l.budget)}/mo</div>}
          </Card>
        </Link>
      ))}
    </div>
  );
})}
```

The board is horizontally scrollable on mobile. Each column has a count badge. Cards are clickable — they navigate to the lead detail page.

## Lead Scoring

Every lead has a score from 0-100 displayed as a colored badge:

```tsx
<Badge className={l.score > 80 ? "bg-accent text-accent-foreground" : ""}>
  {l.score}
</Badge>
```

Scores above 80 get the gold accent color — they're hot leads. Below 80, they're gray — still worth pursuing but not urgent.

The scoring algorithm considers:
- **Source:** Referrals score higher than walk-ins
- **Team size:** 10+ seats scores higher (enterprise deal)
- **Budget:** ₹50,000+/month scores higher
- **Timeline:** "Immediate" scores higher than "exploring"

A freelancer from the website wanting one hot desk: score 50.
A CTO referred by an existing member, needing 40 seats immediately: score 95.

Both are leads. The score tells the sales team which one to call first.

## The Table View

Not everyone likes Kanban. A toggle switches to a table view:

```tsx
<Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "table")}>
  <TabsList>
    <TabsTrigger value="kanban">Kanban</TabsTrigger>
    <TabsTrigger value="table">Table</TabsTrigger>
  </TabsList>
```

The table shows: Lead name, Source, Budget, Score, Stage (inline dropdown), Owner, and a detail link.

The stage column has an inline Select dropdown — the sales team can move a lead to a different stage directly from the table without opening the detail page:

```tsx
<Select value={l.stage} onValueChange={(v) => moveLeadStage(l.id, v as LeadStage)}>
  <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
  <SelectContent>
    {STAGES.map((s) => <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>)}
  </SelectContent>
</Select>
```

One-click stage transition. The `useUpdateLead()` mutation fires, the backend updates the lead, and TanStack Query invalidates the lead list to refetch.

## Owner Filtering

Sales execs see only their own leads by default. Sales managers and super admins see everyone's:

```typescript
// Backend
if (user.role === "sales_exec") {
  res.json(allLeads.filter((l) => l.ownerId === user.id));
} else {
  res.json(allLeads);
}
```

On the frontend, there's an owner filter dropdown:

```tsx
<Select value={ownerFilter} onValueChange={setOwnerFilter}>
  <SelectItem value="all">All owners</SelectItem>
  {me?.role === "sales_exec" && <SelectItem value="mine">My leads</SelectItem>}
  {salesTeam.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
</Select>
```

A sales manager can switch between "All owners" and individual team members to see who's working what. A sales exec can see "My leads" or "All" (if the backend allows it for their role).

## KPI Row

Above the pipeline, 4 KPIs give the team a snapshot:

```tsx
<Kpi label="Total leads" value={String(visible.length)} />
<Kpi label="Won value" value={inr(wonValue)} />
<Kpi label="Conversion" value={`${conversionRate}%`} />
<Kpi label="Avg score" value={String(avgScore)} />
```

These update as the owner filter changes. "Show me Priya's leads" → the KPIs show Priya's totals.

The won value is calculated from leads with `stage: "won"`:

```tsx
const wonValue = visible
  .filter((l) => l.stage === "won")
  .reduce((s, l) => s + (l.budget ?? 0), 0);
```

## WhatsApp on Every Card

In the bottom-right of every lead card, a WhatsApp icon:

```tsx
<a
  href={whatsappLink(
    `Hi ${l.name.split(" ")[0]}, this is ${owner?.name ?? "Aztech"}.`,
    l.phone.replace(/\D/g, "")
  )}
  target="_blank"
  className="text-success"
>
  <MessageCircle className="h-3.5 w-3.5" />
</a>
```

One tap opens WhatsApp with a pre-filled greeting using the lead's first name and the sales exec's name. The phone number is cleaned of non-digit characters.

In India, this is the follow-up channel. Not email. Not "I'll call you back." WhatsApp. And having it one tap away on every lead card means the sales team actually follows up.

## Why Not Use a CRM Tool?

Because the data already exists in this system. Leads come from the website forms and the reception desk. Members are in the user table. Invoices are in the billing module. Site visits are in the visitor system.

An external CRM would need:
- Webhook integration to receive website leads
- API sync to push member data
- Manual import of invoice data for revenue attribution

With the built-in CRM, a lead flows from the website form to the pipeline to the member table to the invoice system without any integration. One database. One codebase. Zero data silos.

---

**Tomorrow:** Day 19 — Lead Detail Page: Activity Timeline, Task Management, and Stage Transitions

**Image suggestions:**
- SCREENSHOT: The Kanban board with lead cards across 8 stages
- SCREENSHOT: The table view with inline stage dropdown
- SCREENSHOT: A lead card showing score badge, budget, source, and WhatsApp icon
- SCREENSHOT: The owner filter dropdown with team members

**LinkedIn post:**

> Built a sales CRM inside the coworking platform. Here's why:
>
> The data already exists in the system. Leads come from website forms. Members are in the user table. Invoices are in billing.
>
> External CRM would need: webhooks, API sync, manual imports.
> Built-in CRM: one database, zero integration.
>
> Features:
> - 8-stage Kanban with inline stage transitions
> - Lead scoring (0-100, algorithm-based)
> - Table + Kanban view toggle
> - Owner filtering (exec sees own, manager sees all)
> - WhatsApp on every lead card (one-tap follow-up)
> - 4 KPIs: leads, won value, conversion, avg score
>
> The best CRM is the one that doesn't need integration because it's already part of the system.
>
> Day 18 of 45: [link]

**X post:**

> Built a CRM inside the coworking platform instead of integrating one.
>
> Website form → Lead → Pipeline → Member → Invoice
>
> One database. Zero webhooks. Zero API sync. Zero manual imports.
>
> WhatsApp on every lead card. Because in India, that's how sales happens.
>
> Day 18/45

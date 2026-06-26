# Day 12: 258 Lines of TypeScript That Power the Entire Platform

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #typescript #types #architecture #react

---

One file. 258 lines. Zero imports. Every entity in the system defined once.

`types.ts` is the most important file in the entire codebase. Not because it's clever. Because everything else references it.

## The File

20 TypeScript interfaces and type definitions:

```
User, Branch, SeatInventory, MeetingRoom, Plan, Coupon,
Lead, LeadActivity, Task, SiteVisit, Membership, Booking,
Invoice, Visitor, AccessLog, Referral, FormField,
FormDefinition, WorkflowCondition, WorkflowAction, WorkflowRule,
BlogPost, Testimonial
```

Plus 5 union types:

```
Role, SeatType, LeadStage, LeadSource, LeadTimeline
```

Each interface maps 1:1 to a database table. Each field maps to a column. The types ARE the schema.

## Who Uses These Types

**Frontend components** — Every component that renders a Lead, User, Branch, or Invoice imports from `types.ts`:

```tsx
import type { Lead, LeadStage } from "@/types";
```

**TanStack Query hooks** — Every `useQuery` and `useMutation` is typed:

```tsx
export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ["dashboard", "leads"],
    queryFn: () => api.get("/api/dashboard/leads"),
  });
}
```

**Mock data** — The mock API returns typed objects:

```typescript
export const leads: Lead[] = [
  { id: "ld_01", name: "Ravi Chandran", stage: "qualified", score: 82, ... },
];
```

**Seed data** — The Zustand store's initial state is typed:

```typescript
const seedLeads: Lead[] = [...];
```

**Zod validation schemas (server)** — The server's Zod schemas validate the same shape:

```typescript
const leadPatchSchema = z.object({
  stage: z.enum(["new", "contacted", "qualified", ...]).optional(),
  score: z.number().min(0).max(100).optional(),
  ownerId: z.string().optional(),
});
```

The Zod schemas and TypeScript types enforce the same constraints. If I add a field to the `Lead` interface, TypeScript shows me every file that needs updating — components, hooks, mock data, seed data.

## Union Types Over Enums

I use union types instead of TypeScript enums:

```typescript
// This, not enum
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

Why:

1. **No runtime code.** Union types are erased at compile time. Enums generate JavaScript objects. I don't need a runtime object — I need compile-time checks.

2. **Better autocomplete.** When I type `role: "s`, the editor suggests `"sales_exec"`, `"sales_manager"`, `"super_admin"`. Enums require `Role.SalesExec` — a different casing convention and more keystrokes.

3. **JSON compatibility.** API responses use strings: `{ "role": "sales_exec" }`. Union types match this directly. Enums would need mapping.

4. **Exhaustiveness checking.** I can use a switch statement with `satisfies never` to ensure every role is handled:

```typescript
function dashboardPath(role: Role): string {
  switch (role) {
    case "member": return "/dashboard";
    case "reception": return "/staff/reception";
    case "sales_exec": return "/staff/sales";
    // ... if I miss a role, TypeScript errors
  }
}
```

## The Schema Design Principles

**Every entity has an `id: string`.** Not `number`. String IDs like `ld_01`, `br_bk`, `u_admin` are readable in logs, unique across tables, and don't leak sequential information.

**Timestamps are ISO 8601 strings.** Not Date objects. `"2026-06-15T10:30:00.000Z"` serializes cleanly to/from JSON. No timezone bugs. No `new Date()` parsing issues.

**Optional fields use `?`.** Not `| null`. TypeScript's optional property syntax (`phone?: string`) means the field can be undefined or missing entirely. This matches how the API works — some responses include `branchId`, some don't.

**References are string IDs.** `Lead.ownerId`, `Membership.planId`, `Booking.branchId` — all string references to other entities. No embedded objects. The component fetches the referenced entity separately if needed:

```tsx
const branch = branches.find((b) => b.id === membership.branchId);
```

Simple. Predictable. Matches the relational model.

## The Ripple Effect

When I added the `lostReason` field to the Lead type:

```typescript
export interface Lead {
  // ...existing fields
  lostReason?: string;  // NEW
}
```

TypeScript immediately told me:
- The mock data in `mock-data.ts` should include `lostReason` on leads with `stage: "lost"`
- The seed data in `seed.ts` should include it
- The lead detail component should display it
- The Zod validation schema should allow it

One field addition. Four files to update. TypeScript told me all four. Zero runtime surprises.

This is why the types file has zero imports — it's the foundation. Everything depends on it. It depends on nothing.

## Types as Documentation

The types file doubles as documentation for new developers (including future me):

```typescript
export type LeadStage =
  | "new"         // Just entered the system
  | "contacted"   // First outreach made
  | "qualified"   // Budget/timeline confirmed
  | "site_visit"  // Visit scheduled or completed
  | "proposal"    // Pricing sent
  | "negotiation" // Terms being discussed
  | "won"         // Converted to member
  | "lost";       // Declined or ghosted
```

Reading this union type tells you the entire sales funnel in 8 lines. No wiki page. No Confluence doc. The code is the documentation.

```typescript
export interface Visitor {
  id: string;
  hostUserId: string;     // Member who invited them
  branchId: string;       // Which branch they're visiting
  name: string;
  phone: string;
  purpose: string;
  qrToken: string;        // Unique token for check-in
  expectedAt: string;     // When they're expected
  checkedInAt?: string;   // Set on check-in
  checkedOutAt?: string;  // Set on check-out
}
```

The optional `checkedInAt` and `checkedOutAt` fields tell you the visitor lifecycle without any additional documentation. Present = happened. Absent = hasn't happened yet.

## The Rule

258 lines. One file. Zero imports. If you're building a full-stack app and your types are scattered across 15 files, you're making your life harder than it needs to be.

Put them in one place. Make everything reference that one place. Let TypeScript do the rest.

---

**Tomorrow:** Day 13 — The oklch Color System: Building a Design System in Tailwind CSS 4

**Image suggestions:**
- SCREENSHOT: The full types.ts file in VS Code
- SCREENSHOT: TypeScript error showing ripple effect when a type changes
- CODE SCREENSHOT: A union type with the IntelliSense autocomplete dropdown
- DIAGRAM: types.ts at center, arrows pointing to components, hooks, mock data, seed data, Zod schemas

**LinkedIn post:**

> 258 lines of TypeScript types power the entire platform.
>
> One file. types.ts. Zero imports. 20 interfaces + 5 union types.
>
> Used by:
> - Frontend components (renders Lead, User, Branch...)
> - TanStack Query hooks (typed responses)
> - Mock data (typed arrays)
> - Seed data (typed initial state)
> - Zod schemas (validates same shape)
>
> When I add a field to Lead, TypeScript tells me every file that needs updating. Across the entire codebase. Zero runtime surprises.
>
> Why union types over enums:
> - No runtime code (erased at compile time)
> - Better autocomplete ("s" → "sales_exec")
> - JSON-compatible (no mapping needed)
> - Exhaustiveness checking with `satisfies never`
>
> 258 lines. The most important file in the codebase. Not because it's clever. Because everything else references it.
>
> Day 12 of 45: [link]

**X post:**

> The most important file in my SaaS codebase: types.ts
>
> 258 lines. 0 imports. 20 interfaces.
>
> Every component, hook, mock, seed file, and Zod schema references it.
>
> Add a field → TypeScript shows every file to update.
>
> One source of truth. That's the whole strategy.
>
> Day 12/45

# Day 5: The 1,200-Line Monster — Splitting a Monolithic Store Into 5 Modules

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #react #zustand #refactoring #typescript

---

The AI-generated store file was 1,200 lines long. Types, seed data, business logic, computed values, and UI state — all in one file called `store.ts`.

It worked. It all compiled. Every component could import `useStore` and access anything.

And it was completely unmaintainable.

## The Anatomy of a Monolith

Here's what was crammed into that single file:

```
Lines 1-150:     TypeScript interfaces (User, Branch, Lead, Booking, etc.)
Lines 151-500:   Seed data (fake branches, users, leads, plans, invoices...)
Lines 501-900:   Business logic (lead scoring, stage transitions, invoice generation)
Lines 901-1100:  Zustand store definition (state + actions)
Lines 1101-1200: Utility functions (formatting, validation, computed values)
```

When I needed to fix a lead scoring bug, I had to scroll past 500 lines of seed data to find the function. When I needed to add a new type, I had to be careful not to accidentally break the seed data that referenced it. When I wanted to add a new formatting utility, I was modifying a file that also contained the entire database schema.

The file was doing 5 jobs. Each job deserved its own module.

## The Split: 5 Focused Files

I extracted the monolith into 5 files, each with a single responsibility:

### `types.ts` — The Schema (258 lines)

Every TypeScript interface in one place. `User`, `Branch`, `Lead`, `Membership`, `Booking`, `Invoice`, `Visitor`, `Plan`, `Task`, `SiteVisit` — 20 types that mirror the database schema exactly.

This file has zero imports. It's pure type definitions. It's the source of truth for the entire application — frontend, backend, and mock data all reference these types.

```typescript
export type Role =
  | "visitor" | "member" | "reception"
  | "sales_exec" | "sales_manager" | "branch_manager"
  | "finance" | "marketing" | "super_admin";

export type LeadStage =
  | "new" | "contacted" | "qualified" | "site_visit"
  | "proposal" | "negotiation" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  score: number;
  stage: LeadStage;
  ownerId?: string;
  createdAt: string;
  // ... 8 more fields
}
```

### `seed.ts` — The Demo Data

All the fake-but-realistic data. 6 branches with real Coimbatore addresses. 8 users with different roles. 12 leads in various pipeline stages. Plans with actual pricing. Invoices with GST calculations. Meeting rooms with hourly rates.

This file imports only from `types.ts`. It exports typed arrays: `const branches: Branch[] = [...]`.

### `engine.ts` — The Business Logic

Lead scoring algorithm. Stage transition rules. Invoice number generation. Seat availability calculations. Referral code generation.

These are pure functions. No side effects. No state. Easy to test. Easy to reason about.

```typescript
export function calculateLeadScore(lead: Lead): number {
  let score = 50; // base score
  if (lead.source === "referral") score += 20;
  if (lead.teamSize && lead.teamSize >= 10) score += 15;
  if (lead.budget && lead.budget >= 50000) score += 10;
  if (lead.timeline === "immediate") score += 15;
  return Math.min(score, 100);
}
```

### `format.ts` — Display Utilities

Currency formatting (`inr(8500)` -> "₹8,500"), date formatting, WhatsApp link generation, Unsplash image URL helper, stage labels, role labels.

```typescript
export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const whatsappLink = (msg: string, phone = "918310696307") =>
  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

export const roleLabels: Record<Role, string> = {
  visitor: "Visitor",
  member: "Member",
  reception: "Reception",
  sales_exec: "Sales Executive",
  // ...
};
```

### `store.ts` — Just the Zustand Store

Now down to ~200 lines. Creates the Zustand store with `persist` middleware for localStorage. Imports types from `types.ts`, seed data from `seed.ts`, and business logic from `engine.ts`.

The store definition is clean: state shape + actions. No business logic inline. No seed data inline. No formatting utilities.

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lead, Task, Visitor } from "@/types";
import { seedBranches, seedUsers, seedLeads } from "@/seed";

export const useStore = create(persist(
  (set, get) => ({
    branches: seedBranches,
    users: seedUsers,
    leads: seedLeads,
    // ... state

    updateLead: (id: string, patch: Partial<Lead>) => {
      set((s) => ({
        leads: s.leads.map((l) =>
          l.id === id ? { ...l, ...patch } : l
        ),
      }));
    },
    // ... actions
  }),
  { name: "aztech-store" }
));
```

## The Refactoring Process

This wasn't a "rewrite everything" situation. It was a surgical extraction:

1. **Create `types.ts`** — Move all `interface` and `type` declarations. Update imports everywhere. Run `tsc`. Fix any broken references.

2. **Create `seed.ts`** — Move all `const seedX = [...]` arrays. Import types from the new `types.ts`. Update the store to import from `seed.ts`.

3. **Create `engine.ts`** — Find all pure functions in the store (no `set()` calls, no state access). Move them. Replace inline logic in store actions with function calls.

4. **Create `format.ts`** — Find all functions used in JSX for display (currency, dates, labels). Move them. Update component imports.

5. **Clean up `store.ts`** — What remains is the Zustand `create()` call with state and actions. No types, no data, no logic, no formatting.

Each step: move code, update imports, run TypeScript, fix errors, verify the app works. Five iterations. Zero breaking changes.

## The Dependency Graph

After the split, the import graph is clean and acyclic:

```
types.ts          (zero imports)
  |
  v
seed.ts           (imports types)
engine.ts         (imports types)
format.ts         (imports types)
  |
  v
store.ts          (imports types, seed, engine)
```

No circular dependencies. No file imports from a file that imports from it. Each module has a clear dependency direction: types -> data/logic -> store.

Components import from whichever module they need:
- Need a type? Import from `types.ts`
- Need to format currency? Import from `format.ts`
- Need to read/write state? Import `useStore` from `store.ts`

## Why This Matters

**For debugging:** When a lead score is wrong, I open `engine.ts`. When seed data is incorrect, I open `seed.ts`. When a type is missing a field, I open `types.ts`. I never have to search a 1,200-line file.

**For code review:** When someone (future me) reads the code, each file communicates its purpose through its name. `format.ts` formats things. `engine.ts` runs business logic. There's no "oh, that function is on line 847 of store.ts."

**For the backend:** When I built the Express backend later, I could reference `types.ts` to know the exact shape of every entity. The types became the API contract.

**For testing:** Pure functions in `engine.ts` are trivially testable. No mocking stores or providers. `calculateLeadScore(lead)` takes a lead, returns a number.

## The Rule

If a file is doing more than one job, it's doing zero jobs well.

1,200 lines -> 5 files. Each file under 300 lines. Each file with one purpose. The total line count went up slightly (import statements, file headers), but the cognitive load per file dropped by 80%.

That's not a refactor. That's an investment in my own sanity.

---

**Tomorrow:** Day 6 — Nine User Roles: How RBAC Works Without a Library

**Image suggestions:**
- DIAGRAM: The dependency graph showing types -> seed/engine/format -> store
- SCREENSHOT: The file tree showing the 5 modules in `src/lib/`
- SCREENSHOT: Before/after line counts for store.ts
- GENERIC: Someone organizing a messy desk into labeled folders

**LinkedIn post:**

> The store.ts file was 1,200 lines.
>
> Types. Seed data. Business logic. UI state. Formatting utilities. All in one file.
>
> I split it into 5 modules:
>
> types.ts — 258 lines (zero imports, pure interfaces)
> seed.ts — demo data (imports types only)
> engine.ts — business logic (pure functions)
> format.ts — display utilities (currency, dates, labels)
> store.ts — just Zustand state + actions (200 lines)
>
> Dependency graph: types -> data/logic -> store. No circular imports.
>
> Refactoring process: move code, update imports, run tsc, fix errors, verify. Five iterations. Zero breaking changes.
>
> The rule: If a file is doing more than one job, it's doing zero jobs well.
>
> Day 5 of 45: [link]

**X post:**

> store.ts: 1,200 lines. Types + seed data + business logic + state + formatting.
>
> Split into 5 files:
> - types.ts (interfaces)
> - seed.ts (demo data)
> - engine.ts (pure functions)
> - format.ts (display utils)
> - store.ts (just Zustand)
>
> Each file: one job. Zero circular deps. 80% less cognitive load.
>
> Day 5/45 #buildinpublic

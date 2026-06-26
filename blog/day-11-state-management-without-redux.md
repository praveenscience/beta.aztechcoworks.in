# Day 11: State Management Without Redux — The Three-Layer Pattern

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #react #statemanagement #tanstackquery #zustand

---

No Redux. No Context providers wrapping your app 7 layers deep. No `useReducer` with a 200-line switch statement. No Jotai. No Recoil. No MobX.

Three tools. Three layers. Each does one thing.

## Layer 1: Server State → TanStack Query

Every piece of data that lives on the server — branches, users, leads, bookings, invoices, plans — is managed by TanStack Query.

```tsx
export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ["dashboard", "leads"],
    queryFn: () => api.get("/api/dashboard/leads"),
  });
}
```

18 query hooks for reads. 15 mutation hooks for writes. Each hook is 3-10 lines. Each returns `{ data, isLoading, error }` for queries or `{ mutate, isPending }` for mutations.

What TanStack Query gives me for free:
- **Caching** — Data is cached by query key. Navigate away and back, no re-fetch (until stale time expires).
- **Deduplication** — Two components using `useLeads()` trigger one network request, not two.
- **Background refetch** — Stale data is shown immediately, then silently updated when the refetch completes.
- **Cache invalidation** — After a mutation, `invalidateQueries({ queryKey: ["dashboard", "leads"] })` triggers a refetch. Simple.
- **Loading and error states** — Built in. No manual `setLoading(true)` / `setLoading(false)` / `try-catch`.

The mutation pattern is consistent across every write operation:

```tsx
export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) =>
      api.patch(`/api/dashboard/leads/${id}`, patch),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["dashboard", "leads"] }),
  });
}
```

Mutate → API call → on success, invalidate the relevant cache → TanStack Query refetches → UI updates. Every mutation follows this pattern. It's predictable and debuggable.

## Layer 2: Client-Only State → Zustand + localStorage

Some features have no backend API and live purely client-side:

- **Coupons** — Admin-created discount codes (no API yet)
- **Custom forms** — Drag-and-drop form builder (no API yet)
- **Workflow rules** — Automation rules like "when a lead reaches score 80, auto-assign to senior sales" (no API yet)

These use Zustand with the `persist` middleware:

```tsx
export const useStore = create(persist(
  (set) => ({
    coupons: [],
    upsertCoupon: (coupon) => set((s) => ({
      coupons: [...s.coupons.filter((c) => c.code !== coupon.code), coupon],
    })),
    deleteCoupon: (code) => set((s) => ({
      coupons: s.coupons.filter((c) => c.code !== code),
    })),
    // ...
  }),
  { name: "aztech-store" }
));
```

Data persists to localStorage. Survives page refreshes. No server round-trip. No API call. Just the browser.

This is deliberately temporary. When these features get backend APIs, the Zustand store calls will be replaced with TanStack Query hooks — exactly like I did for leads, bookings, and memberships.

## Layer 3: UI State → React useState

Ephemeral state that doesn't survive a page refresh and doesn't need to be shared:

```tsx
const [q, setQ] = useState("");           // Search filter
const [view, setView] = useState("kanban"); // Kanban vs. table toggle
const [branchId, setBranchId] = useState(""); // Selected branch in a form
const [isOpen, setIsOpen] = useState(false);  // Modal/dialog state
```

No library. No global state. Just React's built-in `useState`. When the component unmounts, the state is gone. That's correct — a search filter on the community page doesn't need to persist when you navigate to the invoices page.

## Why This Works

Each layer handles a different lifecycle:

| Layer | Lifecycle | Tool |
|-------|-----------|------|
| Server state | Lives on the server, cached client-side | TanStack Query |
| Client-only features | Persists locally until backend exists | Zustand + localStorage |
| UI state | Exists only while component is mounted | React useState |

There's no confusion about where data comes from or how to update it:

- **Need data from the API?** → `useQuery` / `useMutation`
- **Need client-only persistence?** → `useStore`
- **Need ephemeral form state?** → `useState`

No state management "architecture." No "should this go in the global store or local state?" debates. The lifecycle of the data determines the tool.

## What I Didn't Need

**Redux** — State management for the "everything is global" era. TanStack Query handles server state better than Redux + thunks ever did. The remaining client state is tiny — Zustand handles it in 100 lines.

**Context API** — Useful for dependency injection (theme, i18n), not for state management. Context re-renders every consumer on every update. TanStack Query and Zustand both have fine-grained subscriptions.

**Jotai/Recoil** — Atomic state management. Useful when you have lots of interdependent atoms. I don't. I have server data + a few client-side lists.

**State machines (XState)** — Useful for complex workflows with defined transitions. My workflows are simple: form → submit → success/error. A `useMutation` hook handles this implicitly.

## The Migration Path

The beautiful thing about this layered approach: Layer 2 (Zustand) naturally shrinks over time as features get backend APIs.

When I built the backend for memberships, I replaced:
```tsx
// Before (Zustand)
const memberships = useStore((s) => s.memberships);
```

With:
```tsx
// After (TanStack Query)
const { data: memberships = [] } = useAllMemberships();
```

Same data. Same component. Different source. The component doesn't care where the data comes from — it just renders an array of memberships.

Right now, 4 features still use Zustand (coupons, forms, workflows, referrals). When they get APIs, each migration is a one-line import change + removing the Zustand selector. No refactoring. No architecture changes.

## The Numbers

- **TanStack Query hooks:** 33 (18 queries + 15 mutations)
- **Zustand selectors:** 8 (down from 40+ — most migrated to TanStack Query)
- **Context providers:** 1 (QueryClientProvider — required by TanStack Query)
- **useState calls:** ~60 across all components

Total state management code: maybe 300 lines. For a 33-route SaaS application with 9 user roles.

Keep it simple. Use the right tool for each layer. Don't architecture-astronaut your state management.

---

**Tomorrow:** Day 12 — 258 Lines of TypeScript That Power the Entire Platform

**Image suggestions:**
- DIAGRAM: Three-layer pyramid: useState (top, ephemeral) → Zustand (middle, persistent) → TanStack Query (bottom, server)
- CODE SCREENSHOT: A useQuery hook and a useMutation hook side by side
- SCREENSHOT: React DevTools showing TanStack Query cache entries

**LinkedIn post:**

> My state management strategy for a 33-route SaaS app:
>
> Layer 1: Server state → TanStack Query (33 hooks)
> Layer 2: Client-only features → Zustand + localStorage (8 selectors)
> Layer 3: UI state → React useState (~60 calls)
>
> No Redux. No Context providers. No state management library drama.
>
> The lifecycle of the data determines the tool:
> - API data? → useQuery / useMutation
> - Needs local persistence? → useStore
> - Ephemeral form state? → useState
>
> Layer 2 naturally shrinks over time as features get backend APIs. When memberships got a backend, the migration was one line:
>
> useStore((s) => s.memberships)  →  useAllMemberships()
>
> Same data. Same component. Different source.
>
> Total state management code: ~300 lines. For a 9-role SaaS platform.
>
> Day 11 of 45: [link]

**X post:**

> State management for a 33-route SaaS:
>
> Server data → TanStack Query (33 hooks)
> Local persistence → Zustand (8 selectors)
> Form state → useState
>
> 300 lines total. No Redux. No Context. No drama.
>
> The data's lifecycle determines the tool. That's the entire strategy.
>
> Day 11/45

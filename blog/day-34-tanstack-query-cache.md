# Day 34: The TanStack Query Cache — Why Data Feels Instant

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #tanstackquery #react #performance #caching

---

Navigate to the branches page. Data loads. Navigate away. Navigate back. Data appears instantly. No loading spinner. No flash of empty content.

That's not preloading. That's not prefetching. That's the TanStack Query cache doing its job.

## How the Cache Works

Every `useQuery` call has a `queryKey`:

```tsx
useQuery({
  queryKey: ["branches"],
  queryFn: () => api.get("/api/branches"),
  staleTime: 60_000, // 1 minute
});
```

The first time this hook runs, it fetches from the API and stores the result in a cache keyed by `["branches"]`. For the next 60 seconds (staleTime), any component using `queryKey: ["branches"]` gets the cached data immediately — no network request.

After 60 seconds, the data is "stale." The next time a component renders with this query, TanStack Query:
1. Returns the stale data immediately (instant UI)
2. Fetches fresh data in the background
3. Updates the UI when fresh data arrives

The user sees data instantly. The data is at most 60 seconds old. No loading spinners.

## Stale Time Strategy

Different data gets different stale times:

```tsx
// Public data — changes infrequently
useBranches()       → staleTime: 60_000  (1 minute)
usePlans()          → staleTime: 60_000
useBlog()           → staleTime: 60_000
useTestimonials()   → staleTime: 60_000

// User session — changes rarely
useMe()             → staleTime: 300_000 (5 minutes)

// Dashboard data — default (0, always refetch on mount)
useLeads()          → staleTime: 0
useTasks()          → staleTime: 0
useMyInvoices()     → staleTime: 0
```

Public data is cached for a minute because branch seat counts and plan pricing don't change every second. The user session is cached for 5 minutes because role and profile data rarely changes mid-session.

Dashboard data has no stale time (defaults to 0) — it always refetches when the component mounts. This ensures the sales pipeline shows current lead stages, the task list shows current tasks, and the invoice list shows current invoices.

## Cache Invalidation After Mutations

When a mutation succeeds, I invalidate the relevant cache:

```tsx
export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/api/dashboard/leads/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard", "leads"] }),
  });
}
```

`invalidateQueries` marks the cached data as stale and triggers an immediate refetch. The updated lead list appears within milliseconds of the mutation completing.

The invalidation is targeted — only queries matching `["dashboard", "leads"]` are refetched. Other cached data (branches, plans, tasks) is unaffected.

## Cross-Component Data Sharing

Two components on the same page both need branch data:

```tsx
// In BranchSelector component
const { data: branches = [] } = useBranches();

// In BookingForm component
const { data: branches = [] } = useBranches();
```

TanStack Query deduplicates these. One network request. Both components receive the same data from the cache. Update one, and both re-render with the fresh data.

This eliminates the need to "lift state up" or use Context to share fetched data. Each component declares what data it needs. The cache handles sharing.

## Mutation → Invalidation Patterns

Every mutation follows the same pattern:

```tsx
// Create → invalidate the list
useCreateTask()       → invalidates ["dashboard", "tasks"]
useCreateVisitor()    → invalidates ["dashboard", "visitors"]
useCreateBooking()    → invalidates ["dashboard", "me", "bookings"]

// Update → invalidate the list
useUpdateLead()       → invalidates ["dashboard", "leads"]
useUpdateTask()       → invalidates ["dashboard", "tasks"]

// Delete → invalidate the list
useDeletePlan()       → invalidates ["plans"]

// Upsert → invalidate multiple lists
useUpsertBranch()     → invalidates ["dashboard", "all-branches"] AND ["branches"]
```

The `useUpsertBranch` mutation invalidates both the admin branch list AND the public branch list because updating a branch affects both the admin panel and the marketing site.

## The `setQueryData` Shortcut

For auth mutations, I skip the refetch entirely and write directly to the cache:

```tsx
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds) => api.post("/api/auth/login", creds),
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}
```

After login, the user data is immediately available in the cache without a separate `GET /api/auth/me` call. The dashboard renders instantly after login.

Similarly, logout clears the cache:

```tsx
onSuccess: () => {
  qc.setQueryData(["me"], null);
  qc.clear(); // Clear all cached data
}
```

`qc.clear()` removes all cached data, so the next login starts fresh with no stale data from the previous session.

## The Result

The perceived performance of the app is dramatically better than the actual network performance. Users experience:

- **Instant navigation** — Cached data renders immediately
- **Background updates** — Fresh data arrives silently
- **Optimistic mutations** — Changes feel immediate
- **No loading spinners** — On return visits to pages

TanStack Query turns a standard API-backed React app into something that feels like a native application. And the configuration is just `staleTime` values and `invalidateQueries` calls.

---

**Tomorrow:** Day 35 — The API Layer: 66 Lines That Connect Everything

**Image suggestions:**
- DIAGRAM: Cache flow: Component mount → cache hit? → return cached data → background refetch → update UI
- CODE SCREENSHOT: staleTime configuration for different query types
- CODE SCREENSHOT: invalidateQueries after a mutation

**LinkedIn post:**

> TanStack Query cache strategy for a SaaS dashboard:
>
> Public data: staleTime 60s (branches, plans, blog)
> User session: staleTime 5min (role, profile)
> Dashboard data: staleTime 0 (always fresh on mount)
>
> Navigate away and back: instant data (from cache).
> After mutation: invalidateQueries triggers refetch.
> After login: setQueryData writes user directly to cache.
>
> Two components using useBranches() = one network request. The cache deduplicates automatically.
>
> No "lift state up." No Context for shared data. Each component declares what it needs. The cache handles sharing.
>
> The perceived performance is dramatically better than actual network performance. That's the magic.
>
> Day 34 of 45: [link]

**X post:**

> TanStack Query cache makes the app feel instant:
>
> Navigate → cached data renders immediately
> Stale data? → background refetch, silent update
> Mutation? → invalidateQueries, targeted refetch
>
> No loading spinners on return visits. Zero "lift state up."
>
> Day 34/45

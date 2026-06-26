# Day 4: File-Based Routing Without a Server — How TanStack Router Powers a 33-Route SPA

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #tanstackrouter #react #routing #typescript

---

After ripping out SSR (Day 3), I needed a client-side router that could handle 33 routes with type safety, code splitting, and layouts. TanStack Router delivered on all three — and introduced me to a trick I now use on every project.

## File-Based Routing in a Pure SPA

Most people associate file-based routing with Next.js or Remix — frameworks that require a server. TanStack Router does file-based routing with zero server requirement.

Here's my route tree:

```
src/routes/
  __root.tsx              # Root layout (providers, error boundaries)
  _public.tsx             # Marketing layout (header, footer, WhatsApp FAB)
  _public/
    index.tsx             # Homepage (/)
    pricing.tsx           # Pricing page (/pricing)
    branches.index.tsx    # All branches (/branches)
    branches.$slug.tsx    # Branch detail (/branches/brookfields)
    blog.index.tsx        # Blog listing (/blog)
    blog.$slug.tsx        # Blog post (/blog/some-post)
    book-visit.tsx        # Site visit form (/book-visit)
    corporate.tsx         # Enterprise page (/corporate)
    auth.tsx              # Login/register (/auth)
  dashboard.tsx           # Member layout (sidebar, header)
  dashboard.index.tsx     # Member overview (/dashboard)
  dashboard.bookings.tsx  # Meeting room booking (/dashboard/bookings)
  dashboard.membership.tsx
  dashboard.invoices.tsx
  dashboard.visitors.tsx
  dashboard.community.tsx
  dashboard.referrals.tsx
  staff.tsx               # Staff layout
  staff.reception.tsx     # Reception desk (/staff/reception)
  staff.sales.index.tsx   # Sales pipeline (/staff/sales)
  staff.sales.$leadId.tsx # Lead detail (/staff/sales/abc123)
  staff.branch.tsx        # Branch ops (/staff/branch)
  staff.finance.tsx       # Finance (/staff/finance)
  staff.marketing.tsx     # Marketing tools (/staff/marketing)
  admin.tsx               # Admin layout
  admin.analytics.tsx     # CEO dashboard (/admin/analytics)
  admin.users.tsx         # User management (/admin/users)
  admin.branches.tsx      # Branch CRUD (/admin/branches)
  admin.pricing.tsx       # Plan management (/admin/pricing)
  admin.forms.tsx         # Custom forms (/admin/forms)
  admin.workflows.tsx     # Workflow rules (/admin/workflows)
```

No configuration file. No manual route registration. Drop a file, get a route. TanStack Router's Vite plugin generates the route tree automatically with `autoCodeSplitting` — every route is lazy-loaded by default.

## The Pathless Layout Route Trick

This is the feature that sold me on TanStack Router. See that `_public.tsx` file? The underscore prefix makes it a "pathless layout route."

It wraps all the files inside `_public/` with a shared layout — header, footer, WhatsApp floating action button — **without adding `/public/` to the URL**.

So the homepage is `/`, not `/public/`. The pricing page is `/pricing`, not `/public/pricing`.

Here's what `_public.tsx` looks like:

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteChrome } from "@/components/site-chrome";

export const Route = createFileRoute("/_public")({
  component: () => (
    <SiteChrome>
      <Outlet />
    </SiteChrome>
  ),
});
```

`SiteChrome` renders the nav bar, the footer, and the WhatsApp FAB. `<Outlet />` renders whatever child route matches. Clean separation.

Meanwhile, `dashboard.tsx`, `staff.tsx`, and `admin.tsx` are regular layout routes that wrap their children with the `DashboardShell` component — sidebar, top bar, breadcrumbs.

Two completely different layouts. Zero URL pollution. No `useLocation()` hacks to detect which layout to show.

## Type-Safe Route Parameters

TanStack Router generates TypeScript types for every route automatically. When I write:

```tsx
<Link to="/staff/sales/$leadId" params={{ leadId: lead.id }}>
```

TypeScript knows that `/staff/sales/$leadId` requires a `leadId` param. If I typo it as `leadd`, the compiler catches it. If I forget the param entirely, red squiggles.

In the route component itself:

```tsx
export const Route = createFileRoute("/staff/sales/$leadId")({
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  // leadId is typed as string, guaranteed to exist
}
```

No `useParams<{ leadId: string }>()` casting. No runtime checks. The route file name IS the type definition.

## Code Splitting for Free

With `autoCodeSplitting` enabled in the Vite plugin config:

```ts
// vite.config.ts
TanStackRouterVite({ autoCodeSplitting: true })
```

Every route becomes its own chunk. The member dashboard code doesn't load when you're on the homepage. The admin analytics charts (including the 348KB Recharts library) don't load until you navigate to `/admin/analytics`.

The build output:

```
dist/assets/index-D70QJFUU.js                     355 kB  (shared React/UI)
dist/assets/admin.analytics-C14SvL0A.js             14 kB  (charts page)
dist/assets/staff.sales-BxYz1234.js                  8 kB  (CRM pipeline)
dist/assets/dashboard.bookings-AbCd5678.js           6 kB  (booking engine)
```

First paint loads ~100KB. Each subsequent navigation loads 5-15KB. The user never downloads code for pages they don't visit.

## The `head()` Function

Even without SSR, I need per-route meta tags for the marketing pages. TanStack Router has a `head()` function:

```tsx
export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Aztech Co-Works — Coworking in Coimbatore" },
      { name: "description", content: "6 branches, 1,200+ seats..." },
      { property: "og:title", content: "Aztech Co-Works..." },
    ],
  }),
  component: Home,
});
```

Each marketing page defines its own title, description, and Open Graph tags. The root layout applies them to `<head>`. Works with social media crawlers and Google's JavaScript rendering.

## Layout Routes vs. Page Routes

The mental model is simple:

- **Layout routes** (`_public.tsx`, `dashboard.tsx`, `staff.tsx`, `admin.tsx`) render `<Outlet />` and provide shared chrome (headers, sidebars, navigation)
- **Page routes** (`dashboard.bookings.tsx`, `staff.sales.index.tsx`) render actual content
- **Dynamic routes** (`branches.$slug.tsx`, `staff.sales.$leadId.tsx`) have URL parameters

The dot notation (`dashboard.bookings`) creates URL nesting (`/dashboard/bookings`). The `$` prefix creates dynamic segments. The `index` suffix handles the bare path.

It's a file system that maps 1:1 to URL paths. Once you see the pattern, you can read the route tree like a sitemap.

## What I'd Tell Next.js Developers

If you're coming from Next.js, the mental shift is:

1. **No `getServerSideProps`.** Everything is client-side. Use TanStack Query for data fetching.
2. **No `api/` routes.** Your backend is a separate service. This is a good thing.
3. **No server components.** Every component is a client component. Use code splitting instead of server components for performance.
4. **Layout files are explicit.** No magic `layout.tsx` convention. You create layout routes with `<Outlet />` and they wrap child routes.

The trade-off: you lose automatic SSR/SSG. You gain simplicity, sub-second builds, and a deployment model that's just static files on a CDN.

For a dashboard-heavy SaaS app, that trade-off is overwhelmingly in favor of the SPA.

---

**Tomorrow:** Day 5 — The 1,200-Line Monster: How I Split a Monolithic Store Into 5 Modules Without Breaking Anything

**Image suggestions:**
- SCREENSHOT: The file tree in VS Code showing all route files
- SCREENSHOT: The `_public.tsx` layout route code
- DIAGRAM: Visual showing how _public layout wraps marketing pages vs. dashboard layout wrapping dashboard pages
- SCREENSHOT: TypeScript autocomplete showing typed route params

**LinkedIn post:**

> TanStack Router has a feature called "pathless layout routes."
>
> File: `_public.tsx` (note the underscore)
>
> It wraps every marketing page with a shared header, footer, and WhatsApp FAB — without adding `/public/` to the URL.
>
> So `/pricing`, `/branches`, `/blog` all get the marketing chrome.
> But `/dashboard` and `/admin` get a completely different sidebar layout.
>
> Two layouts. Zero URL pollution. One underscore prefix.
>
> Meanwhile, `autoCodeSplitting` makes every route its own lazy chunk. The admin dashboard code (with 348KB of charts) never loads on the homepage.
>
> 33 routes. All type-safe. All code-split. No configuration file.
>
> Day 4 of 45: [link]

**X post:**

> TanStack Router trick: pathless layout routes.
>
> _public.tsx wraps marketing pages with header + footer.
> dashboard.tsx wraps member pages with sidebar.
>
> Different layouts. Clean URLs. One underscore prefix.
>
> 33 routes, all type-safe, all code-split. Zero config.
>
> Day 4/45 #buildinpublic

# 45-Day Content Plan: Building a Full-Stack SaaS Platform for a Coworking Business

**Author:** Praveen Kumar Purushothaman
**Tone:** 70% technical deep-dives, 30% storytelling and founder journey
**Platforms:** Blog (personal site / Dev.to / Hashnode), LinkedIn, X (Twitter)
**Rule:** No client names. No co-founder mentions. First-person "I built" narrative.

---

## Content Calendar Overview

| Week | Theme | Blog Post | Social Posts |
|------|-------|-----------|--------------|
| 1 | The Origin Story | Blog #1: Why I built it | 7 posts |
| 2 | Architecture & Stack | Blog #2: Stack decisions | 7 posts |
| 3 | The Marketing Site | Blog #3: Building the public face | 7 posts |
| 4 | The Dashboard Empire | Blog #4: Multi-role dashboards | 7 posts |
| 5 | Backend & Security | Blog #5: Production hardening | 7 posts |
| 6 | Mock Mode & Deployment | Blog #6: The mock mode trick | 6 posts |
| 6.5 | Wrap-up & Retrospective | Blog #7: What I'd do differently | 4 posts |

---

## WEEK 1: THE ORIGIN STORY (Days 1-7)

### Blog Post #1: "I Built a Full-Stack SaaS Platform for a 1,200-Seat Coworking Business. Here's the Entire Journey."

**Word count:** ~2,500
**Publish on:** Day 1 (anchor post, everything links back here)

**Outline:**

1. **The hook** — "A coworking business with 6 branches, 1,200 seats, and 9 different user roles needed software. Not a WordPress site. Not a Wix template. A real platform — CRM, member portal, sales pipeline, reception desk, finance dashboard, booking engine, visitor management, and a marketing site. I said yes."

2. **The constraint** — No dedicated dev team. Just me. The business is already running — real members, real revenue, real operations. Whatever I build has to work yesterday.

3. **The prototype gamble** — I started with Lovable (AI code generation) to get a working prototype in front of the business team. It generated a TanStack Start SSR app. It worked. Sort of. Then I needed to actually ship it.

4. **The 20-commit journey** — Walk through the git log as a narrative:
   - Commit 1-2: Lovable prototype + route tree
   - Commit 3-5: Cloudflare deploy hell (three commits just to fix deployment)
   - Commit 6: Rip out SSR, go pure SPA (the moment I stopped fighting the framework)
   - Commit 7: Split the monolithic store (the file was 1,200 lines)
   - Commit 8-9: Marketing site polish (scroll reveals, animated counters, WhatsApp FAB)
   - Commit 10: Layout refactor (the pathless route trick)
   - Commit 11: Mobile sidebar
   - Commit 12-13: Dead code cleanup
   - Commit 14: Node.js backend with Express
   - Commit 15: Wire frontend to backend
   - Commit 16: SQLite migration
   - Commit 17: PHP backend (yes, both)
   - Commit 18: Mock mode (the best decision I made)
   - Commit 19: Real business data
   - Commit 20: Corporate/enterprise features
   - Commit 21-24: Security hardening + complete API coverage

5. **The numbers** — 33 route files. 9 user roles. 18 API query hooks. 46+ UI components. 2 backends (Node + PHP). 258 lines of TypeScript types. Zero npm audit vulnerabilities. Sub-second builds.

6. **What's next** — Razorpay payments, WhatsApp Business API, real branch photos, Google Analytics.

**Image suggestions:**
- GENERIC: A split-screen showing code editor on left, coworking space on right
- SCREENSHOT: The homepage hero section with the "1,200+ seats" counter
- SCREENSHOT: The git log (`git log --oneline`) showing the full commit history
- GENERIC: Aerial view of a modern coworking space

---

### Social Posts — Week 1

**Day 1 (LinkedIn) — Launch post:**

> I just built a full-stack SaaS platform for a coworking business.
>
> Not a landing page. Not a template. The whole thing:
>
> - Marketing site with real-time seat availability
> - Member portal with QR check-in, invoices, and bookings
> - Sales CRM with Kanban pipeline and lead scoring
> - Reception desk with visitor management
> - Finance dashboard with GST invoicing
> - Admin panel with 9-role RBAC
>
> 6 branches. 1,200 seats. One developer.
>
> Stack: React 19 + Vite + TanStack Router + shadcn/ui + Express + SQLite
>
> I'm writing a 7-part series about the entire build. Part 1 is live now.
>
> [link]
>
> #buildinpublic #saas #react #coworking

**Day 1 (X) — Thread starter:**

> I built a full-stack SaaS platform for a 1,200-seat coworking business.
>
> 33 routes. 9 user roles. 2 backends. 0 regrets.
>
> Here's the entire journey in 7 blog posts. Thread on the highlights:
>
> 1/12

**Day 2 (X) — Thread continues:**

> The prototype came from Lovable (AI code gen). It gave me a TanStack Start SSR app.
>
> First lesson: AI-generated code is a starting point, not a destination.
>
> I kept the component structure. Ripped out everything else.
>
> 2/12

**Day 3 (LinkedIn) — The Cloudflare story:**

> Three commits to deploy to Cloudflare Pages.
>
> Commit 1: Wrong Nitro preset
> Commit 2: Lockfile not cross-platform compatible
> Commit 3: esbuild missing from devDependencies
>
> Lesson: Your CI environment is not your laptop. Ever.
>
> The fix that finally worked? Rip out SSR entirely. Go pure SPA. Add a `_redirects` file.
>
> Sometimes the best architecture decision is subtraction.
>
> #cloudflare #deployment #webdev

**Day 4 (X):**

> The store.ts file hit 1,200 lines.
>
> Types, seed data, business logic, and UI state — all in one file.
>
> I split it into 5 modules: types.ts, seed.ts, engine.ts, format.ts, store.ts
>
> Each file has one job. Zero circular imports.
>
> Monoliths are fine until they're not. 4/12

**Day 5 (LinkedIn) — The roles story:**

> 9 user roles in one coworking platform:
>
> visitor -> member -> reception -> sales_exec -> sales_manager -> branch_manager -> finance -> marketing -> super_admin
>
> Each role sees a completely different dashboard.
>
> A receptionist sees visitor check-ins and walk-in leads.
> A sales exec sees their pipeline and tasks.
> A branch manager sees occupancy and seat utilization charts.
> A finance user sees invoices and revenue.
> A super admin sees everything.
>
> The RBAC system isn't a library. It's 3 middleware functions and a switch statement.
>
> Sometimes the boring solution is the right solution.

**Day 6 (X):**

> Hot take: You don't need a permission library for RBAC.
>
> requireAuth() — checks session exists
> requireRole("super_admin") — checks user.role
> Conditional UI — checks role client-side
>
> 3 functions. 40 lines. Covers 9 roles across 33 routes.
>
> 6/12

**Day 7 (LinkedIn) — Week 1 recap:**

> Week 1 of the build series is done.
>
> Most popular question so far: "Why not Next.js?"
>
> Answer: This is a coworking management platform, not a blog. Every page is behind auth. SEO only matters on 6 marketing pages. SSR adds complexity for zero benefit here.
>
> Vite builds in 619ms. Cold start is instant. No server to manage.
>
> Choose tools for the problem, not for the resume.

**Image suggestions for Week 1:**
- SCREENSHOT: Homepage with animated counters mid-animation
- SCREENSHOT: Git log showing all commits
- GENERIC: Developer at a standing desk in a coworking space
- SCREENSHOT: The 9-role type definition from types.ts

---

## WEEK 2: ARCHITECTURE & STACK DECISIONS (Days 8-14)

### Blog Post #2: "React 19 + Vite + TanStack Router + shadcn/ui: Why This Stack Won"

**Word count:** ~3,000
**Publish on:** Day 8

**Outline:**

1. **Why not Next.js** — This isn't a content site. It's an operational platform. 27 of 33 routes are behind authentication. SSR buys me nothing. I need a fast SPA with great client-side routing.

2. **TanStack Router deep-dive** — File-based routing with `autoCodeSplitting`. The pathless layout route trick (`_public.tsx` wraps marketing pages without adding a URL segment). Type-safe route params. How `createFileRoute` gives you autocomplete on every `<Link>`.

3. **The state management pyramid:**
   - TanStack Query for server state (18 query hooks, 15 mutation hooks)
   - Zustand + localStorage for client-only features (coupons, custom forms, workflow rules)
   - React `useState` for ephemeral UI state (form inputs, filters, modals)
   - Why I didn't need Redux, Context, or Jotai

4. **shadcn/ui + Tailwind CSS 4** — The oklch color system. How `bg-hero`, `text-accent`, `shadow-elegant` create a consistent brand. Why copying components into your project beats npm packages.

5. **The type system** — 258 lines of TypeScript types that mirror the database schema exactly. `types.ts` is the single source of truth. If the type compiles, the API call works.

6. **Build performance** — Vite 8 builds in 619ms. 18 code-split chunks. The largest is recharts at 348KB (tree-shaking limit for a charting library). Total JS: ~900KB gzipped across all routes, but each page loads only what it needs.

**Image suggestions:**
- DIAGRAM: Architecture diagram showing Frontend (React SPA) -> API Layer -> Backend (Express/PHP) -> SQLite, with Mock Mode as a bypass
- SCREENSHOT: The file tree of `src/routes/` showing the file-based routing structure
- SCREENSHOT: Vite build output showing chunk sizes
- SCREENSHOT: The `_public.tsx` layout route code
- GENERIC: A clean whiteboard with architecture boxes drawn on it

---

### Social Posts — Week 2

**Day 8 (LinkedIn):**

> TanStack Router has a feature called "pathless layout routes."
>
> My file `_public.tsx` wraps every marketing page with a shared header, footer, and WhatsApp FAB — without adding `/public/` to the URL.
>
> So `/pricing`, `/branches`, `/blog` all get the shared chrome, but `/dashboard` and `/admin` get a completely different layout.
>
> One underscore prefix. Zero URL pollution. This is elegant routing.
>
> Full deep-dive in blog post #2: [link]

**Day 9 (X):**

> My state management strategy:
>
> Server state -> TanStack Query (18 hooks)
> Client-only features -> Zustand + localStorage
> UI state -> useState
>
> That's it. No Redux. No Context providers. No state management library drama.
>
> The right tool for each layer.

**Day 10 (LinkedIn):**

> 258 lines of TypeScript types power the entire platform.
>
> One file. `types.ts`. It defines User, Branch, Lead, Membership, Booking, Invoice, Visitor — every entity in the system.
>
> The same types are used by:
> - The frontend components
> - The API query hooks
> - The mock data generator
> - The Zod validation schemas (server)
>
> When I add a field to a type, TypeScript tells me every file that needs updating. Across the entire codebase.
>
> This is why I use TypeScript.

**Day 11 (X):**

> Vite 8 build stats for a 33-route SaaS platform:
>
> Build time: 619ms
> Chunks: 18 code-split bundles
> Largest: recharts (348KB) — can't tree-shake a chart library
> Total: ~900KB gzipped across ALL routes
>
> Each page loads ~50-100KB. The rest is lazy.

**Day 12 (LinkedIn):**

> The oklch color system in Tailwind CSS 4 is underrated.
>
> I defined 6 semantic colors (hero, accent, success, card-soft, shadow-elegant, shadow-glow) and they work across light and dark mode automatically.
>
> `bg-hero` is the dark gradient on the homepage and admin sections.
> `text-accent` is the brand gold.
> `shadow-elegant` is the hover effect on every card.
>
> No hex codes scattered across 33 files. Just semantic tokens.

**Day 13 (X):**

> shadcn/ui vs component libraries:
>
> With npm packages, you fight the library's opinions.
> With shadcn, you OWN the code. I modified 15 components for this project.
>
> Button, Card, Badge, Select, Sheet, Tabs — all customized. Zero version conflicts. Forever.

**Day 14 (X):**

> The TanStack Router + TanStack Query combo is absurdly good.
>
> Route params are typed. Query keys are typed. Mutation payloads are typed.
>
> Click a lead card -> navigates to /staff/sales/$leadId -> leadId is a typed param -> useQuery fetches with that param -> response is typed Lead & { activities: LeadActivity[] }
>
> End-to-end type safety from URL to UI. No `any`. No runtime surprises.

---

## WEEK 3: THE MARKETING SITE (Days 15-21)

### Blog Post #3: "Building a Marketing Site That Actually Converts — Inside a React SPA"

**Word count:** ~2,500
**Publish on:** Day 15

**Outline:**

1. **The homepage as a sales machine** — Real-time seat availability in the hero ("847 seats available right now"). Animated counters that count up on scroll. Branch cards with live seat counts and photos. Pricing cards pulled from the database. Testimonials. Corporate CTA. Every section earns its place.

2. **Scroll reveal animations** — Custom `useScrollReveal` hook using IntersectionObserver. No animation library. Each section fades in and slides up as you scroll. The counter hook (`useCounter`) animates from 0 to target using `requestAnimationFrame`.

3. **The branch detail page** — Dynamic route `/branches/$slug`. Shows seat inventory breakdown, meeting rooms, amenities, and a "Book a site visit" CTA. Data comes from the API, falls back to mock data if the backend is down.

4. **The corporate page** — B2B landing page with 4 platform pillars, enterprise lead capture form with team size, timeline, and branch preference. The form creates a lead with `source: "corporate"` directly in the CRM.

5. **SEO in an SPA** — `head()` function in TanStack Router for per-page meta tags. Open Graph tags. Structured descriptions. The `_redirects` file for Cloudflare Pages SPA fallback.

6. **The WhatsApp FAB** — Floating action button on every marketing page. Pre-filled message. Opens WhatsApp with the business number. One line of code: `whatsappLink("Hi Aztech! I'd like to know more...")`.

**Image suggestions:**
- SCREENSHOT: Full homepage hero section with seat counter and branch cards
- SCREENSHOT: Branch detail page showing seat inventory breakdown
- SCREENSHOT: Corporate page with the enterprise lead form
- SCREENSHOT: Mobile view of the homepage showing responsive layout
- SCREENSHOT: The pricing section with the "Most popular" badge
- GENERIC: Person browsing a website on a laptop in a cafe

---

### Social Posts — Week 3

**Day 15 (LinkedIn):**

> The homepage of this coworking platform shows real-time seat availability.
>
> "847 seats available right now" — pulled live from the database.
>
> Not a static number. Not updated weekly. Real-time.
>
> When a member joins or leaves, the counter updates across the entire site. The hero badge, the branch cards, the pricing page — all reactive.
>
> This is what separates a website from a platform.
>
> Blog post #3 breaks down how: [link]

**Day 16 (X):**

> Built animated counters without any animation library.
>
> useCounter hook:
> - IntersectionObserver triggers on scroll
> - requestAnimationFrame drives the animation
> - Eases from 0 to target over 1.5s
>
> "6 branches" counts up from 0.
> "1,200+ seats" counts up from 0.
>
> 30 lines of code. Zero dependencies.

**Day 17 (LinkedIn):**

> The corporate landing page doubles as a lead generation engine.
>
> When an enterprise prospect fills out the form (name, company, team size, timeline, preferred branch), it doesn't just send an email.
>
> It creates a Lead object in the CRM with:
> - source: "corporate"
> - Kanban stage: "new"
> - Lead score: 50
> - Custom fields: { company }
>
> The sales team sees it instantly in their pipeline. No manual data entry. No "check the inbox."
>
> Marketing page = CRM intake form. That's the integration.

**Day 18 (X):**

> SEO in a React SPA:
>
> TanStack Router's head() function:
>
> ```
> head: () => ({
>   meta: [
>     { title: "Aztech Co-Works — Coworking in Coimbatore" },
>     { property: "og:title", content: "..." },
>   ],
> })
> ```
>
> Per-route meta tags. Works with crawlers. No SSR needed.

**Day 19 (LinkedIn):**

> Every section on the homepage earns its place.
>
> Hero: Hook + CTA + live stats
> Trusted by: Social proof
> Branches: Live availability
> Pricing: Transparent plans
> Amenities: Feature grid
> Testimonials: Real quotes
> Corporate CTA: Enterprise upsell
>
> No "about our journey" section. No team photos. No mission statement.
>
> Every pixel converts or informs. That's it.

**Day 20 (X):**

> The WhatsApp integration is literally one utility function:
>
> ```
> export const whatsappLink = (msg: string, phone = "918310696307") =>
>   `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
> ```
>
> Used in: homepage CTA, branch pages, sales pipeline, corporate page.
>
> In India, WhatsApp IS the conversion channel. Not email. Not forms.

**Day 21 (LinkedIn) — Week 3 recap:**

> Built an entire marketing site inside a React SPA this week.
>
> The biggest learning: A marketing site for a B2B product isn't about looking pretty.
>
> It's about:
> 1. Showing live data (not screenshots)
> 2. Converting visitors into leads (not "contact us")
> 3. Loading fast on 4G (not 50MB hero videos)
>
> Every branch card shows real seat availability. Every CTA creates a real CRM lead. Every page loads in under 2 seconds on mobile.
>
> Form follows function.

---

## WEEK 4: THE DASHBOARD EMPIRE (Days 22-28)

### Blog Post #4: "9 User Roles, 9 Different Dashboards — How I Built a Multi-Tenant Admin Panel"

**Word count:** ~3,500 (the meatiest post)
**Publish on:** Day 22

**Outline:**

1. **The role hierarchy** — visitor < member < reception < sales_exec < sales_manager < branch_manager < finance < marketing < super_admin. Each role has a different sidebar, different data access, and different capabilities.

2. **DashboardShell** — The shared layout component. Sidebar with role-aware navigation. Sheet-based mobile drawer. Breadcrumbs. User avatar with logout. How one component serves 9 different experiences.

3. **Member portal deep-dive:**
   - Dashboard overview: Active plan, recent invoices, QR code for entry, quick actions
   - Meeting room booking: Branch picker -> room picker -> date/time -> instant confirmation with GST calculation
   - Membership management: View plan, upgrade, cancel
   - Visitor pre-registration: QR tokens for guests
   - Referral program: Share code, track conversions
   - Community directory: Search members by name or company

4. **Sales CRM deep-dive:**
   - Kanban pipeline with 8 stages (new -> contacted -> qualified -> site_visit -> proposal -> negotiation -> won -> lost)
   - Lead detail page with activity timeline, task creation, stage changes
   - Lead scoring (0-100)
   - Owner assignment and filtering
   - WhatsApp integration on every lead card
   - One-click stage transitions via dropdown

5. **Reception desk:**
   - Walk-in lead capture
   - Visitor check-in/check-out with QR tokens
   - Site visit management
   - Today's scheduled visitors

6. **Branch manager view:**
   - Occupancy percentage with progress bars
   - Seat utilization chart (Recharts BarChart)
   - Inventory breakdown by seat type (hot_desk, dedicated, cabin, team_office, enterprise)
   - Active member count

7. **Finance dashboard:**
   - All invoices with status filtering
   - Revenue totals
   - GST breakdown

8. **Super admin (CEO dashboard):**
   - 6 KPIs: Total leads, conversion rate, occupancy, active members, lifetime revenue, estimated LTV
   - Monthly revenue trend (LineChart)
   - Branch occupancy comparison (BarChart)
   - User management with inline role editing
   - Branch CRUD
   - Plan CRUD with feature list editor
   - Coupon management

**Image suggestions:**
- SCREENSHOT: Member dashboard overview with QR code and quick actions
- SCREENSHOT: Sales pipeline Kanban view with lead cards
- SCREENSHOT: Lead detail page showing activity timeline
- SCREENSHOT: Meeting room booking form with GST calculation
- SCREENSHOT: Branch operations page with seat utilization chart
- SCREENSHOT: CEO analytics dashboard with revenue and occupancy charts
- SCREENSHOT: Admin user management page with role dropdown
- SCREENSHOT: Mobile view of the dashboard with Sheet sidebar open
- GENERIC: Multiple screens/devices showing different dashboard views

---

### Social Posts — Week 4

**Day 22 (LinkedIn):**

> 9 user roles. 9 different dashboard experiences. One React app.
>
> Here's what each role sees when they log in:
>
> Member: QR code, bookings, invoices
> Reception: Visitor check-in, walk-in leads
> Sales exec: Their pipeline + tasks
> Sales manager: All pipelines + team performance
> Branch manager: Occupancy + seat utilization
> Finance: Invoices + revenue
> Marketing: Campaign tools
> Super admin: Everything above + user management + branch CRUD
>
> No separate apps. No separate deployments. One codebase, role-conditional rendering.
>
> Blog post #4 is the deepest one yet: [link]

**Day 23 (X):**

> The sales CRM I built inside this coworking platform:
>
> - 8-stage Kanban pipeline
> - Lead scoring (0-100)
> - Activity timeline per lead
> - Task assignment
> - WhatsApp on every card
> - Table + Kanban view toggle
> - Owner filtering
>
> It's not Salesforce. It's better — because it's exactly what this business needs.

**Day 24 (LinkedIn):**

> The meeting room booking flow:
>
> 1. Pick a branch
> 2. See available rooms (name, capacity, price/hr)
> 3. Pick date and time
> 4. Set duration
> 5. See total with 18% GST calculated live
> 6. One-click confirm
>
> Under the hood:
> - useMeetingRooms() fetches rooms from API
> - Room list filters by selected branch
> - GST calculation is client-side (amount * 1.18)
> - useCreateBooking() mutation creates the booking
> - TanStack Query invalidates and refetches
>
> 160 lines of code. Complete booking engine.

**Day 25 (X):**

> The visitor management system:
>
> 1. Member pre-registers a visitor (name, phone, purpose, expected time)
> 2. System generates a unique QR token
> 3. Visitor arrives at reception
> 4. Receptionist scans/searches -> one-click check-in
> 5. Timestamp recorded
> 6. One-click check-out when leaving
>
> Simple? Yes. But it replaced a paper logbook at 6 branches.

**Day 26 (LinkedIn):**

> The hardest part of building 9 dashboards wasn't the UI.
>
> It was deciding what each role should NOT see.
>
> A sales exec shouldn't see other people's pipelines.
> A branch manager shouldn't edit pricing.
> A finance user shouldn't see CRM data.
> A member shouldn't see any staff tools.
>
> The code is simple — `if (!["super_admin", "branch_manager"].includes(user.role)) return 403`.
>
> The hard part is the conversation with the business about who has access to what. The code just reflects those decisions.

**Day 27 (X):**

> Component reuse across 9 dashboards:
>
> KpiCard — used in member overview, sales pipeline, branch ops, CEO dashboard
> PageHeader — used on every single dashboard page
> Badge — used for status, role, score, seat count, plan name
>
> 3 components. 33 routes. Consistent everywhere.

**Day 28 (LinkedIn) — The Recharts story:**

> Recharts is 348KB. It's the largest dependency in the entire app.
>
> But it gives me:
> - Revenue trend line charts on the CEO dashboard
> - Seat utilization bar charts on the branch ops page
> - Branch occupancy comparison charts
>
> All responsive. All themed with CSS variables. All code-split so they only load on pages that use charts.
>
> Could I have used a lighter library? Yes. Would I save 200KB gzipped? Yes. Would my branch managers lose the charts they check every morning? Also yes.
>
> Ship what users need. Optimize later.

---

## WEEK 5: BACKEND & SECURITY (Days 29-35)

### Blog Post #5: "From localStorage to Production: Hardening a SaaS Backend in One Weekend"

**Word count:** ~3,000
**Publish on:** Day 29

**Outline:**

1. **The starting point** — Everything lived in Zustand + localStorage. It worked perfectly for demos. Then someone asked: "What happens when I clear my browser?"

2. **The dual-backend strategy** — Node.js (Express + better-sqlite3) for modern hosting. PHP (PDO SQLite) for cPanel shared hosting. Same API contract. Same database schema. The business picks whichever their hosting supports.

3. **SQLite — the underrated production database:**
   - WAL mode for concurrent reads
   - 12 indexes on frequently queried columns
   - Single-file database, easy backups
   - `better-sqlite3` is synchronous — no callback hell
   - Why SQLite is perfect for a 1,200-seat coworking business (spoiler: it handles 100x this traffic)

4. **Authentication:**
   - Session-based auth with `express-session`
   - bcrypt (12 rounds) for password hashing — replaced SHA256
   - `secure` + `sameSite: "lax"` cookies in production
   - SESSION_SECRET enforcement (server won't start without it in prod)

5. **Security hardening checklist:**
   - helmet middleware (CSP, HSTS, X-Frame-Options, etc.)
   - Rate limiting: 20 req/15min on auth, 10 req/15min on public forms
   - Zod validation on every POST/PATCH endpoint
   - `requireRole()` middleware for admin-only operations
   - Structured error responses (`{ error, fields }`)
   - Environment-gated demo endpoint (disabled in production)

6. **The API layer** — 33 endpoints total. GET for reads, POST for creates, PATCH for updates, DELETE for removes. Every mutation validates input with Zod, checks permissions, and returns the created/updated entity.

7. **The 4 seed data files problem** — `server/src/store.ts`, `server-php/src/Db.php`, `src/lib/mock-data.ts`, `src/lib/seed.ts` all need the same data. This is the one thing I'd change in a v2 (single source of truth that generates all 4).

**Image suggestions:**
- DIAGRAM: Request flow: Client -> API Layer -> Auth Middleware -> Validation (Zod) -> RBAC Check -> SQLite
- SCREENSHOT: The validation.ts file showing Zod schemas
- SCREENSHOT: Terminal showing rate limiting in action (429 response)
- SCREENSHOT: The server startup log with SESSION_SECRET check
- GENERIC: A padlock on a laptop screen
- CODE SCREENSHOT: The `validate()` middleware function

---

### Social Posts — Week 5

**Day 29 (LinkedIn):**

> The security hardening I did on this SaaS backend:
>
> Before:
> - SHA256 password hashing
> - No rate limiting
> - No input validation
> - No security headers
> - Demo mode always on
>
> After:
> - bcrypt (12 rounds)
> - 20 req/15min on auth, 10 req/15min on forms
> - Zod validation on every endpoint
> - helmet (CSP, HSTS, X-Frame-Options)
> - Demo mode disabled in production
> - SESSION_SECRET required or server won't start
>
> None of this is glamorous. All of it is mandatory.
>
> Blog post #5: [link]

**Day 30 (X):**

> The Zod validation middleware pattern I'm using everywhere:
>
> ```
> function validate(schema) {
>   return (req, res, next) => {
>     const result = schema.safeParse(req.body);
>     if (!result.success) {
>       return res.status(400).json({
>         error: "Validation failed",
>         fields: formatZodErrors(result.error)
>       });
>     }
>     req.body = result.data;
>     next();
>   };
> }
> ```
>
> One function. Used on 15 endpoints. Structured errors the frontend can display per-field.

**Day 31 (LinkedIn):**

> I built the same backend twice. In two languages.
>
> Node.js version: Express + better-sqlite3
> PHP version: Slim + PDO SQLite
>
> Same API contract. Same database schema. Same seed data.
>
> Why? The business has cPanel shared hosting (PHP). But I develop in Node. Instead of choosing, I built both.
>
> The PHP version took 1 day because the API contract was already defined. The routes were identical. The SQL was identical. Only the language changed.
>
> Having a clear API spec makes multi-language backends trivial.

**Day 32 (X):**

> SQLite in production is fine.
>
> This coworking platform handles:
> - 1,200 seats across 6 branches
> - 12 data tables
> - 33 API endpoints
> - Session auth
>
> SQLite with WAL mode handles all of it. Single file. Zero config. Easy backups.
>
> You don't need Postgres until you need Postgres.

**Day 33 (LinkedIn):**

> The most important line of code in the entire backend:
>
> ```
> if (isProd && !sessionSecret) {
>   console.error("FATAL: SESSION_SECRET is required in production.");
>   process.exit(1);
> }
> ```
>
> The server refuses to start without a proper secret in production.
>
> It's not clever. It's not elegant. It's a guard rail that prevents you from shipping an insecure session cookie to real users.
>
> The best security code is the code that prevents you from making mistakes.

**Day 34 (X):**

> Rate limiting config for a SaaS backend:
>
> Auth endpoints (login/register): 20 requests per 15 minutes
> Public forms (lead capture, site visits): 10 requests per 15 minutes
> Dashboard APIs: No limit (already behind auth)
>
> Three lines of express-rate-limit. Stops credential stuffing and form spam.

**Day 35 (LinkedIn):**

> The 33 API endpoints in this coworking platform:
>
> Auth: 4 (login, register, me, logout)
> Public: 6 (branches, plans, blog, testimonials)
> Public mutations: 2 (lead capture, site visit booking)
> Dashboard reads: 15 (leads, tasks, visits, users, invoices, rooms, seats, memberships, bookings)
> Dashboard mutations: 14 (CRUD for leads, tasks, visitors, bookings, memberships, branches, plans, users)
>
> Every single mutation has:
> - Zod input validation
> - Session authentication
> - Role-based authorization
> - Structured error responses
>
> No shortcuts. Every endpoint earns its place.

---

## WEEK 6: MOCK MODE & DEPLOYMENT (Days 36-41)

### Blog Post #6: "The Best Architecture Decision: A Frontend That Works Without a Backend"

**Word count:** ~2,500
**Publish on:** Day 36

**Outline:**

1. **The problem** — The frontend deploys to Cloudflare Pages. The backend deploys to a VPS or cPanel. They're separate. What happens when the backend is down? During development? During demos?

2. **The mock mode architecture:**
   - `api.ts` tries the real backend first
   - If it gets a network error (TypeError with "fetch" or "Failed"), it flips a global `_mockMode` flag
   - All subsequent requests bypass fetch entirely and route through `mock-api.ts`
   - `mock-api.ts` is a regex-based router that matches paths and returns mock data
   - The mock data mirrors the real database seed exactly

3. **The amber banner** — When mock mode activates, a persistent amber banner appears: "Demo mode — data is local only." It uses `useSyncExternalStore` for reactive updates without React state.

4. **Why this matters:**
   - Demos work anywhere, anytime — no server needed
   - Frontend development is completely independent of backend
   - Stakeholders can review the UI without setting up a dev environment
   - CI can run without a backend service
   - The app gracefully degrades instead of showing error screens

5. **The mock router code** — Walk through how `matchRoute` works: regex patterns, capture groups, route handlers. It's essentially a miniature Express router running in the browser.

6. **Keeping mock and real in sync** — The mock data, seed data, and database schema all share the same TypeScript types. If they drift, the compiler catches it.

**Image suggestions:**
- SCREENSHOT: The amber "Demo mode" banner at the top of the dashboard
- SCREENSHOT: The mock-api.ts file showing the regex route matching
- DIAGRAM: Flow chart: fetch() -> network error? -> yes -> mock mode -> regex router -> mock data
- SCREENSHOT: The api.ts file showing the fallback logic
- GENERIC: A safety net under a tightrope walker (metaphor for graceful degradation)

---

### Social Posts — Week 6

**Day 36 (LinkedIn):**

> The best architecture decision I made on this project:
>
> The frontend works without the backend.
>
> When the API is unreachable, the app automatically switches to "mock mode" — an in-browser router that matches API paths with regex and returns demo data.
>
> No error screens. No loading spinners that never resolve. Just a working app with an amber banner that says "Demo mode."
>
> This means:
> - Demos work without servers
> - Frontend dev is backend-independent
> - Stakeholders can review without setup
> - Graceful degradation in production
>
> Full breakdown in blog post #6: [link]

**Day 37 (X):**

> I built a miniature Express router that runs in the browser.
>
> 170 lines. Regex route matching. GET/POST/PATCH/DELETE.
>
> It handles 33 API endpoints with mock data when the real backend is unreachable.
>
> The frontend literally doesn't care if the server exists.

**Day 38 (LinkedIn):**

> Cloudflare Pages deployment for a React SPA:
>
> 1. Build command: `npm run build`
> 2. Output directory: `dist`
> 3. Add `_redirects` file: `/* /index.html 200`
>
> That last line is critical. Without it, refreshing `/dashboard/bookings` returns a 404 because Cloudflare looks for a file at that path.
>
> SPA routing = all paths serve index.html. The router handles the rest client-side.
>
> 3 lines of config. Free hosting. Global CDN. Done.

**Day 39 (X):**

> useSyncExternalStore for the mock mode banner:
>
> The mock mode flag lives outside React (a plain boolean).
> Components subscribe to it with useSyncExternalStore.
> When mock mode activates, the banner renders instantly.
>
> No Context. No state management. Just React 18's built-in external store API.

**Day 40 (LinkedIn):**

> The deployment architecture for this coworking platform:
>
> Frontend: Cloudflare Pages (free, global CDN, auto-deploy from GitHub)
> Backend option A: Node.js on any VPS (Express + SQLite)
> Backend option B: PHP on cPanel shared hosting (PDO SQLite)
> Database: SQLite (single file, WAL mode)
>
> Total hosting cost: $0 for frontend + $5-10/month for backend
>
> No Kubernetes. No Docker. No AWS. No Vercel Pro.
>
> A 1,200-seat coworking business running on infrastructure that costs less than a hot desk.

**Day 41 (X):**

> The 4 seed data files that need to stay in sync:
>
> 1. server/src/store.ts (Node backend)
> 2. server-php/src/Db.php (PHP backend)
> 3. src/lib/mock-data.ts (browser mock)
> 4. src/lib/seed.ts (Zustand fallback)
>
> This is my one regret. Should have been one JSON file that all 4 import.
>
> Lesson: If you have the same data in 2+ places, automate the sync. Day 1.

---

## WEEK 6.5: RETROSPECTIVE & WRAP-UP (Days 42-45)

### Blog Post #7: "What I'd Do Differently: Lessons from Building a Production SaaS Solo"

**Word count:** ~2,000
**Publish on:** Day 42

**Outline:**

1. **Start with the API contract, not the UI** — I built the frontend first (Lovable prototype), then the backend. This meant retrofitting API shapes to match existing UI expectations. In v2, I'd define the OpenAPI spec first, generate types from it, and build both ends against the spec.

2. **One seed data source** — 4 files with the same data is a maintenance hazard. A single `seed.json` that gets imported everywhere would have saved hours of "why is the mock data different from the database?"

3. **Authentication should be boring** — I replaced SHA256 with bcrypt. I should have started with bcrypt. Or better: use an auth service. Rolling your own auth is a solved problem — stop re-solving it.

4. **The Lovable prototype was worth it** — Despite rewriting most of it, the AI-generated code gave me the component structure, the route tree, and the UI patterns. I kept the "shape" and replaced the "substance." This saved 2-3 days of initial scaffolding.

5. **SQLite is production-ready (for this scale)** — I hesitated. I shouldn't have. For a business with 1,200 seats and maybe 50 concurrent users, SQLite is overkill, not underpowered. The migration to Postgres can happen when (if) it's needed.

6. **Ship the minimum viable security** — helmet, rate limiting, Zod validation, bcrypt, and CORS took an afternoon. There's no excuse for skipping any of these. They're not "nice to have." They're table stakes.

7. **The mock mode pattern is transferable** — Every SPA I build from now on will have a mock mode. The ability to demo without infrastructure, develop without a backend, and degrade gracefully in production is worth the 170 lines of mock router code.

8. **What's still on the list** — Razorpay payment integration, WhatsApp Business API for automated follow-ups, real branch photos replacing Unsplash placeholders, email notifications, Google Analytics.

**Image suggestions:**
- GENERIC: A notebook with a "v2" written on it, coffee cup nearby
- SCREENSHOT: The final git log showing all 24 commits
- DIAGRAM: "What I'd keep vs. what I'd change" two-column layout
- GENERIC: Sunrise over a city (metaphor for "shipping")

---

### Social Posts — Week 6.5

**Day 42 (LinkedIn):**

> 7 blog posts. 45 days. One complete SaaS platform.
>
> Here's the final recap:
>
> What I built:
> - Marketing site with real-time data
> - 9-role dashboard system
> - Sales CRM with Kanban pipeline
> - Member portal with bookings & invoicing
> - Reception desk with visitor management
> - Admin panel with branch/plan/user CRUD
> - Dual backends (Node + PHP)
> - Mock mode for offline demos
>
> What I learned:
> - Start with the API contract, not the UI
> - Mock mode is the most underrated architecture pattern
> - Security is not optional, even for v1
> - SQLite is fine. Really.
> - AI prototyping works — if you're willing to rewrite
>
> Final blog post: [link]
>
> Thanks for following along. What should I build next?

**Day 43 (X):**

> 45-day build recap:
>
> 24 commits
> 33 routes
> 33 API endpoints
> 18 query hooks
> 9 user roles
> 6 branches
> 2 backends
> 1 developer
> 0 npm audit vulnerabilities
>
> Full series: [link]

**Day 44 (LinkedIn):**

> The question I get asked most about this project:
>
> "How long did it take?"
>
> The honest answer: I don't track hours. I tracked commits.
>
> 24 commits from prototype to production-ready.
>
> Some commits were 20 minutes (fixing a Cloudflare deploy). Some were all-day sessions (wiring 14 API endpoints). Some were 3am decisions that I'd make again (ripping out SSR for a pure SPA).
>
> Time estimates are fiction. Commits are history.

**Day 45 (X) — Final post:**

> Day 45. Series complete.
>
> If you're building a SaaS solo, here's my one-line summary:
>
> Build the smallest thing that works, secure it properly, and make it work offline.
>
> Thanks for reading. The entire codebase, all 7 blog posts, and every screenshot are linked in my bio.
>
> What's your "I built the whole thing" story?

---

## IMAGE CHECKLIST

### Screenshots to capture from the product:

1. **Homepage hero** — Full hero section with seat availability badge, animated counters, and branch photos
2. **Homepage branches section** — Grid of 6 branch cards with live seat counts
3. **Homepage pricing section** — 4 plan cards with the "Most popular" badge
4. **Branch detail page** — Single branch with seat inventory breakdown
5. **Corporate page** — Enterprise lead form with the 4-pillar section
6. **Mobile homepage** — Full responsive view on phone-width
7. **Member dashboard** — Overview with QR code, KPIs, and quick actions
8. **Meeting room booking** — Form with branch/room/date/time and live GST calculation
9. **Sales pipeline (Kanban)** — All 8 stages with lead cards
10. **Sales pipeline (Table)** — Table view with inline stage dropdown
11. **Lead detail page** — Activity timeline with task creation
12. **Reception desk** — Walk-in form + visitor list
13. **Visitor management** — Pre-register form + check-in/out buttons
14. **Branch operations** — Seat utilization chart + progress bars
15. **CEO analytics** — KPIs + revenue line chart + occupancy bar chart
16. **Admin users page** — User table with inline role dropdowns
17. **Admin pricing page** — Plan editor cards + coupon section
18. **Admin branches page** — Branch CRUD form
19. **Mobile dashboard** — Sheet sidebar open on phone-width
20. **Mock mode banner** — The amber "Demo mode" banner visible
21. **Git log** — Terminal screenshot of `git log --oneline`
22. **Vite build output** — Terminal screenshot showing chunk sizes and build time

### Generic/stock images needed:

1. Aerial view of a modern coworking space
2. Developer at a standing desk
3. Person browsing a website on a laptop in a cafe
4. Multiple devices showing different screens
5. Padlock on a laptop (security theme)
6. Whiteboard with architecture diagram
7. Notebook with "v2" and coffee cup
8. Sunrise over a city skyline
9. Split screen: code editor + coworking space

---

## CROSS-POSTING STRATEGY

| Platform | Format | Frequency | Best time (IST) |
|----------|--------|-----------|-----------------|
| Blog (Dev.to / Hashnode) | Long-form (2,000-3,500 words) | Weekly (7 posts total) | Tuesday 9am |
| LinkedIn | 150-300 word posts with takeaways | Daily (Mon-Sat) | 8:30am or 12:30pm |
| X (Twitter) | Punchy 1-3 tweet threads | Daily | 10am or 6pm |

### Hashtags:

**LinkedIn:** #buildinpublic #saas #react #typescript #webdev #coworking #startup #indiehacker
**X:** #buildinpublic #react #typescript #webdev #indiehacker

### Engagement strategy:
- End every LinkedIn post with a question or opinion prompt
- Quote-tweet your own blog posts with a hot take
- Reply to every comment in the first 2 hours
- Cross-link blog posts in social posts (drive traffic both ways)
- Tag relevant tools (@tan_stack, @shadaborern, @vaborern, @cloudflare) when mentioning them
- Repost Day 1 and Day 45 posts 1 week after original for reach

---

## REPURPOSING

Each blog post can also become:
- A **YouTube video** (screen recording + voiceover walkthrough)
- A **conference talk** (the 7 posts = 7 sections of a 45-minute talk: "Building a Multi-Tenant SaaS Solo")
- A **GitHub README** showcase
- A **case study** on your consulting/freelance portfolio

---

*Total content pieces: 7 blog posts + 45 social posts + 22 screenshots + 9 generic images = 83 content assets from one project.*

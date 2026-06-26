# Day 45: The Retrospective — What I'd Do Differently, What I'd Do Again

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #retrospective #saas #lessons #engineering

---

45 days. 45 blog posts. One full-stack SaaS platform. Here's the honest retrospective.

## What I'd Do Differently

### 1. Start with the API contract, not the UI

I built the frontend first (AI-generated prototype → refactored SPA), then the backend to match. This meant the API shapes were constrained by existing UI expectations.

In v2, I'd write the API spec first — even just a markdown file listing endpoints, request bodies, and response shapes. Then build both ends against the spec. The spec becomes the source of truth, not the first thing someone happened to code.

### 2. One seed data source

Four files with the same data: `server/src/store.ts`, `server-php/src/Db.php`, `src/lib/mock-data.ts`, `src/lib/seed.ts`. Same branches. Same users. Same plans. Four places to update when I add a branch.

Should have been one JSON file that all four import. Or a script that generates the seed data for each target. The "single source of truth" principle applies to data, not just types.

### 3. Auth should have been boring from day 1

I started with SHA256. Had to migrate to bcrypt. Should have started with bcrypt — or better, used a managed auth service.

Rolling session auth is educational. It's also a liability. Every hour spent on cookie flags and rate limiters is an hour not spent on features that differentiate the product.

For v2: Auth0 or Clerk. Let someone else handle password hashing, session management, MFA, and OAuth. Focus on the coworking-specific features.

### 4. TypeScript strict mode from the start

I had `any` types in some of the AI-generated code that I didn't catch until later. Every `any` is a potential runtime error hiding from the compiler. I should have enabled strict mode and fixed every error before building new features.

### 5. Tests

Zero automated tests. The app works — I verified it manually, page by page, role by role. But there's no safety net for refactoring. When I rewired 4 dashboard pages from Zustand to API hooks, I had to manually verify each one.

For v2: Vitest for unit tests on business logic (lead scoring, invoice calculations), Playwright for critical user flows (login → book a room → verify booking appears).

## What I'd Do Again

### 1. The AI prototype

Starting with Lovable gave me a working prototype in 20 minutes and realistic seed data. I rewrote 70% of the code, but the 30% I kept (route structure, data model, UI patterns) would have taken days to design from scratch.

AI code generation is a first draft tool. Use it that way.

### 2. Ripping out SSR

The moment I deleted TanStack Start and went pure SPA, everything simplified. Build time dropped to 619ms. Deployment became static files on a CDN. No server to manage.

For an authenticated dashboard app, SSR is complexity for zero benefit. I'd make the same call again instantly.

### 3. The mock mode

170 lines of mock router code. The best investment in the entire project. Demos, development, and graceful degradation — all from one architectural decision.

Every SPA I build from now on will have a mock mode.

### 4. SQLite

Zero configuration. Single file. Sub-millisecond queries. Easy backups. For a business with 1,200 seats and 50 concurrent users, SQLite is not a compromise. It's the right choice.

I'd pick SQLite again. Without hesitation.

### 5. shadcn/ui

Owning the component code means owning the design. I modified 15 components. Zero version conflicts. Zero CSS battles. The customization freedom is worth the tradeoff of not getting automatic updates.

### 6. The store split

Splitting `store.ts` from 1,200 lines into 5 focused modules (types, seed, engine, format, store) made the codebase navigable. Each file has one job. The dependency graph is acyclic. I'd do this on day 1, not day 7.

### 7. Transparent pricing

Putting prices on the website qualifies leads automatically. Every competitor in Coimbatore hides pricing behind "contact us." We show it. Prospects arrive at site visits pre-qualified. Sales cycles are shorter.

This was a business decision, not a technical one. But it's the decision I'm proudest of.

## The Numbers

- **24 commits** from prototype to production-ready
- **33 route files** (6 marketing + 27 dashboard)
- **33 API endpoints** (4 auth + 6 public + 2 public mutations + 21 dashboard)
- **33 TanStack Query hooks** (18 queries + 15 mutations)
- **258 lines of types** (one file, zero imports)
- **170 lines of mock router** (in-browser fallback)
- **66 lines of API layer** (fetch + mock + error handling)
- **9 user roles** (visitor to super_admin)
- **6 branches** (real Coimbatore locations)
- **5 pricing plans** (₹6,500 to ₹1,50,000/month)
- **2 backends** (Node.js + PHP)
- **1 database** (SQLite)
- **0 npm audit vulnerabilities**
- **619ms build time**

## What's Next

The platform needs four things before launch: Razorpay payments, email notifications, real branch photos, and a password reset flow. Four features on a solid foundation.

After launch: WhatsApp Business API for automated follow-ups, Google Analytics for conversion tracking, and PDF invoice generation for tax compliance.

The codebase is clean. The architecture is proven. The security is hardened. The deployment is automated.

It's ready to serve real members at real desks in real branches.

## Thank You

If you read even a few posts in this series, thank you. Building in public is uncomfortable — every architectural decision, every shortcut, every "I should have done this differently" moment is on display.

But that's the point. The gap between "tutorial project" and "production SaaS" is enormous. Nobody shows you the three commits to fix a Cloudflare deployment. Nobody shows you the afternoon spent replacing SHA256 with bcrypt. Nobody shows you the 170-line mock router that makes the entire frontend backend-independent.

I did. For 45 days. And I hope it made the gap feel a little smaller.

Now if you'll excuse me, I have a Razorpay integration to build.

---

**Image suggestions:**
- SCREENSHOT: The final git log showing all 24 commits
- SCREENSHOT: The homepage in its current state (the "finished product")
- SCREENSHOT: The CEO analytics dashboard
- GENERIC: Sunrise over Coimbatore (or any Indian city skyline)
- SCREENSHOT: The Vite build output (619ms)

**LinkedIn post:**

> Day 45. The series is complete.
>
> 45 blog posts about building a full-stack SaaS platform for a coworking business. Solo.
>
> The numbers:
> 24 commits. 33 routes. 33 API endpoints. 9 user roles. 6 branches. 2 backends. 1 database. 0 vulnerabilities. 619ms builds.
>
> What I'd do differently:
> - Start with the API contract, not the UI
> - One seed data source, not four
> - Auth service, not DIY
> - Tests from day 1
>
> What I'd do again:
> - AI prototype (first draft, not final product)
> - Pure SPA (no SSR for dashboards)
> - Mock mode (170 lines, infinite value)
> - SQLite (zero config, right for the scale)
> - Transparent pricing (qualifies leads automatically)
>
> If you're building a SaaS solo, here's my one-line summary:
>
> Build the smallest thing that works, secure it properly, and make it work offline.
>
> Full series: [link]
>
> What's your "I built the whole thing" story?
>
> #buildinpublic #saas #react #typescript #coworking #startup

**X post:**

> Day 45 / 45. Done.
>
> 24 commits. 33 routes. 9 roles. 2 backends. 619ms builds. 0 vulnerabilities.
>
> One-line summary:
> Build the smallest thing that works, secure it properly, and make it work offline.
>
> Full series linked in bio. What should I build next?
>
> #buildinpublic

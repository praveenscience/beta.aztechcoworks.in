# Day 1: Why I Built a Full-Stack SaaS Platform for a 1,200-Seat Coworking Business

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #saas #react #coworking #startup

---

There are roughly 47,000 coworking spaces worldwide. Most of them run on spreadsheets, WhatsApp groups, and a prayer.

I know this because I'm the CTO of one.

Aztech Co-Works runs 6 branches across Coimbatore, India. 1,200+ seats. Hot desks, dedicated desks, private cabins, team offices, and full enterprise floors. We have members who are solo freelancers and members who are 80-person engineering teams. We have walk-in visitors who want a day pass and corporate clients who want a 3-year lease.

And until recently, the "tech stack" was: a WhatsApp group for each branch, a Google Sheet for seat tracking, and a shared inbox for leads.

I decided to fix that. Not with an off-the-shelf tool. Not with a no-code builder. With code. Real, production-grade, ship-it-to-users code.

## The Scope That Made Me Gulp

Here's what a coworking business actually needs from software:

**For the public:** A marketing website with real-time seat availability, branch details, pricing, a blog, testimonials, and lead capture forms. Not a static site — a living, breathing sales machine that shows "847 seats available right now" because it's pulling from the actual database.

**For members:** A portal where they can see their plan, book meeting rooms with live availability and GST calculation, pre-register visitors who get QR tokens, download invoices, manage their membership, and discover other members in the community.

**For staff:** Different tools for different roles. The receptionist needs a visitor check-in desk and walk-in lead capture. The sales team needs a CRM with a Kanban pipeline, lead scoring, activity timelines, and WhatsApp integration on every lead card. The branch manager needs occupancy charts and seat utilization data. The finance team needs invoice management.

**For the super admin (that's me):** Everything above, plus user management with role assignment, branch CRUD, plan CRUD, coupon management, and a CEO dashboard with revenue trends and occupancy comparisons across all 6 branches.

That's 9 distinct user roles. 33 different pages. A complete CRM, a booking engine, a visitor management system, a billing module, and an analytics dashboard — on top of a polished marketing site.

One developer. No dedicated team. The business is already running. Members are already paying. This isn't a side project or a hackathon demo. It has to work.

## Why Not Buy Something?

Fair question. There are coworking management platforms out there — OfficeRnD, Nexudus, Archie, Optix. I evaluated all of them.

Here's the thing: they're built for Western markets. Monthly per-desk pricing that assumes $300/desk/month. GST handling that doesn't understand Indian tax slabs. WhatsApp integration that's an afterthought. And pricing that starts at $200/month and scales with your seat count, which for 1,200 seats means... a lot.

More importantly, none of them give me the data model I want. I need leads that flow from a website form into a sales pipeline, convert to members, generate invoices, and show up in revenue analytics — all in one system. Off-the-shelf tools either do CRM or do workspace management. Not both.

So I built both. In one platform.

## The Starting Point

I didn't start from a blank `npm create vite` terminal. I started with something more controversial: AI-generated code.

Lovable is a tool that generates full React applications from natural language prompts. I described the coworking platform, and it generated a working prototype — components, routes, seed data, the whole thing. TanStack Start with SSR. Zustand for state management. A surprisingly functional UI.

It was also, in the way that all generated code is, subtly wrong in a hundred small ways. The architecture fought against itself. The state management was a monolith. The SSR added complexity for zero benefit (27 of 33 routes are behind authentication — who are we server-rendering for?).

But the shape was right. The component hierarchy made sense. The seed data gave me a realistic starting point. And most importantly, it gave me something to show the business team while I rebuilt the internals.

## The 24-Commit Journey

Over the next several weeks, I shipped 24 commits that took the project from "AI prototype" to "production-ready platform." Each commit tells a story:

- **Commits 1-2:** The Lovable prototype and route tree generation
- **Commits 3-5:** Three attempts to deploy to Cloudflare Pages (spoiler: the fix was removing SSR entirely)
- **Commit 6:** Ripping out SSR and going pure SPA — the moment everything clicked
- **Commit 7:** Splitting a 1,200-line monolithic store into 5 focused modules
- **Commits 8-9:** Polishing the marketing site with scroll animations, animated counters, and a WhatsApp floating action button
- **Commit 10:** The layout refactor that made the codebase maintainable
- **Commits 11-13:** Mobile sidebar, dead code cleanup, accessibility fixes
- **Commits 14-15:** Building the Node.js backend and wiring the frontend to it
- **Commit 16:** Migrating from in-memory storage to SQLite
- **Commit 17:** Building the same backend again in PHP (there's a reason, I promise)
- **Commit 18:** The mock mode — the single best decision of the entire project
- **Commits 19-20:** Real business data and enterprise features
- **Commits 21-24:** Security hardening and complete API coverage

Each of these commits is a blog post in this series. For the next 44 days, I'm going to walk through every decision, every trade-off, every moment where I looked at the code and thought "this is fine" or "this needs to burn."

## The Stack (Spoiler)

For those who want the bullet points upfront:

- **Frontend:** React 19, Vite 8, TanStack Router (file-based routing), TanStack Query, Zustand, shadcn/ui, Tailwind CSS 4, Recharts
- **Backend (Node):** Express, better-sqlite3, bcrypt, helmet, express-rate-limit, Zod
- **Backend (PHP):** Slim Framework, PDO SQLite (same API, different language)
- **Hosting:** Cloudflare Pages (frontend), any VPS or cPanel (backend)
- **Database:** SQLite with WAL mode

No Next.js. No Prisma. No Docker. No Kubernetes. No AWS.

A 1,200-seat business running on infrastructure that costs less than one of our hot desks.

## Why Write About It?

Because the gap between "tutorial project" and "production SaaS" is enormous, and nobody talks about it.

Tutorials show you how to build a todo app. Conference talks show you the shiny architecture diagram. Nobody shows you the three commits to fix a Cloudflare deployment, or the afternoon spent choosing between bcrypt rounds 10 and 12, or the moment you realize your 1,200-line store file needs to become 5 files and you have to do it without breaking anything.

This series is the unedited version. Every decision. Every mistake. Every "I should have done this differently" moment.

45 days. Let's go.

---

**Tomorrow:** Day 2 — Starting with AI-generated code: What Lovable got right, what it got wrong, and why I'd do it again.

**Image suggestions:**
- SCREENSHOT: The homepage hero section showing "X seats available right now" badge
- GENERIC: Aerial view of a modern coworking space with people working
- SCREENSHOT: Terminal showing `git log --oneline` with all 24 commits

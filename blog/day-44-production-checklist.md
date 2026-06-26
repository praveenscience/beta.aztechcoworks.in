# Day 44: What's Left — The Production Checklist

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #production #checklist #saas #roadmap

---

The platform is feature-complete for a v1. It's not production-ready. Here's the gap, and what I'd prioritize.

## What's Done

- Marketing site with real-time data, scroll animations, responsive design
- Member portal (dashboard, bookings, membership, invoices, visitors, community, referrals)
- Sales CRM (Kanban pipeline, lead detail, activity timeline, task management)
- Reception desk (walk-in leads, visitor check-in/out, site visits)
- Branch operations (occupancy, seat utilization, inventory)
- Finance dashboard (invoices, revenue)
- CEO analytics (KPIs, charts, cross-branch comparison)
- Admin panel (users, branches, plans, coupons, custom forms, workflow rules)
- Node.js backend (Express, SQLite, bcrypt, helmet, rate limiting, Zod)
- PHP backend (PDO SQLite, cPanel-ready)
- Mock mode (in-browser fallback)
- Cloudflare Pages deployment

## What's Not Done

### Must-Have for Launch

1. **Razorpay payment integration** — Members can't actually pay. The booking and membership flows create records but no money changes hands. Razorpay is the standard in India for online payments.

2. **Real branch photos** — Unsplash placeholders look good for demos. They don't look like our actual spaces. Need professional photos of each branch.

3. **Email notifications** — No transactional emails. Member signup confirmation, invoice delivery, booking confirmation, password reset — all need email.

4. **Password reset flow** — Members can't reset their password. No "forgot password" link. This is a basic auth feature that's missing.

### Should-Have

5. **WhatsApp Business API** — Automated follow-ups for leads. Booking confirmations via WhatsApp. Visitor arrival notifications to host members.

6. **Google Analytics** — No tracking. No data on page views, conversion funnels, or user behavior. GA4 integration needed.

7. **Meeting room availability** — The booking form doesn't check for conflicts. You can double-book a room. Need overlap detection.

8. **Invoice PDF generation** — Members can see invoices but can't download them. Need PDF with company letterhead, GSTIN, HSN codes.

### Nice-to-Have

9. **Push notifications** — Mobile-style notifications for new leads, upcoming visits, overdue tasks.

10. **Calendar integration** — Booking confirmations as .ics calendar invites.

11. **Audit log** — Track who changed what and when in the admin panel.

12. **Bulk operations** — Assign 10 leads to a new sales exec. Mark 5 invoices as paid.

## The Priority Order

If I had to ship tomorrow:

**Week 1:** Razorpay + password reset + real photos
**Week 2:** Email notifications + booking conflict detection
**Week 3:** WhatsApp API + GA4
**Week 4:** PDF invoices + audit log

Four weeks from "demo" to "production." The architecture supports all of these — the API layer is built, the auth is hardened, the database schema is ready. It's feature work on a solid foundation.

## What I Won't Build

- **Mobile app** — The responsive web app works on mobile. A native app doubles the maintenance for minimal UX improvement at this scale.
- **Multi-tenant SaaS** — This platform is for one business. Not a white-label product. Not "Aztech for every coworking space." One customer, one codebase.
- **AI features** — No AI chat, no ML lead scoring, no GPT-powered anything. Deterministic code that does what it says. AI can come when there's a real use case.

---

**Tomorrow:** Day 45 — The Retrospective: What I'd Do Differently

**LinkedIn post:**

> The production checklist for a coworking SaaS platform:
>
> Done:
> - Full marketing site + member portal + CRM + admin panel
> - Backend (Node + PHP) with security hardening
> - Mock mode + Cloudflare deployment
>
> Not done:
> - Razorpay payments (can't actually pay)
> - Email notifications (no transactional email)
> - Real photos (using Unsplash placeholders)
> - Booking conflict detection (can double-book)
>
> Priority: payments + password reset + photos in week 1. Emails + availability in week 2.
>
> The architecture supports all of it. The foundation is solid. The remaining work is features, not rewrites.
>
> Day 44 of 45: [link]

**X post:**

> Production checklist gap:
>
> Must: Razorpay, real photos, email, password reset
> Should: WhatsApp API, GA4, booking conflicts, PDF invoices
> Nice: push notifications, calendar, audit log
>
> Won't: mobile app, multi-tenant, AI features.
>
> 4 weeks from demo to production. Foundation is solid.
>
> Day 44/45

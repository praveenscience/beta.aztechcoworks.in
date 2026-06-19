# Aztech Co-Works — v1 Build Plan

Scope is Phase 1: marketing site + lead capture + booking + payments + membership + full RBAC + lightweight workflow/form editor. Pure click-to-chat WhatsApp. No AI in v1. No page/dashboard builder. No white-label theming. AI, page builder, community, mobile apps, biometrics, and franchise white-label are explicitly deferred to phase 2.

---

## 1. Tech Stack

- TanStack Start (existing template) + React + Tailwind + shadcn/ui
- Mock JSON for data, RLS, file uploads, Local API Server using NodeJS
- Lovable's built-in Stripe payments (no account/keys needed) for online payments + GST-style invoices
- WhatsApp = `wa.me` deep links with prefilled messages, structured so a WhatsApp Business API webhook can plug in later
- Resend (via Lovable Cloud) for transactional email (booking confirms, invoices)

---

## 2. Modules

### 2.1 Public Marketing Site

- Home: hero, branch search, live seat availability (pulled from DB), pricing overview, amenities, testimonials, corporate CTA, WhatsApp + "Book Site Visit" CTAs
- Branch pages (1 per branch, dynamic route): photos, Google Maps embed, available seats, floor plan image, amenities, meeting rooms, pricing, lead form
- Pricing page: Hot Desk / Dedicated Desk / Private Cabin / Team Office / Meeting Room, with interactive calculator (branch + plan + seats + months → total with GST)
- Corporate Solutions page: lead-gen form targeted at IT/startups/enterprises
- Blog: simple markdown-backed posts (admin can create/edit), SEO-optimized
- Per-route SEO metadata (title, description, OG) on every public page

### 2.2 Lead Capture & CRM

- All inquiries (website forms, branch forms, corporate, callback requests, walk-ins added by reception) flow into one `leads` table (keep everything in memory - add a simple express Node server to run locally).
- Lead scoring (0–100) computed from: team size, budget band, move-in timeline, branch preference match
- Pipeline stages: New → Contacted → Qualified → Site Visit Scheduled → Proposal Sent → Negotiation → Won → Member; plus Lost (with reason)
- Sales pipeline UI: kanban + table views, filters, owner assignment, activity timeline, notes, tasks/reminders
- Lost leads automatically tagged for re-engagement (filterable list; manual re-engage action in v1)

### 2.3 Lightweight Workflow + Form Editor

- **Form editor**: admins add/remove/reorder fields on the standard lead form and corporate form (field types: text, email, phone, number, select, textarea, date). Submissions stored as JSON in `lead.custom_fields`.
- **Workflow rules**: simple trigger → conditions → actions builder (not full drag-drop). Triggers: lead created, stage changed, site visit scheduled. Actions: assign owner (round-robin or specific user), create follow-up task in N days, send templated email, generate WhatsApp deep-link CTA on lead detail page, change stage.

### 2.4 Site Visit Booking (Both modes)

- Self-serve slot picker: branch + date + 30-min slot within branch operating hours; creates a lead at stage "Site Visit Scheduled"
- "Request a visit" path: form-only, sales confirms via WhatsApp/call
- Email + WhatsApp deep-link confirmation; reception sees today's visits in their dashboard

### 2.5 Online Booking & Payments (self-serve everything)

- Member can book:
  - Meeting rooms (hourly)
  - Hot desk day passes
  - Dedicated desk / private cabin / team office monthly subscriptions
- Real-time availability check against `seat_inventory` and `meeting_room_bookings`
- Stripe Checkout for one-off + subscription billing; GST-format invoice PDF auto-generated and emailed; downloadable from member dashboard
- Cancellation / upgrade / additional seats handled in member dashboard

### 2.6 Membership Management

- Profile, active plan(s), seat allocation, payment history, invoices, renewal date
- Self-service: upgrade plan, add seats, cancel, manage team members (invite teammates under one company account)
- Referral program: unique referral code per member, tracked through signup → conversion, reward credits issued on conversion (visible in dashboard)

### 2.7 Visitor & QR Access

- Pre-register a visitor from member dashboard → QR code emailed to visitor
- Reception app: scan QR / manual check-in, check-out, log host + purpose
- Member QR ID generated on signup; entry/exit logs per branch
- Schema designed so biometric device webhooks can write to the same `access_logs` table in phase 2

### 2.8 Community (lite)

- Member directory: profile, company, role, branch, optional bio + links
- Visibility toggle per member
- Full posts/feed/messaging deferred to phase 2

### 2.9 Role-Based Dashboards (full RBAC from brief)

Roles: Visitor, Member, Reception, Sales Executive, Sales Manager, Branch Manager, Finance, Marketing, Super Admin. Stored in `user_roles` table with `app_role` enum + `has_role()` security definer (per Lovable user-roles standard).


| Role           | Dashboard scope                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| Member         | own membership, bookings, invoices, referrals, QR, team                         |
| Reception      | today's visits, walk-ins, visitor check-in/out, member verify, branch occupancy |
| Sales Exec     | own leads, tasks, pipeline kanban                                               |
| Sales Manager  | team pipeline, conversion funnel, lead reassignment                             |
| Branch Manager | their branch only: occupancy, bookings, revenue, resource calendar              |
| Finance        | invoices, payments, refunds, revenue reports, GST exports                       |
| Marketing      | lead sources, campaign UTMs, blog editor, form analytics                        |
| Super Admin    | everything + branch/pricing/role/workflow/form configuration                    |


### 2.10 Analytics

- Fixed (not user-built) dashboards per role with the KPIs from the brief: total leads, occupancy %, revenue, branch performance, seat utilization, monthly growth, conversion rate, CAC (manual input), LTV, churn
- Real-time charts via Recharts; CSV export of any table
- "Dashboard builder" deferred to phase 2

### 2.11 Admin Configuration

Super Admin can manage without code:

- Branches (CRUD, archive, operating hours, amenities, floor plan image, address, contact)
- Seat inventory per branch (Hot/Dedicated/Cabin/Team) with counts and pricing
- Meeting rooms per branch (capacity + hourly price)
- Plans + pricing + GST rate
- Coupon codes + promotional discounts + corporate negotiated rates
- Users + role assignments + permission overrides
- Lead form fields + corporate form fields
- Workflow rules
- Blog posts

---

## 3. Database Schema (high level)

```text
profiles                — id (auth.uid), full_name, phone, avatar, company
user_roles              — user_id, role (enum), branch_id (nullable, for branch-scoped roles)
branches                — id, name, slug, address, lat/lng, hours, amenities[], photos[], floor_plan, is_active
seat_inventory          — branch_id, seat_type (enum), total, available, monthly_price
meeting_rooms           — id, branch_id, name, capacity, hourly_price, photos[]
plans                   — id, name, seat_type, billing_period, base_price, gst_rate
coupons                 — code, discount_type, value, valid_from/to, max_uses, branch_id (nullable)
leads                   — id, name, email, phone, source, branch_pref, plan_pref,
                          team_size, budget, timeline, score, stage, owner_id,
                          custom_fields (jsonb), utm_*, created_at
lead_activities         — lead_id, type, payload, actor_id, created_at
tasks                   — id, lead_id, assignee_id, due_at, status, notes
site_visits             — id, lead_id, branch_id, scheduled_at, status, confirmed_by
memberships             — id, user_id, plan_id, branch_id, seats, status,
                          start_date, end_date, stripe_subscription_id
bookings                — id, user_id, branch_id, resource_type, resource_id,
                          start_at, end_at, amount, status, stripe_payment_id
invoices                — id, user_id, booking_id/membership_id, number,
                          amount, gst, total, pdf_url, status, issued_at
visitors                — id, host_user_id, branch_id, name, phone, purpose,
                          qr_token, expected_at, checked_in_at, checked_out_at
access_logs             — id, user_id/visitor_id, branch_id, direction, at, method
referrals               — id, referrer_user_id, referred_lead_id, status, reward_amount
form_definitions        — id, key (lead|corporate), fields (jsonb)
workflow_rules          — id, trigger, conditions (jsonb), actions (jsonb), is_active
blog_posts              — id, slug, title, body_md, cover_url, published_at, author_id
testimonials            — id, name, company, quote, avatar, branch_id (nullable)
```

RLS on every table. `has_role()` security definer drives policies. Member-owned tables scope to `auth.uid()`. Branch-scoped roles use `user_roles.branch_id`. All public-schema tables get explicit GRANTs to `authenticated` and `service_role` (and `anon` only for public reads like branches/plans/blog).

---

## 4. Page / Route Map

```text
PUBLIC
/                          home
/branches                  branch index
/branches/$slug            branch detail
/pricing                   pricing + calculator
/corporate                 corporate lead-gen
/blog                      blog index
/blog/$slug                blog post
/book-visit                site visit picker
/auth                      login/signup (email + Google)

MEMBER (_authenticated)
/dashboard                 overview, QR, upcoming bookings
/dashboard/bookings        meeting rooms + day passes
/dashboard/membership      plan, seats, team, renew/cancel
/dashboard/invoices        list + PDFs
/dashboard/referrals       code, status, rewards
/dashboard/community       member directory
/dashboard/visitors        pre-register, QR

STAFF (_authenticated, role-gated)
/staff/reception           today's visits + check-in
/staff/sales               pipeline (kanban + table)
/staff/sales/$leadId       lead detail
/staff/branch              branch manager dashboard
/staff/finance             invoices, payments, GST exports
/staff/marketing           leads by source, blog editor

ADMIN (_authenticated, super admin)
/admin/branches            CRUD branches + seat inventory + rooms
/admin/pricing             plans, coupons, GST
/admin/users               users + roles
/admin/forms               lead/corporate form field editor
/admin/workflows           workflow rules
/admin/analytics           KPIs

API (server routes)
/api/public/stripe/webhook payment + subscription events
/api/public/visitor-qr/$token  reception scan endpoint
```

---

## 5. Build Order (so each phase is shippable)

1. Schema + RBAC + auth (email + Google) + role-gated route guards
2. Public marketing site (home, branches, pricing, corporate, book-visit) + lead capture into CRM
3. Admin: branches, seat inventory, plans, pricing, coupons, users/roles
4. Sales pipeline + lead detail + tasks + form/workflow editor
5. Member auth + dashboard shell + meeting room + day pass booking + Stripe Checkout + invoices
6. Subscription bookings (dedicated/cabin/team) + membership management + team invites
7. Reception + visitor pre-register + QR + access logs
8. Branch Manager / Finance / Marketing dashboards + KPI analytics
9. Referrals + community directory + blog + testimonials
10. SEO polish (per-route metadata, sitemap, robots, JSON-LD for LocalBusiness on branch pages)

---

## 6. Explicitly Deferred to Phase 2

- WhatsApp Business API (BSP) automation — wa.me click-to-chat in v1
- AI assistant / lead qualifier / occupancy forecasting / smart recommender
- Drag-and-drop page builder, dashboard builder, full visual workflow canvas
- White-label / custom domains / per-tenant theming for franchises
- Native mobile apps (architecture is API-first so they can be built later)
- Biometric access integrations (schema is ready)
- Full community feed / posts / DMs (only directory in v1)

---

## 7. Open Items I'll Decide Defaults For (you can change in admin later)

- 5 placeholder Coimbatore branch names + 240 seats each (1,200 total, 400 available)
- Default pricing: Hot Desk ₹350/day or ₹6,500/mo, Dedicated ₹8,500/mo, Cabin from ₹18,000/mo, Team Office quote-on-request, Meeting Room ₹500/hr
- 18% GST default
- Brand: deep navy + warm amber accents, dark+light mode, Inter/Manrope (premium SaaS, WeWork-tier polish, mobile-first)

Approve and I'll start building from step 1.
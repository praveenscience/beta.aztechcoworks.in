# Aztech Co-Works — Go-Live & GTM Plan

**Status:** Phase 1 + Phase 2 complete. Needs env vars + deployment to go live.
**Target launch:** 4 weeks from start
**Owner:** Praveen Kumar Purushothaman (CTO & Co-Founder)

---

## Current State (What's Done)

### Frontend (Production-ready)
- Marketing site: homepage, branches, pricing, corporate, blog, book-a-visit
- Member portal: dashboard, bookings, membership, invoices, visitors, community, referrals
- Sales CRM: Kanban pipeline, lead detail, activity timeline, task management
- Reception desk: walk-in leads, visitor check-in/out, site visits
- Branch operations: occupancy, seat utilization, inventory
- Finance dashboard: invoices, revenue overview
- CEO analytics: KPIs, charts, cross-branch comparison
- Admin panel: users, branches, plans, coupons, custom forms, workflow rules
- Mock mode: in-browser fallback when backend is unreachable
- Cloudflare Pages deployment with SPA `_redirects`
- 33 route files, 9 user roles, responsive + mobile sidebar

### Backend (Functional, needs production hardening)
- Node.js: Express + better-sqlite3 (WAL mode) + bcrypt + helmet + rate limiting + Zod
- PHP: PDO SQLite mirror for cPanel hosting
- 33 API endpoints (4 auth + 6 public + 2 public mutations + 21 dashboard)
- Session-based auth with secure cookie flags

### Recently Completed (Phase 1 + 2)
- [x] Razorpay payment integration (create-order, verify, webhook, demo mode)
- [x] Password reset flow (forgot-password, reset-password, secure tokens)
- [x] Transactional email via Resend (welcome, reset, booking, invoice, site visit)
- [x] Booking conflict detection (409 on overlapping rooms)
- [x] Google Analytics 4 (page views + conversion events)
- [x] SEO: sitemap.xml, robots.txt, JSON-LD structured data (Organization + 6 CoworkingSpaces)
- [x] PDF invoice generation (pdfmake, GST-compliant, CGST/SGST split, HSN code)
- [x] Automated tests: Vitest + 19 tests (lead scoring, workflows, formatting)

### What's NOT Done
- No real branch photos (using Unsplash placeholders)
- No WhatsApp Business API integration
- Backend not deployed to production hosting
- Env vars not configured (RESEND_API_KEY, RAZORPAY_KEY_ID/SECRET, VITE_GA_MEASUREMENT_ID)

---

## Phase 1: Critical Path to Launch (Week 1-2)

These are non-negotiable blockers. The product cannot accept real members without them.

### 1.1 Deploy Backend to Production
**Time:** 2-3 days | **Priority:** P0

- [ ] Choose hosting: cPanel shared (PHP backend) or VPS (Node backend)
  - **Recommendation:** Start with PHP on cPanel — Syed likely already has a cPanel host. Zero DevOps. The PHP backend mirrors the Node API 1:1.
  - If VPS: Ubuntu + PM2 + Nginx reverse proxy + Let's Encrypt SSL
- [ ] Set up production domain: `api.aztechcoworks.in` (or subdomain)
- [ ] Configure environment variables:
  - `SESSION_SECRET` — strong random string (32+ chars)
  - `CORS_ORIGIN` — `https://aztechcoworks.in`
  - `NODE_ENV=production` (disables demo login)
- [ ] Set up SQLite database with production seed data (real branches, real plans, admin account)
- [ ] Update frontend `VITE_API_URL` env var on Cloudflare Pages to point to production API
- [ ] Verify HTTPS, CORS, cookie flags (`secure: true`, `sameSite: lax`)
- [ ] Test auth flow end-to-end on production domain

### 1.2 Password Reset Flow
**Time:** 1-2 days | **Priority:** P0

- [ ] Add `password_reset_tokens` table: `token TEXT PK, userId TEXT, expiresAt TEXT`
- [ ] `POST /api/auth/forgot-password` — accepts email, generates token, sends reset link
- [ ] `POST /api/auth/reset-password` — accepts token + new password, validates expiry, updates hash
- [ ] Frontend: "Forgot password?" link on `/auth` page
- [ ] Frontend: `/auth/reset?token=xxx` route with new password form
- [ ] Token expiry: 1 hour, single-use, delete after use
- [ ] Rate limit: 3 requests per email per hour

### 1.3 Transactional Email
**Time:** 2-3 days | **Priority:** P0

- [ ] Choose provider: **Resend** (simplest API, generous free tier: 3,000/month) or **AWS SES** (cheapest at scale)
- [ ] Set up domain verification (SPF, DKIM, DMARC records on `aztechcoworks.in`)
- [ ] Email templates (HTML with inline CSS):
  - **Welcome email** — on registration (name, login link, what's next)
  - **Password reset** — reset link with 1-hour expiry notice
  - **Booking confirmation** — room name, date/time, amount, branch address
  - **Invoice/receipt** — after payment (amount, GST breakdown, invoice number)
  - **Site visit confirmation** — date, time, branch address, Google Maps link
- [ ] Create `server/src/email.ts` utility:
  ```
  sendEmail({ to, subject, html }) — wraps Resend/SES API
  ```
- [ ] Wire into existing flows: register, booking, site visit, invoice creation

### 1.4 Razorpay Payment Integration
**Time:** 3-4 days | **Priority:** P0

- [ ] Create Razorpay account, complete KYC (business PAN, bank account, GST certificate)
  - **Lead time warning:** KYC approval takes 1-3 business days. Start this on Day 1.
- [ ] Install `razorpay` npm package on Node backend (or use REST API for PHP)
- [ ] Backend endpoints:
  - `POST /api/payments/create-order` — creates Razorpay order (amount, currency INR, receipt)
  - `POST /api/payments/verify` — verifies payment signature, updates invoice status to `paid`
  - `GET /api/payments/history` — member's payment history
- [ ] Add `payments` table: `id, orderId, razorpayPaymentId, razorpaySignature, invoiceId, amount, status, createdAt`
- [ ] Frontend integration:
  - Load Razorpay checkout.js script
  - "Pay Now" button on pending invoices → opens Razorpay modal
  - On success callback → verify with backend → update UI → show receipt
  - On failure → show error toast, invoice stays pending
- [ ] Payment flows:
  - **Membership signup** — create invoice → pay → activate membership
  - **Meeting room booking** — create invoice → pay → confirm booking
  - **Day pass** — create invoice → pay → grant access
- [ ] Webhook endpoint: `POST /api/payments/webhook` — handle async Razorpay events (payment.captured, payment.failed, refund.created)
- [ ] Test with Razorpay test mode before going live

### 1.5 Real Branch Photos
**Time:** 1-2 days (photography) + 1 day (integration) | **Priority:** P1

- [ ] Schedule professional photographer for all 6 branches
- [ ] Shot list per branch:
  - Exterior / entrance (1-2 shots)
  - Hot desk area (2 shots)
  - Dedicated desks (1-2 shots)
  - Cabins / private offices (2 shots)
  - Meeting rooms (1-2 shots)
  - Cafeteria / break area (1 shot)
  - Amenities (printer, phone booth, etc.)
- [ ] Image processing: resize to 1200x800 max, WebP format, compress to <200KB each
- [ ] Upload to Cloudflare R2 (free egress, same account) or `/public/images/branches/`
- [ ] Update branch `photo` field from Unsplash IDs to real image URLs
- [ ] Update homepage hero, branch detail pages, and branch cards

### 1.6 Booking Conflict Detection
**Time:** 0.5 days | **Priority:** P1

- [ ] Backend: Before creating a booking, query existing bookings for same `resourceId` with overlapping `startAt`/`endAt`
  ```sql
  SELECT id FROM bookings
  WHERE resourceId = ? AND status = 'confirmed'
  AND startAt < ? AND endAt > ?
  ```
- [ ] Return 409 Conflict if overlap exists
- [ ] Frontend: Show "This room is already booked for that time" error
- [ ] Optional: Show availability calendar/grid for the selected room

---

## Phase 2: Growth & Operations (Week 3-4)

These features improve conversion, retention, and operational efficiency. Launch can proceed without them, but they should follow quickly.

### 2.1 Google Analytics 4 (GA4)
**Time:** 0.5 days | **Priority:** P1

- [ ] Create GA4 property for `aztechcoworks.in`
- [ ] Add gtag.js script to `index.html` (or use `@analytics/google-analytics`)
- [ ] Track key events:
  - `page_view` (automatic)
  - `sign_up` — on successful registration
  - `lead_created` — on enquiry form submission
  - `site_visit_booked` — on visit booking
  - `payment_completed` — on successful Razorpay payment
  - `membership_started` — on membership activation
- [ ] Set up conversion goals in GA4 dashboard
- [ ] Configure Google Search Console, submit sitemap

### 2.2 SEO & Sitemap
**Time:** 1 day | **Priority:** P1

- [ ] Generate `sitemap.xml` (static file or build-time script):
  - `/` — homepage
  - `/branches` — listing
  - `/branches/brookfields`, `/branches/rs-puram`, etc. — each branch
  - `/pricing` — plans
  - `/corporate` — B2B landing
  - `/blog`, `/blog/{slug}` — all blog posts
  - `/book-visit` — site visit booking
- [ ] Add `robots.txt` allowing all public routes, disallowing `/dashboard`, `/admin`, `/staff`
- [ ] Meta tags: verify each public page has unique `<title>` and `<meta description>`
- [ ] Add structured data (JSON-LD) for:
  - Organization (name, logo, contact)
  - LocalBusiness (each branch with address, phone, hours, geo coordinates)
- [ ] Submit to Google Search Console

### 2.3 WhatsApp Business API
**Time:** 2-3 days | **Priority:** P2

- [ ] Set up WhatsApp Business account via Meta Business Suite
- [ ] Choose BSP (Business Solution Provider): **Interakt**, **Wati**, or **Gupshup** (all India-focused, affordable)
- [ ] Create message templates (require Meta approval, ~24h):
  - `lead_welcome` — "Hi {name}, thanks for your interest in Aztech Co-Works..."
  - `visit_reminder` — "Your site visit at {branch} is tomorrow at {time}..."
  - `booking_confirmation` — "Your meeting room {room} is booked for {date}..."
  - `payment_receipt` — "Payment of {amount} received. Invoice #{number}..."
- [ ] Backend: Create `server/src/whatsapp.ts` utility wrapping BSP API
- [ ] Wire into workflow engine: existing `whatsapp_cta` action type in workflow rules becomes functional
- [ ] Wire into operational flows: site visit reminders (24h before), booking confirmations

### 2.4 PDF Invoice Generation
**Time:** 1-2 days | **Priority:** P2

- [ ] Use `jspdf` (frontend) or `puppeteer`/`@react-pdf/renderer` (backend)
  - **Recommendation:** Backend with Puppeteer for consistency and security
- [ ] Invoice template includes:
  - Aztech Co-Works letterhead, logo, GSTIN
  - Invoice number, date, due date
  - Member name, company, address
  - Line items (plan/room, quantity, unit price)
  - Subtotal, GST @ 18% (CGST 9% + SGST 9%), Total
  - HSN/SAC code: 997212 (Rental of commercial property)
  - Payment status, Razorpay transaction ID
  - "This is a computer-generated invoice"
- [ ] `GET /api/dashboard/invoices/:id/pdf` — returns PDF buffer
- [ ] Frontend: "Download PDF" button on invoice detail
- [ ] Attach PDF to invoice email

### 2.5 Automated Tests
**Time:** 2-3 days | **Priority:** P2

- [ ] Install Vitest + Testing Library
- [ ] Unit tests (business logic):
  - Lead scoring algorithm
  - Invoice GST calculation
  - Booking conflict detection
  - Password validation rules
  - Role-based access control checks
- [ ] API integration tests:
  - Auth flow (register → login → me → logout)
  - CRUD operations on leads, bookings, memberships
  - Payment verification logic
- [ ] E2E tests (Playwright, later):
  - Public site navigation
  - Login → dashboard → book a room → verify booking
  - Admin: create user → assign role → verify access

---

## Phase 3: Post-Launch Optimization (Week 5-8)

### 3.1 Push Notifications
- [ ] Service Worker for web push (PWA-lite)
- [ ] Notify reception on visitor arrival
- [ ] Notify sales exec on new lead assignment
- [ ] Notify member on invoice generation

### 3.2 Calendar Integration
- [ ] Generate `.ics` file for booking confirmations
- [ ] Attach to booking confirmation email
- [ ] "Add to Calendar" button on booking success page

### 3.3 Audit Log
- [ ] `audit_logs` table: `id, userId, action, entityType, entityId, diff, createdAt`
- [ ] Middleware to log all write operations (POST, PATCH, DELETE)
- [ ] Admin UI: searchable/filterable audit log page
- [ ] Track: user CRUD, role changes, plan changes, invoice status changes

### 3.4 Bulk Operations
- [ ] Multi-select on lead table → bulk assign owner, bulk change stage
- [ ] Multi-select on invoice table → bulk mark as paid
- [ ] Multi-select on user table → bulk change role/branch

### 3.5 Member Self-Service Improvements
- [ ] Profile edit (name, phone, company, photo)
- [ ] Change password (current + new)
- [ ] Download all invoices as ZIP
- [ ] Membership renewal reminder (7 days before expiry)

---

## Go-To-Market (GTM) Strategy

### Target Audience

| Segment | Size | Channel | Message |
|---------|------|---------|---------|
| Freelancers / solopreneurs | 1-2 seats | Instagram, Google Ads | "Hot desk from Rs.6,500/month. No lock-in." |
| Startups (3-15 people) | Team office | LinkedIn, referrals | "Scale from 3 to 30 without moving offices." |
| SMBs (15-50 people) | Managed office | LinkedIn, direct sales | "Your own floor. Our operations. From Rs.1,50,000/month." |
| Corporates (50+ people) | Enterprise | Direct outreach, events | "Satellite office in Coimbatore. Compliance-ready." |

### Pre-Launch (1-2 weeks before go-live)

1. **Landing page with waitlist**
   - [ ] Add "Coming Soon" banner or early-access signup on homepage
   - [ ] Collect email + phone for launch notification
   - [ ] Goal: 50-100 pre-registrations

2. **Content seeding**
   - [ ] Publish 5-10 blog posts from the 45-day series on the site (space them out)
   - [ ] Cross-post to LinkedIn (Praveen's personal account — developer community reach)
   - [ ] Cross-post to X/Twitter with #buildinpublic tag
   - [ ] Share in Coimbatore startup/freelancer WhatsApp groups

3. **Google My Business**
   - [ ] Create/claim GMB listing for each of the 6 branches
   - [ ] Add photos, hours, phone, website link
   - [ ] Enable Google Maps integration
   - [ ] Respond to any existing reviews

4. **Referral program soft launch**
   - [ ] Existing members get referral codes (already built in the platform)
   - [ ] Define reward: Rs.500 credit per successful referral (member who signs up and pays)
   - [ ] Announce to current members via WhatsApp/email

### Launch Week

1. **Announcement**
   - [ ] LinkedIn post (Praveen): "We built a full digital platform for our coworking spaces..."
   - [ ] Email blast to waitlist: "Aztech Co-Works is live. Book online."
   - [ ] WhatsApp broadcast to existing member base
   - [ ] Instagram stories / reels: quick tour of the platform + branch spaces

2. **Launch offer**
   - [ ] First 20 online signups: 10% off first month (use coupon system already built)
   - [ ] Free day pass for anyone who books a site visit through the platform
   - [ ] Referral bonus: doubled for launch week (Rs.1,000 instead of Rs.500)

3. **PR / Community**
   - [ ] Post on Coimbatore startup community forums
   - [ ] Reach out to local tech meetup organizers (offer free venue for one event)
   - [ ] Submit to Product Hunt (developer audience, #buildinpublic angle)

### Post-Launch (Month 1-3)

1. **Paid acquisition**
   - [ ] Google Ads: "coworking space coimbatore", "shared office coimbatore", "meeting room coimbatore"
   - [ ] Monthly budget: Rs.15,000-25,000 to start
   - [ ] Track cost-per-lead via GA4 conversion goals
   - [ ] Instagram/Facebook ads targeting Coimbatore, age 22-45, interests: startups, freelancing, remote work

2. **Content marketing**
   - [ ] Publish 2-4 blog posts/month (SEO-driven):
     - "Best coworking spaces in Coimbatore" (own the search)
     - "Hot desk vs dedicated desk: which is right for you?"
     - "Why startups choose managed offices over traditional leases"
     - "Coimbatore's startup ecosystem: a guide for remote teams"
   - [ ] Case studies from early members (with permission)

3. **Partnerships**
   - [ ] Tie up with CA firms (they advise startups on office setup)
   - [ ] Startup incubators: FORGE, Coimbatore Innovation Council
   - [ ] Real estate agents: referral commission for corporate leads
   - [ ] Event hosting: offer meeting rooms for startup events, workshops

4. **Retention**
   - [ ] Monthly member newsletter (platform updates, community highlights)
   - [ ] In-app community directory drives networking
   - [ ] Track churn: if a member cancels, trigger a call from branch manager
   - [ ] NPS survey at 30, 90, 180 days

---

## Key Metrics to Track

| Metric | Target (Month 1) | Target (Month 3) |
|--------|-------------------|-------------------|
| Website visitors/month | 2,000 | 5,000 |
| Online leads/month | 30 | 80 |
| Site visits booked online | 10 | 30 |
| Online signups (members) | 15 | 40 |
| Online payment conversion | 60% | 75% |
| Occupancy rate (avg) | 65% | 80% |
| Member NPS | 40+ | 50+ |
| CAC (cost per acquisition) | < Rs.3,000 | < Rs.2,000 |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Razorpay KYC delays | Blocks payments, delays launch | Start KYC application on Day 1 |
| Low initial online adoption | Members prefer walk-in/call | Train reception staff to demo the platform during visits |
| SQLite concurrent write limits | Data loss under heavy load | WAL mode handles 50 concurrent users fine; monitor, migrate to Postgres if needed |
| cPanel PHP hosting limitations | Performance/reliability | Start with PHP, have Node VPS ready as backup |
| WhatsApp template rejection | Delays automated messaging | Submit templates early, keep messages transactional (not promotional) |
| Real photos not ready | Launch with placeholders looks unprofessional | Book photographer in Week 1, can launch with 3 branches photographed first |

---

## Week-by-Week Execution

### Week 1
| Day | Task | Owner |
|-----|------|-------|
| Mon | Start Razorpay KYC. Deploy PHP backend to cPanel. | Praveen |
| Tue | Password reset flow (backend + frontend). | Praveen |
| Wed | Set up Resend for transactional email. Welcome + reset templates. | Praveen |
| Thu | Razorpay integration: create-order + verify endpoints. | Praveen |
| Fri | Razorpay frontend: Pay Now button, checkout modal, success/failure handling. | Praveen |

### Week 2
| Day | Task | Owner |
|-----|------|-------|
| Mon | Razorpay webhook + payment history + invoice email. | Praveen |
| Tue | Booking conflict detection. Branch photo shoot (first 3 branches). | Praveen / Photographer |
| Wed | Integrate real photos. SEO: sitemap, robots.txt, structured data. | Praveen |
| Thu | GA4 setup + conversion events. End-to-end production testing. | Praveen |
| Fri | Remaining branch photos. GMB listings for all 6 branches. | Syed + Praveen |

### Week 3
| Day | Task | Owner |
|-----|------|-------|
| Mon | WhatsApp Business setup + BSP integration. | Praveen |
| Tue | WhatsApp templates: lead welcome, visit reminder, booking confirmation. | Praveen |
| Wed | PDF invoice generation. | Praveen |
| Thu | Pre-launch content: publish first 5 blog posts, LinkedIn/X posts. | Praveen |
| Fri | Internal testing: all roles, all flows, all branches. Bug fixes. | Praveen |

### Week 4
| Day | Task | Owner |
|-----|------|-------|
| Mon | Fix all bugs from testing. Vitest unit tests for critical paths. | Praveen |
| Tue | Soft launch: invite 5-10 existing members to use the platform. | Syed |
| Wed | Gather feedback, fix issues. Launch offer coupons created. | Praveen |
| Thu | **GO LIVE.** Announcement: LinkedIn, email blast, WhatsApp broadcast. | Praveen + Syed |
| Fri | Monitor: errors, payments, signups. Hotfix anything broken. | Praveen |

---

## Tech Decisions Summary

| Decision | Choice | Reason |
|----------|--------|--------|
| Payment gateway | Razorpay | India standard, UPI + cards + netbanking, good docs |
| Email provider | Resend | Simple API, 3K free/month, React email templates |
| WhatsApp BSP | Interakt or Wati | India-focused, affordable, good API |
| PDF generation | Puppeteer (backend) | Consistent output, secure, attach to email |
| Analytics | GA4 | Free, industry standard, conversion tracking |
| Production hosting (API) | cPanel PHP (start) → VPS Node (scale) | Zero DevOps to start, upgrade path clear |
| Image hosting | Cloudflare R2 | Free egress, same account as Pages |
| Testing | Vitest + Playwright | Fast, modern, good DX |

---

*This document is the single source of truth for the Aztech Co-Works launch plan. Update it as tasks are completed.*

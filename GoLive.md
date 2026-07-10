# Aztech Co-Works — Go-Live & GTM Plan

**Status:** All 4 phases complete. Backend at full parity. Ready for cPanel deployment.
**Target launch:** 1 week
**Owner:** Praveen Kumar Purushothaman (CTO & Co-Founder)
**Deployment guide:** See `GoLive-Final.md` for step-by-step cPanel instructions.
**Baby steps:** See `Baby-Steps.md` for the simplest possible deployment walkthrough.

---

## Current State: EVERYTHING IS BUILT

### Frontend (Production-ready on Cloudflare Pages)
- Marketing site: homepage, branches, pricing, corporate, blog, book-a-visit
- Member portal: dashboard, bookings, membership, invoices, visitors, community, referrals
- Sales CRM: Kanban pipeline, lead detail, activity timeline, task management
- Reception desk: walk-in leads, visitor check-in/out, site visits
- Branch operations: occupancy, seat utilization, inventory
- Finance dashboard: invoices, revenue overview
- CEO analytics: KPIs, charts, cross-branch comparison
- Admin panel: users, branches, plans, coupons, custom forms, workflow rules
- Mock mode: in-browser fallback when backend is unreachable
- 33 route files, 9 user roles, responsive + mobile sidebar

### PHP Backend (cPanel-ready, 100% parity with Node.js)
- [x] 48 API endpoints (5 auth + 8 public + 36 dashboard + 5 payment)
- [x] Password reset flow (forgot-password, reset-password, secure tokens, 1hr expiry)
- [x] Razorpay payment integration (create-order, verify, webhook, history, demo mode)
- [x] Transactional email via Resend (5 templates, curl-based, fallback to error_log)
- [x] WhatsApp Business API (4 templates, Meta Cloud API, fallback to error_log)
- [x] PDF invoice generation (raw PDF spec, GST-compliant, CGST/SGST)
- [x] Calendar .ics downloads for bookings
- [x] Booking conflict detection (409 on overlap)
- [x] Audit logging (insert + admin viewer)
- [x] bcrypt password hashing (with legacy SHA-256 backwards-compat)
- [x] .env config loading (CORS, Razorpay, Resend, WhatsApp)
- [x] .htaccess security (blocks .env, .db, src/, data/)
- [x] SQLite with WAL mode, foreign keys, auto-seed

### Node.js Backend (Local development)
- Same 48 endpoints, Express 5 + better-sqlite3
- PDFKit for invoice generation
- Resend SDK for email
- Used for local dev, not for production deployment

### Also Done
- [x] Google Analytics 4 (page views + 5 conversion events)
- [x] SEO: sitemap.xml, robots.txt, JSON-LD structured data
- [x] Automated tests: Vitest + 19 tests
- [x] Cloudflare Pages deployment with SPA fallback

---

## What's Left: ZERO CODE. Only Ops/Config.

| Task | Time | Notes |
|------|------|-------|
| Create cPanel subdomain | 10 min | `api.aztechcoworks.in` |
| Upload PHP files to cPanel | 15 min | File Manager or SFTP |
| Create .env on server | 10 min | Can be all blank (demo mode) |
| Set Cloudflare Pages env var | 5 min | `VITE_API_URL` |
| DNS (if needed) | 15 min | A record for api subdomain |
| Razorpay KYC | 1-3 days | Start NOW, app works without it |
| Resend email setup | 30 min | Optional, falls back to error_log |
| Google Analytics | 15 min | Optional, add later |
| Real branch photos | 1-2 days | Photographer needed |

**Minimum time to live: ~1.5 hours (excluding Razorpay KYC)**

---

## Go-To-Market (GTM) Strategy

### Target Audience

| Segment | Size | Channel | Message |
|---------|------|---------|---------|
| Freelancers / solopreneurs | 1-2 seats | Instagram, Google Ads | "Hot desk from Rs.6,500/month. No lock-in." |
| Startups (3-15 people) | Team office | LinkedIn, referrals | "Scale from 3 to 30 without moving offices." |
| SMBs (15-50 people) | Managed office | LinkedIn, direct sales | "Your own floor. Our operations. From Rs.1,50,000/month." |
| Corporates (50+ people) | Enterprise | Direct outreach, events | "Satellite office in Coimbatore. Compliance-ready." |

### Launch Week Plan

1. **Announcement**
   - LinkedIn post (Praveen): "We built a full digital platform for our coworking spaces..."
   - Email blast to existing members
   - WhatsApp broadcast to member base
   - Instagram stories / reels: quick platform tour

2. **Launch offer**
   - First 20 online signups: 10% off first month
   - Free day pass for anyone who books a site visit online
   - Double referral bonus for launch week

3. **PR / Community**
   - Post on Coimbatore startup community forums
   - Offer free venue for one tech meetup
   - Product Hunt (#buildinpublic angle)

### Post-Launch (Month 1-3)

- Google Ads: "coworking space coimbatore" (Rs.15,000-25,000/month)
- 2-4 blog posts/month (SEO-driven)
- Case studies from early members
- Google My Business listings for all 6 branches
- NPS survey at 30, 90, 180 days

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

---

*See `GoLive-Final.md` for the detailed step-by-step deployment guide.*
*See `Baby-Steps.md` for the simplest possible cPanel deployment walkthrough.*

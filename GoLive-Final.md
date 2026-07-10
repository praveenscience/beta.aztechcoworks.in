# Aztech Co-Works — Final Go-Live Checklist

**Date:** 11 July 2026
**Owner:** Praveen Kumar Purushothaman
**Target:** Go live within 1 week

---

## Backend: PHP on cPanel (Primary) + Node.js for Local Dev

The PHP backend (`server-php/`) is now at **full parity** with Node.js:

| Feature | PHP | Node.js |
|---------|-----|---------|
| Auth (login, register, me, logout, demo) | 5/5 | 5/5 |
| Password reset (forgot + reset) | 2/2 | 2/2 |
| Dashboard endpoints (leads, tasks, visitors, bookings, memberships, invoices, users, branches, plans, rooms, seats, audit) | 36/36 | 36/36 |
| Payment endpoints (key, create-order, verify, history, webhook) | 5/5 | 5/5 |
| Public endpoints (branches, plans, testimonials, blog, leads, site-visits) | All | All |
| Email (Resend API, 5 templates, fallback to error_log) | Done | Done |
| WhatsApp (Meta Cloud API, 4 templates, fallback to error_log) | Done | Done |
| PDF invoices (raw PDF spec, no library) | Done | Done (PDFKit) |
| Calendar .ics downloads | Done | Done |
| Booking conflict detection | Done | Done |
| Audit logging | Done | Done |
| bcrypt password hashing | Done | Done |
| .env config loading | Done | Done |
| Demo mode (no API keys = auto-fallback) | Done | Done |

**Deployment:** PHP backend on cPanel (shared hosting). Node.js backend for local development only.

---

## Code Status: COMPLETE

All application code is built and committed on `main`. Zero code changes needed.

---

## Go-Live Steps (cPanel + PHP)

### Step 0: Start Razorpay KYC NOW (1-3 business days)

**This has the longest lead time. Start today.**

1. Go to https://dashboard.razorpay.com — sign up with business email
2. Complete KYC:
   - Business PAN
   - GST certificate (GSTIN)
   - Bank account details (for settlement)
   - Business address proof
3. KYC approval takes 1-3 business days
4. Once approved:
   - Go to Settings > API Keys > Generate Key
   - Copy `Key ID` and `Key Secret` (you'll need them in Step 4)
   - Go to Settings > Webhooks > Add New
   - URL: `https://api.aztechcoworks.in/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Copy the webhook secret
5. **Test first:** Use Razorpay test mode keys before switching to live

**The app works without Razorpay keys — payments auto-succeed in demo mode.**

---

### Step 1: cPanel Setup — Create Subdomain (10 min)

1. Login to cPanel
2. Go to **Domains** (or **Subdomains** in older cPanel)
3. Create subdomain: `api.aztechcoworks.in`
   - Document Root: `public_html/api` (or wherever cPanel puts it)
4. Note the document root path — you'll upload files there

**Alternative:** If you want the API at `aztechcoworks.in/api/`, you can put the PHP files inside a subdirectory of your main site. The subdomain approach is cleaner.

---

### Step 2: Upload PHP Backend (15 min)

Upload the contents of `server-php/` to the cPanel subdomain document root.

**Via cPanel File Manager or SFTP:**

```
server-php/
├── .htaccess          → Upload to document root
├── index.php          → Upload to document root
├── .env               → Create on server (Step 3)
└── src/
    ├── bootstrap.php
    ├── Db.php
    ├── Email.php
    ├── Router.php
    ├── Whatsapp.php
    ├── routes.php
    └── routes/
        ├── auth.php
        ├── dashboard.php
        ├── payment.php
        └── public.php
```

**Important:**
- The `data/` directory will be auto-created by the app on first request
- Make sure the document root directory is writable (for SQLite): `chmod 755`
- The `data/` directory needs to be writable: the app creates it automatically
- Do NOT upload `.env.example` as `.env` — create `.env` manually (Step 3)

**Verify PHP version:**
- Go to cPanel > **MultiPHP Manager** or **PHP Version**
- Set PHP 8.1+ for the subdomain (8.2 or 8.3 preferred)
- Required extensions: `pdo_sqlite`, `curl`, `mbstring` (all standard)

---

### Step 3: Create .env File on Server (10 min)

In the document root (same directory as `index.php`), create `.env`:

```env
# Frontend URL (for email links)
SITE_URL=https://aztechcoworks.in
CORS_ORIGIN=https://aztechcoworks.in

# Resend (transactional email) — leave blank until Step 5
RESEND_API_KEY=
EMAIL_FROM=Aztech Co-Works <noreply@aztechcoworks.in>

# Razorpay — leave blank until KYC approved (Step 0)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# WhatsApp — leave blank (optional, set up post-launch)
WHATSAPP_API_KEY=
WHATSAPP_API_URL=
WHATSAPP_PHONE_ID=
```

**The app works with all keys blank** — email logs to PHP error_log, payments run in demo mode.

---

### Step 4: Verify API is Working (5 min)

Open in browser:

```
https://api.aztechcoworks.in/api/public/branches
```

You should see JSON with 6 branches. If you see a 500 error:

1. Check cPanel > **Error Logs** for PHP errors
2. Verify PHP version is 8.1+
3. Verify `pdo_sqlite` extension is enabled
4. Check file permissions on the document root

**Test more endpoints:**

```
https://api.aztechcoworks.in/api/public/plans
https://api.aztechcoworks.in/api/public/testimonials
```

---

### Step 5: Resend Email Setup (30 min)

1. Go to https://resend.com — sign up
2. Go to Domains > Add Domain > `aztechcoworks.in`
3. Add the DNS records Resend provides:
   - SPF (TXT record)
   - DKIM (TXT record)
   - DMARC (TXT record — optional but recommended)
4. Wait for verification (usually 5-30 minutes)
5. Go to API Keys > Create API Key
6. SSH/SFTP into server, update `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   ```

**Without the API key, emails log to PHP error_log. App works either way.**

---

### Step 6: DNS Configuration (15 min)

Add these DNS records (wherever `aztechcoworks.in` is managed):

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A/CNAME | api | `<cPanel server IP or hostname>` | Backend API |
| TXT | @ | `v=spf1 include:resend.com ~all` | Email SPF |
| TXT | resend._domainkey | `<from Resend dashboard>` | Email DKIM |
| TXT | _dmarc | `v=DMARC1; p=none;` | Email DMARC |

**If `api.aztechcoworks.in` is on the same cPanel as the main site**, the A record may already exist — just create the subdomain in Step 1.

---

### Step 7: Cloudflare Pages — Set Frontend Env Var (5 min)

1. Go to Cloudflare Dashboard > Pages > project
2. Settings > Environment Variables
3. Add for **Production**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.aztechcoworks.in` |
| `VITE_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` (from Step 8) |

4. Trigger a new deployment (push a commit or click "Retry deployment")

---

### Step 8: Google Analytics (15 min)

1. Go to https://analytics.google.com
2. Create property: "Aztech Co-Works" > Web > `https://aztechcoworks.in`
3. Copy the Measurement ID (starts with `G-`)
4. Add to Cloudflare Pages env vars (Step 7)
5. Go to https://search.google.com/search-console
6. Add property > URL prefix > `https://aztechcoworks.in`
7. Verify via DNS TXT record or Cloudflare integration
8. Submit sitemap: `https://aztechcoworks.in/sitemap.xml`

---

### Step 9: Production Seed Data (15 min)

The database auto-seeds with demo data on first request. For production:

1. Login to cPanel > File Manager
2. Navigate to `data/` directory inside the API document root
3. Delete `aztech.db` (and any WAL/SHM files)
4. Before deleting, consider updating the seed data in `src/Db.php`:
   - Change the super_admin credentials (real name, email, strong password)
   - Verify the 6 branches have correct addresses
   - Verify the 5 plans have correct pricing
   - Remove or keep demo members/leads (useful for initial testing)
5. Visit any API endpoint to trigger re-seed
6. Test login with admin credentials

**Alternative:** Keep the demo seed for initial launch and manage data through the dashboard. The demo password for all accounts is `demo1234`.

---

### Step 10: Smoke Test (30 min)

Run through every critical flow on production:

```
[ ] Visit https://aztechcoworks.in — homepage loads
[ ] Navigate all public pages (branches, pricing, corporate, blog)
[ ] Submit a lead enquiry form
[ ] Book a site visit
[ ] Register a new account
[ ] Login with the new account
[ ] Login as admin (super_admin credentials)
[ ] View dashboard — leads, tasks, site visits load
[ ] Create a booking (meeting room or day pass)
[ ] Payment flow completes (demo mode or Razorpay)
[ ] Download invoice PDF
[ ] Download booking .ics calendar file
[ ] Check audit logs (admin panel)
[ ] Forgot password — sends email (check Resend dashboard or error_log)
[ ] Reset password with token
[ ] Logout and login again
[ ] Test on mobile (responsive layout, mobile sidebar)
```

---

## Launch Order Summary

| # | Task | Time | Blocker? |
|---|------|------|----------|
| 0 | Start Razorpay KYC | 10 min to submit, 1-3 days approval | NO — demo mode works |
| 1 | Create subdomain in cPanel | 10 min | YES |
| 2 | Upload PHP files | 15 min | YES |
| 3 | Create .env file | 10 min | YES |
| 4 | Verify API endpoints | 5 min | YES |
| 5 | Resend email setup + DNS | 30 min | NO — falls back to error_log |
| 6 | DNS configuration | 15 min + propagation | YES (if new subdomain) |
| 7 | Cloudflare Pages env vars + redeploy | 5 min | YES |
| 8 | Google Analytics + Search Console | 15 min | NO — tracking starts later |
| 9 | Update seed data for production | 15 min | Recommended |
| 10 | Smoke test | 30 min | YES |

**Critical path: Steps 1 + 2 + 3 + 4 + 6 + 7 + 10**
**Minimum time to live: ~1.5 hours**
**No VPS needed. No Node.js install. No PM2/Nginx. Just cPanel.**

---

## Security Checklist

```
[ ] .env file is NOT in a public-accessible location (or .htaccess blocks it)
[ ] SQLite data/ directory is outside public_html (or protected by .htaccess)
[ ] Admin password changed from demo1234 to a strong password
[ ] CORS_ORIGIN set to exact production domain (not *)
[ ] Razorpay webhook secret is set (when live)
[ ] PHP error display is OFF in production (display_errors = Off)
```

**Note on .htaccess:** The existing `.htaccess` rewrites everything to `index.php`, so direct access to `.env` or `data/aztech.db` is already blocked — requests to those paths go through the router which returns 404. However, for extra safety, add this to `.htaccess`:

```apache
# Block direct access to sensitive files
<FilesMatch "\.(env|db|db-wal|db-shm)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## Post-Launch (Nice to Have)

| Task | Priority | Notes |
|------|----------|-------|
| Real branch photos | High | Replace Unsplash placeholders. Schedule photographer. |
| Razorpay live keys | High | Once KYC approved, update .env |
| WhatsApp BSP setup | Medium | Choose Interakt/Wati, get templates approved by Meta (~24h) |
| Google My Business | Medium | Claim/create listings for all 6 branches |
| Backups | High | cPanel cron job: daily backup of `data/aztech.db` |
| PHP error monitoring | Medium | Check cPanel error logs weekly |
| Member self-service | Low | Profile edit, change password |
| Bulk operations | Low | Multi-select on leads/invoices |

---

## cPanel Cron Job — Daily SQLite Backup

Go to cPanel > **Cron Jobs** and add:

```
0 2 * * * cp /home/username/public_html/api/data/aztech.db /home/username/backups/aztech-$(date +\%F).db
```

(Adjust paths to match your cPanel document root)

---

## Quick Reference: Architecture

```
aztechcoworks.in (Cloudflare Pages)
  |
  |-- React SPA (Vite + TanStack Router)
  |-- Talks to: api.aztechcoworks.in
  |
api.aztechcoworks.in (cPanel shared hosting)
  |
  |-- PHP 8.1+ (PDO SQLite, WAL mode)
  |-- .htaccess → index.php (single entry point)
  |-- Razorpay API (payments)
  |-- Resend API (email)
  |-- WhatsApp API (notifications)
```

---

*This is the final go-live checklist. No more code changes needed. Just ops.*

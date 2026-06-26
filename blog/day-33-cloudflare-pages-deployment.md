# Day 33: Cloudflare Pages Deployment — Static Files, Global CDN, Free Tier

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #cloudflare #deployment #hosting #devops

---

The entire frontend deploys as static files to Cloudflare Pages. Free. Global CDN. Auto-deploy from GitHub. Zero server management.

## The Setup

1. Connect GitHub repo to Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy.

That's it. Every push to `main` triggers a build and deploy. Preview URLs for pull requests. Rollback to any previous deployment in one click.

## The _redirects File

The most important file in the entire deployment:

```
/* /index.html 200
```

One line. This tells Cloudflare: "For every URL path, serve `index.html` with a 200 status code."

Without this file, navigating directly to `/dashboard/bookings` or refreshing the page returns a 404. Cloudflare looks for a file at `dist/dashboard/bookings/index.html`, which doesn't exist — it's a client-side route, not a file.

The `_redirects` file makes Cloudflare serve `index.html` for all paths. TanStack Router then reads the URL and renders the correct component.

```
Browser requests /dashboard/bookings
  → Cloudflare serves index.html (200)
  → React loads
  → TanStack Router reads /dashboard/bookings
  → Renders BookingsPage component
```

## Build Output

```
dist/
  index.html              (entry point)
  _redirects              (SPA routing)
  assets/
    index-D70QJFUU.js     355 KB (React + shared libs)
    queries-pKf-ApP2.js    46 KB (API hooks)
    select-Bdf-nM8J.js     50 KB (Radix Select)
    ...18 more chunks
```

Total: ~900 KB gzipped across all chunks. But each page loads only what it needs — typically 100-150 KB for the initial page, then 5-15 KB for each subsequent navigation.

The code splitting is automatic — TanStack Router's `autoCodeSplitting` creates a separate chunk for every route. The Recharts library (348 KB) only loads when someone visits `/admin/analytics`.

## Why Cloudflare Pages

**Free tier is generous.** 500 builds per month, unlimited bandwidth, unlimited requests. For a coworking platform with thousands of page views per month, this is effectively free forever.

**Global CDN.** Static files are served from Cloudflare's edge network — 300+ data centers worldwide. A member in Coimbatore gets files from a nearby edge server, not a server in US-East-1.

**Auto-deploy.** Push to GitHub → build triggers → deploys in ~30 seconds. No CI configuration. No deployment scripts. No SSH keys.

**Preview deployments.** Every pull request gets a unique preview URL. Stakeholders can review changes before they go live.

**Rollback.** Every deployment is immutable. Something breaks? Click "Rollback" on the previous deployment. Live in seconds.

## The Full Infrastructure

```
Frontend: Cloudflare Pages (free)
  ↕ HTTPS
Backend: VPS or cPanel (₹300-800/month)
  ↕ SQLite
Database: Single file on server disk
```

Total hosting cost: **₹0 for frontend + ₹300-800/month for backend.**

A 1,200-seat coworking business running on infrastructure that costs less than a hot desk.

## Environment Variables

The frontend has one environment variable:

```
VITE_API_URL=https://api.aztechcoworks.in
```

Set in Cloudflare Pages dashboard → Settings → Environment Variables. Different values for production and preview deployments.

If `VITE_API_URL` isn't set, the frontend defaults to `http://localhost:3001` (development) and eventually falls back to mock mode (if the server is unreachable).

## Custom Domain

Adding a custom domain on Cloudflare Pages:

1. Add domain in Pages settings
2. Update DNS to point to Cloudflare
3. SSL certificate is provisioned automatically

HTTPS everywhere. No Let's Encrypt setup. No certificate renewal cron jobs. Cloudflare handles it.

## What I Learned About Static Hosting

1. **SPA routing requires server configuration.** Whether it's `_redirects` on Cloudflare, `rewrites` in `vercel.json`, or `try_files` in nginx — you need to tell the server to serve `index.html` for all paths.

2. **Code splitting matters.** Without it, every user downloads the entire app on first load. With it, they download only the page they're visiting.

3. **Cache headers matter.** Cloudflare serves hashed asset files (`index-D70QJFUU.js`) with long cache headers. The hash changes when the content changes, so browsers always get fresh code without re-downloading unchanged files.

4. **Preview deployments are worth more than staging servers.** Every PR gets its own URL. QA, design review, and stakeholder approval happen in parallel, not in sequence.

---

**Tomorrow:** Day 34 — The TanStack Query Cache: Why Data Feels Instant

**Image suggestions:**
- SCREENSHOT: Cloudflare Pages dashboard showing deployments
- SCREENSHOT: The _redirects file (it's one line)
- SCREENSHOT: Build output showing chunk sizes
- DIAGRAM: GitHub push → Cloudflare build → CDN edge servers → User

**LinkedIn post:**

> Frontend hosting for a SaaS platform:
>
> Cloudflare Pages. Free tier. Zero server management.
>
> Setup:
> 1. Connect GitHub
> 2. Build: npm run build
> 3. Output: dist/
> 4. Add _redirects: /* /index.html 200
>
> That last line is critical. Without it, refreshing /dashboard/bookings returns 404. It's one line. It's the difference between "works" and "broken."
>
> What I get for free:
> - Global CDN (300+ edge locations)
> - Auto-deploy on push
> - Preview URLs for every PR
> - Instant rollback
> - Free SSL certificates
> - Unlimited bandwidth
>
> Total frontend hosting cost: ₹0.
>
> Day 33 of 45: [link]

**X post:**

> SPA deployment cheat code:
>
> 1. Build → static files
> 2. _redirects file: /* /index.html 200
> 3. Push to Cloudflare Pages
>
> Free CDN. Auto-deploy. Preview URLs. SSL. Rollback.
>
> Total cost: ₹0. The _redirects file is the hero.
>
> Day 33/45

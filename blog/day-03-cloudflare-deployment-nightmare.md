# Day 3: The Cloudflare Deployment Nightmare — Three Commits to Ship a Static Site

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #cloudflare #deployment #devops #webdev

---

Three commits. That's how many it took to deploy a React app to Cloudflare Pages.

Not because Cloudflare is hard. Because my assumptions were wrong in three different ways.

## Commit 1: Wrong Nitro Preset

The Lovable-generated app used TanStack Start, which uses Vinxi under the hood, which uses Nitro for the server layer. Nitro supports different "presets" for different hosting platforms — node-server, vercel, netlify, cloudflare-pages, etc.

I picked `cloudflare-pages`. Build succeeded. Deploy succeeded. Site loaded.

But the API routes didn't work. The SSR didn't hydrate correctly. Console errors everywhere. The preset was designed for Cloudflare Workers, which have a different runtime model than what I actually needed.

Lesson: **The Nitro preset matters, and "cloudflare-pages" doesn't mean what you think it means if you're coming from a Node.js mental model.**

## Commit 2: Lockfile Not Cross-Platform

Fixed the preset issue, pushed again. Cloudflare's CI picked up the commit and... `npm ci` failed.

```
npm ERR! EBADPLATFORM
```

The `package-lock.json` was generated on macOS. Cloudflare's build environment runs Linux. Some native dependencies (like esbuild) have platform-specific binaries. The lockfile had locked in the macOS binary versions, and Linux couldn't find them.

The fix was straightforward: delete `package-lock.json`, run `npm install` fresh, commit the new lockfile. But the debugging wasn't straightforward because the error message was buried in a wall of npm output, and "EBADPLATFORM" isn't exactly self-explanatory.

Lesson: **Your CI environment is not your laptop. Ever. Always verify your lockfile is platform-agnostic, or use a platform-independent package manager.**

## Commit 3: esbuild Missing from devDependencies

Okay, lockfile is fixed. Build starts. And fails again.

```
Error: Cannot find module 'esbuild'
```

esbuild was a transitive dependency — something that Vite needed internally but wasn't in my direct `devDependencies`. On my machine, it existed in `node_modules` because of hoisting. On Cloudflare's CI, after a fresh `npm ci`, the hoisting resolved differently and esbuild wasn't where the build script expected it.

The fix: add `esbuild` explicitly to `devDependencies`.

```bash
npm install --save-dev esbuild
```

Build passes. Deploy passes. Site loads. SSR works.

For about 10 minutes. Then I clicked around the app and realized the real problem.

## The Real Problem: SSR Was Wrong for This App

The site was working. But it was slow. Every page navigation triggered a server-side render, which means a round-trip to Cloudflare's edge function, which means latency on every click. For a dashboard-heavy app where users click between 10 different pages in a session, that latency adds up.

And more fundamentally: why was I server-rendering pages that require authentication?

The marketing pages — homepage, branches, pricing, blog — benefit from SSR. Search engines can crawl them. The initial paint is fast. Fine.

But the dashboard, the sales pipeline, the reception desk, the admin panel? These pages are 100% behind authentication. No search engine will ever see them. No unauthenticated user will ever load them. SSR adds a server, complicates the deployment, introduces edge function cold starts, and provides exactly zero benefit.

27 of my 33 routes are behind auth. I was paying the SSR tax on 82% of the app for zero return.

## The Fix: Rip It All Out

Commit 6 (after a few more intermediate commits for other things) was the inflection point. I removed TanStack Start entirely. Removed Vinxi. Removed Nitro. Removed the server-side rendering layer.

What remained: a pure Vite SPA. React 19. TanStack Router for client-side routing. No server. No edge functions. No SSR.

The deployment became trivially simple:

```
Build command: npm run build
Output directory: dist
```

And one critical file — `public/_redirects`:

```
/* /index.html 200
```

That `_redirects` file tells Cloudflare: "Whatever path the browser requests, serve `index.html` and let the client-side router handle it." Without it, navigating directly to `/dashboard/bookings` returns a 404 because Cloudflare looks for a file at that path.

Build time dropped from ~8 seconds (SSR compilation) to 619 milliseconds. Deployment went from "edge functions + static assets" to "just static assets." The entire app became a folder of HTML, CSS, and JS files served from Cloudflare's global CDN.

No server. No cold starts. No edge function debugging. Free tier.

## What I Learned

**1. Start with the simplest deployment model.**

If your app is a SPA, deploy it as static files. Add SSR only when you have a proven, measurable need — not because the framework supports it.

**2. SSR is a tool, not a default.**

For content sites, blogs, e-commerce with SEO needs — absolutely use SSR. For authenticated dashboards and admin panels? You're adding complexity for zero benefit.

**3. The `_redirects` file is the most important file in an SPA.**

Seriously. Without it, every deep link and every browser refresh returns a 404. It's one line. It's the difference between "working" and "broken in production."

```
/* /index.html 200
```

Memorize it.

**4. Debug deployment failures in the CI environment, not your laptop.**

My app built perfectly on macOS. It failed three times on Cloudflare's Linux CI. If I had tested with a Docker container running the same environment, I would have caught all three issues before pushing.

**5. Sometimes the best architecture decision is subtraction.**

I didn't add a better SSR solution. I didn't fix the Nitro preset. I didn't optimize the edge function. I removed the entire layer. The app became simpler, faster, cheaper, and easier to debug.

Subtraction > Addition. Every time.

## The Numbers

| Metric | With SSR | Without SSR |
|--------|----------|-------------|
| Build time | ~8s | 619ms |
| Deployment | Edge functions + static | Static only |
| Hosting cost | Paid tier (Workers) | Free tier |
| Cold start | 50-200ms per function | 0ms |
| Debugging | Server + client | Client only |
| Commits to deploy | 3 | 0 (just works) |

The 619ms build time still makes me smile every time I run it.

---

**Tomorrow:** Day 4 — Ripping Out SSR: How TanStack Router's File-Based Routing Works Without a Server

**Image suggestions:**
- SCREENSHOT: Terminal showing the failed Cloudflare build with EBADPLATFORM error
- SCREENSHOT: The `_redirects` file (it's one line, but it's the most important line)
- SCREENSHOT: Vite build output showing 619ms build time
- GENERIC: A person removing a tangled cable from a server rack

**LinkedIn post:**

> Three commits to deploy a React app to Cloudflare Pages.
>
> Commit 1: Wrong Nitro preset
> Commit 2: Lockfile not cross-platform compatible
> Commit 3: esbuild missing from devDependencies
>
> Then I realized the real problem: I was server-rendering 27 pages that are behind authentication. Zero SEO benefit. Just added latency, complexity, and cost.
>
> The fix: rip out SSR entirely. Go pure SPA.
>
> Build time: 8s -> 619ms
> Hosting cost: Paid tier -> Free tier
> Cold starts: 50-200ms -> 0ms
> Complexity: Server + client -> Client only
>
> Sometimes the best architecture decision is subtraction.
>
> Day 3 of 45: [link]

**X post:**

> 3 commits to deploy to Cloudflare. Then I deleted the whole server layer.
>
> Build: 8s -> 619ms
> Cost: Paid -> Free
> Cold starts: Gone
>
> 27 of 33 routes are behind auth. SSR was a tax on 82% of the app for 0 benefit.
>
> Subtraction > Addition.
>
> Day 3/45 #buildinpublic

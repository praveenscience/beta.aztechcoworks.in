# Day 26: Building the Express Backend — From In-Memory Store to Real API

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #express #nodejs #backend #api

---

The frontend worked. Every page rendered. Every form submitted. Every chart showed data. And all of it lived in localStorage.

Clear your browser → lose your business data. Time for a real backend.

## Why Express

I evaluated three options: Express, Fastify, and Hono.

**Express** won because:
1. The middleware ecosystem is unmatched (helmet, express-rate-limit, express-session)
2. I've shipped Express to production before — no learning curve
3. The codebase is simple enough that Express's performance is irrelevant

For a coworking platform serving maybe 50 concurrent users, framework performance is not the bottleneck. Developer velocity is. Express let me ship the entire backend in a day.

## The Server Setup

```typescript
import express from "express";
import session from "express-session";
import cors from "cors";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-only-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    sameSite: "lax",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes(publicFormLimiter));
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Three route groups:
- **Auth routes** — Login, register, logout, me
- **Public routes** — Branches, plans, blog, testimonials, lead capture, site visit booking
- **Dashboard routes** — Everything behind authentication (leads, tasks, users, bookings, etc.)

## The Route Structure

The dashboard routes are the biggest group — 33 endpoints:

```
GET    /api/dashboard/leads
GET    /api/dashboard/leads/:id
PATCH  /api/dashboard/leads/:id
POST   /api/dashboard/leads/:id/activities
GET    /api/dashboard/tasks
POST   /api/dashboard/tasks
PATCH  /api/dashboard/tasks/:id
GET    /api/dashboard/site-visits
GET    /api/dashboard/visitors
POST   /api/dashboard/visitors
PATCH  /api/dashboard/visitors/:id/checkin
PATCH  /api/dashboard/visitors/:id/checkout
POST   /api/dashboard/bookings
POST   /api/dashboard/memberships
PATCH  /api/dashboard/memberships/:id/cancel
GET    /api/dashboard/users
POST   /api/dashboard/users
PATCH  /api/dashboard/users/:id
GET    /api/dashboard/all-branches
POST   /api/dashboard/branches
PATCH  /api/dashboard/branches/:id
POST   /api/dashboard/plans
PATCH  /api/dashboard/plans/:id
DELETE /api/dashboard/plans/:id
GET    /api/dashboard/meeting-rooms
GET    /api/dashboard/seat-inventory
GET    /api/dashboard/all-memberships
GET    /api/dashboard/all-bookings
GET    /api/dashboard/invoices
GET    /api/dashboard/me/memberships
GET    /api/dashboard/me/invoices
GET    /api/dashboard/me/bookings
```

Every dashboard route has `requireAuth` middleware applied at the router level:

```typescript
const router = Router();
router.use(requireAuth);
```

One line. Every endpoint in this router is protected.

## The Endpoint Pattern

Every endpoint follows the same pattern:

```typescript
router.patch("/leads/:id", validate(leadPatchSchema), (req, res) => {
  const lead = db.leads.update(req.params.id, req.body);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});
```

1. Route path with params
2. Optional validation middleware
3. Optional authorization middleware
4. Handler: database operation → response

No controllers. No service layers. No repository pattern. The handler IS the business logic. For a backend this size, abstraction layers add indirection without adding value.

## Session Authentication

I chose session-based auth over JWT for one reason: simplicity.

```typescript
// Login
router.post("/login", validate(loginSchema), async (req, res) => {
  const user = db.users.findByEmail(req.body.email);
  if (!user || !await verifyPassword(req.body.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  req.session.userId = user.id;
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// Check auth
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = db.users.find(req.session.userId);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({}));
});
```

Sessions are stored in memory (default express-session store). For a single-server deployment, this is fine. For multiple servers, I'd switch to Redis or connect-sqlite3.

The frontend sends `credentials: "include"` on every fetch, which sends the session cookie automatically. No token management. No Authorization headers. No refresh token rotation.

## Wiring the Frontend

The frontend API layer was already built to make fetch calls. I just needed to ensure it hit the right URLs:

```typescript
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || res.statusText), { status: res.status });
  }
  return res.json();
}
```

The `credentials: "include"` is crucial — without it, the browser won't send the session cookie on cross-origin requests.

## The Demo Login

For development and demos, there's a special endpoint that logs in as any seed user:

```typescript
router.post("/demo/:userId", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  const user = db.users.find(req.params.userId);
  if (!user) return res.status(404).json({ error: "Unknown demo user" });
  req.session.userId = user.id;
  const { passwordHash, ...safe } = user;
  res.json(safe);
});
```

The `NODE_ENV` guard is critical — this endpoint doesn't exist in production. You can't log in as an arbitrary user in the real deployment. But during development, it lets me quickly switch between roles to test each dashboard.

---

**Tomorrow:** Day 27 — SQLite in Production: WAL Mode, Indexes, and Why You Don't Need Postgres

**Image suggestions:**
- SCREENSHOT: The server directory structure
- SCREENSHOT: Terminal showing the Express server starting
- CODE SCREENSHOT: The session configuration
- DIAGRAM: Request flow: Browser → CORS → JSON parser → Session → Auth → Validation → Handler → SQLite

**LinkedIn post:**

> Built the entire backend in a day with Express.
>
> 33 API endpoints. Session auth. Zod validation. RBAC middleware.
>
> Why Express over Fastify/Hono? Three reasons:
> 1. Middleware ecosystem (helmet, rate-limit, session)
> 2. Zero learning curve (shipped Express before)
> 3. Performance doesn't matter at 50 concurrent users
>
> The endpoint pattern:
> router.patch("/leads/:id", validate(schema), (req, res) => {
>   const lead = db.leads.update(id, body);
>   if (!lead) return res.status(404);
>   res.json(lead);
> });
>
> No controllers. No service layers. No repository pattern. The handler IS the business logic.
>
> For a backend this size, abstraction layers add indirection without value.
>
> Day 26 of 45: [link]

**X post:**

> Express backend: 33 endpoints, built in a day.
>
> Pattern: route → validate → authorize → query → respond.
>
> No controllers. No services. No repositories. Just handlers.
>
> At 50 concurrent users, architecture is overhead. Ship it.
>
> Day 26/45

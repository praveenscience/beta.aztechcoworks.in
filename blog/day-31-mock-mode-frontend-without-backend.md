# Day 31: The Mock Mode — A Frontend That Works Without a Backend

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #architecture #react #mockapi #offlinefirst

---

The single best architecture decision I made on this project: the frontend works without the backend.

When the API server is unreachable — because it's down, because you're offline, because you're demoing on an airplane — the app automatically switches to mock mode. Every page still works. Every form still submits. Every chart still renders.

## How It Works

The API layer tries the real server first:

```typescript
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (_mockMode) {
    return handleMock<T>(path, init);
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) throw Object.assign(new Error(), { status: res.status });
    return res.json();
  } catch (e) {
    if (isNetworkError(e)) {
      setMockMode();
      return handleMock<T>(path, init);
    }
    throw e;
  }
}
```

The key is the `isNetworkError` check:

```typescript
function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError &&
    (e.message.includes("fetch") || e.message.includes("network") || e.message.includes("Failed"));
}
```

A `TypeError` with "fetch" or "Failed" in the message means the server is unreachable. Not a 404 or 500 (those are server responses — the server is working). A genuine network failure.

When that happens, `setMockMode()` flips a global flag, and all subsequent requests bypass fetch entirely.

## The Mock Router

`mock-api.ts` is a 170-line in-browser router that matches API paths and returns mock data:

```typescript
const getRoutes: [RegExp, RouteHandler][] = [
  [/^\/api\/branches$/, () => mock.branches],
  [/^\/api\/branches\/([^/]+)$/, (p) => {
    const b = mock.branches.find((r) => r.slug === p[0] || r.id === p[0]);
    if (!b) throw { status: 404 };
    return {
      ...b,
      seatInventory: mock.seatInventory.filter((s) => s.branchId === b.id),
      meetingRooms: mock.meetingRooms.filter((m) => m.branchId === b.id),
    };
  }],
  [/^\/api\/plans$/, () => mock.plans],
  [/^\/api\/dashboard\/leads$/, () => mock.leads],
  // ... 20 more routes
];
```

Each route is a regex pattern and a handler function. The handler receives captured groups (URL parameters) and an optional body (for POST/PATCH).

The `matchRoute` function iterates through routes:

```typescript
function matchRoute(path: string, routes: [RegExp, RouteHandler][], body?: unknown): unknown {
  for (const [re, handler] of routes) {
    const m = path.match(re);
    if (m) {
      const params: Record<string, string> = {};
      m.slice(1).forEach((v, i) => { params[i] = v; });
      return handler(params, body);
    }
  }
  return undefined;
}
```

It's essentially a miniature Express router running in the browser. Same pattern matching. Same parameter extraction. Same handler signature.

## Mock Mutations

POST, PATCH, and DELETE routes also have mock handlers:

```typescript
const postRoutes: [RegExp, RouteHandler][] = [
  [/^\/api\/dashboard\/tasks$/, (_p, body: any) => ({
    id: `tk_mock_${Date.now()}`,
    ...body,
  })],
  [/^\/api\/dashboard\/visitors$/, (_p, body: any) => ({
    id: `vis_mock_${Date.now()}`,
    ...body,
    qrToken: Math.random().toString(36).slice(2, 8).toUpperCase(),
  })],
  [/^\/api\/auth\/login$/, (_p, body: any) => {
    const user = mock.users.find((u) => u.email === body?.email);
    if (!user) throw { status: 401, message: "Invalid credentials" };
    currentUser = user;
    return user;
  }],
];
```

Create operations return a new object with a generated ID. Login operations check mock user data and set a `currentUser` variable (the mock mode's "session").

This means you can log in, create tasks, book rooms, and register visitors — all without a server. The data lives in memory for the session.

## The Amber Banner

When mock mode activates, users need to know. A persistent amber banner appears at the top of the page:

```tsx
function MockBanner() {
  const active = useSyncExternalStore(
    mockMode.subscribe,
    () => mockMode.active
  );

  if (!active) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-sm py-1.5 px-4">
      Demo mode — showing sample data. Backend is not connected.
    </div>
  );
}
```

`useSyncExternalStore` is React 18's API for subscribing to external state. The mock mode flag lives outside React (a plain boolean module variable), but the banner component reacts to changes.

When the flag flips from `false` to `true`, the banner renders. No Context provider. No state management library. Just React's built-in subscription API.

## Why This Matters

**1. Demos work anywhere.** I can open the app on my phone at a coffee shop and walk a potential partner through the entire platform. No VPN. No "let me check if the server is running."

**2. Frontend development is independent.** Frontend developers (or future me) can build new features without running the backend. The mock data provides realistic responses for every endpoint.

**3. Stakeholder reviews.** The business team can review the UI on their own laptops. No developer setup. No Docker. Just open the URL.

**4. CI/CD.** End-to-end tests can run against mock mode without spinning up a database server. Faster CI. Less infrastructure.

**5. Graceful degradation.** If the production server goes down at 2 AM, the marketing site still shows branch information, pricing, and testimonials from mock data. The dashboard shows demo data with the amber banner. Users aren't staring at an error page.

## The Cost

170 lines of mock router code. The mock data is shared with the seed data (same TypeScript types, similar structure). There's some maintenance cost when adding new endpoints — you need to add a mock route alongside the real route. But each mock route is 2-5 lines.

For the benefits listed above, 170 lines is a bargain.

---

**Tomorrow:** Day 32 — useSyncExternalStore: Reactive UI Without React State

**Image suggestions:**
- SCREENSHOT: The amber "Demo mode" banner at the top of the dashboard
- SCREENSHOT: The mock-api.ts file showing regex route patterns
- DIAGRAM: Flow chart: fetch() → network error? → mock mode → regex router → mock data
- SCREENSHOT: The app working fully in mock mode (all data visible)

**LinkedIn post:**

> The frontend works without the backend.
>
> When the API server is unreachable:
> 1. fetch() throws a network TypeError
> 2. Global _mockMode flag flips to true
> 3. All subsequent requests route through an in-browser mock router
> 4. An amber banner says "Demo mode"
>
> The mock router: 170 lines. Regex-based path matching. GET/POST/PATCH/DELETE handlers. Mock data for every endpoint.
>
> Why this matters:
> - Demos work without servers
> - Frontend dev is backend-independent
> - Stakeholders review without setup
> - Graceful degradation in production
>
> If the server goes down at 2 AM, users see demo data with a banner — not an error page.
>
> 170 lines. The best architectural investment in the entire codebase.
>
> Day 31 of 45: [link]

**X post:**

> The frontend works without the backend. 170 lines of mock router code.
>
> Server unreachable? Auto-switch to mock mode. Every page works. Amber banner warns the user.
>
> Demos, development, CI, and graceful degradation — all from one architectural decision.
>
> Day 31/45

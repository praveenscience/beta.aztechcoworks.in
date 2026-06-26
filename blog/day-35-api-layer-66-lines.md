# Day 35: The API Layer — 66 Lines That Connect Everything

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #api #react #typescript #architecture

---

The entire API layer — the code that connects the React frontend to the Express backend (or the PHP backend, or the mock router) — is 66 lines of TypeScript.

## The File

```typescript
import { mockGet, mockPost, mockPatch, mockDelete } from "./mock-api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

let _mockMode = false;
const listeners = new Set<() => void>();

export const mockMode = {
  get active() { return _mockMode; },
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
};

function setMockMode() {
  if (!_mockMode) { _mockMode = true; listeners.forEach((fn) => fn()); }
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError &&
    (e.message.includes("fetch") || e.message.includes("network") || e.message.includes("Failed"));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (_mockMode) return handleMock<T>(path, init);

  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(body.error || res.statusText), { status: res.status });
    }
    return res.json();
  } catch (e) {
    if (isNetworkError(e)) { setMockMode(); return handleMock<T>(path, init); }
    throw e;
  }
}

function handleMock<T>(path: string, init?: RequestInit): T {
  const method = init?.method?.toUpperCase() ?? "GET";
  const body = init?.body ? JSON.parse(init.body as string) : undefined;
  if (method === "POST") return mockPost<T>(path, body);
  if (method === "PATCH") return mockPatch<T>(path, body);
  if (method === "DELETE") return mockDelete<T>(path);
  return mockGet<T>(path);
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
```

66 lines. Four exported methods: `api.get`, `api.post`, `api.patch`, `api.delete`. Mock mode detection and fallback. Error handling with structured error objects.

## What Each Section Does

**Lines 1-3:** Imports and base URL from environment variable.

**Lines 5-11:** Mock mode state and subscription system (for the amber banner).

**Lines 13-15:** One-way flag flip. Once mock mode activates, it stays active for the session.

**Lines 17-19:** Network error detection — distinguishes "server returned an error" from "server is unreachable."

**Lines 21-38:** The core `request` function. Try the real server. If it fails with a network error, switch to mock mode. If it fails with an HTTP error (4xx, 5xx), throw with the status code attached.

**Lines 40-46:** Mock mode routing. Dispatches to the correct mock function based on HTTP method.

**Lines 48-53:** The public API. Four typed methods that compose `request`.

## The Error Object Pattern

```typescript
throw Object.assign(new Error(body.error || res.statusText), { status: res.status });
```

This creates an Error with a `status` property. The TanStack Query hooks can catch and inspect it:

```tsx
export function useMe() {
  return useQuery({
    queryFn: async () => {
      try {
        return await api.get<SafeUser>("/api/auth/me");
      } catch (e: any) {
        if (e.status === 401) return null; // Not logged in
        throw e; // Real error
      }
    },
  });
}
```

A 401 means "not authenticated" — that's expected, not an error. The hook returns `null`. Any other error (500, network) propagates to TanStack Query's error handling.

## The Generic Type Parameter

```typescript
api.get<Branch[]>("/api/branches")
api.post<SafeUser>("/api/auth/login", creds)
api.patch<Lead>(`/api/dashboard/leads/${id}`, patch)
```

The `<T>` generic flows through `request<T>` to the return type. The caller specifies what they expect, and TypeScript enforces it at the call site.

This isn't runtime validation — it's a developer experience feature. The API could return anything. But the type annotation tells the developer (and the compiler) what shape to expect, enabling autocomplete and type checking on the response.

## Why Not Axios?

Axios provides:
- Interceptors (for auth headers, error transformation)
- Request cancellation
- Automatic JSON parsing
- Browser + Node.js compatibility

I don't need any of these:
- **Interceptors:** My auth is cookie-based (no Authorization header needed)
- **Cancellation:** TanStack Query handles query cancellation
- **JSON parsing:** `res.json()` is one method call
- **Node.js:** The API layer only runs in the browser

`fetch` does everything I need. Adding Axios would add 13 KB for zero benefit.

## The Three-Way Switch

The same `api.get("/api/branches")` call works against:

1. **Real Node.js backend** — `fetch("http://localhost:3001/api/branches")`
2. **Real PHP backend** — `fetch("https://api.example.com/api/branches")`
3. **In-browser mock** — `mockGet("/api/branches")` → returns mock data

The frontend doesn't know or care which backend it's talking to. Change `VITE_API_URL` to switch backends. Remove the URL entirely to use mock mode.

This is the power of a thin API layer: it decouples the frontend from the backend implementation. The contract is the URL paths and response shapes. Everything else is an implementation detail.

## 66 Lines, Zero Dependencies

No Axios. No ky. No superagent. No GraphQL client. Just `fetch`, `JSON.stringify`, and `JSON.parse`.

The API layer is the thinnest possible abstraction over the network. It adds three things:
1. Credential handling (`credentials: "include"`)
2. Error normalization (attach `status` to error objects)
3. Mock fallback (network error → mock mode)

Everything else is handled by TanStack Query (caching, retries, deduplication) and the browser (fetch API, cookies, CORS).

Keep your API layer thin. Let the tools do their jobs.

---

**Tomorrow:** Day 36 — Zod Validation Schemas: One Pattern for Every Endpoint

**Image suggestions:**
- CODE SCREENSHOT: The complete api.ts file (it fits on one screen)
- DIAGRAM: api.get() → fetch? → success/error → mock fallback
- CODE SCREENSHOT: A useQuery hook calling api.get with a generic type

**LinkedIn post:**

> The entire API layer for a 33-endpoint SaaS platform: 66 lines of TypeScript.
>
> 4 methods: api.get, api.post, api.patch, api.delete
> 0 dependencies: just fetch + JSON
>
> What it does:
> 1. Sends requests with credentials (cookie auth)
> 2. Normalizes errors ({ status } on Error objects)
> 3. Falls back to mock mode on network failure
>
> Why not Axios?
> - Auth: cookie-based (no headers needed)
> - Cancellation: TanStack Query handles it
> - JSON parsing: res.json() is one call
> - Bundle: 0 KB vs 13 KB
>
> The same api.get("/api/branches") works against Node.js, PHP, or the in-browser mock router.
>
> Keep your API layer thin. Let the tools do their jobs.
>
> Day 35 of 45: [link]

**X post:**

> The entire API layer: 66 lines. Zero dependencies.
>
> 4 methods: get, post, patch, delete.
> 3 features: credentials, error normalization, mock fallback.
>
> Works against Node.js, PHP, or the in-browser mock. The frontend doesn't know. Doesn't care.
>
> Day 35/45

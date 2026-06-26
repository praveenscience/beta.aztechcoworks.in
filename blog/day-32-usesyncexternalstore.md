# Day 32: useSyncExternalStore — Reactive UI Without React State

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #react #hooks #reactapi #frontend

---

The mock mode banner needs to appear the instant mock mode activates. The mock mode flag lives outside React. How do you make React react to a non-React variable?

`useSyncExternalStore`. The most underused React 18 hook.

## The Problem

The mock mode flag is a plain module variable:

```typescript
// api.ts
let _mockMode = false;

function setMockMode() {
  if (!_mockMode) {
    _mockMode = true;
    listeners.forEach((fn) => fn());
  }
}
```

It's not React state. It's not Context. It's not Zustand. It's a boolean in a TypeScript module.

React components don't re-render when module variables change. If you tried `const active = _mockMode` in a component, it would read `false` and never update even after `setMockMode()` fires.

## The Hook

```typescript
export const mockMode = {
  get active() { return _mockMode; },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
```

The `subscribe` function matches the signature that `useSyncExternalStore` expects:

```typescript
subscribe(callback: () => void): () => void
```

Takes a callback. Returns an unsubscribe function. When the external state changes, call all subscribed callbacks. React then re-renders the subscribing components.

## The Component

```tsx
import { useSyncExternalStore } from "react";
import { mockMode } from "@/lib/api";

function MockBanner() {
  const active = useSyncExternalStore(
    mockMode.subscribe,      // How to subscribe
    () => mockMode.active    // How to read the current value
  );

  if (!active) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-sm py-1.5">
      Demo mode — showing sample data. Backend is not connected.
    </div>
  );
}
```

Three arguments to `useSyncExternalStore`:
1. **subscribe** — React calls this to register its callback
2. **getSnapshot** — React calls this to read the current value
3. (Optional) **getServerSnapshot** — For SSR (we don't use SSR)

When `setMockMode()` fires → listeners are called → React's callback fires → `getSnapshot()` returns `true` → component re-renders → banner appears.

## Why Not useState + useEffect?

You could do this with useState:

```tsx
function MockBanner() {
  const [active, setActive] = useState(mockMode.active);

  useEffect(() => {
    return mockMode.subscribe(() => setActive(mockMode.active));
  }, []);

  if (!active) return null;
  return <div>Demo mode</div>;
}
```

This works. But `useSyncExternalStore` is better because:

1. **No extra state.** The truth lives in the external store. useState creates a copy that could drift.
2. **SSR-safe.** `useSyncExternalStore` handles hydration mismatches. useState + useEffect doesn't.
3. **Tearing prevention.** In concurrent rendering, `useSyncExternalStore` ensures all components see the same snapshot. useState doesn't guarantee this.
4. **Cleaner API.** One hook call vs. useState + useEffect + cleanup.

## Where Else This Pattern Works

`useSyncExternalStore` is perfect for any "non-React state that React needs to know about":

- **Online/offline status**: `navigator.onLine`
- **Window resize**: `window.innerWidth`
- **Media queries**: `matchMedia("(prefers-color-scheme: dark)")`
- **Browser storage**: `localStorage` changes
- **WebSocket messages**: Real-time data from a socket

The pattern is always the same:

```typescript
const store = {
  subscribe(callback) { /* register callback, return unsubscribe */ },
  getSnapshot() { /* return current value */ },
};

function MyComponent() {
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot);
}
```

## The Mental Model

Think of it as: "React, here's something that lives outside of you. Watch it. When it changes, re-render me."

- `useState` — React owns the state
- `useContext` — React owns the state (shared)
- `useSyncExternalStore` — Someone else owns the state, React subscribes to it

The mock mode flag is owned by the API layer. React subscribes to it. Clean separation.

---

**Tomorrow:** Day 33 — Cloudflare Pages Deployment: Static Files, CDN, and the _redirects File

**Image suggestions:**
- DIAGRAM: External store → subscribe → React callback → re-render → UI update
- CODE SCREENSHOT: The useSyncExternalStore call in MockBanner
- CODE SCREENSHOT: The mockMode store with subscribe and active

**LinkedIn post:**

> useSyncExternalStore: the most underused React 18 hook.
>
> Problem: A mock mode flag (plain boolean) lives outside React. When it changes, a banner should appear.
>
> Solution:
> ```
> const active = useSyncExternalStore(
>   mockMode.subscribe,
>   () => mockMode.active
> );
> ```
>
> Why not useState + useEffect?
> 1. No extra state (truth lives in the external store)
> 2. SSR-safe (handles hydration)
> 3. Concurrent-safe (no tearing)
> 4. Cleaner (1 hook vs 2 hooks + cleanup)
>
> Pattern works for: online/offline, window resize, media queries, WebSocket messages, localStorage.
>
> "React, here's something outside of you. Watch it."
>
> Day 32 of 45: [link]

**X post:**

> useSyncExternalStore: React subscribes to non-React state.
>
> Mock mode flag (plain boolean) changes → React re-renders → banner appears.
>
> No useState. No useEffect. No Context. One hook call.
>
> The most underused React 18 feature.
>
> Day 32/45

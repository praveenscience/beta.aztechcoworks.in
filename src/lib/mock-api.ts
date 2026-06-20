// In-browser mock API — used when the backend server is unreachable.
// Handles GET/POST/PATCH by routing paths to mock data.

import * as mock from "./mock-data";

let currentUser: (typeof mock.users)[number] | null = null;

type RouteHandler = (params: Record<string, string>, body?: unknown) => unknown;

const getRoutes: [RegExp, RouteHandler][] = [
  [/^\/api\/auth\/me$/, () => {
    if (!currentUser) throw { status: 401 };
    return currentUser;
  }],
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
  [/^\/api\/blog$/, () => mock.blog],
  [/^\/api\/blog\/([^/]+)$/, (p) => {
    const post = mock.blog.find((r) => r.slug === p[0] || r.id === p[0]);
    if (!post) throw { status: 404 };
    return post;
  }],
  [/^\/api\/testimonials$/, () => mock.testimonials],
  [/^\/api\/dashboard\/leads$/, () => mock.leads],
  [/^\/api\/dashboard\/leads\/([^/]+)$/, (p) => {
    const lead = mock.leads.find((r) => r.id === p[0]);
    if (!lead) throw { status: 404 };
    return { ...lead, activities: [] };
  }],
  [/^\/api\/dashboard\/tasks$/, () => mock.tasks],
  [/^\/api\/dashboard\/site-visits$/, () => mock.siteVisits],
  [/^\/api\/dashboard\/me\/memberships$/, () =>
    currentUser ? mock.memberships.filter((m) => m.userId === currentUser!.id) : []
  ],
  [/^\/api\/dashboard\/me\/invoices$/, () =>
    currentUser ? mock.invoices.filter((i) => i.userId === currentUser!.id) : []
  ],
  [/^\/api\/dashboard\/me\/bookings$/, () => []],
  [/^\/api\/dashboard\/invoices$/, () => mock.invoices],
  [/^\/api\/dashboard\/users$/, () => mock.users],
  [/^\/api\/dashboard\/visitors$/, () => []],
  [/^\/api\/dashboard\/all-branches$/, () => mock.branches],
];

const postRoutes: [RegExp, RouteHandler][] = [
  [/^\/api\/auth\/demo\/([^/]+)$/, (p) => {
    const user = mock.users.find((u) => u.id === p[0]);
    if (!user) throw { status: 404, message: "Unknown demo user" };
    currentUser = user;
    return user;
  }],
  [/^\/api\/auth\/login$/, (_p, body: any) => {
    const user = mock.users.find((u) => u.email === body?.email);
    if (!user) throw { status: 401, message: "Invalid credentials" };
    currentUser = user;
    return user;
  }],
  [/^\/api\/auth\/register$/, (_p, body: any) => {
    const user = { id: "u_new", name: body?.name ?? "New User", email: body?.email ?? "", role: "member" as const, referralCode: "NEW", createdAt: new Date().toISOString() };
    currentUser = user;
    return user;
  }],
  [/^\/api\/auth\/logout$/, () => {
    currentUser = null;
    return {};
  }],
  [/^\/api\/leads$/, (_p, body: any) => ({ id: "ld_mock", ...body, score: 50, stage: "new", createdAt: new Date().toISOString() })],
  [/^\/api\/site-visits$/, (_p, body: any) => ({
    lead: { id: "ld_mock", name: body?.name, email: body?.email, phone: body?.phone, score: 50, stage: "new", source: "website", createdAt: new Date().toISOString() },
    visit: { id: "sv_mock", branchId: body?.branchId, scheduledAt: body?.date, status: "scheduled", mode: body?.mode ?? "self_serve" },
  })],
];

const patchRoutes: [RegExp, RouteHandler][] = [
  [/^\/api\/dashboard\/leads\/([^/]+)$/, (p, body: any) => {
    const lead = mock.leads.find((r) => r.id === p[0]);
    if (lead) Object.assign(lead, body);
    return lead ?? { id: p[0], ...body };
  }],
  [/^\/api\/dashboard\/tasks\/([^/]+)$/, (p, body: any) => {
    const task = mock.tasks.find((r) => r.id === p[0]);
    if (task) Object.assign(task, body);
    return task ?? { id: p[0], ...body };
  }],
];

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

export function mockGet<T>(path: string): T {
  const result = matchRoute(path, getRoutes);
  if (result === undefined) return [] as unknown as T;
  return result as T;
}

export function mockPost<T>(path: string, body?: unknown): T {
  const result = matchRoute(path, postRoutes, body);
  if (result === undefined) return {} as T;
  return result as T;
}

export function mockPatch<T>(path: string, body?: unknown): T {
  const result = matchRoute(path, patchRoutes, body);
  if (result === undefined) return {} as T;
  return result as T;
}

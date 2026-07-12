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
  [/^\/api\/dashboard\/meeting-rooms$/, () => mock.meetingRooms],
  [/^\/api\/dashboard\/seat-inventory$/, () => mock.seatInventory],
  [/^\/api\/dashboard\/all-memberships$/, () => mock.memberships],
  [/^\/api\/dashboard\/all-bookings$/, () => []],
  [/^\/api\/dashboard\/all-branches$/, () => mock.branches],
  [/^\/api\/dashboard\/me\/deals$/, () => {
    if (!currentUser) return [];
    return [
      { id: "ud_1", userId: currentUser.id, couponId: "cp_launch", status: "available", assignedBy: "u_admin", assignedAt: "2026-07-01", coupon: { id: "cp_launch", code: "LAUNCH26", discountType: "percentage", discountValue: 26, serviceScope: "all" } },
      { id: "ud_2", userId: currentUser.id, couponId: "cp_hot", status: "available", assignedBy: "u_admin", assignedAt: "2026-07-01", expiresAt: "2026-08-31", coupon: { id: "cp_hot", code: "HOTDESK500", discountType: "flat", discountValue: 500, serviceScope: "membership" } },
    ];
  }],
  [/^\/api\/dashboard\/deals$/, () => []],
  [/^\/api\/dashboard\/coupons$/, () => []],
  [/^\/api\/site-settings$/, () => ({
    heroImages: ["photo-1497366216548-37526070297c", "photo-1556761175-5973dc0f32e7", "photo-1604328698692-f76ea9498e76"],
    clientLogos: [
      { name: "Loop Analytics", logo: "" }, { name: "Cibyl Studios", logo: "" },
      { name: "Northwind Labs", logo: "" }, { name: "OrangeFin", logo: "" },
      { name: "Indigo Code", logo: "" }, { name: "BrewLab", logo: "" },
    ],
  })],
  [/^\/api\/payments\/key$/, () => ({ key: "" })],
  [/^\/api\/payments\/history$/, () => []],
];

const postRoutes: [RegExp, RouteHandler][] = [
  // Dashboard mutations
  [/^\/api\/dashboard\/leads\/([^/]+)\/activities$/, (p, body: any) => ({
    id: `la_mock_${Date.now()}`, leadId: p[0], ...body, createdAt: new Date().toISOString(),
  })],
  [/^\/api\/dashboard\/tasks$/, (_p, body: any) => ({
    id: `tk_mock_${Date.now()}`, ...body,
  })],
  [/^\/api\/dashboard\/visitors$/, (_p, body: any) => ({
    id: `vis_mock_${Date.now()}`, ...body, qrToken: Math.random().toString(36).slice(2, 8).toUpperCase(),
  })],
  [/^\/api\/dashboard\/bookings$/, (_p, body: any) => ({
    id: `bk_mock_${Date.now()}`, ...body, status: "confirmed",
  })],
  [/^\/api\/dashboard\/memberships$/, (_p, body: any) => ({
    id: `mb_mock_${Date.now()}`, ...body, status: "active",
  })],
  [/^\/api\/dashboard\/branches$/, (_p, body: any) => ({
    ...body, id: body.id || `br_mock_${Date.now()}`, slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, "-"),
  })],
  [/^\/api\/dashboard\/plans$/, (_p, body: any) => ({
    ...body, id: body.id || `pl_mock_${Date.now()}`,
  })],
  [/^\/api\/dashboard\/users$/, (_p, body: any) => ({
    id: `u_mock_${Date.now()}`, ...body, referralCode: "NEW", createdAt: new Date().toISOString(),
  })],
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
  [/^\/api\/auth\/forgot-password$/, () => ({ ok: true })],
  [/^\/api\/auth\/reset-password$/, () => ({ ok: true })],
  [/^\/api\/payments\/create-order$/, (_p, body: any) => ({
    orderId: `order_demo_${Date.now()}`, amount: 10000, currency: "INR", paymentId: `pay_mock_${Date.now()}`, demo: true,
  })],
  [/^\/api\/payments\/verify$/, () => ({ verified: true, paymentId: `pay_mock_${Date.now()}` })],
  [/^\/api\/dashboard\/coupons$/, (_p, body: any) => ({ ...body, id: `cp_mock_${Date.now()}`, createdAt: new Date().toISOString() })],
  [/^\/api\/dashboard\/deals$/, (_p, body: any) => ({ created: (body?.userIds?.length ?? 0), deals: [] })],
  [/^\/api\/coupons\/validate$/, (_p, body: any) => ({ valid: false, reason: "Coupon validation requires a live backend." })],
  [/^\/api\/dashboard\/invoices$/, (_p, body: any) => ({
    id: `inv_mock_${Date.now()}`, number: `AZTECH-2026-${String(Date.now()).slice(-4)}`,
    ...body, status: "pending", issuedAt: new Date().toISOString(),
  })],
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
  [/^\/api\/dashboard\/visitors\/([^/]+)\/checkin$/, (p) => ({ id: p[0], checkedInAt: new Date().toISOString() })],
  [/^\/api\/dashboard\/visitors\/([^/]+)\/checkout$/, (p) => ({ id: p[0], checkedOutAt: new Date().toISOString() })],
  [/^\/api\/dashboard\/memberships\/([^/]+)\/cancel$/, (p) => ({ id: p[0], status: "cancelled" })],
  [/^\/api\/dashboard\/branches\/([^/]+)$/, (p, body: any) => ({ id: p[0], ...body })],
  [/^\/api\/dashboard\/plans\/([^/]+)$/, (p, body: any) => ({ id: p[0], ...body })],
  [/^\/api\/dashboard\/users\/([^/]+)$/, (p, body: any) => ({ id: p[0], ...body })],
  [/^\/api\/dashboard\/coupons\/([^/]+)$/, (p, body: any) => ({ id: p[0], ...body })],
  [/^\/api\/dashboard\/site-settings\/hero-images$/, (_p, body: any) => ({ heroImages: body?.heroImages ?? [] })],
  [/^\/api\/dashboard\/site-settings\/client-logos$/, (_p, body: any) => ({ clientLogos: body?.clientLogos ?? [] })],
];

const deleteRoutes: [RegExp, RouteHandler][] = [
  [/^\/api\/dashboard\/plans\/([^/]+)$/, () => ({ ok: true })],
  [/^\/api\/dashboard\/coupons\/([^/]+)$/, () => ({ ok: true })],
  [/^\/api\/dashboard\/deals\/([^/]+)$/, () => ({ ok: true })],
  [/^\/api\/dashboard\/users\/([^/]+)$/, () => ({ ok: true })],
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

export function mockDelete<T>(path: string): T {
  const result = matchRoute(path, deleteRoutes);
  if (result === undefined) return {} as T;
  return result as T;
}

import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import { db } from "../store.js";
import { uid } from "../uid.js";
import { auditLog } from "../audit.js";
import { validateCoupon } from "../coupon-engine.js";
import type { Coupon, UserDeal } from "../types.js";

const router = Router();

// ─── POST /api/coupons/validate ─────────────────
// Authenticated user validates a coupon against a purchase context.

router.post("/validate", requireAuth, (req, res) => {
  const { code, serviceScope, planId, branchId, seatType, subtotal, durationMonths } = req.body;
  const result = validateCoupon(code ?? "", req.session.userId!, {
    serviceScope, planId, branchId, seatType,
    subtotal: Number(subtotal) || 0,
    durationMonths: Number(durationMonths) || 1,
  });
  res.json(result);
});

// ─── GET /api/dashboard/coupons ─────────────────

router.get("/dashboard/coupons", requireAuth, requireRole("super_admin", "marketing"), (_req, res) => {
  const coupons = db.coupons.all();
  const today = new Date().toISOString().slice(0, 10);
  for (const c of coupons) {
    if (c.status === "active" && c.validUntil.slice(0, 10) < today) {
      db.coupons.update(c.id, { status: "expired" });
      c.status = "expired";
    }
  }
  res.json(coupons);
});

// ─── POST /api/dashboard/coupons ────────────────

router.post("/dashboard/coupons", requireAuth, requireRole("super_admin", "marketing"), (req, res) => {
  const user = (req as any)._user;
  const b = req.body;
  const code = (b.code ?? "").trim().toUpperCase();

  if (!code) {
    res.status(400).json({ error: "Coupon code is required" });
    return;
  }

  if (db.coupons.findByCode(code)) {
    res.status(400).json({ error: "A coupon with this code already exists" });
    return;
  }

  const now = new Date().toISOString();
  const coupon: Coupon = {
    id: b.id || uid("cp"),
    code,
    description: (b.description ?? "").trim(),
    discountType: b.discountType ?? "percentage",
    discountValue: Number(b.discountValue) || 0,
    maxDiscountAmount: b.maxDiscountAmount != null && b.maxDiscountAmount !== "" ? Number(b.maxDiscountAmount) : undefined,
    serviceScope: b.serviceScope ?? "all",
    allowedPlanIds: b.allowedPlanIds ?? [],
    allowedBranchIds: b.allowedBranchIds ?? [],
    allowedSeatTypes: b.allowedSeatTypes ?? [],
    minOrderValue: Number(b.minOrderValue) || 0,
    minDurationMonths: Number(b.minDurationMonths) || 0,
    firstPurchaseOnly: !!b.firstPurchaseOnly,
    maxUsesTotal: Number(b.maxUsesTotal) || 0,
    maxUsesPerUser: Number(b.maxUsesPerUser) || 0,
    currentUsesTotal: 0,
    stackable: !!b.stackable,
    isReferralCoupon: !!b.isReferralCoupon,
    validFrom: b.validFrom ?? now,
    validUntil: b.validUntil ?? "2027-12-31",
    status: b.status ?? "active",
    createdBy: user.id,
    createdAt: now,
  };

  db.coupons.insert(coupon);
  db.auditLogs.insert({ userId: user.id, action: "create", entityType: "coupon", entityId: coupon.id, detail: `Created coupon ${code}` });
  res.status(201).json(db.coupons.find(coupon.id));
});

// ─── PATCH /api/dashboard/coupons/:id ───────────

router.patch("/dashboard/coupons/:id", requireAuth, requireRole("super_admin", "marketing"), (req, res) => {
  const user = (req as any)._user;
  const coupon = db.coupons.find(req.params.id);
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }

  const patch = { ...req.body };

  if (patch.code) {
    patch.code = patch.code.trim().toUpperCase();
    const existing = db.coupons.findByCode(patch.code);
    if (existing && existing.id !== req.params.id) {
      res.status(400).json({ error: "A coupon with this code already exists" });
      return;
    }
  }

  delete patch.currentUsesTotal;
  delete patch.createdAt;
  delete patch.createdBy;

  db.coupons.update(req.params.id, patch);
  db.auditLogs.insert({ userId: user.id, action: "update", entityType: "coupon", entityId: req.params.id, detail: "Updated coupon" });
  res.json(db.coupons.find(req.params.id));
});

// ─── DELETE /api/dashboard/coupons/:id ──────────

router.delete("/dashboard/coupons/:id", requireAuth, requireRole("super_admin", "marketing"), (req, res) => {
  const user = (req as any)._user;
  const coupon = db.coupons.find(req.params.id);
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }

  db.coupons.update(req.params.id, { status: "inactive" });
  db.auditLogs.insert({ userId: user.id, action: "delete", entityType: "coupon", entityId: req.params.id, detail: `Deactivated coupon ${coupon.code}` });
  res.json({ ok: true });
});

// ─── GET /api/dashboard/coupons/:id/usages ──────

router.get("/dashboard/coupons/:id/usages", requireAuth, requireRole("super_admin", "marketing", "finance"), (req, res) => {
  const coupon = db.coupons.find(req.params.id);
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }

  const usages = db.couponUsages.byCoupon(req.params.id);
  const enriched = usages.map((u) => {
    const user = db.users.find(u.userId);
    return { ...u, userName: user?.name ?? "Unknown", userEmail: user?.email ?? "" };
  });
  res.json(enriched);
});

// ─── GET /api/dashboard/me/deals ────────────────

router.get("/dashboard/me/deals", requireAuth, (req, res) => {
  const deals = db.userDeals.byUser(req.session.userId!);
  const now = new Date().toISOString();

  // Auto-expire past-due deals & enrich with coupon
  const enriched = deals.map((d) => {
    if (d.status === "available" && d.expiresAt && d.expiresAt < now) {
      d.status = "expired";
      db.userDeals.update(d.id, { status: "expired" });
    }
    return { ...d, coupon: db.coupons.find(d.couponId) };
  });

  // Sort: available first, then used, then expired
  const order: Record<string, number> = { available: 0, used: 1, expired: 2 };
  enriched.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

  res.json(enriched);
});

// ─── GET /api/dashboard/deals ───────────────────

router.get("/dashboard/deals", requireAuth, requireRole("super_admin", "marketing"), (_req, res) => {
  const deals = db.userDeals.all();
  const enriched = deals.map((d) => {
    const coupon = db.coupons.find(d.couponId);
    const user = db.users.find(d.userId);
    return { ...d, coupon, userName: user?.name ?? "Unknown" };
  });
  res.json(enriched);
});

// ─── POST /api/dashboard/deals ──────────────────

router.post("/dashboard/deals", requireAuth, requireRole("super_admin", "marketing"), (req, res) => {
  const user = (req as any)._user;
  const { couponId, userIds, expiresAt } = req.body;

  if (!couponId || !userIds?.length) {
    res.status(400).json({ error: "couponId and userIds are required" });
    return;
  }

  const coupon = db.coupons.find(couponId);
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }

  const now = new Date().toISOString();
  const created: UserDeal[] = [];

  for (const userId of userIds) {
    if (db.userDeals.hasAvailable(userId, couponId)) continue;
    const deal: UserDeal = {
      id: uid("ud"),
      userId,
      couponId,
      status: "available",
      assignedBy: user.id,
      assignedAt: now,
      expiresAt: expiresAt ?? undefined,
    };
    db.userDeals.insert(deal);
    created.push(deal);
  }

  db.auditLogs.insert({ userId: user.id, action: "create", entityType: "user_deal", entityId: couponId, detail: `Assigned deal to ${created.length} user(s)` });
  res.status(201).json({ created: created.length, deals: created });
});

// ─── DELETE /api/dashboard/deals/:id ────────────

router.delete("/dashboard/deals/:id", requireAuth, requireRole("super_admin", "marketing"), (req, res) => {
  const user = (req as any)._user;
  const deal = db.userDeals.find(req.params.id);
  if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

  db.userDeals.update(req.params.id, { status: "expired" });
  db.auditLogs.insert({ userId: user.id, action: "delete", entityType: "user_deal", entityId: req.params.id, detail: "Revoked deal" });
  res.json({ ok: true });
});

export default router;

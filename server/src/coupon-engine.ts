// Coupon validation engine — mirrors server-php/src/CouponEngine.php

import { db } from "./store.js";
import { uid } from "./uid.js";
import type { Coupon } from "./types.js";

interface ValidationContext {
  serviceScope?: string;
  planId?: string;
  branchId?: string;
  seatType?: string;
  subtotal?: number;
  durationMonths?: number;
}

interface ValidationResult {
  valid: boolean;
  couponId?: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  message?: string;
  reason?: string;
}

function fail(reason: string): ValidationResult {
  return { valid: false, reason };
}

function inr(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function validateCoupon(code: string, userId: string, context: ValidationContext): ValidationResult {
  code = code.trim().toUpperCase();
  if (!code) return fail("Coupon code is required.");

  const coupon = db.coupons.findByCode(code);
  if (!coupon) return fail("Invalid coupon code.");
  if (coupon.status !== "active") return fail("This coupon is no longer active.");

  const today = new Date().toISOString().slice(0, 10);
  if (today < coupon.validFrom.slice(0, 10)) return fail("This coupon is not yet valid.");
  if (today > coupon.validUntil.slice(0, 10)) return fail("This coupon has expired.");

  const scope = context.serviceScope ?? "all";
  if (coupon.serviceScope !== "all" && coupon.serviceScope !== scope) {
    const labels: Record<string, string> = { membership: "memberships", meeting_room: "meeting room bookings", day_pass: "day passes" };
    return fail(`This coupon is only valid for ${labels[coupon.serviceScope] ?? coupon.serviceScope}.`);
  }

  if (coupon.allowedPlanIds.length && context.planId && !coupon.allowedPlanIds.includes(context.planId)) {
    return fail("This coupon does not apply to the selected plan.");
  }

  if (coupon.allowedBranchIds.length && context.branchId && !coupon.allowedBranchIds.includes(context.branchId)) {
    return fail("This coupon is not valid at the selected branch.");
  }

  if (coupon.allowedSeatTypes.length && context.seatType && !coupon.allowedSeatTypes.includes(context.seatType)) {
    return fail("This coupon does not apply to this seat type.");
  }

  const subtotal = context.subtotal ?? 0;
  if (coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) {
    return fail(`Minimum order of ${inr(coupon.minOrderValue)} required for this coupon.`);
  }

  const duration = context.durationMonths ?? 1;
  if (coupon.minDurationMonths > 0 && duration < coupon.minDurationMonths) {
    return fail(`This coupon requires a minimum ${coupon.minDurationMonths}-month commitment.`);
  }

  if (coupon.firstPurchaseOnly) {
    const paidCount = (db.raw.query("SELECT COUNT(*) as c FROM invoices WHERE userId = ? AND status = 'paid'", userId) as any[])[0]?.c ?? 0;
    if (paidCount > 0) return fail("This coupon is only valid for first-time purchases.");
  }

  if (coupon.maxUsesTotal > 0 && coupon.currentUsesTotal >= coupon.maxUsesTotal) {
    return fail("This coupon has reached its usage limit.");
  }

  if (coupon.maxUsesPerUser > 0) {
    const userUses = db.couponUsages.countByUser(coupon.id, userId);
    if (userUses >= coupon.maxUsesPerUser) {
      return fail("You have already used this coupon the maximum number of times.");
    }
  }

  if (coupon.discountType === "free_days" && scope !== "membership") {
    return fail("Free day coupons can only be applied to memberships.");
  }

  const discountAmount = calculateDiscount(coupon, subtotal);

  const message =
    coupon.discountType === "percentage" ? `${coupon.discountValue}% off applied! You save ${inr(discountAmount)}.` :
    coupon.discountType === "flat" ? `${inr(coupon.discountValue)} off applied!` :
    coupon.discountType === "free_days" ? `${coupon.discountValue} free days added to your membership!` :
    "Coupon applied!";

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    message,
  };
}

export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === "percentage") {
    let amount = Math.floor(subtotal * coupon.discountValue / 100);
    if (coupon.maxDiscountAmount && amount > coupon.maxDiscountAmount) {
      amount = coupon.maxDiscountAmount;
    }
    return Math.min(amount, subtotal);
  }
  if (coupon.discountType === "flat") {
    return Math.min(coupon.discountValue, subtotal);
  }
  return 0; // free_days has no monetary discount
}

export function recordCouponUsage(couponId: string, userId: string, invoiceId: string, discountAmount: number): void {
  db.couponUsages.insert({
    id: uid("cu"),
    couponId,
    userId,
    invoiceId,
    discountAmount,
    appliedAt: new Date().toISOString(),
  });
  db.coupons.incrementUsage(couponId);
  db.userDeals.markUsed(userId, couponId);
}

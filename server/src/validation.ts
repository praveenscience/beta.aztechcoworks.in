import { z } from "zod";
import type { RequestHandler } from "express";

// ─── Reusable fields ────────────────────────────

const phone = z.string().min(7).max(20);
const email = z.string().email().max(254);

// ─── Auth schemas ───────────────────────────────

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: email,
  password: z.string().min(8).max(128),
  phone: phone.optional(),
});

export const forgotPasswordSchema = z.object({
  email: email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

// ─── Public form schemas ────────────────────────

export const leadCaptureSchema = z.object({
  name: z.string().min(2).max(100),
  email: email,
  phone: phone,
  source: z.enum(["website", "whatsapp", "walk_in", "referral", "corporate"]).default("website"),
  branchId: z.string().max(50).optional(),
  planId: z.string().max(50).optional(),
  teamSize: z.number().int().positive().max(1000).optional(),
  budget: z.number().int().positive().optional(),
  timeline: z.enum(["immediate", "1_month", "3_months", "exploring"]).optional(),
  message: z.string().max(2000).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const siteVisitSchema = z.object({
  name: z.string().min(2).max(100),
  email: email,
  phone: phone.optional(),
  branchId: z.string().min(1).max(50),
  scheduledAt: z.string().optional(),
  mode: z.enum(["self_serve", "request"]).default("self_serve"),
});

// ─── Dashboard schemas ──────────────────────────

export const leadPatchSchema = z.object({
  stage: z.enum(["new", "contacted", "qualified", "site_visit", "proposal", "negotiation", "won", "lost"]).optional(),
  ownerId: z.string().max(50).optional(),
  score: z.number().int().min(0).max(100).optional(),
  lostReason: z.string().max(500).optional(),
  branchId: z.string().max(50).optional(),
  planId: z.string().max(50).optional(),
  teamSize: z.number().int().positive().optional(),
  budget: z.number().int().positive().optional(),
  timeline: z.enum(["immediate", "1_month", "3_months", "exploring"]).optional(),
  message: z.string().max(2000).optional(),
}).strict();

export const taskPatchSchema = z.object({
  done: z.boolean().optional(),
  title: z.string().min(1).max(300).optional(),
  dueAt: z.string().optional(),
  assigneeId: z.string().max(50).optional(),
}).strict();

export const taskCreateSchema = z.object({
  leadId: z.string().max(50).optional(),
  assigneeId: z.string().min(1).max(50),
  title: z.string().min(1).max(300),
  dueAt: z.string(),
  done: z.boolean().default(false),
});

export const leadActivitySchema = z.object({
  type: z.enum(["note", "stage_change", "email", "whatsapp", "call", "task"]),
  description: z.string().min(1).max(2000),
  actorId: z.string().max(50).optional(),
});

export const visitorCreateSchema = z.object({
  hostUserId: z.string().min(1).max(50),
  branchId: z.string().min(1).max(50),
  name: z.string().min(2).max(100),
  phone: phone,
  purpose: z.string().min(1).max(100),
  expectedAt: z.string(),
});

export const bookingCreateSchema = z.object({
  userId: z.string().min(1).max(50),
  branchId: z.string().min(1).max(50),
  resourceType: z.enum(["meeting_room", "day_pass", "subscription"]),
  resourceId: z.string().min(1).max(50),
  startAt: z.string(),
  endAt: z.string(),
  amount: z.number().int().min(0),
});

export const membershipCreateSchema = z.object({
  userId: z.string().min(1).max(50),
  planId: z.string().min(1).max(50),
  branchId: z.string().min(1).max(50),
  seats: z.number().int().min(1).max(500),
  startDate: z.string(),
  endDate: z.string(),
});

export const branchUpsertSchema = z.object({
  id: z.string().max(50).optional(),
  slug: z.string().max(100).optional(),
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  phone: phone,
  hours: z.string().min(2).max(200),
  amenities: z.array(z.string().max(100)),
  totalSeats: z.number().int().min(0),
  availableSeats: z.number().int().min(0),
  isActive: z.boolean().default(true),
  photo: z.string().max(500),
  description: z.string().max(1000),
});

export const planUpsertSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().min(2).max(100),
  seatType: z.enum(["hot_desk", "dedicated", "cabin", "team_office", "enterprise"]),
  basePrice: z.number().int().min(0),
  gstRate: z.number().int().min(0).max(100),
  description: z.string().max(500),
  features: z.array(z.string().max(200)),
});

export const userCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: email,
  role: z.enum(["visitor", "member", "reception", "sales_exec", "sales_manager", "branch_manager", "finance", "marketing", "super_admin"]),
  branchId: z.string().max(50).optional(),
  phone: phone.optional(),
});

export const userPatchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: email.optional(),
  role: z.enum(["visitor", "member", "reception", "sales_exec", "sales_manager", "branch_manager", "finance", "marketing", "super_admin"]).optional(),
  branchId: z.string().max(50).nullable().optional(),
  phone: phone.optional(),
  company: z.string().max(200).nullable().optional(),
}).strict();

// ─── Validation middleware ──────────────────────

export function validate<T extends z.ZodType>(schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!fields[key]) fields[key] = issue.message;
      }
      res.status(400).json({
        error: "Validation failed",
        fields,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

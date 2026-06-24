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

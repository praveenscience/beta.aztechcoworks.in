import { Router, type RequestHandler } from "express";
import { db } from "../store.js";
import { uid } from "../uid.js";
import { validate, leadCaptureSchema, siteVisitSchema } from "../validation.js";
import type { Lead } from "../types.js";

export default function publicRoutes(formLimiter: RequestHandler) {
  const router = Router();

  // ─── Branches (public) ─────────────────────────
  router.get("/branches", (_req, res) => {
    res.json(db.branches.all().filter((b) => b.isActive));
  });

  router.get("/branches/:id", (req, res) => {
    const branch = db.branches.find(req.params.id);
    if (!branch) { res.status(404).json({ error: "Branch not found" }); return; }

    res.json({
      ...branch,
      seatInventory: db.seatInventory.byBranch(branch.id),
      meetingRooms: db.meetingRooms.byBranch(branch.id),
    });
  });

  // ─── Plans (public) ─────────────────────────────
  router.get("/plans", (_req, res) => {
    res.json(db.plans.all());
  });

  // ─── Blog (public) ──────────────────────────────
  router.get("/blog", (_req, res) => {
    res.json(db.blog.all());
  });

  router.get("/blog/:slug", (req, res) => {
    const post = db.blog.find(req.params.slug);
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json(post);
  });

  // ─── Testimonials (public) ──────────────────────
  router.get("/testimonials", (_req, res) => {
    res.json(db.testimonials.all());
  });

  // ─── Lead capture (public — no auth needed) ─────
  router.post("/leads", formLimiter, validate(leadCaptureSchema), (req, res) => {
    const { name, email, phone, source, branchId, planId, teamSize, budget, timeline, message, customFields } = req.body;

    const lead: Lead = {
      id: uid("ld"),
      name, email, phone,
      source: source || "website",
      branchId, planId, teamSize, budget, timeline, message, customFields,
      score: 0,
      stage: "new",
      createdAt: new Date().toISOString(),
    };

    db.leads.insert(lead);
    res.status(201).json(lead);
  });

  // ─── Site visit booking (public) ────────────────
  router.post("/site-visits", formLimiter, validate(siteVisitSchema), (req, res) => {
    const { name, email, phone, branchId, scheduledAt, mode } = req.body;

    // Create a lead for the visit
    const lead: Lead = {
      id: uid("ld"),
      name, email, phone: phone || "",
      source: "website",
      branchId,
      score: 0,
      stage: "site_visit",
      message: `Site visit: ${scheduledAt || "TBD"}`,
      createdAt: new Date().toISOString(),
    };
    db.leads.insert(lead);

    const visit = {
      id: uid("sv"),
      leadId: lead.id,
      branchId,
      scheduledAt: scheduledAt || new Date().toISOString(),
      status: "scheduled" as const,
      mode: mode || "self_serve" as const,
    };
    db.siteVisits.insert(visit);

    res.status(201).json({ lead, visit });
  });

  return router;
}

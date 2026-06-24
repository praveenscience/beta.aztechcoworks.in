import { Router } from "express";
import { requireAuth } from "../auth.js";
import { db } from "../store.js";
import { validate, leadPatchSchema, taskPatchSchema } from "../validation.js";

const router = Router();
router.use(requireAuth);

// Attach user to request after auth check
router.use((req, _res, next) => {
  (req as any)._user = db.users.find(req.session.userId!);
  next();
});

// ─── Current user's data ────────────────────────

router.get("/me/memberships", (req, res) => {
  res.json(db.memberships.byUser(req.session.userId!));
});

router.get("/me/invoices", (req, res) => {
  res.json(db.invoices.byUser(req.session.userId!));
});

router.get("/me/bookings", (req, res) => {
  res.json(db.bookings.byUser(req.session.userId!));
});

// ─── Leads (staff/admin) ────────────────────────

router.get("/leads", (req, res) => {
  const user = (req as any)._user;
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const allLeads = db.leads.all();

  // Sales execs see only their leads, managers/admins see all
  if (user.role === "sales_exec") {
    res.json(allLeads.filter((l) => l.ownerId === user.id));
  } else {
    res.json(allLeads);
  }
});

router.get("/leads/:id", (req, res) => {
  const lead = db.leads.find(req.params.id);
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }

  res.json({
    ...lead,
    activities: db.leadActivities.byLead(lead.id),
  });
});

router.patch("/leads/:id", validate(leadPatchSchema), (req, res) => {
  const lead = db.leads.update(req.params.id, req.body);
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json(lead);
});

// ─── Tasks ──────────────────────────────────────

router.get("/tasks", (req, res) => {
  const user = (req as any)._user;
  const allTasks = db.tasks.all();

  if (["super_admin", "sales_manager", "branch_manager"].includes(user.role)) {
    res.json(allTasks);
  } else {
    res.json(allTasks.filter((t) => t.assigneeId === user.id));
  }
});

router.patch("/tasks/:id", validate(taskPatchSchema), (req, res) => {
  const task = db.tasks.update(req.params.id, req.body);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(task);
});

// ─── Site visits ────────────────────────────────

router.get("/site-visits", (_req, res) => {
  res.json(db.siteVisits.all());
});

// ─── Users (admin) ──────────────────────────────

router.get("/users", (req, res) => {
  const user = (req as any)._user;
  if (!["super_admin", "branch_manager"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  // Strip password hashes
  res.json(db.users.all().map(({ passwordHash, ...u }) => u));
});

// ─── All branches (admin — includes inactive) ───

router.get("/all-branches", (req, res) => {
  const user = (req as any)._user;
  if (user.role !== "super_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(db.branches.all());
});

// ─── Invoices (finance/admin) ───────────────────

router.get("/invoices", (req, res) => {
  const user = (req as any)._user;
  if (!["super_admin", "finance"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(db.invoices.all());
});

// ─── Visitors (reception) ───────────────────────

router.get("/visitors", (_req, res) => {
  res.json(db.visitors.all());
});

export default router;

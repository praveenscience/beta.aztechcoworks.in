import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import { db, hashPassword } from "../store.js";
import { uid } from "../uid.js";
import {
  validate, leadPatchSchema, taskPatchSchema, taskCreateSchema,
  leadActivitySchema, visitorCreateSchema, bookingCreateSchema,
  membershipCreateSchema, branchUpsertSchema, planUpsertSchema,
  userCreateSchema, userPatchSchema,
} from "../validation.js";
import type { User, LeadActivity, Task, Visitor, Booking, Membership, Branch, Plan } from "../types.js";

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

// ─── Lead activities ────────────────────────────

router.post("/leads/:id/activities", validate(leadActivitySchema), (req, res) => {
  const lead = db.leads.find(req.params.id);
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }

  const activity: LeadActivity = {
    id: uid("la"),
    leadId: req.params.id,
    ...req.body,
    actorId: req.body.actorId || req.session.userId,
    createdAt: new Date().toISOString(),
  };
  db.leadActivities.insert(activity);
  res.status(201).json(activity);
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

router.post("/tasks", validate(taskCreateSchema), (req, res) => {
  const task: Task = {
    id: uid("tk"),
    ...req.body,
  };
  db.tasks.insert(task);
  res.status(201).json(task);
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

// ─── Visitors ───────────────────────────────────

router.get("/visitors", (_req, res) => {
  res.json(db.visitors.all());
});

router.post("/visitors", validate(visitorCreateSchema), (req, res) => {
  const visitor: Visitor = {
    id: uid("vis"),
    ...req.body,
    qrToken: uid("qr").slice(3).toUpperCase(),
  };
  db.visitors.insert(visitor);
  res.status(201).json(visitor);
});

router.patch("/visitors/:id/checkin", (req, res) => {
  const visitor = db.visitors.update(req.params.id, { checkedInAt: new Date().toISOString() });
  if (!visitor) { res.status(404).json({ error: "Visitor not found" }); return; }
  res.json(visitor);
});

router.patch("/visitors/:id/checkout", (req, res) => {
  const visitor = db.visitors.update(req.params.id, { checkedOutAt: new Date().toISOString() });
  if (!visitor) { res.status(404).json({ error: "Visitor not found" }); return; }
  res.json(visitor);
});

// ─── Bookings ───────────────────────────────────

router.post("/bookings", validate(bookingCreateSchema), (req, res) => {
  const booking: Booking = {
    id: uid("bk"),
    ...req.body,
    status: "confirmed",
  };
  db.bookings.insert(booking);
  res.status(201).json(booking);
});

// ─── Memberships ────────────────────────────────

router.post("/memberships", validate(membershipCreateSchema), (req, res) => {
  const membership: Membership = {
    id: uid("mb"),
    ...req.body,
    status: "active",
  };
  db.memberships.insert(membership);
  res.status(201).json(membership);
});

router.patch("/memberships/:id/cancel", (req, res) => {
  const membership = db.memberships.update(req.params.id, { status: "cancelled" });
  if (!membership) { res.status(404).json({ error: "Membership not found" }); return; }
  res.json(membership);
});

// ─── Users (admin) ──────────────────────────────

router.get("/users", (req, res) => {
  const user = (req as any)._user;
  if (!["super_admin", "branch_manager"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(db.users.all().map(({ passwordHash, ...u }) => u));
});

router.post("/users", requireRole("super_admin"), validate(userCreateSchema), (req, res) => {
  const { name, email, role, branchId, phone } = req.body;

  if (db.users.findByEmail(email)) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const user: User = {
    id: uid("u"),
    name,
    email,
    phone,
    role,
    branchId,
    referralCode: `${name.split(" ")[0].toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    passwordHash: hashPassword("changeme123"),
    createdAt: new Date().toISOString(),
  };
  db.users.insert(user);
  const { passwordHash: _, ...safe } = user;
  res.status(201).json(safe);
});

router.patch("/users/:id", requireRole("super_admin"), validate(userPatchSchema), (req, res) => {
  const user = db.users.update(req.params.id, req.body);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash, ...safe } = user;
  res.json(safe);
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

router.post("/branches", requireRole("super_admin"), validate(branchUpsertSchema), (req, res) => {
  const data = req.body;
  const branch: Branch = {
    ...data,
    id: data.id || uid("br"),
    slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-"),
  };
  db.branches.insert(branch);
  res.status(201).json(branch);
});

router.patch("/branches/:id", requireRole("super_admin"), (req, res) => {
  const branch = db.branches.update(req.params.id, req.body);
  if (!branch) { res.status(404).json({ error: "Branch not found" }); return; }
  res.json(branch);
});

// ─── Plans (admin) ──────────────────────────────

router.post("/plans", requireRole("super_admin"), validate(planUpsertSchema), (req, res) => {
  const data = req.body;
  const plan: Plan = {
    ...data,
    id: data.id || uid("pl"),
  };
  db.plans.insert(plan);
  res.status(201).json(plan);
});

router.patch("/plans/:id", requireRole("super_admin"), (req, res) => {
  const plan = db.plans.update(req.params.id, req.body);
  if (!plan) { res.status(404).json({ error: "Plan not found" }); return; }
  res.json(plan);
});

router.delete("/plans/:id", requireRole("super_admin"), (req, res) => {
  db.plans.delete(req.params.id);
  res.json({ ok: true });
});

// ─── Meeting rooms (all authenticated) ──────────

router.get("/meeting-rooms", (_req, res) => {
  res.json(db.meetingRooms.all());
});

// ─── Seat inventory (all authenticated) ─────────

router.get("/seat-inventory", (_req, res) => {
  res.json(db.seatInventory.all());
});

// ─── All memberships (admin/manager) ────────────

router.get("/all-memberships", (req, res) => {
  const user = (req as any)._user;
  if (!["super_admin", "branch_manager"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(db.memberships.all());
});

// ─── All bookings (admin/manager) ───────────────

router.get("/all-bookings", (req, res) => {
  const user = (req as any)._user;
  if (!["super_admin", "branch_manager"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(db.bookings.all());
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

export default router;

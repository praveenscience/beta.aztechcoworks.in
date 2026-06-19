/**
 * Aztech Co-Works — Application store.
 * Persisted to localStorage so the demo works across reloads.
 * Replace with a real backend in phase 2 — the shape is stable.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  Branch,
  SeatInventory,
  MeetingRoom,
  Plan,
  Coupon,
  Lead,
  LeadActivity,
  LeadStage,
  Task,
  SiteVisit,
  Membership,
  Booking,
  Invoice,
  Visitor,
  AccessLog,
  Referral,
  FormDefinition,
  WorkflowRule,
  BlogPost,
  Testimonial,
} from "@/types";
import { scoreLead, evaluateWorkflows } from "./engine";
import {
  seedBranches,
  seedSeatInventory,
  seedMeetingRooms,
  seedPlans,
  seedCoupons,
  seedUsers,
  seedLeads,
  seedTasks,
  seedSiteVisits,
  seedMemberships,
  seedInvoices,
  seedForms,
  seedWorkflowRules,
  seedBlog,
  seedTestimonials,
} from "./seed";

// ─── Helpers ─────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

// ─── State shape ─────────────────────────────────

interface StoreData {
  currentUserId: string | null;
  users: User[];
  branches: Branch[];
  seatInventory: SeatInventory[];
  meetingRooms: MeetingRoom[];
  plans: Plan[];
  coupons: Coupon[];
  leads: Lead[];
  leadActivities: LeadActivity[];
  tasks: Task[];
  siteVisits: SiteVisit[];
  memberships: Membership[];
  bookings: Booking[];
  invoices: Invoice[];
  visitors: Visitor[];
  accessLogs: AccessLog[];
  referrals: Referral[];
  forms: FormDefinition[];
  workflowRules: WorkflowRule[];
  blog: BlogPost[];
  testimonials: Testimonial[];
}

interface StoreActions {
  signIn: (userId: string) => void;
  signOut: () => void;
  upsertUser: (u: User) => void;
  addLead: (lead: Omit<Lead, "id" | "score" | "stage" | "createdAt">) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  moveLeadStage: (id: string, stage: LeadStage) => void;
  addLeadActivity: (a: Omit<LeadActivity, "id" | "createdAt">) => void;
  addTask: (t: Omit<Task, "id">) => void;
  toggleTask: (id: string) => void;
  bookSiteVisit: (visit: Omit<SiteVisit, "id" | "status">) => SiteVisit;
  createBooking: (b: Omit<Booking, "id" | "status">) => Booking;
  createMembership: (m: Omit<Membership, "id" | "status">) => Membership;
  cancelMembership: (id: string) => void;
  addVisitor: (v: Omit<Visitor, "id" | "qrToken">) => Visitor;
  checkInVisitor: (id: string) => void;
  checkOutVisitor: (id: string) => void;
  upsertBranch: (b: Branch) => void;
  archiveBranch: (id: string) => void;
  upsertPlan: (p: Plan) => void;
  deletePlan: (id: string) => void;
  upsertCoupon: (c: Coupon) => void;
  deleteCoupon: (code: string) => void;
  upsertWorkflow: (w: WorkflowRule) => void;
  upsertForm: (f: FormDefinition) => void;
  upsertBlog: (b: BlogPost) => void;
  resetDemo: () => void;
}

type Store = StoreData & StoreActions;

function initialData(): StoreData {
  return {
    currentUserId: null,
    users: seedUsers,
    branches: seedBranches,
    seatInventory: seedSeatInventory,
    meetingRooms: seedMeetingRooms,
    plans: seedPlans,
    coupons: seedCoupons,
    leads: seedLeads,
    leadActivities: [],
    tasks: seedTasks,
    siteVisits: seedSiteVisits,
    memberships: seedMemberships,
    bookings: [],
    invoices: seedInvoices,
    visitors: [],
    accessLogs: [],
    referrals: [],
    forms: seedForms,
    workflowRules: seedWorkflowRules,
    blog: seedBlog,
    testimonials: seedTestimonials,
  };
}

// ─── Generic upsert helper ───────────────────────

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  return idx >= 0
    ? list.map((x, i) => (i === idx ? item : x))
    : [...list, item];
}

// ─── Store ───────────────────────────────────────

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData(),

      // Auth
      signIn: (userId) => set({ currentUserId: userId }),
      signOut: () => set({ currentUserId: null }),

      // Users
      upsertUser: (u) => set((s) => ({ users: upsert(s.users, u) })),

      // Leads
      addLead: (input) => {
        const lead: Lead = {
          ...input,
          id: `ld_${uid()}`,
          score: scoreLead(input),
          stage: "new",
          createdAt: now(),
        };

        const wf = evaluateWorkflows(lead, get().workflowRules);
        if (wf.ownerId) lead.ownerId = wf.ownerId;

        const newTasks: Task[] = wf.tasks.map((t) => ({ ...t, id: `tk_${uid()}` }));
        const newActivities: LeadActivity[] = wf.activities.map((a) => ({
          ...a,
          id: `la_${uid()}`,
          createdAt: now(),
        }));

        set((s) => ({
          leads: [lead, ...s.leads],
          tasks: [...newTasks, ...s.tasks],
          leadActivities: [...newActivities, ...s.leadActivities],
        }));
        return lead;
      },

      updateLead: (id, patch) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

      moveLeadStage: (id, stage) =>
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)),
          leadActivities: [
            { id: `la_${uid()}`, leadId: id, type: "stage_change", description: `Moved to ${stage.replace("_", " ")}`, createdAt: now() },
            ...s.leadActivities,
          ],
        })),

      addLeadActivity: (a) =>
        set((s) => ({
          leadActivities: [{ ...a, id: `la_${uid()}`, createdAt: now() }, ...s.leadActivities],
        })),

      // Tasks
      addTask: (t) =>
        set((s) => ({ tasks: [{ ...t, id: `tk_${uid()}` }, ...s.tasks] })),

      toggleTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),

      // Site Visits
      bookSiteVisit: (visit) => {
        const sv: SiteVisit = { ...visit, id: `sv_${uid()}`, status: "scheduled" };
        set((s) => ({ siteVisits: [sv, ...s.siteVisits] }));
        return sv;
      },

      // Bookings
      createBooking: (b) => {
        const booking: Booking = { ...b, id: `bk_${uid()}`, status: "confirmed" };
        const inv: Invoice = {
          id: `inv_${uid()}`,
          number: `AZTECH-2026-${String(get().invoices.length + 100).padStart(4, "0")}`,
          userId: b.userId,
          bookingId: booking.id,
          subtotal: b.amount,
          gst: Math.round(b.amount * 0.18),
          total: Math.round(b.amount * 1.18),
          status: "paid",
          issuedAt: now(),
        };
        set((s) => ({ bookings: [booking, ...s.bookings], invoices: [inv, ...s.invoices] }));
        return booking;
      },

      // Memberships
      createMembership: (m) => {
        const mem: Membership = { ...m, id: `mb_${uid()}`, status: "active" };
        const plan = get().plans.find((p) => p.id === m.planId);
        const subtotal = plan ? plan.basePrice * m.seats : 0;
        const gst = plan ? Math.round(subtotal * (plan.gstRate / 100)) : 0;
        const inv: Invoice = {
          id: `inv_${uid()}`,
          number: `AZTECH-2026-${String(get().invoices.length + 100).padStart(4, "0")}`,
          userId: m.userId,
          membershipId: mem.id,
          subtotal,
          gst,
          total: subtotal + gst,
          status: "paid",
          issuedAt: now(),
        };
        set((s) => ({ memberships: [mem, ...s.memberships], invoices: [inv, ...s.invoices] }));
        return mem;
      },

      cancelMembership: (id) =>
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.id === id ? { ...m, status: "cancelled" as const } : m,
          ),
        })),

      // Visitors
      addVisitor: (v) => {
        const visitor: Visitor = { ...v, id: `vis_${uid()}`, qrToken: uid().toUpperCase() };
        set((s) => ({ visitors: [visitor, ...s.visitors] }));
        return visitor;
      },

      checkInVisitor: (id) =>
        set((s) => ({
          visitors: s.visitors.map((v) => (v.id === id ? { ...v, checkedInAt: now() } : v)),
          accessLogs: [
            { id: `al_${uid()}`, subjectType: "visitor", subjectId: id, branchId: s.visitors.find((v) => v.id === id)?.branchId ?? "", direction: "in", at: now() },
            ...s.accessLogs,
          ],
        })),

      checkOutVisitor: (id) =>
        set((s) => ({
          visitors: s.visitors.map((v) => (v.id === id ? { ...v, checkedOutAt: now() } : v)),
          accessLogs: [
            { id: `al_${uid()}`, subjectType: "visitor", subjectId: id, branchId: s.visitors.find((v) => v.id === id)?.branchId ?? "", direction: "out", at: now() },
            ...s.accessLogs,
          ],
        })),

      // Admin: Branches
      upsertBranch: (b) => set((s) => ({ branches: upsert(s.branches, b) })),
      archiveBranch: (id) =>
        set((s) => ({ branches: s.branches.map((b) => (b.id === id ? { ...b, isActive: false } : b)) })),

      // Admin: Plans & Coupons
      upsertPlan: (p) => set((s) => ({ plans: upsert(s.plans, p) })),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      upsertCoupon: (c) =>
        set((s) => ({
          coupons: s.coupons.find((x) => x.code === c.code)
            ? s.coupons.map((x) => (x.code === c.code ? c : x))
            : [...s.coupons, c],
        })),
      deleteCoupon: (code) => set((s) => ({ coupons: s.coupons.filter((c) => c.code !== code) })),

      // Admin: Workflows, Forms, Blog
      upsertWorkflow: (w) => set((s) => ({ workflowRules: upsert(s.workflowRules, w) })),
      upsertForm: (f) =>
        set((s) => ({ forms: s.forms.map((x) => (x.key === f.key ? f : x)) })),
      upsertBlog: (b) => set((s) => ({ blog: upsert(s.blog, b) })),

      // Reset
      resetDemo: () => set(initialData()),
    }),
    { name: "aztech-coworks-v1", version: 1 },
  ),
);

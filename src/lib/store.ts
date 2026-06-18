/**
 * In-memory mock data store for Aztech Co-Works.
 * Persisted to localStorage so the demo is "alive" across reloads.
 * Replace with a real backend (Lovable Cloud / Supabase) in phase 2 — the shape is stable.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role =
  | "visitor"
  | "member"
  | "reception"
  | "sales_exec"
  | "sales_manager"
  | "branch_manager"
  | "finance"
  | "marketing"
  | "super_admin";

export type SeatType = "hot_desk" | "dedicated" | "cabin" | "team_office";
export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "site_visit"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: Role;
  branchId?: string;
  referralCode: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  amenities: string[];
  totalSeats: number;
  availableSeats: number;
  isActive: boolean;
  photo: string;
  description: string;
}

export interface SeatInventory {
  branchId: string;
  type: SeatType;
  total: number;
  available: number;
  monthlyPrice: number;
}

export interface MeetingRoom {
  id: string;
  branchId: string;
  name: string;
  capacity: number;
  hourlyPrice: number;
}

export interface Plan {
  id: string;
  name: string;
  seatType: SeatType;
  basePrice: number;
  gstRate: number;
  description: string;
  features: string[];
}

export interface Coupon {
  code: string;
  discountPct: number;
  validUntil: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: "website" | "whatsapp" | "walk_in" | "referral" | "corporate";
  branchId?: string;
  planId?: string;
  teamSize?: number;
  budget?: number;
  timeline?: "immediate" | "1_month" | "3_months" | "exploring";
  message?: string;
  score: number;
  stage: LeadStage;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
  lostReason?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: "note" | "stage_change" | "email" | "whatsapp" | "call" | "task";
  description: string;
  actorId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  leadId?: string;
  assigneeId: string;
  title: string;
  dueAt: string;
  done: boolean;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  branchId: string;
  scheduledAt: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  mode: "self_serve" | "request";
}

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  branchId: string;
  seats: number;
  status: "active" | "cancelled" | "pending";
  startDate: string;
  endDate: string;
}

export interface Booking {
  id: string;
  userId: string;
  branchId: string;
  resourceType: "meeting_room" | "day_pass" | "subscription";
  resourceId: string;
  startAt: string;
  endAt: string;
  amount: number;
  status: "confirmed" | "cancelled" | "completed";
}

export interface Invoice {
  id: string;
  number: string;
  userId: string;
  bookingId?: string;
  membershipId?: string;
  subtotal: number;
  gst: number;
  total: number;
  status: "paid" | "pending" | "refunded";
  issuedAt: string;
}

export interface Visitor {
  id: string;
  hostUserId: string;
  branchId: string;
  name: string;
  phone: string;
  purpose: string;
  qrToken: string;
  expectedAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface AccessLog {
  id: string;
  subjectType: "member" | "visitor";
  subjectId: string;
  branchId: string;
  direction: "in" | "out";
  at: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredLeadId: string;
  status: "pending" | "converted" | "rewarded";
  rewardAmount: number;
}

export interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "select" | "textarea" | "date";
  required: boolean;
  options?: string[];
}

export interface FormDefinition {
  key: "lead" | "corporate";
  fields: FormField[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: "lead_created" | "stage_changed" | "site_visit_scheduled";
  conditions: { field: string; op: "eq" | "gt" | "lt"; value: string | number }[];
  actions: {
    type: "assign_owner" | "create_task" | "send_email" | "change_stage" | "whatsapp_cta";
    payload: Record<string, unknown>;
  }[];
  isActive: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  publishedAt: string;
  author: string;
  tags: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  quote: string;
  avatar: string;
}

interface State {
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

  // actions
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
  deleteCoupon: (code: string) => void;
  upsertCoupon: (c: Coupon) => void;
  upsertWorkflow: (w: WorkflowRule) => void;
  upsertForm: (f: FormDefinition) => void;
  upsertBlog: (b: BlogPost) => void;
  resetDemo: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

function scoreLead(l: Pick<Lead, "teamSize" | "budget" | "timeline" | "branchId">): number {
  let s = 30;
  if (l.teamSize) s += Math.min(l.teamSize * 2, 25);
  if (l.budget) s += Math.min(Math.round(l.budget / 5000), 25);
  if (l.timeline === "immediate") s += 20;
  else if (l.timeline === "1_month") s += 12;
  else if (l.timeline === "3_months") s += 6;
  if (l.branchId) s += 5;
  return Math.min(s, 100);
}

const branchSeed = (
  id: string,
  slug: string,
  name: string,
  area: string,
  photo: string,
  total: number,
  available: number,
): Branch => ({
  id,
  slug,
  name,
  address: `${area}, Coimbatore, Tamil Nadu`,
  city: "Coimbatore",
  phone: "+91 90000 00000",
  hours: "Mon–Sat · 8:00 AM – 10:00 PM",
  amenities: [
    "High-speed Wi-Fi (1 Gbps)",
    "Power backup",
    "Cafeteria",
    "Premium coffee",
    "Meeting rooms",
    "24/7 access",
    "Reception & mail handling",
    "Printing & scanning",
    "Phone booths",
    "Lockers",
  ],
  totalSeats: total,
  availableSeats: available,
  isActive: true,
  photo,
  description: `A premium Aztech Co-Works branch in ${area} designed for focused work, collaboration, and growth. Built for founders, freelancers, and growing teams.`,
});

function seed(): Omit<State, keyof StateActions> {
  const branches: Branch[] = [
    branchSeed(
      "br_rs",
      "rs-puram",
      "Aztech R.S. Puram",
      "R.S. Puram",
      "photo-1497366216548-37526070297c",
      240,
      80,
    ),
    branchSeed(
      "br_pn",
      "peelamedu",
      "Aztech Peelamedu",
      "Peelamedu",
      "photo-1497366754035-f200968a6e72",
      240,
      75,
    ),
    branchSeed(
      "br_ga",
      "gandhipuram",
      "Aztech Gandhipuram",
      "Gandhipuram",
      "photo-1556761175-5973dc0f32e7",
      240,
      90,
    ),
    branchSeed(
      "br_sg",
      "saravanampatti",
      "Aztech Saravanampatti",
      "Saravanampatti (IT Corridor)",
      "photo-1604328698692-f76ea9498e76",
      240,
      85,
    ),
    branchSeed(
      "br_av",
      "avinashi-road",
      "Aztech Avinashi Road",
      "Avinashi Road",
      "photo-1568992687947-868a62a9f521",
      240,
      70,
    ),
  ];

  const seatInventory: SeatInventory[] = branches.flatMap((b) => [
    { branchId: b.id, type: "hot_desk", total: 80, available: 30, monthlyPrice: 6500 },
    { branchId: b.id, type: "dedicated", total: 90, available: 25, monthlyPrice: 8500 },
    { branchId: b.id, type: "cabin", total: 40, available: 15, monthlyPrice: 18000 },
    { branchId: b.id, type: "team_office", total: 30, available: 10, monthlyPrice: 45000 },
  ]);

  const meetingRooms: MeetingRoom[] = branches.flatMap((b, i) => [
    { id: `mr_${i}_a`, branchId: b.id, name: "Boardroom A", capacity: 12, hourlyPrice: 800 },
    { id: `mr_${i}_b`, branchId: b.id, name: "Huddle Room", capacity: 4, hourlyPrice: 400 },
    { id: `mr_${i}_c`, branchId: b.id, name: "Conference Hall", capacity: 24, hourlyPrice: 1500 },
  ]);

  const plans: Plan[] = [
    {
      id: "pl_hot",
      name: "Hot Desk",
      seatType: "hot_desk",
      basePrice: 6500,
      gstRate: 18,
      description: "Flexible desks, any branch, available daily.",
      features: ["Any open desk", "All amenities", "Meeting room credits (4 hrs/mo)", "Community access"],
    },
    {
      id: "pl_ded",
      name: "Dedicated Desk",
      seatType: "dedicated",
      basePrice: 8500,
      gstRate: 18,
      description: "Your own desk, 24/7 access, locker included.",
      features: ["Reserved desk", "24/7 access", "Lockable storage", "Meeting room credits (8 hrs/mo)"],
    },
    {
      id: "pl_cab",
      name: "Private Cabin",
      seatType: "cabin",
      basePrice: 18000,
      gstRate: 18,
      description: "Lockable private cabin for individuals or pairs.",
      features: ["Lockable cabin", "2 desks", "Premium chairs", "Meeting room credits (16 hrs/mo)"],
    },
    {
      id: "pl_team",
      name: "Team Office",
      seatType: "team_office",
      basePrice: 45000,
      gstRate: 18,
      description: "Private office for 4–20 person teams. Fully managed.",
      features: ["Custom build-out", "Dedicated reception", "Unlimited meeting rooms", "Enterprise SLAs"],
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: "t1",
      name: "Karthik Subramaniam",
      company: "Loop Analytics",
      role: "Founder & CEO",
      quote:
        "Aztech let us scale from 3 to 22 people without ever moving offices. The Peelamedu branch is our HQ now.",
      avatar: "photo-1500648767791-00dcc994a43e",
    },
    {
      id: "t2",
      name: "Anjali Menon",
      company: "Cibyl Studios",
      role: "Design Lead",
      quote: "The community is real. We've hired two engineers from coffee chats in the lounge.",
      avatar: "photo-1438761681033-6461ffad8d80",
    },
    {
      id: "t3",
      name: "Vignesh Raghavan",
      company: "Northwind Labs",
      role: "CTO",
      quote: "Best workspace in Coimbatore, hands down. The Wi-Fi alone is worth it.",
      avatar: "photo-1472099645785-5658abf4ff4e",
    },
  ];

  const blog: BlogPost[] = [
    {
      id: "bp1",
      slug: "best-coworking-space-in-coimbatore",
      title: "The Best Coworking Space in Coimbatore (2026 Guide)",
      excerpt:
        "A founder's guide to picking a workspace in Coimbatore — branches, amenities, pricing, and what actually matters.",
      body: "Coimbatore's tech corridor has exploded over the last 36 months...",
      cover: "photo-1497366216548-37526070297c",
      publishedAt: "2026-05-22",
      author: "Aztech Editorial",
      tags: ["coimbatore", "coworking", "guide"],
    },
    {
      id: "bp2",
      slug: "office-space-vs-coworking",
      title: "Office Space vs Coworking: What's right for your startup?",
      excerpt: "A break-even calculation, plus the soft factors most founders miss.",
      body: "When you cross 8 people, the math changes...",
      cover: "photo-1604328698692-f76ea9498e76",
      publishedAt: "2026-05-08",
      author: "Aztech Editorial",
      tags: ["startups", "decisions"],
    },
    {
      id: "bp3",
      slug: "startup-workspace-guide",
      title: "The Startup Workspace Guide: From founders to seed to Series A",
      excerpt: "How your workspace needs change as you grow — and how to plan ahead.",
      body: "Every stage has different workspace needs...",
      cover: "photo-1568992687947-868a62a9f521",
      publishedAt: "2026-04-19",
      author: "Aztech Editorial",
      tags: ["startups", "growth"],
    },
  ];

  const demoUsers: User[] = [
    {
      id: "u_super",
      name: "Aarav Kumar",
      email: "admin@aztechcoworks.in",
      phone: "+91 90000 11111",
      role: "super_admin",
      referralCode: "AARAV-VIP",
      createdAt: now(),
    },
    {
      id: "u_sales",
      name: "Divya Iyer",
      email: "sales@aztechcoworks.in",
      role: "sales_exec",
      referralCode: "DIVYA-100",
      createdAt: now(),
    },
    {
      id: "u_smgr",
      name: "Rohit Pillai",
      email: "salesmgr@aztechcoworks.in",
      role: "sales_manager",
      referralCode: "ROHIT-200",
      createdAt: now(),
    },
    {
      id: "u_rec",
      name: "Meera Sundar",
      email: "reception@aztechcoworks.in",
      role: "reception",
      branchId: "br_rs",
      referralCode: "MEERA-300",
      createdAt: now(),
    },
    {
      id: "u_brm",
      name: "Karthik Raja",
      email: "branchmgr@aztechcoworks.in",
      role: "branch_manager",
      branchId: "br_rs",
      referralCode: "KARTHIK-400",
      createdAt: now(),
    },
    {
      id: "u_fin",
      name: "Sneha Nair",
      email: "finance@aztechcoworks.in",
      role: "finance",
      referralCode: "SNEHA-500",
      createdAt: now(),
    },
    {
      id: "u_mkt",
      name: "Vikram Joshi",
      email: "marketing@aztechcoworks.in",
      role: "marketing",
      referralCode: "VIKRAM-600",
      createdAt: now(),
    },
    {
      id: "u_member",
      name: "Anjali Menon",
      email: "anjali@cibylstudios.com",
      phone: "+91 98765 43210",
      company: "Cibyl Studios",
      role: "member",
      branchId: "br_pn",
      referralCode: "ANJALI-CW",
      createdAt: now(),
    },
  ];

  const leads: Lead[] = [
    {
      id: "ld1",
      name: "Suresh Babu",
      email: "suresh@orangefin.in",
      phone: "+91 99887 76655",
      source: "website",
      branchId: "br_sg",
      planId: "pl_team",
      teamSize: 12,
      budget: 60000,
      timeline: "1_month",
      message: "Looking for a team office for our fintech.",
      score: 86,
      stage: "qualified",
      ownerId: "u_sales",
      createdAt: now(),
    },
    {
      id: "ld2",
      name: "Priya Ramesh",
      email: "priya@studiokin.co",
      phone: "+91 90000 23456",
      source: "website",
      branchId: "br_rs",
      planId: "pl_ded",
      teamSize: 3,
      budget: 25000,
      timeline: "immediate",
      score: 78,
      stage: "site_visit",
      ownerId: "u_sales",
      createdAt: now(),
    },
    {
      id: "ld3",
      name: "Manoj K",
      email: "manoj@indigocode.dev",
      phone: "+91 90000 99887",
      source: "whatsapp",
      branchId: "br_pn",
      planId: "pl_hot",
      teamSize: 1,
      budget: 7000,
      timeline: "immediate",
      score: 64,
      stage: "new",
      createdAt: now(),
    },
    {
      id: "ld4",
      name: "Rahul Verma",
      email: "rahul@northwindlabs.io",
      phone: "+91 98800 11223",
      source: "corporate",
      branchId: "br_av",
      planId: "pl_team",
      teamSize: 20,
      budget: 120000,
      timeline: "3_months",
      score: 92,
      stage: "proposal",
      ownerId: "u_sales",
      createdAt: now(),
    },
    {
      id: "ld5",
      name: "Lakshmi P",
      email: "lakshmi@brewlab.in",
      phone: "+91 99000 22334",
      source: "referral",
      branchId: "br_ga",
      planId: "pl_cab",
      teamSize: 2,
      budget: 18000,
      timeline: "exploring",
      score: 55,
      stage: "contacted",
      ownerId: "u_sales",
      createdAt: now(),
    },
    {
      id: "ld6",
      name: "Sandeep V",
      email: "sandeep@noveltech.co",
      phone: "+91 88990 22334",
      source: "website",
      branchId: "br_rs",
      planId: "pl_ded",
      teamSize: 4,
      budget: 30000,
      timeline: "1_month",
      score: 70,
      stage: "won",
      ownerId: "u_sales",
      createdAt: now(),
    },
    {
      id: "ld7",
      name: "Anita Rao",
      email: "anita@mintkernel.dev",
      phone: "+91 88990 99887",
      source: "website",
      branchId: "br_pn",
      teamSize: 6,
      budget: 35000,
      timeline: "exploring",
      score: 45,
      stage: "lost",
      ownerId: "u_sales",
      lostReason: "Went with competitor",
      createdAt: now(),
    },
  ];

  const memberships: Membership[] = [
    {
      id: "mb1",
      userId: "u_member",
      planId: "pl_ded",
      branchId: "br_pn",
      seats: 1,
      status: "active",
      startDate: "2026-01-15",
      endDate: "2026-07-15",
    },
  ];

  const invoices: Invoice[] = [
    {
      id: "inv1",
      number: "AZTECH-2026-0001",
      userId: "u_member",
      membershipId: "mb1",
      subtotal: 8500,
      gst: 1530,
      total: 10030,
      status: "paid",
      issuedAt: "2026-06-01",
    },
    {
      id: "inv2",
      number: "AZTECH-2026-0002",
      userId: "u_member",
      membershipId: "mb1",
      subtotal: 8500,
      gst: 1530,
      total: 10030,
      status: "paid",
      issuedAt: "2026-05-01",
    },
  ];

  const forms: FormDefinition[] = [
    {
      key: "lead",
      fields: [
        { key: "name", label: "Full name", type: "text", required: true },
        { key: "email", label: "Work email", type: "email", required: true },
        { key: "phone", label: "Phone (WhatsApp)", type: "phone", required: true },
        {
          key: "branchId",
          label: "Preferred branch",
          type: "select",
          required: false,
          options: ["br_rs", "br_pn", "br_ga", "br_sg", "br_av"],
        },
        {
          key: "planId",
          label: "Workspace type",
          type: "select",
          required: false,
          options: ["pl_hot", "pl_ded", "pl_cab", "pl_team"],
        },
        { key: "teamSize", label: "Team size", type: "number", required: false },
        { key: "message", label: "Anything else?", type: "textarea", required: false },
      ],
    },
    {
      key: "corporate",
      fields: [
        { key: "name", label: "Contact name", type: "text", required: true },
        { key: "company", label: "Company", type: "text", required: true },
        { key: "email", label: "Work email", type: "email", required: true },
        { key: "phone", label: "Phone", type: "phone", required: true },
        { key: "teamSize", label: "Team size", type: "number", required: true },
        {
          key: "timeline",
          label: "When do you want to move in?",
          type: "select",
          required: true,
          options: ["immediate", "1_month", "3_months", "exploring"],
        },
        { key: "message", label: "Requirements", type: "textarea", required: false },
      ],
    },
  ];

  const workflowRules: WorkflowRule[] = [
    {
      id: "wf1",
      name: "Auto-assign new leads",
      trigger: "lead_created",
      conditions: [],
      actions: [
        { type: "assign_owner", payload: { userId: "u_sales" } },
        { type: "create_task", payload: { dueInDays: 1, title: "Call new lead" } },
        { type: "whatsapp_cta", payload: { template: "intro" } },
      ],
      isActive: true,
    },
    {
      id: "wf2",
      name: "High-intent lead alert",
      trigger: "lead_created",
      conditions: [{ field: "budget", op: "gt", value: 50000 }],
      actions: [
        { type: "send_email", payload: { to: "salesmgr@aztechcoworks.in", template: "hot_lead" } },
      ],
      isActive: true,
    },
  ];

  const tasks: Task[] = [
    {
      id: "tk1",
      leadId: "ld1",
      assigneeId: "u_sales",
      title: "Send proposal to Suresh",
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      done: false,
    },
    {
      id: "tk2",
      leadId: "ld2",
      assigneeId: "u_sales",
      title: "Confirm site visit slot",
      dueAt: new Date(Date.now() + 3600000 * 4).toISOString(),
      done: false,
    },
    {
      id: "tk3",
      leadId: "ld4",
      assigneeId: "u_sales",
      title: "Follow up on negotiation",
      dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      done: false,
    },
  ];

  const siteVisits: SiteVisit[] = [
    {
      id: "sv1",
      leadId: "ld2",
      branchId: "br_rs",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      status: "scheduled",
      mode: "self_serve",
    },
  ];

  return {
    currentUserId: null,
    users: demoUsers,
    branches,
    seatInventory,
    meetingRooms,
    plans,
    coupons: [{ code: "LAUNCH26", discountPct: 15, validUntil: "2026-12-31" }],
    leads,
    leadActivities: [],
    tasks,
    siteVisits,
    memberships,
    bookings: [],
    invoices,
    visitors: [],
    accessLogs: [],
    referrals: [],
    forms,
    workflowRules,
    blog,
    testimonials,
  };
}

type StateActions = Pick<
  State,
  | "signIn"
  | "signOut"
  | "upsertUser"
  | "addLead"
  | "updateLead"
  | "moveLeadStage"
  | "addLeadActivity"
  | "addTask"
  | "toggleTask"
  | "bookSiteVisit"
  | "createBooking"
  | "createMembership"
  | "cancelMembership"
  | "addVisitor"
  | "checkInVisitor"
  | "checkOutVisitor"
  | "upsertBranch"
  | "archiveBranch"
  | "upsertPlan"
  | "deletePlan"
  | "deleteCoupon"
  | "upsertCoupon"
  | "upsertWorkflow"
  | "upsertForm"
  | "upsertBlog"
  | "resetDemo"
>;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),
      signIn: (userId) => set({ currentUserId: userId }),
      signOut: () => set({ currentUserId: null }),
      upsertUser: (u) =>
        set((s) => {
          const exists = s.users.find((x) => x.id === u.id);
          return { users: exists ? s.users.map((x) => (x.id === u.id ? u : x)) : [...s.users, u] };
        }),
      addLead: (lead) => {
        const newLead: Lead = {
          ...lead,
          id: `ld_${uid()}`,
          score: scoreLead(lead),
          stage: "new",
          createdAt: now(),
        };
        const rules = get().workflowRules.filter((r) => r.isActive && r.trigger === "lead_created");
        let owner: string | undefined;
        const newTasks: Task[] = [];
        const activities: LeadActivity[] = [];
        for (const rule of rules) {
          const pass = rule.conditions.every((c) => {
            const v = (newLead as unknown as Record<string, unknown>)[c.field];
            if (c.op === "eq") return v === c.value;
            if (c.op === "gt") return typeof v === "number" && v > Number(c.value);
            if (c.op === "lt") return typeof v === "number" && v < Number(c.value);
            return true;
          });
          if (!pass) continue;
          for (const a of rule.actions) {
            if (a.type === "assign_owner") owner = String(a.payload.userId);
            if (a.type === "create_task")
              newTasks.push({
                id: `tk_${uid()}`,
                leadId: newLead.id,
                assigneeId: owner ?? "u_sales",
                title: String(a.payload.title ?? "Follow up"),
                dueAt: new Date(
                  Date.now() + Number(a.payload.dueInDays ?? 1) * 86400000,
                ).toISOString(),
                done: false,
              });
            activities.push({
              id: `la_${uid()}`,
              leadId: newLead.id,
              type: a.type === "send_email" ? "email" : a.type === "whatsapp_cta" ? "whatsapp" : "note",
              description: `Workflow "${rule.name}" → ${a.type}`,
              createdAt: now(),
            });
          }
        }
        if (owner) newLead.ownerId = owner;
        set((s) => ({
          leads: [newLead, ...s.leads],
          tasks: [...newTasks, ...s.tasks],
          leadActivities: [...activities, ...s.leadActivities],
        }));
        return newLead;
      },
      updateLead: (id, patch) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      moveLeadStage: (id, stage) =>
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)),
          leadActivities: [
            {
              id: `la_${uid()}`,
              leadId: id,
              type: "stage_change",
              description: `Moved to ${stage.replace("_", " ")}`,
              createdAt: now(),
            },
            ...s.leadActivities,
          ],
        })),
      addLeadActivity: (a) =>
        set((s) => ({
          leadActivities: [{ ...a, id: `la_${uid()}`, createdAt: now() }, ...s.leadActivities],
        })),
      addTask: (t) => set((s) => ({ tasks: [{ ...t, id: `tk_${uid()}` }, ...s.tasks] })),
      toggleTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      bookSiteVisit: (visit) => {
        const sv: SiteVisit = { ...visit, id: `sv_${uid()}`, status: "scheduled" };
        set((s) => ({ siteVisits: [sv, ...s.siteVisits] }));
        return sv;
      },
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
      createMembership: (m) => {
        const mem: Membership = { ...m, id: `mb_${uid()}`, status: "active" };
        const inv: Invoice = {
          id: `inv_${uid()}`,
          number: `AZTECH-2026-${String(get().invoices.length + 100).padStart(4, "0")}`,
          userId: m.userId,
          membershipId: mem.id,
          subtotal: 0,
          gst: 0,
          total: 0,
          status: "paid",
          issuedAt: now(),
        };
        const plan = get().plans.find((p) => p.id === m.planId);
        if (plan) {
          inv.subtotal = plan.basePrice * m.seats;
          inv.gst = Math.round(inv.subtotal * (plan.gstRate / 100));
          inv.total = inv.subtotal + inv.gst;
        }
        set((s) => ({ memberships: [mem, ...s.memberships], invoices: [inv, ...s.invoices] }));
        return mem;
      },
      cancelMembership: (id) =>
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.id === id ? { ...m, status: "cancelled" as const } : m,
          ),
        })),
      addVisitor: (v) => {
        const visitor: Visitor = { ...v, id: `vis_${uid()}`, qrToken: uid().toUpperCase() };
        set((s) => ({ visitors: [visitor, ...s.visitors] }));
        return visitor;
      },
      checkInVisitor: (id) =>
        set((s) => ({
          visitors: s.visitors.map((v) => (v.id === id ? { ...v, checkedInAt: now() } : v)),
          accessLogs: [
            {
              id: `al_${uid()}`,
              subjectType: "visitor",
              subjectId: id,
              branchId: s.visitors.find((v) => v.id === id)?.branchId ?? "",
              direction: "in",
              at: now(),
            },
            ...s.accessLogs,
          ],
        })),
      checkOutVisitor: (id) =>
        set((s) => ({
          visitors: s.visitors.map((v) => (v.id === id ? { ...v, checkedOutAt: now() } : v)),
          accessLogs: [
            {
              id: `al_${uid()}`,
              subjectType: "visitor",
              subjectId: id,
              branchId: s.visitors.find((v) => v.id === id)?.branchId ?? "",
              direction: "out",
              at: now(),
            },
            ...s.accessLogs,
          ],
        })),
      upsertBranch: (b) =>
        set((s) => {
          const exists = s.branches.find((x) => x.id === b.id);
          return {
            branches: exists ? s.branches.map((x) => (x.id === b.id ? b : x)) : [...s.branches, b],
          };
        }),
      archiveBranch: (id) =>
        set((s) => ({
          branches: s.branches.map((b) => (b.id === id ? { ...b, isActive: false } : b)),
        })),
      upsertPlan: (p) =>
        set((s) => {
          const exists = s.plans.find((x) => x.id === p.id);
          return { plans: exists ? s.plans.map((x) => (x.id === p.id ? p : x)) : [...s.plans, p] };
        }),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      deleteCoupon: (code) => set((s) => ({ coupons: s.coupons.filter((c) => c.code !== code) })),
      upsertCoupon: (c) =>
        set((s) => ({
          coupons: s.coupons.find((x) => x.code === c.code)
            ? s.coupons.map((x) => (x.code === c.code ? c : x))
            : [...s.coupons, c],
        })),
      upsertWorkflow: (w) =>
        set((s) => ({
          workflowRules: s.workflowRules.find((x) => x.id === w.id)
            ? s.workflowRules.map((x) => (x.id === w.id ? w : x))
            : [...s.workflowRules, w],
        })),
      upsertForm: (f) =>
        set((s) => ({ forms: s.forms.map((x) => (x.key === f.key ? f : x)) })),
      upsertBlog: (b) =>
        set((s) => ({
          blog: s.blog.find((x) => x.id === b.id)
            ? s.blog.map((x) => (x.id === b.id ? b : x))
            : [b, ...s.blog],
        })),
      resetDemo: () => set({ ...seed() }),
    }),
    {
      name: "aztech-coworks-v1",
      version: 1,
    },
  ),
);

// Helpers
export const roleLabels: Record<Role, string> = {
  visitor: "Visitor",
  member: "Member",
  reception: "Reception",
  sales_exec: "Sales Executive",
  sales_manager: "Sales Manager",
  branch_manager: "Branch Manager",
  finance: "Finance",
  marketing: "Marketing",
  super_admin: "Super Admin",
};

export const stageLabels: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit: "Site Visit",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const seatTypeLabels: Record<SeatType, string> = {
  hot_desk: "Hot Desk",
  dedicated: "Dedicated Desk",
  cabin: "Private Cabin",
  team_office: "Team Office",
};

export function unsplash(id: string, w = 1200, h = 800) {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function whatsappLink(message: string, phone = "919000000000") {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

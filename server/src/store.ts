// In-memory data store. Swap this file for a DB adapter later.

import type {
  User, Branch, SeatInventory, MeetingRoom, Plan,
  Lead, LeadActivity, Task, SiteVisit, Membership,
  Booking, Invoice, Visitor, BlogPost, Testimonial,
} from "./types.js";
import { createHash } from "node:crypto";

// Simple password hashing (replace with bcrypt when adding real auth)
export function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

const now = () => new Date().toISOString();

function makeBranch(
  id: string, slug: string, name: string, area: string,
  photo: string, total: number, available: number,
): Branch {
  return {
    id, slug, name,
    address: `${area}, Coimbatore, Tamil Nadu`,
    city: "Coimbatore",
    phone: "+91 90000 00000",
    hours: "Mon–Sat · 8:00 AM – 10:00 PM",
    amenities: [
      "High-speed Wi-Fi (1 Gbps)", "Power backup", "Cafeteria",
      "Premium coffee", "Meeting rooms", "24/7 access",
      "Reception & mail handling", "Printing & scanning",
      "Phone booths", "Lockers",
    ],
    totalSeats: total,
    availableSeats: available,
    isActive: true,
    photo,
    description: `A premium Aztech Co-Works branch in ${area} designed for focused work, collaboration, and growth.`,
  };
}

// ─── Seed data ──────────────────────────────────

const branches: Branch[] = [
  makeBranch("br_rs", "rs-puram", "Aztech R.S. Puram", "R.S. Puram", "photo-1497366216548-37526070297c", 240, 80),
  makeBranch("br_pn", "peelamedu", "Aztech Peelamedu", "Peelamedu", "photo-1497366754035-f200968a6e72", 240, 75),
  makeBranch("br_ga", "gandhipuram", "Aztech Gandhipuram", "Gandhipuram", "photo-1556761175-5973dc0f32e7", 240, 90),
  makeBranch("br_sg", "saravanampatti", "Aztech Saravanampatti", "Saravanampatti (IT Corridor)", "photo-1604328698692-f76ea9498e76", 240, 85),
  makeBranch("br_av", "avinashi-road", "Aztech Avinashi Road", "Avinashi Road", "photo-1568992687947-868a62a9f521", 240, 70),
];

const seatInventory: SeatInventory[] = branches.flatMap((b) => [
  { branchId: b.id, type: "hot_desk" as const, total: 80, available: 30, monthlyPrice: 6500 },
  { branchId: b.id, type: "dedicated" as const, total: 90, available: 25, monthlyPrice: 8500 },
  { branchId: b.id, type: "cabin" as const, total: 40, available: 15, monthlyPrice: 18000 },
  { branchId: b.id, type: "team_office" as const, total: 30, available: 10, monthlyPrice: 45000 },
]);

const meetingRooms: MeetingRoom[] = branches.flatMap((b, i) => [
  { id: `mr_${i}_a`, branchId: b.id, name: "Boardroom A", capacity: 12, hourlyPrice: 800 },
  { id: `mr_${i}_b`, branchId: b.id, name: "Huddle Room", capacity: 4, hourlyPrice: 400 },
  { id: `mr_${i}_c`, branchId: b.id, name: "Conference Hall", capacity: 24, hourlyPrice: 1500 },
]);

const plans: Plan[] = [
  { id: "pl_hot", name: "Hot Desk", seatType: "hot_desk", basePrice: 6500, gstRate: 18, description: "Flexible desks, any branch, available daily.", features: ["Any open desk", "All amenities", "Meeting room credits (4 hrs/mo)", "Community access"] },
  { id: "pl_ded", name: "Dedicated Desk", seatType: "dedicated", basePrice: 8500, gstRate: 18, description: "Your own desk, 24/7 access, locker included.", features: ["Reserved desk", "24/7 access", "Lockable storage", "Meeting room credits (8 hrs/mo)"] },
  { id: "pl_cab", name: "Private Cabin", seatType: "cabin", basePrice: 18000, gstRate: 18, description: "Lockable private cabin for individuals or pairs.", features: ["Lockable cabin", "2 desks", "Premium chairs", "Meeting room credits (16 hrs/mo)"] },
  { id: "pl_team", name: "Team Office", seatType: "team_office", basePrice: 45000, gstRate: 18, description: "Private office for 4–20 person teams. Fully managed.", features: ["Custom build-out", "Dedicated reception", "Unlimited meeting rooms", "Enterprise SLAs"] },
];

const DEFAULT_PASSWORD = hashPassword("demo1234");

const users: User[] = [
  { id: "u_super", name: "Aarav Kumar", email: "admin@aztechcoworks.in", phone: "+91 90000 11111", role: "super_admin", referralCode: "AARAV-VIP", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
  { id: "u_sales", name: "Divya Iyer", email: "sales@aztechcoworks.in", role: "sales_exec", referralCode: "DIVYA-100", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
  { id: "u_smgr", name: "Rohit Pillai", email: "salesmgr@aztechcoworks.in", role: "sales_manager", referralCode: "ROHIT-200", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
  { id: "u_rec", name: "Meera Sundar", email: "reception@aztechcoworks.in", role: "reception", branchId: "br_rs", referralCode: "MEERA-300", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
  { id: "u_brm", name: "Karthik Raja", email: "branchmgr@aztechcoworks.in", role: "branch_manager", branchId: "br_rs", referralCode: "KARTHIK-400", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
  { id: "u_fin", name: "Sneha Nair", email: "finance@aztechcoworks.in", role: "finance", referralCode: "SNEHA-500", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
  { id: "u_mkt", name: "Vikram Joshi", email: "marketing@aztechcoworks.in", role: "marketing", referralCode: "VIKRAM-600", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
  { id: "u_member", name: "Anjali Menon", email: "anjali@cibylstudios.com", phone: "+91 98765 43210", company: "Cibyl Studios", role: "member", branchId: "br_pn", referralCode: "ANJALI-CW", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
];

const leads: Lead[] = [
  { id: "ld1", name: "Suresh Babu", email: "suresh@orangefin.in", phone: "+91 99887 76655", source: "website", branchId: "br_sg", planId: "pl_team", teamSize: 12, budget: 60000, timeline: "1_month", message: "Looking for a team office for our fintech.", score: 86, stage: "qualified", ownerId: "u_sales", createdAt: now() },
  { id: "ld2", name: "Priya Ramesh", email: "priya@studiokin.co", phone: "+91 90000 23456", source: "website", branchId: "br_rs", planId: "pl_ded", teamSize: 3, budget: 25000, timeline: "immediate", score: 78, stage: "site_visit", ownerId: "u_sales", createdAt: now() },
  { id: "ld3", name: "Manoj K", email: "manoj@indigocode.dev", phone: "+91 90000 99887", source: "whatsapp", branchId: "br_pn", planId: "pl_hot", teamSize: 1, budget: 7000, timeline: "immediate", score: 64, stage: "new", createdAt: now() },
];

const leadActivities: LeadActivity[] = [];
const tasks: Task[] = [
  { id: "tk1", leadId: "ld1", assigneeId: "u_sales", title: "Send proposal to Suresh", dueAt: new Date(Date.now() + 86400000).toISOString(), done: false },
  { id: "tk2", leadId: "ld2", assigneeId: "u_sales", title: "Confirm site visit slot", dueAt: new Date(Date.now() + 3600000 * 4).toISOString(), done: false },
];
const siteVisits: SiteVisit[] = [
  { id: "sv1", leadId: "ld2", branchId: "br_rs", scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", mode: "self_serve" },
];
const memberships: Membership[] = [
  { id: "mb1", userId: "u_member", planId: "pl_ded", branchId: "br_pn", seats: 1, status: "active", startDate: "2026-01-15", endDate: "2026-07-15" },
];
const bookings: Booking[] = [];
const invoices: Invoice[] = [
  { id: "inv1", number: "AZTECH-2026-0001", userId: "u_member", membershipId: "mb1", subtotal: 8500, gst: 1530, total: 10030, status: "paid", issuedAt: "2026-06-01" },
  { id: "inv2", number: "AZTECH-2026-0002", userId: "u_member", membershipId: "mb1", subtotal: 8500, gst: 1530, total: 10030, status: "paid", issuedAt: "2026-05-01" },
];
const visitors: Visitor[] = [];
const blog: BlogPost[] = [
  { id: "bp1", slug: "best-coworking-space-in-coimbatore", title: "The Best Coworking Space in Coimbatore (2026 Guide)", excerpt: "A founder's guide to picking a workspace in Coimbatore.", body: "Coimbatore's tech corridor has exploded over the last 36 months...", cover: "photo-1497366216548-37526070297c", publishedAt: "2026-05-22", author: "Aztech Editorial", tags: ["coimbatore", "coworking", "guide"] },
  { id: "bp2", slug: "office-space-vs-coworking", title: "Office Space vs Coworking: What's right for your startup?", excerpt: "A break-even calculation, plus the soft factors most founders miss.", body: "When you cross 8 people, the math changes...", cover: "photo-1604328698692-f76ea9498e76", publishedAt: "2026-05-08", author: "Aztech Editorial", tags: ["startups", "decisions"] },
  { id: "bp3", slug: "startup-workspace-guide", title: "The Startup Workspace Guide", excerpt: "How your workspace needs change as you grow.", body: "Every stage has different workspace needs...", cover: "photo-1568992687947-868a62a9f521", publishedAt: "2026-04-19", author: "Aztech Editorial", tags: ["startups", "growth"] },
];
const testimonials: Testimonial[] = [
  { id: "t1", name: "Karthik Subramaniam", company: "Loop Analytics", role: "Founder & CEO", quote: "Aztech let us scale from 3 to 22 people without ever moving offices.", avatar: "photo-1500648767791-00dcc994a43e" },
  { id: "t2", name: "Anjali Menon", company: "Cibyl Studios", role: "Design Lead", quote: "The community is real. We've hired two engineers from coffee chats in the lounge.", avatar: "photo-1438761681033-6461ffad8d80" },
  { id: "t3", name: "Vignesh Raghavan", company: "Northwind Labs", role: "CTO", quote: "Best workspace in Coimbatore, hands down.", avatar: "photo-1472099645785-5658abf4ff4e" },
];

// ─── Public API ─────────────────────────────────
// Each table is exposed as a getter + basic mutators.
// When we swap to SQL, only this file changes.

export const db = {
  branches:      { all: () => branches,      find: (id: string) => branches.find((r) => r.id === id || r.slug === id) },
  seatInventory: { all: () => seatInventory, byBranch: (id: string) => seatInventory.filter((r) => r.branchId === id) },
  meetingRooms:  { all: () => meetingRooms,  byBranch: (id: string) => meetingRooms.filter((r) => r.branchId === id) },
  plans:         { all: () => plans,         find: (id: string) => plans.find((r) => r.id === id) },

  users: {
    all:         () => users,
    find:        (id: string) => users.find((r) => r.id === id),
    findByEmail: (email: string) => users.find((r) => r.email === email),
    insert:      (u: User) => { users.push(u); return u; },
    update:      (id: string, patch: Partial<User>) => {
      const u = users.find((r) => r.id === id);
      if (u) Object.assign(u, patch);
      return u;
    },
  },

  leads: {
    all:    () => leads,
    find:   (id: string) => leads.find((r) => r.id === id),
    insert: (l: Lead) => { leads.push(l); return l; },
    update: (id: string, patch: Partial<Lead>) => {
      const l = leads.find((r) => r.id === id);
      if (l) Object.assign(l, patch);
      return l;
    },
  },

  leadActivities: {
    byLead: (id: string) => leadActivities.filter((r) => r.leadId === id),
    insert: (a: LeadActivity) => { leadActivities.push(a); return a; },
  },

  tasks: {
    all:    () => tasks,
    find:   (id: string) => tasks.find((r) => r.id === id),
    insert: (t: Task) => { tasks.push(t); return t; },
    update: (id: string, patch: Partial<Task>) => {
      const t = tasks.find((r) => r.id === id);
      if (t) Object.assign(t, patch);
      return t;
    },
  },

  siteVisits: {
    all:    () => siteVisits,
    insert: (sv: SiteVisit) => { siteVisits.push(sv); return sv; },
    update: (id: string, patch: Partial<SiteVisit>) => {
      const sv = siteVisits.find((r) => r.id === id);
      if (sv) Object.assign(sv, patch);
      return sv;
    },
  },

  memberships: {
    all:      () => memberships,
    byUser:   (id: string) => memberships.filter((r) => r.userId === id),
    insert:   (m: Membership) => { memberships.push(m); return m; },
  },

  bookings: {
    all:    () => bookings,
    byUser: (id: string) => bookings.filter((r) => r.userId === id),
    insert: (b: Booking) => { bookings.push(b); return b; },
  },

  invoices: {
    all:    () => invoices,
    byUser: (id: string) => invoices.filter((r) => r.userId === id),
    insert: (inv: Invoice) => { invoices.push(inv); return inv; },
  },

  visitors: {
    all:    () => visitors,
    insert: (v: Visitor) => { visitors.push(v); return v; },
    update: (id: string, patch: Partial<Visitor>) => {
      const v = visitors.find((r) => r.id === id);
      if (v) Object.assign(v, patch);
      return v;
    },
  },

  blog:         { all: () => blog, find: (slug: string) => blog.find((r) => r.slug === slug || r.id === slug) },
  testimonials: { all: () => testimonials },
};

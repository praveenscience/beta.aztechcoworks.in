// SQLite data store via better-sqlite3.
// Same `db` export shape as the old in-memory store — route files don't change.

import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  User, Branch, SeatInventory, MeetingRoom, Plan,
  Lead, LeadActivity, Task, SiteVisit, Membership,
  Booking, Invoice, Visitor, BlogPost, Testimonial,
} from "./types.js";

// ─── Setup ──────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../data/aztech.db");

// Ensure data directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// ─── Schema ─────────────────────────────────────

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    hours TEXT NOT NULL,
    amenities TEXT NOT NULL DEFAULT '[]',
    totalSeats INTEGER NOT NULL,
    availableSeats INTEGER NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    photo TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS seat_inventory (
    branchId TEXT NOT NULL REFERENCES branches(id),
    type TEXT NOT NULL,
    total INTEGER NOT NULL,
    available INTEGER NOT NULL,
    monthlyPrice INTEGER NOT NULL,
    PRIMARY KEY (branchId, type)
  );

  CREATE TABLE IF NOT EXISTS meeting_rooms (
    id TEXT PRIMARY KEY,
    branchId TEXT NOT NULL REFERENCES branches(id),
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    hourlyPrice INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    seatType TEXT NOT NULL,
    basePrice INTEGER NOT NULL,
    gstRate INTEGER NOT NULL,
    description TEXT NOT NULL,
    features TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    role TEXT NOT NULL,
    branchId TEXT REFERENCES branches(id),
    referralCode TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'website',
    branchId TEXT,
    planId TEXT,
    teamSize INTEGER,
    budget INTEGER,
    timeline TEXT,
    message TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'new',
    ownerId TEXT,
    customFields TEXT,
    createdAt TEXT NOT NULL,
    lostReason TEXT
  );

  CREATE TABLE IF NOT EXISTS lead_activities (
    id TEXT PRIMARY KEY,
    leadId TEXT NOT NULL REFERENCES leads(id),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    actorId TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    leadId TEXT,
    assigneeId TEXT NOT NULL,
    title TEXT NOT NULL,
    dueAt TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS site_visits (
    id TEXT PRIMARY KEY,
    leadId TEXT NOT NULL REFERENCES leads(id),
    branchId TEXT NOT NULL,
    scheduledAt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    mode TEXT NOT NULL DEFAULT 'self_serve'
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    planId TEXT NOT NULL,
    branchId TEXT NOT NULL,
    seats INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    branchId TEXT NOT NULL,
    resourceType TEXT NOT NULL,
    resourceId TEXT NOT NULL,
    startAt TEXT NOT NULL,
    endAt TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed'
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL REFERENCES users(id),
    bookingId TEXT,
    membershipId TEXT,
    subtotal INTEGER NOT NULL,
    gst INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    issuedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    hostUserId TEXT NOT NULL REFERENCES users(id),
    branchId TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    purpose TEXT NOT NULL,
    qrToken TEXT NOT NULL,
    expectedAt TEXT NOT NULL,
    checkedInAt TEXT,
    checkedOutAt TEXT
  );

  CREATE TABLE IF NOT EXISTS blog (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    body TEXT NOT NULL,
    cover TEXT NOT NULL,
    publishedAt TEXT NOT NULL,
    author TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    quote TEXT NOT NULL,
    avatar TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    action TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT,
    detail TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    expiresAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    orderId TEXT UNIQUE NOT NULL,
    razorpayPaymentId TEXT,
    razorpaySignature TEXT,
    invoiceId TEXT REFERENCES invoices(id),
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created',
    createdAt TEXT NOT NULL
  );

  -- ─── Indexes ────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
  CREATE INDEX IF NOT EXISTS idx_leads_ownerId ON leads(ownerId);
  CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
  CREATE INDEX IF NOT EXISTS idx_memberships_userId ON memberships(userId);
  CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
  CREATE INDEX IF NOT EXISTS idx_invoices_userId ON invoices(userId);
  CREATE INDEX IF NOT EXISTS idx_bookings_userId ON bookings(userId);
  CREATE INDEX IF NOT EXISTS idx_visitors_hostUserId ON visitors(hostUserId);
  CREATE INDEX IF NOT EXISTS idx_lead_activities_leadId ON lead_activities(leadId);
  CREATE INDEX IF NOT EXISTS idx_tasks_assigneeId ON tasks(assigneeId);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_entityType ON audit_logs(entityType);
  CREATE INDEX IF NOT EXISTS idx_payments_orderId ON payments(orderId);
  CREATE INDEX IF NOT EXISTS idx_payments_invoiceId ON payments(invoiceId);
  CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_userId ON password_reset_tokens(userId);
`);

// ─── Helpers ────────────────────────────────────

// JSON fields that need parse/stringify
const JSON_FIELDS: Record<string, string[]> = {
  branches: ["amenities"],
  plans: ["features"],
  blog: ["tags"],
  leads: ["customFields"],
};

function parseRow<T>(table: string, row: any): T {
  if (!row) return row;
  const fields = JSON_FIELDS[table];
  if (fields) {
    for (const f of fields) {
      if (row[f] && typeof row[f] === "string") {
        try { row[f] = JSON.parse(row[f]); } catch { /* keep as string */ }
      }
    }
  }
  // SQLite stores booleans as 0/1
  if ("isActive" in row) row.isActive = !!row.isActive;
  if ("done" in row) row.done = !!row.done;
  return row as T;
}

function parseRows<T>(table: string, rows: any[]): T[] {
  return rows.map((r) => parseRow<T>(table, r));
}

function prepareForInsert(table: string, obj: Record<string, any>): Record<string, any> {
  const copy = { ...obj };
  const fields = JSON_FIELDS[table];
  if (fields) {
    for (const f of fields) {
      if (copy[f] && typeof copy[f] !== "string") {
        copy[f] = JSON.stringify(copy[f]);
      }
    }
  }
  if ("isActive" in copy) copy.isActive = copy.isActive ? 1 : 0;
  if ("done" in copy) copy.done = copy.done ? 1 : 0;
  return copy;
}

function insertRow(table: string, sqlTable: string, obj: Record<string, any>) {
  const data = prepareForInsert(table, obj);
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const stmt = sqlite.prepare(`INSERT OR IGNORE INTO ${sqlTable} (${keys.join(", ")}) VALUES (${placeholders})`);
  stmt.run(...keys.map((k) => data[k] ?? null));
}

function updateRow(sqlTable: string, table: string, id: string, patch: Record<string, any>): any {
  const data = prepareForInsert(table, patch);
  const keys = Object.keys(data).filter((k) => k !== "id");
  if (keys.length === 0) return getRow(sqlTable, table, id);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  sqlite.prepare(`UPDATE ${sqlTable} SET ${sets} WHERE id = ?`).run(...keys.map((k) => data[k] ?? null), id);
  return getRow(sqlTable, table, id);
}

function getRow<T>(sqlTable: string, table: string, id: string): T | undefined {
  const row = sqlite.prepare(`SELECT * FROM ${sqlTable} WHERE id = ?`).get(id);
  return row ? parseRow<T>(table, row) : undefined;
}

function getAllRows<T>(sqlTable: string, table: string): T[] {
  return parseRows<T>(table, sqlite.prepare(`SELECT * FROM ${sqlTable}`).all());
}

// ─── Seed data ──────────────────────────────────

const needsSeed = (sqlite.prepare("SELECT COUNT(*) as c FROM branches").get() as any).c === 0;

if (needsSeed) {
  const now = () => new Date().toISOString();
  const DEFAULT_PASSWORD = hashPassword("demo1234");

  const amenities = [
    "High-speed Wi-Fi (1 Gbps)", "Power backup", "Cafeteria",
    "Premium coffee", "Meeting rooms", "24/7 access",
    "Reception & mail handling", "Printing & scanning",
    "Phone booths", "Lockers",
  ];

  const seedBranches: Branch[] = [
    { id: "br_bk", slug: "brookfields", name: "Aztech Brookfields", address: "Dr Krishnasamy Mudaliyar Rd, Above Kailash Parbat, Brookefields, Sukrawar Pettai, R.S. Puram, Coimbatore, Tamil Nadu 641001", city: "Coimbatore", phone: "+91 83106 96307", hours: "Mon–Sat · 8:00 AM – 10:00 PM", amenities, totalSeats: 200, availableSeats: 60, isActive: true, photo: "photo-1497366216548-37526070297c", description: "The Aztech flagship at Brookfields Mall — large team operations, fully managed enterprise setups (20 to 150+ seaters), and premium corporate workstations." },
    { id: "br_rs", slug: "rs-puram", name: "Aztech RS Puram", address: "2nd Floor, Indsil House, E TV Swamy Road, RS Puram, Coimbatore, Tamil Nadu 641002", city: "Coimbatore", phone: "+91 83106 96307", hours: "Mon–Sat · 8:00 AM – 10:00 PM", amenities, totalSeats: 200, availableSeats: 65, isActive: true, photo: "photo-1497366754035-f200968a6e72", description: "Premium enterprise wings, custom executive suites, private cabins, and day-pass coworking at the heart of RS Puram." },
    { id: "br_re", slug: "rs-puram-east", name: "Aztech RS Puram East", address: "2nd Floor, 161 L, E Ponnurangam Road (East), RS Puram, Coimbatore, Tamil Nadu 641002", city: "Coimbatore", phone: "+91 83106 96307", hours: "Mon–Sat · 8:00 AM – 10:00 PM", amenities, totalSeats: 200, availableSeats: 80, isActive: true, photo: "photo-1556761175-5973dc0f32e7", description: "Ideal for freelancers, startups, back-office operations, training centers, and virtual office rentals." },
    { id: "br_rn", slug: "ram-nagar", name: "Aztech Ram Nagar", address: "Near Vivekananda Road, Ram Nagar, Coimbatore", city: "Coimbatore", phone: "+91 83106 96307", hours: "24/7 · Digital access codes", amenities, totalSeats: 200, availableSeats: 75, isActive: true, photo: "photo-1604328698692-f76ea9498e76", description: "24/7 access hub with digital door codes — work on your schedule, any time of day or night." },
    { id: "br_at", slug: "att-colony", name: "Aztech ATT Colony", address: "Aztech Elysium Towers, ATT Colony, Coimbatore", city: "Coimbatore", phone: "+91 83106 96307", hours: "Mon–Sat · 8:00 AM – 10:00 PM", amenities, totalSeats: 200, availableSeats: 70, isActive: true, photo: "photo-1568992687947-868a62a9f521", description: "Modern tech-startup floors and corporate satellite offices in the vibrant ATT Colony neighborhood." },
    { id: "br_sb", slug: "saibaba-colony", name: "Aztech Saibaba Colony", address: "Aztech Sanhasa Square, Saibaba Colony, Coimbatore", city: "Coimbatore", phone: "+91 83106 96307", hours: "Mon–Sat · 8:00 AM – 10:00 PM", amenities, totalSeats: 200, availableSeats: 65, isActive: true, photo: "photo-1555396273-367ea4eb4db5", description: "High-density scale-up teams and private corporate cabins at Sanhasa Square." },
  ];

  const seedTransaction = sqlite.transaction(() => {
    for (const b of seedBranches) {
      insertRow("branches", "branches", b);

      for (const si of [
        { branchId: b.id, type: "hot_desk", total: 80, available: 30, monthlyPrice: 6500 },
        { branchId: b.id, type: "dedicated", total: 90, available: 25, monthlyPrice: 8500 },
        { branchId: b.id, type: "cabin", total: 40, available: 15, monthlyPrice: 18000 },
        { branchId: b.id, type: "team_office", total: 30, available: 10, monthlyPrice: 45000 },
        { branchId: b.id, type: "enterprise", total: 4, available: 2, monthlyPrice: 150000 },
      ]) {
        insertRow("seat_inventory", "seat_inventory", si);
      }
    }

    const mrData = seedBranches.flatMap((b, i) => [
      { id: `mr_${i}_a`, branchId: b.id, name: "Boardroom A", capacity: 12, hourlyPrice: 800 },
      { id: `mr_${i}_b`, branchId: b.id, name: "Huddle Room", capacity: 4, hourlyPrice: 400 },
      { id: `mr_${i}_c`, branchId: b.id, name: "Conference Hall", capacity: 24, hourlyPrice: 1500 },
    ]);
    for (const mr of mrData) insertRow("meeting_rooms", "meeting_rooms", mr);

    const seedPlans = [
      { id: "pl_hot", name: "Hot Desk", seatType: "hot_desk", basePrice: 6500, gstRate: 18, description: "Flexible desks, any branch, available daily.", features: ["Any open desk", "All amenities", "Meeting room credits (4 hrs/mo)", "Community access"] },
      { id: "pl_ded", name: "Dedicated Desk", seatType: "dedicated", basePrice: 8500, gstRate: 18, description: "Your own desk, 24/7 access, locker included.", features: ["Reserved desk", "24/7 access", "Lockable storage", "Meeting room credits (8 hrs/mo)"] },
      { id: "pl_cab", name: "Private Cabin", seatType: "cabin", basePrice: 18000, gstRate: 18, description: "Lockable private cabin for individuals or pairs.", features: ["Lockable cabin", "2 desks", "Premium chairs", "Meeting room credits (16 hrs/mo)"] },
      { id: "pl_team", name: "Team Office", seatType: "team_office", basePrice: 45000, gstRate: 18, description: "Private office for 4–20 person teams. Fully managed.", features: ["Custom build-out", "Dedicated reception", "Unlimited meeting rooms", "Enterprise SLAs"] },
      { id: "pl_ent", name: "Managed Enterprise Floor", seatType: "enterprise", basePrice: 150000, gstRate: 18, description: "Fully managed floors for 30–150+ person teams. Custom build-outs with annual lock-in contracts.", features: ["Custom build-out", "White-labeled dashboard", "Hybrid workforce tracking", "Dedicated reception", "Enterprise SLAs", "Audit-ready compliance"] },
    ];
    for (const p of seedPlans) insertRow("plans", "plans", p);

    const seedUsers: User[] = [
      { id: "u_super", name: "Aarav Kumar", email: "admin@aztechcoworks.in", phone: "+91 83106 96307", role: "super_admin", referralCode: "AARAV-VIP", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
      { id: "u_sales", name: "Divya Iyer", email: "sales@aztechcoworks.in", role: "sales_exec", referralCode: "DIVYA-100", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
      { id: "u_smgr", name: "Rohit Pillai", email: "salesmgr@aztechcoworks.in", role: "sales_manager", referralCode: "ROHIT-200", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
      { id: "u_rec", name: "Meera Sundar", email: "reception@aztechcoworks.in", role: "reception", branchId: "br_bk", referralCode: "MEERA-300", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
      { id: "u_brm", name: "Karthik Raja", email: "branchmgr@aztechcoworks.in", role: "branch_manager", branchId: "br_bk", referralCode: "KARTHIK-400", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
      { id: "u_fin", name: "Sneha Nair", email: "finance@aztechcoworks.in", role: "finance", referralCode: "SNEHA-500", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
      { id: "u_mkt", name: "Vikram Joshi", email: "marketing@aztechcoworks.in", role: "marketing", referralCode: "VIKRAM-600", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
      { id: "u_member", name: "Anjali Menon", email: "anjali@cibylstudios.com", phone: "+91 98765 43210", company: "Cibyl Studios", role: "member", branchId: "br_rs", referralCode: "ANJALI-CW", passwordHash: DEFAULT_PASSWORD, createdAt: now() },
    ];
    for (const u of seedUsers) insertRow("users", "users", u);

    const seedLeads = [
      { id: "ld1", name: "Suresh Babu", email: "suresh@orangefin.in", phone: "+91 99887 76655", source: "website", branchId: "br_sb", planId: "pl_team", teamSize: 12, budget: 60000, timeline: "1_month", message: "Looking for a team office for our fintech.", score: 86, stage: "qualified", ownerId: "u_sales", createdAt: now() },
      { id: "ld2", name: "Priya Ramesh", email: "priya@studiokin.co", phone: "+91 90000 23456", source: "website", branchId: "br_rs", planId: "pl_ded", teamSize: 3, budget: 25000, timeline: "immediate", score: 78, stage: "site_visit", ownerId: "u_sales", createdAt: now() },
      { id: "ld3", name: "Manoj K", email: "manoj@indigocode.dev", phone: "+91 90000 99887", source: "whatsapp", branchId: "br_rn", planId: "pl_hot", teamSize: 1, budget: 7000, timeline: "immediate", score: 64, stage: "new", createdAt: now() },
    ];
    for (const l of seedLeads) insertRow("leads", "leads", l);

    insertRow("tasks", "tasks", { id: "tk1", leadId: "ld1", assigneeId: "u_sales", title: "Send proposal to Suresh", dueAt: new Date(Date.now() + 86400000).toISOString(), done: false });
    insertRow("tasks", "tasks", { id: "tk2", leadId: "ld2", assigneeId: "u_sales", title: "Confirm site visit slot", dueAt: new Date(Date.now() + 3600000 * 4).toISOString(), done: false });

    insertRow("site_visits", "site_visits", { id: "sv1", leadId: "ld2", branchId: "br_rs", scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", mode: "self_serve" });

    insertRow("memberships", "memberships", { id: "mb1", userId: "u_member", planId: "pl_ded", branchId: "br_rs", seats: 1, status: "active", startDate: "2026-01-15", endDate: "2026-07-15" });

    insertRow("invoices", "invoices", { id: "inv1", number: "AZTECH-2026-0001", userId: "u_member", membershipId: "mb1", subtotal: 8500, gst: 1530, total: 10030, status: "paid", issuedAt: "2026-06-01" });
    insertRow("invoices", "invoices", { id: "inv2", number: "AZTECH-2026-0002", userId: "u_member", membershipId: "mb1", subtotal: 8500, gst: 1530, total: 10030, status: "paid", issuedAt: "2026-05-01" });

    const seedBlog = [
      { id: "bp1", slug: "best-coworking-space-in-coimbatore", title: "The Best Coworking Space in Coimbatore (2026 Guide)", excerpt: "A founder's guide to picking a workspace in Coimbatore.", body: "Coimbatore's tech corridor has exploded over the last 36 months...", cover: "photo-1497366216548-37526070297c", publishedAt: "2026-05-22", author: "Aztech Editorial", tags: ["coimbatore", "coworking", "guide"] },
      { id: "bp2", slug: "office-space-vs-coworking", title: "Office Space vs Coworking: What's right for your startup?", excerpt: "A break-even calculation, plus the soft factors most founders miss.", body: "When you cross 8 people, the math changes...", cover: "photo-1604328698692-f76ea9498e76", publishedAt: "2026-05-08", author: "Aztech Editorial", tags: ["startups", "decisions"] },
      { id: "bp3", slug: "startup-workspace-guide", title: "The Startup Workspace Guide", excerpt: "How your workspace needs change as you grow.", body: "Every stage has different workspace needs...", cover: "photo-1568992687947-868a62a9f521", publishedAt: "2026-04-19", author: "Aztech Editorial", tags: ["startups", "growth"] },
    ];
    for (const bp of seedBlog) insertRow("blog", "blog", bp);

    const seedTestimonials = [
      { id: "t1", name: "Karthik Subramaniam", company: "Loop Analytics", role: "Founder & CEO", quote: "Aztech let us scale from 3 to 22 people without ever moving offices.", avatar: "photo-1500648767791-00dcc994a43e" },
      { id: "t2", name: "Anjali Menon", company: "Cibyl Studios", role: "Design Lead", quote: "The community is real. We've hired two engineers from coffee chats in the lounge.", avatar: "photo-1438761681033-6461ffad8d80" },
      { id: "t3", name: "Vignesh Raghavan", company: "Northwind Labs", role: "CTO", quote: "Best workspace in Coimbatore, hands down.", avatar: "photo-1472099645785-5658abf4ff4e" },
    ];
    for (const t of seedTestimonials) insertRow("testimonials", "testimonials", t);
  });

  seedTransaction();
  console.log("Database seeded with demo data.");
}

// ─── Public API ─────────────────────────────────
// Same shape as before — route files don't change.

export const db = {
  branches: {
    all: () => getAllRows<Branch>("branches", "branches"),
    find: (id: string) => {
      const row = sqlite.prepare("SELECT * FROM branches WHERE id = ? OR slug = ?").get(id, id);
      return row ? parseRow<Branch>("branches", row) : undefined;
    },
    insert: (b: Branch) => { insertRow("branches", "branches", b); return b; },
    update: (id: string, patch: Partial<Branch>) => updateRow("branches", "branches", id, patch) as Branch | undefined,
  },
  seatInventory: {
    all: () => parseRows<SeatInventory>("seat_inventory", sqlite.prepare("SELECT * FROM seat_inventory").all()),
    byBranch: (id: string) => parseRows<SeatInventory>("seat_inventory", sqlite.prepare("SELECT * FROM seat_inventory WHERE branchId = ?").all(id)),
  },
  meetingRooms: {
    all: () => getAllRows<MeetingRoom>("meeting_rooms", "meeting_rooms"),
    byBranch: (id: string) => parseRows<MeetingRoom>("meeting_rooms", sqlite.prepare("SELECT * FROM meeting_rooms WHERE branchId = ?").all(id)),
  },
  plans: {
    all: () => getAllRows<Plan>("plans", "plans"),
    find: (id: string) => getRow<Plan>("plans", "plans", id),
    insert: (p: Plan) => { insertRow("plans", "plans", p); return p; },
    update: (id: string, patch: Partial<Plan>) => updateRow("plans", "plans", id, patch) as Plan | undefined,
    delete: (id: string) => { sqlite.prepare("DELETE FROM plans WHERE id = ?").run(id); },
  },

  users: {
    all: () => getAllRows<User>("users", "users"),
    find: (id: string) => getRow<User>("users", "users", id),
    findByEmail: (email: string) => {
      const row = sqlite.prepare("SELECT * FROM users WHERE email = ?").get(email);
      return row ? parseRow<User>("users", row) : undefined;
    },
    insert: (u: User) => { insertRow("users", "users", u); return u; },
    update: (id: string, patch: Partial<User>) => updateRow("users", "users", id, patch) as User | undefined,
    updatePassword: (id: string, hash: string) => {
      sqlite.prepare("UPDATE users SET passwordHash = ? WHERE id = ?").run(hash, id);
    },
  },

  leads: {
    all: () => getAllRows<Lead>("leads", "leads"),
    find: (id: string) => getRow<Lead>("leads", "leads", id),
    insert: (l: Lead) => { insertRow("leads", "leads", l); return l; },
    update: (id: string, patch: Partial<Lead>) => updateRow("leads", "leads", id, patch) as Lead | undefined,
  },

  leadActivities: {
    byLead: (id: string) => parseRows<LeadActivity>("lead_activities", sqlite.prepare("SELECT * FROM lead_activities WHERE leadId = ? ORDER BY createdAt DESC").all(id)),
    insert: (a: LeadActivity) => { insertRow("lead_activities", "lead_activities", a); return a; },
  },

  tasks: {
    all: () => getAllRows<Task>("tasks", "tasks"),
    find: (id: string) => getRow<Task>("tasks", "tasks", id),
    insert: (t: Task) => { insertRow("tasks", "tasks", t); return t; },
    update: (id: string, patch: Partial<Task>) => updateRow("tasks", "tasks", id, patch) as Task | undefined,
  },

  siteVisits: {
    all: () => getAllRows<SiteVisit>("site_visits", "site_visits"),
    insert: (sv: SiteVisit) => { insertRow("site_visits", "site_visits", sv); return sv; },
    update: (id: string, patch: Partial<SiteVisit>) => updateRow("site_visits", "site_visits", id, patch) as SiteVisit | undefined,
  },

  memberships: {
    all: () => getAllRows<Membership>("memberships", "memberships"),
    byUser: (id: string) => parseRows<Membership>("memberships", sqlite.prepare("SELECT * FROM memberships WHERE userId = ?").all(id)),
    insert: (m: Membership) => { insertRow("memberships", "memberships", m); return m; },
    update: (id: string, patch: Partial<Membership>) => updateRow("memberships", "memberships", id, patch) as Membership | undefined,
  },

  bookings: {
    all: () => getAllRows<Booking>("bookings", "bookings"),
    byUser: (id: string) => parseRows<Booking>("bookings", sqlite.prepare("SELECT * FROM bookings WHERE userId = ?").all(id)),
    insert: (b: Booking) => { insertRow("bookings", "bookings", b); return b; },
    hasConflict: (resourceId: string, startAt: string, endAt: string) => {
      const row = sqlite.prepare(
        "SELECT id FROM bookings WHERE resourceId = ? AND status = 'confirmed' AND startAt < ? AND endAt > ?"
      ).get(resourceId, endAt, startAt);
      return !!row;
    },
  },

  invoices: {
    all: () => getAllRows<Invoice>("invoices", "invoices"),
    byUser: (id: string) => parseRows<Invoice>("invoices", sqlite.prepare("SELECT * FROM invoices WHERE userId = ?").all(id)),
    find: (id: string) => getRow<Invoice>("invoices", "invoices", id),
    insert: (inv: Invoice) => { insertRow("invoices", "invoices", inv); return inv; },
    update: (id: string, patch: Partial<Invoice>) => updateRow("invoices", "invoices", id, patch) as Invoice | undefined,
  },

  visitors: {
    all: () => getAllRows<Visitor>("visitors", "visitors"),
    insert: (v: Visitor) => { insertRow("visitors", "visitors", v); return v; },
    update: (id: string, patch: Partial<Visitor>) => updateRow("visitors", "visitors", id, patch) as Visitor | undefined,
  },

  blog: {
    all: () => getAllRows<BlogPost>("blog", "blog"),
    find: (slug: string) => {
      const row = sqlite.prepare("SELECT * FROM blog WHERE slug = ? OR id = ?").get(slug, slug);
      return row ? parseRow<BlogPost>("blog", row) : undefined;
    },
  },

  testimonials: {
    all: () => getAllRows<Testimonial>("testimonials", "testimonials"),
  },

  auditLogs: {
    all: (limit = 200) => {
      return sqlite.prepare("SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT ?").all(limit) as any[];
    },
    byEntity: (entityType: string, entityId: string) => {
      return sqlite.prepare("SELECT * FROM audit_logs WHERE entityType = ? AND entityId = ? ORDER BY createdAt DESC").all(entityType, entityId) as any[];
    },
    insert: (log: { userId: string; action: string; entityType: string; entityId?: string; detail?: string }) => {
      const id = `al_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      sqlite.prepare(
        "INSERT INTO audit_logs (id, userId, action, entityType, entityId, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(id, log.userId, log.action, log.entityType, log.entityId ?? null, log.detail ?? null, new Date().toISOString());
    },
  },

  passwordResetTokens: {
    insert: (token: string, userId: string, expiresAt: string) => {
      sqlite.prepare("DELETE FROM password_reset_tokens WHERE userId = ?").run(userId);
      sqlite.prepare("INSERT INTO password_reset_tokens (token, userId, expiresAt) VALUES (?, ?, ?)").run(token, userId, expiresAt);
    },
    find: (token: string) => {
      return sqlite.prepare("SELECT * FROM password_reset_tokens WHERE token = ?").get(token) as { token: string; userId: string; expiresAt: string } | undefined;
    },
    delete: (token: string) => {
      sqlite.prepare("DELETE FROM password_reset_tokens WHERE token = ?").run(token);
    },
    deleteExpired: () => {
      sqlite.prepare("DELETE FROM password_reset_tokens WHERE expiresAt < ?").run(new Date().toISOString());
    },
  },

  payments: {
    all: () => getAllRows<any>("payments", "payments"),
    find: (id: string) => getRow<any>("payments", "payments", id),
    findByOrderId: (orderId: string) => {
      const row = sqlite.prepare("SELECT * FROM payments WHERE orderId = ?").get(orderId);
      return row ? parseRow<any>("payments", row) : undefined;
    },
    byInvoice: (invoiceId: string) => {
      const row = sqlite.prepare("SELECT * FROM payments WHERE invoiceId = ?").get(invoiceId);
      return row ? parseRow<any>("payments", row) : undefined;
    },
    insert: (p: any) => { insertRow("payments", "payments", p); return p; },
    update: (id: string, patch: Record<string, any>) => updateRow("payments", "payments", id, patch),
  },
};

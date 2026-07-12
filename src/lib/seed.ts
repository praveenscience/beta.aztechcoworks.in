import type {
  User,
  Branch,
  SeatInventory,
  MeetingRoom,
  Plan,
  Coupon,
  Lead,
  Task,
  SiteVisit,
  Membership,
  Invoice,
  FormDefinition,
  WorkflowRule,
  BlogPost,
  Testimonial,
} from "@/types";

const now = () => new Date().toISOString();

const defaultAmenities = [
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
];

function makeBranch(
  id: string,
  slug: string,
  name: string,
  address: string,
  description: string,
  photo: string,
  total: number,
  available: number,
  hours = "Mon–Sat · 8:00 AM – 10:00 PM",
): Branch {
  return {
    id,
    slug,
    name,
    address,
    city: "Coimbatore",
    phone: "+91 83106 96307",
    hours,
    amenities: defaultAmenities,
    totalSeats: total,
    availableSeats: available,
    isActive: true,
    photo,
    description,
  };
}

// ─── Branches ────────────────────────────────────

export const seedBranches: Branch[] = [
  makeBranch("br_bk", "brookfields", "Aztech Brookfields",
    "Dr Krishnasamy Mudaliyar Rd, Above Kailash Parbat, Brookefields, Sukrawar Pettai, R.S. Puram, Coimbatore, Tamil Nadu 641001",
    "The Aztech flagship at Brookfields Mall — large team operations, fully managed enterprise setups (20 to 150+ seaters), and premium corporate workstations.",
    "photo-1497366216548-37526070297c", 200, 60),
  makeBranch("br_rs", "rs-puram", "Aztech RS Puram",
    "2nd Floor, Indsil House, E TV Swamy Road, RS Puram, Coimbatore, Tamil Nadu 641002",
    "Premium enterprise wings, custom executive suites, private cabins, and day-pass coworking at the heart of RS Puram.",
    "photo-1497366754035-f200968a6e72", 200, 65),
  makeBranch("br_re", "rs-puram-east", "Aztech RS Puram East",
    "2nd Floor, 161 L, E Ponnurangam Road (East), RS Puram, Coimbatore, Tamil Nadu 641002",
    "Ideal for freelancers, startups, back-office operations, training centers, and virtual office rentals.",
    "photo-1556761175-5973dc0f32e7", 200, 80),
  makeBranch("br_rn", "ram-nagar", "Aztech Ram Nagar",
    "Near Vivekananda Road, Ram Nagar, Coimbatore",
    "24/7 access hub with digital door codes — work on your schedule, any time of day or night.",
    "photo-1604328698692-f76ea9498e76", 200, 75,
    "24/7 · Digital access codes"),
  makeBranch("br_at", "att-colony", "Aztech ATT Colony",
    "Aztech Elysium Towers, ATT Colony, Coimbatore",
    "Modern tech-startup floors and corporate satellite offices in the vibrant ATT Colony neighborhood.",
    "photo-1568992687947-868a62a9f521", 200, 70),
  makeBranch("br_sb", "saibaba-colony", "Aztech Saibaba Colony",
    "Aztech Sanhasa Square, Saibaba Colony, Coimbatore",
    "High-density scale-up teams and private corporate cabins at Sanhasa Square.",
    "photo-1555396273-367ea4eb4db5", 200, 65),
];

// ─── Seat Inventory ──────────────────────────────

export const seedSeatInventory: SeatInventory[] = seedBranches.flatMap((b) => [
  { branchId: b.id, type: "hot_desk", total: 80, available: 30, monthlyPrice: 6500 },
  { branchId: b.id, type: "dedicated", total: 90, available: 25, monthlyPrice: 8500 },
  { branchId: b.id, type: "cabin", total: 40, available: 15, monthlyPrice: 18000 },
  { branchId: b.id, type: "team_office", total: 30, available: 10, monthlyPrice: 45000 },
  { branchId: b.id, type: "enterprise" as const, total: 4, available: 2, monthlyPrice: 150000 },
]);

// ─── Meeting Rooms ───────────────────────────────

export const seedMeetingRooms: MeetingRoom[] = seedBranches.flatMap((b, i) => [
  { id: `mr_${i}_a`, branchId: b.id, name: "Boardroom A", capacity: 12, hourlyPrice: 800 },
  { id: `mr_${i}_b`, branchId: b.id, name: "Huddle Room", capacity: 4, hourlyPrice: 400 },
  { id: `mr_${i}_c`, branchId: b.id, name: "Conference Hall", capacity: 24, hourlyPrice: 1500 },
]);

// ─── Plans ───────────────────────────────────────

export const seedPlans: Plan[] = [
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
  {
    id: "pl_ent",
    name: "Managed Enterprise Floor",
    seatType: "enterprise",
    basePrice: 150000,
    gstRate: 18,
    description: "Fully managed floors for 30–150+ person teams. Custom build-outs with annual lock-in contracts.",
    features: ["Custom build-out", "White-labeled dashboard", "Hybrid workforce tracking", "Dedicated reception", "Enterprise SLAs", "Audit-ready compliance"],
  },
];

// ─── Users ───────────────────────────────────────

export const seedUsers: User[] = [
  { id: "u_super", name: "Aarav Kumar", email: "admin@aztechcoworks.in", phone: "+91 83106 96307", role: "super_admin", referralCode: "AARAV-VIP", createdAt: now() },
  { id: "u_sales", name: "Divya Iyer", email: "sales@aztechcoworks.in", role: "sales_exec", referralCode: "DIVYA-100", createdAt: now() },
  { id: "u_smgr", name: "Rohit Pillai", email: "salesmgr@aztechcoworks.in", role: "sales_manager", referralCode: "ROHIT-200", createdAt: now() },
  { id: "u_rec", name: "Meera Sundar", email: "reception@aztechcoworks.in", role: "reception", branchId: "br_bk", referralCode: "MEERA-300", createdAt: now() },
  { id: "u_brm", name: "Karthik Raja", email: "branchmgr@aztechcoworks.in", role: "branch_manager", branchId: "br_bk", referralCode: "KARTHIK-400", createdAt: now() },
  { id: "u_fin", name: "Sneha Nair", email: "finance@aztechcoworks.in", role: "finance", referralCode: "SNEHA-500", createdAt: now() },
  { id: "u_mkt", name: "Vikram Joshi", email: "marketing@aztechcoworks.in", role: "marketing", referralCode: "VIKRAM-600", createdAt: now() },
  { id: "u_member", name: "Anjali Menon", email: "anjali@cibylstudios.com", phone: "+91 98765 43210", company: "Cibyl Studios", role: "member", branchId: "br_rs", referralCode: "ANJALI-CW", createdAt: now() },
];

// ─── Leads ───────────────────────────────────────

export const seedLeads: Lead[] = [
  { id: "ld1", name: "Suresh Babu", email: "suresh@orangefin.in", phone: "+91 99887 76655", source: "website", branchId: "br_sb", planId: "pl_team", teamSize: 12, budget: 60000, timeline: "1_month", message: "Looking for a team office for our fintech.", score: 86, stage: "qualified", ownerId: "u_sales", createdAt: now() },
  { id: "ld2", name: "Priya Ramesh", email: "priya@studiokin.co", phone: "+91 90000 23456", source: "website", branchId: "br_rs", planId: "pl_ded", teamSize: 3, budget: 25000, timeline: "immediate", score: 78, stage: "site_visit", ownerId: "u_sales", createdAt: now() },
  { id: "ld3", name: "Manoj K", email: "manoj@indigocode.dev", phone: "+91 90000 99887", source: "whatsapp", branchId: "br_rn", planId: "pl_hot", teamSize: 1, budget: 7000, timeline: "immediate", score: 64, stage: "new", createdAt: now() },
  { id: "ld4", name: "Rahul Verma", email: "rahul@northwindlabs.io", phone: "+91 98800 11223", source: "corporate", branchId: "br_rs", planId: "pl_team", teamSize: 20, budget: 120000, timeline: "3_months", score: 92, stage: "proposal", ownerId: "u_sales", createdAt: now() },
  { id: "ld5", name: "Lakshmi P", email: "lakshmi@brewlab.in", phone: "+91 99000 22334", source: "referral", branchId: "br_rn", planId: "pl_cab", teamSize: 2, budget: 18000, timeline: "exploring", score: 55, stage: "contacted", ownerId: "u_sales", createdAt: now() },
  { id: "ld6", name: "Sandeep V", email: "sandeep@noveltech.co", phone: "+91 88990 22334", source: "website", branchId: "br_at", planId: "pl_ded", teamSize: 4, budget: 30000, timeline: "1_month", score: 70, stage: "won", ownerId: "u_sales", createdAt: now() },
  { id: "ld7", name: "Anita Rao", email: "anita@mintkernel.dev", phone: "+91 88990 99887", source: "website", branchId: "br_pn", teamSize: 6, budget: 35000, timeline: "exploring", score: 45, stage: "lost", ownerId: "u_sales", lostReason: "Went with competitor", createdAt: now() },
];

// ─── Tasks ───────────────────────────────────────

export const seedTasks: Task[] = [
  { id: "tk1", leadId: "ld1", assigneeId: "u_sales", title: "Send proposal to Suresh", dueAt: new Date(Date.now() + 86400000).toISOString(), done: false },
  { id: "tk2", leadId: "ld2", assigneeId: "u_sales", title: "Confirm site visit slot", dueAt: new Date(Date.now() + 3600000 * 4).toISOString(), done: false },
  { id: "tk3", leadId: "ld4", assigneeId: "u_sales", title: "Follow up on negotiation", dueAt: new Date(Date.now() + 86400000 * 2).toISOString(), done: false },
];

// ─── Site Visits ─────────────────────────────────

export const seedSiteVisits: SiteVisit[] = [
  { id: "sv1", leadId: "ld2", branchId: "br_rs", scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", mode: "self_serve" },
];

// ─── Memberships & Invoices ──────────────────────

export const seedMemberships: Membership[] = [
  { id: "mb1", userId: "u_member", planId: "pl_ded", branchId: "br_rs", seats: 1, status: "active", startDate: "2026-01-15", endDate: "2026-07-15" },
];

export const seedInvoices: Invoice[] = [
  { id: "inv1", number: "AZTECH-2026-0001", userId: "u_member", membershipId: "mb1", discountAmount: 0, subtotal: 8500, gst: 1530, total: 10030, status: "paid", issuedAt: "2026-06-01" },
  { id: "inv2", number: "AZTECH-2026-0002", userId: "u_member", membershipId: "mb1", discountAmount: 0, subtotal: 8500, gst: 1530, total: 10030, status: "paid", issuedAt: "2026-05-01" },
];

// ─── Coupons ─────────────────────────────────────

export const seedCoupons: Coupon[] = [
  {
    id: "cp_launch", code: "LAUNCH26", description: "Launch offer — 15% off everything",
    discountType: "percentage", discountValue: 15, maxDiscountAmount: 2000,
    serviceScope: "all", allowedPlanIds: [], allowedBranchIds: [], allowedSeatTypes: [],
    minOrderValue: 0, minDurationMonths: 0, firstPurchaseOnly: false,
    maxUsesTotal: 100, maxUsesPerUser: 1, currentUsesTotal: 0,
    stackable: false, isReferralCoupon: false,
    validFrom: "2026-01-01", validUntil: "2026-12-31", status: "active",
    createdBy: "u_super", createdAt: "2026-01-01T00:00:00Z",
  },
];

// ─── Forms ───────────────────────────────────────

export const seedForms: FormDefinition[] = [
  {
    key: "lead",
    fields: [
      { key: "name", label: "Full name", type: "text", required: true },
      { key: "email", label: "Work email", type: "email", required: true },
      { key: "phone", label: "Phone (WhatsApp)", type: "phone", required: true },
      { key: "branchId", label: "Preferred branch", type: "select", required: false, options: ["br_bk", "br_rs", "br_re", "br_rn", "br_at", "br_sb"] },
      { key: "planId", label: "Workspace type", type: "select", required: false, options: ["pl_hot", "pl_ded", "pl_cab", "pl_team", "pl_ent"] },
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
      { key: "timeline", label: "When do you want to move in?", type: "select", required: true, options: ["immediate", "1_month", "3_months", "exploring"] },
      { key: "message", label: "Requirements", type: "textarea", required: false },
    ],
  },
];

// ─── Workflows ───────────────────────────────────

export const seedWorkflowRules: WorkflowRule[] = [
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

// ─── Blog ────────────────────────────────────────

export const seedBlog: BlogPost[] = [
  {
    id: "bp1",
    slug: "best-coworking-space-in-coimbatore",
    title: "The Best Coworking Space in Coimbatore (2026 Guide)",
    excerpt: "A founder's guide to picking a workspace in Coimbatore — branches, amenities, pricing, and what actually matters.",
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

// ─── Testimonials ────────────────────────────────

export const seedTestimonials: Testimonial[] = [
  { id: "t1", name: "Karthik Subramaniam", company: "Loop Analytics", role: "Founder & CEO", quote: "Aztech let us scale from 3 to 22 people without ever moving offices. The RS Puram branch is our HQ now.", avatar: "photo-1500648767791-00dcc994a43e" },
  { id: "t2", name: "Anjali Menon", company: "Cibyl Studios", role: "Design Lead", quote: "The community is real. We've hired two engineers from coffee chats in the lounge.", avatar: "photo-1438761681033-6461ffad8d80" },
  { id: "t3", name: "Vignesh Raghavan", company: "Northwind Labs", role: "CTO", quote: "Best workspace in Coimbatore, hands down. The Wi-Fi alone is worth it.", avatar: "photo-1472099645785-5658abf4ff4e" },
];

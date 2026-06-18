// Mock in-memory "database" for the Aztech Co-Works app.
// Server-only: the `.server.ts` suffix prevents this module from being
// bundled into the client. Import it only from server functions or
// server route handlers.

export type MockBranch = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  totalSeats: number;
  availableSeats: number;
  amenities: string[];
};

export type MockPlan = {
  id: string;
  name: string;
  seatType: "hot_desk" | "dedicated" | "cabin" | "meeting_room";
  basePrice: number;
  gstPercent: number;
  cadence: "day" | "month" | "hour";
};

export type MockLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  stage: "new" | "contacted" | "tour" | "negotiation" | "won" | "lost";
  score: number;
  createdAt: string;
};

const now = () => new Date().toISOString();

const db: { branches: MockBranch[]; plans: MockPlan[]; leads: MockLead[] } = {
  branches: [
    {
      id: "br_rs_puram",
      slug: "rs-puram",
      name: "Aztech RS Puram",
      city: "Coimbatore",
      address: "DB Road, RS Puram, Coimbatore 641002",
      totalSeats: 240,
      availableSeats: 82,
      amenities: ["High-speed WiFi", "Cafe", "Meeting rooms", "Parking"],
    },
    {
      id: "br_peelamedu",
      slug: "peelamedu",
      name: "Aztech Peelamedu",
      city: "Coimbatore",
      address: "Avinashi Road, Peelamedu, Coimbatore 641004",
      totalSeats: 240,
      availableSeats: 64,
      amenities: ["High-speed WiFi", "Cafe", "Phone booths", "Event space"],
    },
    {
      id: "br_saibaba_colony",
      slug: "saibaba-colony",
      name: "Aztech Saibaba Colony",
      city: "Coimbatore",
      address: "NSR Road, Saibaba Colony, Coimbatore 641011",
      totalSeats: 240,
      availableSeats: 91,
      amenities: ["High-speed WiFi", "Cafe", "Wellness room", "Parking"],
    },
    {
      id: "br_race_course",
      slug: "race-course",
      name: "Aztech Race Course",
      city: "Coimbatore",
      address: "Race Course Road, Coimbatore 641018",
      totalSeats: 240,
      availableSeats: 78,
      amenities: ["High-speed WiFi", "Cafe", "Meeting rooms", "Lounge"],
    },
    {
      id: "br_gandhipuram",
      slug: "gandhipuram",
      name: "Aztech Gandhipuram",
      city: "Coimbatore",
      address: "100ft Road, Gandhipuram, Coimbatore 641012",
      totalSeats: 240,
      availableSeats: 85,
      amenities: ["High-speed WiFi", "Cafe", "Podcast booth", "Parking"],
    },
  ],

  plans: [
    { id: "pln_hot_day", name: "Hot Desk – Day Pass", seatType: "hot_desk", basePrice: 350, gstPercent: 18, cadence: "day" },
    { id: "pln_hot_mo", name: "Hot Desk – Monthly", seatType: "hot_desk", basePrice: 6500, gstPercent: 18, cadence: "month" },
    { id: "pln_ded_mo", name: "Dedicated Desk – Monthly", seatType: "dedicated", basePrice: 8500, gstPercent: 18, cadence: "month" },
    { id: "pln_cab_mo", name: "Private Cabin – Monthly", seatType: "cabin", basePrice: 18000, gstPercent: 18, cadence: "month" },
    { id: "pln_mtg_hr", name: "Meeting Room – Hourly", seatType: "meeting_room", basePrice: 500, gstPercent: 18, cadence: "hour" },
  ],

  leads: [
    { id: "ld_001", name: "Arjun Murali", email: "arjun@example.com", phone: "+91 90000 10001", source: "Website", stage: "new", score: 72, createdAt: now() },
    { id: "ld_002", name: "Priya Selvan", email: "priya@example.com", phone: "+91 90000 10002", source: "Referral", stage: "tour", score: 88, createdAt: now() },
    { id: "ld_003", name: "Karthik R", email: "karthik@example.com", phone: "+91 90000 10003", source: "WhatsApp", stage: "contacted", score: 64, createdAt: now() },
  ],
};

export function listBranches() {
  return db.branches;
}

export function getBranch(slug: string) {
  return db.branches.find((b) => b.slug === slug) ?? null;
}

export function listPlans() {
  return db.plans;
}

export function listLeads() {
  return db.leads;
}

export function createLead(input: Omit<MockLead, "id" | "createdAt" | "score" | "stage"> & { score?: number }) {
  const lead: MockLead = {
    id: `ld_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: input.source,
    stage: "new",
    score: input.score ?? 50,
    createdAt: now(),
  };
  db.leads.unshift(lead);
  return lead;
}

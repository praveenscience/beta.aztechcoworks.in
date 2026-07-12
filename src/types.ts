// ────────────────────────────────────────────────
// Aztech Co-Works — Shared type definitions
// These mirror the planned Postgres schema 1:1.
// ────────────────────────────────────────────────

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

export type SeatType = "hot_desk" | "dedicated" | "cabin" | "team_office" | "enterprise";

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "site_visit"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type LeadSource = "website" | "whatsapp" | "walk_in" | "referral" | "corporate";
export type LeadTimeline = "immediate" | "1_month" | "3_months" | "exploring";

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
  photos?: string[];
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
  source: LeadSource;
  branchId?: string;
  planId?: string;
  teamSize?: number;
  budget?: number;
  timeline?: LeadTimeline;
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

export interface WorkflowCondition {
  field: string;
  op: "eq" | "gt" | "lt";
  value: string | number;
}

export interface WorkflowAction {
  type: "assign_owner" | "create_task" | "send_email" | "change_stage" | "whatsapp_cta";
  payload: Record<string, unknown>;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: "lead_created" | "stage_changed" | "site_visit_scheduled";
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
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

import type { Role, LeadStage, SeatType } from "@/types";

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

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function inr(n: number) {
  return inrFormatter.format(n);
}

export function unsplash(id: string, w = 1200, h = 800) {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

export function whatsappLink(message: string, phone = "919000000000") {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

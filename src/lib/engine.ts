import type { Lead, LeadActivity, Task, WorkflowRule } from "@/types";

/** Score a lead 0–100 based on team size, budget, timeline, and branch preference. */
export function scoreLead(
  lead: Pick<Lead, "teamSize" | "budget" | "timeline" | "branchId">,
): number {
  let s = 30;
  if (lead.teamSize) s += Math.min(lead.teamSize * 2, 25);
  if (lead.budget) s += Math.min(Math.round(lead.budget / 5000), 25);
  if (lead.timeline === "immediate") s += 20;
  else if (lead.timeline === "1_month") s += 12;
  else if (lead.timeline === "3_months") s += 6;
  if (lead.branchId) s += 5;
  return Math.min(s, 100);
}

export interface WorkflowResult {
  ownerId?: string;
  tasks: Omit<Task, "id">[];
  activities: Omit<LeadActivity, "id" | "createdAt">[];
}

/** Evaluate active workflow rules against a new lead. */
export function evaluateWorkflows(
  lead: Lead,
  rules: WorkflowRule[],
): WorkflowResult {
  const result: WorkflowResult = { tasks: [], activities: [] };

  for (const rule of rules) {
    if (!rule.isActive || rule.trigger !== "lead_created") continue;

    const pass = rule.conditions.every((c) => {
      const v = (lead as unknown as Record<string, unknown>)[c.field];
      if (c.op === "eq") return v === c.value;
      if (c.op === "gt") return typeof v === "number" && v > Number(c.value);
      if (c.op === "lt") return typeof v === "number" && v < Number(c.value);
      return true;
    });
    if (!pass) continue;

    for (const a of rule.actions) {
      if (a.type === "assign_owner") {
        result.ownerId = String(a.payload.userId);
      }
      if (a.type === "create_task") {
        result.tasks.push({
          leadId: lead.id,
          assigneeId: result.ownerId ?? "u_sales",
          title: String(a.payload.title ?? "Follow up"),
          dueAt: new Date(
            Date.now() + Number(a.payload.dueInDays ?? 1) * 86400000,
          ).toISOString(),
          done: false,
        });
      }
      result.activities.push({
        leadId: lead.id,
        type:
          a.type === "send_email"
            ? "email"
            : a.type === "whatsapp_cta"
              ? "whatsapp"
              : "note",
        description: `Workflow "${rule.name}" → ${a.type}`,
      });
    }
  }

  return result;
}

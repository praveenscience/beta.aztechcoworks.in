import { describe, it, expect } from "vitest";
import { scoreLead, evaluateWorkflows } from "../engine";
import type { Lead, WorkflowRule } from "@/types";

describe("scoreLead", () => {
  it("returns base score of 30 for empty lead", () => {
    expect(scoreLead({})).toBe(30);
  });

  it("scores higher for larger team size", () => {
    const small = scoreLead({ teamSize: 2 });
    const large = scoreLead({ teamSize: 10 });
    expect(large).toBeGreaterThan(small);
  });

  it("scores higher for bigger budget", () => {
    const low = scoreLead({ budget: 5000 });
    const high = scoreLead({ budget: 50000 });
    expect(high).toBeGreaterThan(low);
  });

  it("scores immediate timeline highest", () => {
    const immediate = scoreLead({ timeline: "immediate" });
    const oneMonth = scoreLead({ timeline: "1_month" });
    const threeMonths = scoreLead({ timeline: "3_months" });
    const exploring = scoreLead({ timeline: "exploring" });
    expect(immediate).toBeGreaterThan(oneMonth);
    expect(oneMonth).toBeGreaterThan(threeMonths);
    expect(threeMonths).toBeGreaterThan(exploring);
  });

  it("adds 5 points for having a branch preference", () => {
    const without = scoreLead({});
    const withBranch = scoreLead({ branchId: "br_bk" });
    expect(withBranch - without).toBe(5);
  });

  it("caps at 100", () => {
    const score = scoreLead({ teamSize: 50, budget: 500000, timeline: "immediate", branchId: "br_bk" });
    expect(score).toBe(100);
  });
});

describe("evaluateWorkflows", () => {
  const baseLead: Lead = {
    id: "ld_test",
    name: "Test",
    email: "test@test.com",
    phone: "1234567890",
    source: "website",
    score: 80,
    stage: "new",
    createdAt: new Date().toISOString(),
  };

  it("returns empty result with no rules", () => {
    const result = evaluateWorkflows(baseLead, []);
    expect(result.ownerId).toBeUndefined();
    expect(result.tasks).toHaveLength(0);
    expect(result.activities).toHaveLength(0);
  });

  it("skips inactive rules", () => {
    const rule: WorkflowRule = {
      id: "wf1",
      name: "Test Rule",
      trigger: "lead_created",
      conditions: [],
      actions: [{ type: "assign_owner", payload: { userId: "u_sales" } }],
      isActive: false,
    };
    const result = evaluateWorkflows(baseLead, [rule]);
    expect(result.ownerId).toBeUndefined();
  });

  it("assigns owner from matching rule", () => {
    const rule: WorkflowRule = {
      id: "wf1",
      name: "Auto-assign",
      trigger: "lead_created",
      conditions: [],
      actions: [{ type: "assign_owner", payload: { userId: "u_sales" } }],
      isActive: true,
    };
    const result = evaluateWorkflows(baseLead, [rule]);
    expect(result.ownerId).toBe("u_sales");
  });

  it("creates task from matching rule", () => {
    const rule: WorkflowRule = {
      id: "wf1",
      name: "Create task",
      trigger: "lead_created",
      conditions: [],
      actions: [{ type: "create_task", payload: { title: "Follow up", dueInDays: 2 } }],
      isActive: true,
    };
    const result = evaluateWorkflows(baseLead, [rule]);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe("Follow up");
    expect(result.tasks[0].leadId).toBe("ld_test");
  });

  it("evaluates conditions correctly", () => {
    const lead = { ...baseLead, score: 80 };
    const rule: WorkflowRule = {
      id: "wf1",
      name: "High score",
      trigger: "lead_created",
      conditions: [{ field: "score", op: "gt", value: 70 }],
      actions: [{ type: "assign_owner", payload: { userId: "u_smgr" } }],
      isActive: true,
    };
    const result = evaluateWorkflows(lead, [rule]);
    expect(result.ownerId).toBe("u_smgr");

    // Lead with low score should not match
    const lowLead = { ...baseLead, score: 50 };
    const result2 = evaluateWorkflows(lowLead, [rule]);
    expect(result2.ownerId).toBeUndefined();
  });
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Typed RPC wrappers around the mock server "DB". Call these from
// components/loaders via `useServerFn` — they execute server-only.

export const getMockBranches = createServerFn({ method: "GET" }).handler(async () => {
  const { listBranches } = await import("@/server/mock-db.server");
  return { branches: listBranches() };
});

export const getMockPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { listPlans } = await import("@/server/mock-db.server");
  return { plans: listPlans() };
});

export const getMockLeads = createServerFn({ method: "GET" }).handler(async () => {
  const { listLeads } = await import("@/server/mock-db.server");
  return { leads: listLeads() };
});

export const createMockLead = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(1).max(120),
        email: z.string().email(),
        phone: z.string().min(5).max(20),
        source: z.string().min(1).max(40),
        score: z.number().min(0).max(100).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { createLead } = await import("@/server/mock-db.server");
    return { lead: createLead(data) };
  });

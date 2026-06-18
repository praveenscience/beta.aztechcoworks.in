import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const LeadInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(20),
  source: z.string().min(1).max(40),
  score: z.number().min(0).max(100).optional(),
});

export const Route = createFileRoute("/api/mock/leads")({
  server: {
    handlers: {
      GET: async () => {
        const { listLeads } = await import("@/server/mock-db.server");
        return Response.json({ leads: listLeads() });
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const parsed = LeadInput.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const { createLead } = await import("@/server/mock-db.server");
        const lead = createLead(parsed.data);
        return Response.json({ lead }, { status: 201 });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mock/plans")({
  server: {
    handlers: {
      GET: async () => {
        const { listPlans } = await import("@/server/mock-db.server");
        return Response.json({ plans: listPlans() });
      },
    },
  },
});

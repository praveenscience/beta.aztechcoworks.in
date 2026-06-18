import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mock/branches")({
  server: {
    handlers: {
      GET: async () => {
        const { listBranches } = await import("@/server/mock-db.server");
        return Response.json({ branches: listBranches() });
      },
    },
  },
});

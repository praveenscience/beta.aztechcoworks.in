import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: DashboardShell,
});

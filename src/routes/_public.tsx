import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader, SiteFooter, WhatsAppFab } from "@/components/site-chrome";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

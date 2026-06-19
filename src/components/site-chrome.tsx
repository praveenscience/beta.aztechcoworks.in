import { Link } from "@tanstack/react-router";
import { Menu, MapPin, MessageCircle, Sparkles, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { whatsappLink } from "@/lib/format";
import type { Role } from "@/types";

const navItems = [
  { to: "/branches", label: "Branches" },
  { to: "/pricing", label: "Pricing" },
  { to: "/corporate", label: "Corporate" },
  { to: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const me = users.find((u) => u.id === currentUserId);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-gradient text-accent-foreground shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base">Aztech<span className="text-muted-foreground"> Co-Works</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="hidden md:inline-flex"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link to="/book-visit">
              <MapPin className="mr-1.5 h-4 w-4" /> Book a visit
            </Link>
          </Button>
          {me ? (
            <Button asChild size="sm">
              <Link to={dashboardHomeFor(me.role)}>{me.name.split(" ")[0]}</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="mt-8 flex flex-col gap-2">
                {navItems.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {n.label}
                  </Link>
                ))}
                <Link
                  to="/book-visit"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Book a visit
                </Link>
                <Button onClick={toggleDark} variant="outline" className="mt-2 justify-start">
                  {dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {dark ? "Light mode" : "Dark mode"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-gradient text-accent-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            Aztech Co-Works
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Coimbatore's premium coworking & managed office network. 5 branches, 1,200 seats.
          </p>
        </div>
        <FooterCol
          title="Workspace"
          links={[
            { to: "/branches", label: "All branches" },
            { to: "/pricing", label: "Pricing" },
            { to: "/corporate", label: "Corporate solutions" },
            { to: "/book-visit", label: "Book a site visit" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { to: "/blog", label: "Blog" },
            { to: "/auth", label: "Sign in" },
          ]}
        />
        <div>
          <div className="text-sm font-semibold">Get in touch</div>
          <p className="mt-3 text-sm text-muted-foreground">
            R.S. Puram, Coimbatore<br />
            Tamil Nadu — 641002<br />
            <a className="text-foreground hover:text-accent" href="tel:+919000000000">+91 90000 00000</a><br />
            <a className="text-foreground hover:text-accent" href="mailto:hello@aztechcoworks.in">hello@aztechcoworks.in</a>
          </p>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:px-6">
          <div>© 2026 Aztech Co-Works. All rights reserved.</div>
          <div>Made in Coimbatore, India.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="hover:text-foreground">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink("Hi Aztech! I'd like to know more about your coworking spaces.")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground shadow-elegant transition hover:scale-105 active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

export function dashboardHomeFor(role: Role): string {
  switch (role) {
    case "member": return "/dashboard";
    case "reception": return "/staff/reception";
    case "sales_exec":
    case "sales_manager": return "/staff/sales";
    case "branch_manager": return "/staff/branch";
    case "finance": return "/staff/finance";
    case "marketing": return "/staff/marketing";
    case "super_admin": return "/admin/branches";
    default: return "/";
  }
}

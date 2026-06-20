import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { dashboardHomeFor } from "@/components/site-chrome";
import { ArrowRight, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { useDemoLogin, useLogin, useRegister } from "@/lib/queries";
import type { Role } from "@/types";
import { roleLabels } from "@/lib/format";

export const Route = createFileRoute("/_public/auth")({
  head: () => ({
    meta: [{ title: "Sign in — Aztech Co-Works" }],
  }),
  component: AuthPage,
});

const DEMO_ROLES: { id: string; label: string; role: Role; desc: string }[] = [
  { id: "u_member", label: "Anjali Menon", role: "member", desc: "Cibyl Studios · Active dedicated desk member" },
  { id: "u_sales", label: "Divya Iyer", role: "sales_exec", desc: "Owns ~12 active leads" },
  { id: "u_smgr", label: "Rohit Pillai", role: "sales_manager", desc: "Manages the sales team" },
  { id: "u_rec", label: "Meera Sundar", role: "reception", desc: "R.S. Puram branch reception" },
  { id: "u_brm", label: "Karthik Raja", role: "branch_manager", desc: "R.S. Puram branch manager" },
  { id: "u_fin", label: "Sneha Nair", role: "finance", desc: "Invoices, payments, GST" },
  { id: "u_mkt", label: "Vikram Joshi", role: "marketing", desc: "Leads, campaigns, blog" },
  { id: "u_super", label: "Aarav Kumar", role: "super_admin", desc: "Full platform access" },
];

function AuthPage() {
  const navigate = useNavigate();
  const demoLogin = useDemoLogin();
  const login = useLogin();
  const register = useRegister();
  const [form, setForm] = useState({ email: "", password: "" });

  const pickDemo = (userId: string, role: Role) => {
    demoLogin.mutate(userId, {
      onSuccess: () => {
        toast.success(`Signed in as ${roleLabels[role]}`);
        navigate({ to: dashboardHomeFor(role) });
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;

    // Try login first, if it fails try register
    login.mutate(form, {
      onSuccess: (user) => {
        toast.success(`Welcome back, ${user.name}!`);
        navigate({ to: dashboardHomeFor(user.role) });
      },
      onError: () => {
        register.mutate({ name: form.email.split("@")[0], ...form }, {
          onSuccess: (user) => {
            toast.success("Welcome to Aztech!");
            navigate({ to: dashboardHomeFor(user.role) });
          },
          onError: (err) => toast.error(err.message),
        });
      },
    });
  };

  return (
      <main className="container mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">
        <div>
          <Badge variant="outline" className="mb-3">
            <Sparkles className="mr-1 h-3 w-3" /> Demo mode
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">Pick a role to explore</h1>
          <p className="mt-2 text-muted-foreground">
            Click any role to instantly enter that dashboard. All demo accounts use password <code className="text-foreground">demo1234</code>.
          </p>
          <div className="mt-6 grid gap-3">
            {DEMO_ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => pickDemo(r.id, r.role)}
                disabled={demoLogin.isPending}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-accent/50 hover:shadow-soft"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
                <Badge variant="secondary">{roleLabels[r.role]}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </button>
            ))}
          </div>
        </div>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Or sign in / sign up</CardTitle>
            <CardDescription>Use your email and password. New accounts are created automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <Button className="w-full" type="submit" size="lg" disabled={login.isPending || register.isPending}>
                {login.isPending || register.isPending ? "Signing in..." : "Sign in / Create account"}
              </Button>
            </form>
            <div className="mt-6 rounded-lg bg-secondary/60 p-4 text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> This connects to the local API server at <code>localhost:3001</code>.
              Make sure the backend is running: <code>cd server && npm run dev</code>.
              <Link to="/" className="ml-1 text-accent hover:underline">Back to site</Link>.
            </div>
          </CardContent>
        </Card>
      </main>
  );
}

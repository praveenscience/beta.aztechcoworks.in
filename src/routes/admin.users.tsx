import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore, roleLabels, type Role } from "@/lib/store";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

const ALL_ROLES: Role[] = ["member", "reception", "sales_exec", "sales_manager", "branch_manager", "finance", "marketing", "super_admin"];

function AdminUsers() {
  const users = useStore((s) => s.users);
  const branches = useStore((s) => s.branches);
  const upsertUser = useStore((s) => s.upsertUser);
  const [form, setForm] = useState({ name: "", email: "", role: "member" as Role, branchId: "" });

  return (
    <>
      <PageHeader title="Users & roles" description="Granular permissions for every team member." />
      <Card>
        <CardHeader>
          <CardTitle>Add a team member</CardTitle>
          <CardDescription>They'll get instant access matching their role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              upsertUser({
                id: `u_${Math.random().toString(36).slice(2, 7)}`,
                name: form.name,
                email: form.email,
                role: form.role,
                branchId: form.branchId || undefined,
                referralCode: `${form.name.toUpperCase().slice(0, 6)}-NEW`,
                createdAt: new Date().toISOString(),
              });
              toast.success("User added");
              setForm({ name: "", email: "", role: "member", branchId: "" });
            }}
            className="grid gap-3 sm:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto]"
          >
            <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
              <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit"><Plus className="mr-1.5 h-4 w-4" />Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>All users ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Code</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="text-muted-foreground">{u.email}</td>
                  <td>
                    <Select value={u.role} onValueChange={(v) => upsertUser({ ...u, role: v as Role })}>
                      <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td>{branches.find((b) => b.id === u.branchId)?.name ?? "—"}</td>
                  <td><Badge variant="secondary" className="font-mono text-xs">{u.referralCode}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

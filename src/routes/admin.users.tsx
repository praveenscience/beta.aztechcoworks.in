import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useBranches, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/queries";
import type { Role } from "@/types";
import { roleLabels } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

const ALL_ROLES: Role[] = ["member", "reception", "sales_exec", "sales_manager", "branch_manager", "finance", "marketing", "super_admin"];

function roleBadgeColor(role: Role) {
  if (role === "super_admin") return "destructive" as const;
  if (role === "member") return "secondary" as const;
  return "default" as const;
}

function AdminUsers() {
  const { data: users = [] } = useUsers();
  const { data: branches = [] } = useBranches();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "member" as Role, branchId: "" });
  const [editing, setEditing] = useState<typeof users[number] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        roleLabels[u.role as Role]?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const openEdit = (u: typeof users[number]) => {
    setEditing(u);
    setEditOpen(true);
  };

  const handleDelete = (u: typeof users[number]) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    deleteUserMutation.mutate(u.id, {
      onSuccess: () => toast.success(`Deleted ${u.name}`),
      onError: (e: any) => toast.error(e.message || "Failed to delete"),
    });
  };

  return (
    <>
      <PageHeader title="Users & roles" description="Manage team members, assign roles, and control access." />

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditing(null); }}>
        {editing && (
          <EditUserDialog
            key={editing.id}
            user={editing}
            branches={branches}
            onSave={(patch) => {
              updateUserMutation.mutate(
                { id: editing.id, ...patch },
                { onSuccess: () => { toast.success(`Updated ${patch.name || editing.name}`); setEditOpen(false); setEditing(null); } },
              );
            }}
          />
        )}
      </Dialog>

      {/* Add user form */}
      <Card>
        <CardHeader>
          <CardTitle>Add a team member</CardTitle>
          <CardDescription>They'll get instant access matching their role. Default password: changeme123</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createUserMutation.mutate(
                { name: form.name, email: form.email, phone: form.phone || undefined, role: form.role, branchId: form.branchId || undefined },
                { onSuccess: () => { toast.success("User added"); setForm({ name: "", email: "", phone: "", role: "member", branchId: "" }); } },
              );
            }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_auto]"
          >
            <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
              <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No branch</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={createUserMutation.isPending}><Plus className="mr-1.5 h-4 w-4" />Add</Button>
          </form>
        </CardContent>
      </Card>

      {/* User table */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All users ({users.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="pr-3">Email</th>
                  <th className="pr-3">Phone</th>
                  <th className="pr-3">Role</th>
                  <th className="pr-3">Branch</th>
                  <th className="pr-3">Referral</th>
                  <th className="pr-3">Joined</th>
                  <th className="w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{u.name}</div>
                      {u.company && <div className="text-xs text-muted-foreground">{u.company}</div>}
                    </td>
                    <td className="pr-3 text-muted-foreground">{u.email}</td>
                    <td className="pr-3 text-muted-foreground">{u.phone || "—"}</td>
                    <td className="pr-3">
                      <Badge variant={roleBadgeColor(u.role as Role)}>{roleLabels[u.role as Role]}</Badge>
                    </td>
                    <td className="pr-3 text-xs">{branches.find((b) => b.id === u.branchId)?.name ?? "—"}</td>
                    <td className="pr-3"><Badge variant="secondary" className="font-mono text-xs">{u.referralCode}</Badge></td>
                    <td className="pr-3 text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(u)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">
                    {search ? "No users match your search." : "No users yet."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function EditUserDialog({
  user,
  branches,
  onSave,
}: {
  user: { id: string; name: string; email: string; phone?: string; company?: string; role: string; branchId?: string };
  branches: { id: string; name: string }[];
  onSave: (patch: { name?: string; email?: string; phone?: string; company?: string; role?: string; branchId?: string }) => void;
}) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    company: user.company || "",
    role: user.role as Role,
    branchId: user.branchId || "",
  });

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>

      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
        </div>
        <div>
          <Label>Company</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Optional" />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Branch</Label>
          <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
            <SelectTrigger><SelectValue placeholder="No branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No branch</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.email.trim()}>
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

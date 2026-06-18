import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/visitors")({
  component: VisitorsPage,
});

function VisitorsPage() {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const branches = useStore((s) => s.branches);
  const visitors = useStore(useShallow((s) => s.visitors.filter((v) => v.hostUserId === me?.id)));
  const addVisitor = useStore((s) => s.addVisitor);
  const [form, setForm] = useState({ name: "", phone: "", purpose: "Meeting", branchId: me?.branchId ?? branches[0]?.id, expectedAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16) });
  if (!me) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addVisitor({
      hostUserId: me.id,
      branchId: form.branchId!,
      name: form.name,
      phone: form.phone,
      purpose: form.purpose,
      expectedAt: new Date(form.expectedAt).toISOString(),
    });
    toast.success("Visitor pre-registered. QR pass emailed (demo).");
    setForm({ ...form, name: "", phone: "" });
  };

  return (
    <>
      <PageHeader title="Visitors" description="Pre-register guests for a faster check-in." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pre-register a visitor</CardTitle>
            <CardDescription>They'll receive an SMS + email with a QR pass.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div><Label>Visitor name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div>
                <Label>Purpose</Label>
                <Select value={form.purpose} onValueChange={(v) => setForm({ ...form, purpose: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Meeting", "Delivery", "Interview", "Investor", "Personal"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Branch</Label>
                <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Expected arrival</Label><Input type="datetime-local" value={form.expectedAt} onChange={(e) => setForm({ ...form, expectedAt: e.target.value })} /></div>
              <Button type="submit" className="sm:col-span-2">Pre-register & send QR</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent visitors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visitors.length === 0 && <p className="text-sm text-muted-foreground">No visitors yet.</p>}
            {visitors.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-foreground text-background"><QrCode className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.purpose} · {new Date(v.expectedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
                </div>
                <Badge variant="secondary" className="font-mono">{v.qrToken}</Badge>
                {v.checkedInAt && <Badge className="bg-success text-success-foreground hover:bg-success">in</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

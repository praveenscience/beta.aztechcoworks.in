import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Archive, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAllBranches, useUpsertBranch } from "@/lib/queries";
import type { Branch } from "@/types";
import { unsplash } from "@/lib/format";

export const Route = createFileRoute("/admin/branches")({
  component: AdminBranches,
});

const EMPTY: Branch = {
  id: "",
  slug: "",
  name: "",
  address: "",
  city: "Coimbatore",
  phone: "+91 ",
  hours: "Mon–Sat · 8:00 AM – 10:00 PM",
  amenities: ["Wi-Fi", "Power backup", "Cafeteria"],
  totalSeats: 100,
  availableSeats: 50,
  isActive: true,
  photo: "photo-1497366216548-37526070297c",
  description: "",
};

function AdminBranches() {
  const { data: branches = [] } = useAllBranches();
  const upsertBranchMutation = useUpsertBranch();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);

  const save = (b: Branch) => {
    if (!b.id) b.id = `br_${Math.random().toString(36).slice(2, 7)}`;
    if (!b.slug) b.slug = b.name.toLowerCase().replace(/\s+/g, "-");
    upsertBranchMutation.mutate(b, { onSuccess: () => { toast.success(`Saved ${b.name}`); setOpen(false); setEditing(null); } });
  };

  const archive = (b: Branch) => {
    upsertBranchMutation.mutate({ ...b, isActive: false }, { onSuccess: () => toast.success("Archived") });
  };

  return (
    <>
      <PageHeader
        title="Branches"
        description="Create, edit, and archive branches. Configure capacity, hours, and amenities."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing({ ...EMPTY })}><Plus className="mr-1.5 h-4 w-4" /> New branch</Button>
            </DialogTrigger>
            <BranchDialog branch={editing} onSave={save} />
          </Dialog>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((b) => (
          <Card key={b.id} className={!b.isActive ? "opacity-60" : ""}>
            <img src={unsplash(b.photo, 600, 350)} alt={b.name} className="aspect-[16/10] w-full rounded-t-xl object-cover" />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {b.name}
                {!b.isActive && <Badge variant="secondary">Archived</Badge>}
              </CardTitle>
              <CardDescription>{b.address}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{b.totalSeats} seats · {b.availableSeats} free</span>
              <div className="flex gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                  </DialogTrigger>
                  <BranchDialog branch={editing} onSave={save} />
                </Dialog>
                <Button size="sm" variant="ghost" onClick={() => archive(b)}>
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function BranchDialog({ branch, onSave }: { branch: Branch | null; onSave: (b: Branch) => void }) {
  const [b, setB] = useState<Branch>(branch ?? EMPTY);
  if (!branch) return null;
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{b.id ? "Edit branch" : "New branch"}</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Name</Label><Input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} /></div>
        <div><Label>Slug</Label><Input value={b.slug} onChange={(e) => setB({ ...b, slug: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Address</Label><Input value={b.address} onChange={(e) => setB({ ...b, address: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={b.phone} onChange={(e) => setB({ ...b, phone: e.target.value })} /></div>
        <div><Label>Hours</Label><Input value={b.hours} onChange={(e) => setB({ ...b, hours: e.target.value })} /></div>
        <div><Label>Total seats</Label><Input type="number" value={b.totalSeats} onChange={(e) => setB({ ...b, totalSeats: Number(e.target.value) })} /></div>
        <div><Label>Available seats</Label><Input type="number" value={b.availableSeats} onChange={(e) => setB({ ...b, availableSeats: Number(e.target.value) })} /></div>
        <div className="sm:col-span-2"><Label>Amenities (comma-separated)</Label>
          <Input value={b.amenities.join(", ")} onChange={(e) => setB({ ...b, amenities: e.target.value.split(",").map((a) => a.trim()) })} />
        </div>
        <div className="sm:col-span-2"><Label>Photo</Label><Input value={b.photo} onChange={(e) => setB({ ...b, photo: e.target.value })} placeholder="Full URL or Unsplash ID" />
          <p className="text-xs text-muted-foreground mt-1">Paste a full image URL (https://...) or an Unsplash ID</p>
        </div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea value={b.description} onChange={(e) => setB({ ...b, description: e.target.value })} rows={3} /></div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Switch checked={b.isActive} onCheckedChange={(v) => setB({ ...b, isActive: v })} />
          <Label>Active (visible on public site)</Label>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(b)}>Save branch</Button>
      </DialogFooter>
    </DialogContent>
  );
}

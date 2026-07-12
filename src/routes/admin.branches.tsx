import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Archive, Pencil, Upload, X, Star, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAllBranches, useUpsertBranch } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { Branch } from "@/types";
import { unsplash } from "@/lib/format";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
  photos: [],
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
              <span>{b.totalSeats} seats · {b.availableSeats} free · {(b.photos ?? []).length} photos</span>
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

function PhotoUploader({ branchId, photos, cover, onUpdate }: {
  branchId: string;
  photos: string[];
  cover: string;
  onUpdate: (photos: string[], cover: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!branchId || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("photos", f));

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/branches/${branchId}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onUpdate(data.photos, data.photo);
      qc.invalidateQueries({ queryKey: ["all-branches"] });
      toast.success(`${data.uploaded.length} photo(s) uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [branchId, onUpdate, qc]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) uploadFiles(files);
  }, [uploadFiles]);

  const deletePhoto = async (url: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/branches/${branchId}/photos`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      onUpdate(data.photos, data.photo);
      qc.invalidateQueries({ queryKey: ["all-branches"] });
      toast.success("Photo removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    }
  };

  const setCover = (url: string) => {
    onUpdate(photos, url);
  };

  // Resolve photo src: /photos/... needs API_BASE prefix, full URLs stay as-is
  const photoSrc = (url: string) => {
    if (url.startsWith("/")) return `${API_BASE}${url}`;
    return unsplash(url, 300, 200);
  };

  return (
    <div className="space-y-3">
      <Label>Photos</Label>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        )}
        <div>
          <span className="text-sm font-medium">{uploading ? "Uploading..." : "Drop photos here or click to browse"}</span>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, AVIF · Max 5MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-lg border">
              <img src={photoSrc(url)} alt="" className="h-full w-full object-cover" />
              {/* Cover badge */}
              {url === cover && (
                <span className="absolute top-1 left-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  <Star className="h-2.5 w-2.5 fill-amber-400" /> Cover
                </span>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                {url !== cover && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCover(url); }}
                    className="rounded-full bg-white/90 p-1.5 text-xs shadow hover:bg-white"
                    title="Set as cover"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deletePhoto(url); }}
                  className="rounded-full bg-white/90 p-1.5 text-xs shadow hover:bg-red-100"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BranchDialog({ branch, onSave }: { branch: Branch | null; onSave: (b: Branch) => void }) {
  const [b, setB] = useState<Branch>(branch ?? EMPTY);
  if (!branch) return null;

  const hasSavedBranch = !!branch.id && branch.id !== "";

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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

        {/* Photo upload (only for saved branches) */}
        {hasSavedBranch ? (
          <div className="sm:col-span-2">
            <PhotoUploader
              branchId={b.id}
              photos={b.photos ?? []}
              cover={b.photo}
              onUpdate={(photos, cover) => setB({ ...b, photos, photo: cover })}
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <Label>Cover photo</Label>
            <Input value={b.photo} onChange={(e) => setB({ ...b, photo: e.target.value })} placeholder="Full URL or Unsplash ID" />
            <p className="text-xs text-muted-foreground mt-1">Save the branch first, then you can upload photos</p>
          </div>
        )}

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

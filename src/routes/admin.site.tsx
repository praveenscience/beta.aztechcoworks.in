import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, GripVertical, ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings, useUpdateHeroImages, useUpdateClientLogos } from "@/lib/queries";
import { unsplash } from "@/lib/format";
import type { ClientLogo } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const Route = createFileRoute("/admin/site")({
  component: AdminSite,
});

function AdminSite() {
  const { data: settings, isLoading } = useSiteSettings();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Site settings" description="Manage hero images and trusted client logos." />
        <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Site settings" description="Manage hero banner images and trusted client logos on the homepage." />
      <div className="space-y-6">
        <HeroImagesEditor images={settings?.heroImages ?? []} />
        <ClientLogosEditor logos={settings?.clientLogos ?? []} />
      </div>
    </>
  );
}

// ─── Hero Images ──────────────────────────────────

function HeroImagesEditor({ images: initial }: { images: string[] }) {
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mutation = useUpdateHeroImages();

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "hero");
      const res = await fetch(`${API_BASE}/api/dashboard/site-settings/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImages((prev) => [...prev, data.url]);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = () => {
    mutation.mutate(images, {
      onSuccess: () => toast.success("Hero images updated"),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero banner images</CardTitle>
        <CardDescription>
          These appear in the hero section on the homepage. The first 3 images are shown in the collage grid.
          Upload your own or use Unsplash IDs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <div key={`${img}-${i}`} className="group relative overflow-hidden rounded-xl border">
              <img
                src={unsplash(img, 400, 300)}
                alt={`Hero ${i + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                <Button
                  size="sm" variant="destructive"
                  onClick={() => remove(i)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                </Button>
              </div>
              <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                {i + 1}
              </div>
            </div>
          ))}

          {/* Upload tile */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition hover:border-accent hover:text-accent"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Upload image</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={mutation.isPending}>
            <Save className="mr-1.5 h-4 w-4" /> Save hero images
          </Button>
          <span className="text-xs text-muted-foreground">{images.length} image(s)</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Client Logos ──────────────────────────────────

function ClientLogosEditor({ logos: initial }: { logos: ClientLogo[] }) {
  const [logos, setLogos] = useState<ClientLogo[]>(initial);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadIdx, setUploadIdx] = useState<number>(-1);
  const mutation = useUpdateClientLogos();

  const addClient = () => {
    setLogos((prev) => [...prev, { name: "", logo: "" }]);
  };

  const updateClient = (idx: number, patch: Partial<ClientLogo>) => {
    setLogos((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const removeClient = (idx: number) => {
    setLogos((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadLogo = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "logo");
      const res = await fetch(`${API_BASE}/api/dashboard/site-settings/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      updateClient(idx, { logo: data.url });
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  };

  const save = () => {
    const valid = logos.filter((l) => l.name.trim());
    mutation.mutate(valid, {
      onSuccess: () => toast.success("Client logos updated"),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trusted clients</CardTitle>
        <CardDescription>
          Client names and logos shown in the "Trusted by teams at" section on the homepage.
          Logos are optional — if not set, only the company name is displayed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

              {/* Logo preview / upload */}
              <button
                onClick={() => {
                  setUploadIdx(i);
                  fileRef.current?.click();
                }}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted"
              >
                {uploading === i ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : logo.logo ? (
                  <img
                    src={unsplash(logo.logo)}
                    alt={logo.name}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </button>

              <div className="flex-1">
                <Input
                  value={logo.name}
                  onChange={(e) => updateClient(i, { name: e.target.value })}
                  placeholder="Company name"
                  className="h-8"
                />
              </div>

              {logo.logo && (
                <Button
                  size="sm" variant="ghost"
                  onClick={() => updateClient(i, { logo: "" })}
                  title="Remove logo"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}

              <Button
                size="sm" variant="ghost"
                onClick={() => removeClient(i)}
                title="Remove client"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && uploadIdx >= 0) uploadLogo(uploadIdx, file);
            e.target.value = "";
          }}
        />

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={addClient}>
            <Plus className="mr-1.5 h-4 w-4" /> Add client
          </Button>
          <Button onClick={save} disabled={mutation.isPending}>
            <Save className="mr-1.5 h-4 w-4" /> Save clients
          </Button>
          <span className="text-xs text-muted-foreground">{logos.length} client(s)</span>
        </div>
      </CardContent>
    </Card>
  );
}

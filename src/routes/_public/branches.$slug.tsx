import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useBranch, usePlans, useCreateLead } from "@/lib/queries";
import { unsplash, inr, whatsappLink, seatTypeLabels } from "@/lib/format";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
function photoSrc(url: string, w = 800, h = 500) {
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return unsplash(url, w, h);
}

export const Route = createFileRoute("/_public/branches/$slug")({
  component: BranchDetail,
});

function Lightbox({ photos, initial, branchName, onClose }: {
  photos: string[];
  initial: number;
  branchName: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initial);

  const prev = useCallback(() => setIdx((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative flex h-full w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20" aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        {/* Counter */}
        <span className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur">
          {idx + 1} / {photos.length}
        </span>

        {/* Prev */}
        {photos.length > 1 && (
          <button onClick={prev} className="absolute left-3 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20" aria-label="Previous photo">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <img
          src={photoSrc(photos[idx], 1600, 1000)}
          alt={`${branchName} photo ${idx + 1}`}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        />

        {/* Next */}
        {photos.length > 1 && (
          <button onClick={next} className="absolute right-3 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20" aria-label="Next photo">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}

function BranchDetail() {
  const { slug } = Route.useParams();
  const { data: branch } = useBranch(slug);
  const { data: plans = [] } = usePlans();
  const createLead = useCreateLead();
  const [form, setForm] = useState({ name: "", email: "", phone: "", planId: "", message: "" });
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!branch) throw notFound();

  // Combine cover + album photos, deduplicated
  const allPhotos = [branch.photo, ...(branch.photos ?? []).filter((p) => p !== branch.photo)];

  const seatInventory = branch.seatInventory;
  const rooms = branch.meetingRooms;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate(
      {
        ...form,
        source: "website",
        branchId: branch.id,
        planId: form.planId || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Got it! Our team will reach out shortly.");
          setForm({ name: "", email: "", phone: "", planId: "", message: "" });
        },
      },
    );
  };

  return (
      <main>
        <section className="group relative h-[420px] cursor-pointer overflow-hidden" onClick={() => setLightbox(0)}>
          <img src={photoSrc(branch.photo, 1800, 900)} alt={branch.name} className="h-full w-full object-cover transition group-hover:scale-[1.02]" width={1800} height={900} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-10 text-white md:px-6">
            <Badge className="border-white/20 bg-white/10 text-white backdrop-blur">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> {branch.availableSeats} seats available
            </Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{branch.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-white/80"><MapPin className="h-4 w-4" />{branch.address}</p>
          </div>
        </section>

        <section className="container mx-auto grid gap-10 px-4 py-12 md:px-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-10">
            {/* Photo gallery (skip cover since it's the hero) */}
            {allPhotos.length > 1 && (
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Gallery</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {allPhotos.slice(1).map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(i + 1)}
                      className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <img
                        src={photoSrc(p)}
                        alt={`${branch.name} photo ${i + 2}`}
                        className="aspect-[4/3] w-full object-cover transition hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lightbox !== null && (
              <Lightbox
                photos={allPhotos}
                initial={lightbox}
                branchName={branch.name}
                onClose={() => setLightbox(null)}
              />
            )}

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">About this branch</h2>
              <p className="mt-3 text-muted-foreground">{branch.description}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {branch.hours}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {branch.phone}</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Available workspaces</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {seatInventory.map((si) => (
                  <Card key={si.type}>
                    <CardHeader>
                      <CardTitle className="text-base">{seatTypeLabels[si.type]}</CardTitle>
                      <CardDescription>
                        {si.available} of {si.total} available
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inr(si.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Meeting rooms</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {rooms.map((r) => (
                  <Card key={r.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{r.name}</CardTitle>
                      <CardDescription>Seats {r.capacity}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-lg font-semibold">{inr(r.hourlyPrice)}<span className="text-xs font-normal text-muted-foreground">/hour</span></CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Amenities</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {branch.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success" /> {a}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Location</h2>
              <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
                <iframe
                  title={`${branch.name} map`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(branch.address)}&output=embed`}
                  className="h-full w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Enquire about {branch.name}</CardTitle>
                <CardDescription>We'll respond within 30 minutes during working hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (WhatsApp)</Label>
                    <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                      <SelectTrigger><SelectValue placeholder="What are you looking for?" /></SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="msg">Message</Label>
                    <Textarea id="msg" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <Button className="w-full" type="submit">Send enquiry</Button>
                  <a
                    href={whatsappLink(`Hi! I'd like to enquire about ${branch.name}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-success text-success-foreground py-2 text-sm font-medium transition hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp us
                  </a>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/book-visit" search={{ branch: branch.slug }}>
                      Book a site visit <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
  );
}

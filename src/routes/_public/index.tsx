import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Sparkles,
  Wifi,
  Coffee,
  Users,
  Building2,
  Star,
  Clock,
  Shield,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBranches, usePlans, useTestimonials } from "@/lib/queries";
import { unsplash, whatsappLink, inr } from "@/lib/format";
import { useCounter } from "@/hooks/use-counter";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Aztech Co-Works — Coworking, Enterprise Workspaces & Managed Offices in Coimbatore" },
      {
        name: "description",
        content:
          "6 branches across Coimbatore. 1,200+ seats. Hot desks, dedicated desks, private cabins, team offices. Book a site visit instantly.",
      },
      { property: "og:title", content: "Aztech Co-Works — Coworking, Enterprise Workspaces & Managed Offices in Coimbatore" },
      {
        property: "og:description",
        content: "6 branches, 1,200+ seats, built for founders, freelancers, and growing teams.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: branches = [] } = useBranches();
  const { data: plans = [] } = usePlans();
  const { data: testimonials = [] } = useTestimonials();
  const totalSeats = branches.reduce((a, b) => a + b.totalSeats, 0);
  const avail = branches.reduce((a, b) => a + b.availableSeats, 0);

  const branchesRef = useScrollReveal<HTMLElement>();
  const pricingRef = useScrollReveal<HTMLElement>();
  const amenitiesRef = useScrollReveal<HTMLElement>();
  const testimonialsRef = useScrollReveal<HTMLElement>();

  return (
      <main>
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden bg-hero text-white">
          <div className="container relative mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28 lg:py-32">
            <div className="flex flex-col justify-center">
              <Badge className="w-fit border-white/20 bg-white/10 text-white backdrop-blur">
                <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                {avail} seats available right now
              </Badge>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                The workspace that{" "}
                <span className="bg-gradient-to-r from-accent to-amber-200 bg-clip-text text-transparent">
                  works as hard
                </span>{" "}
                as you do.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
                Six premium coworking & enterprise branches across Coimbatore. {totalSeats.toLocaleString("en-IN")} seats,
                fibre internet, meeting rooms, 24/7 access, and a real community of founders, freelancers, and
                teams.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/book-visit">
                    Book a site visit <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <a
                    href={whatsappLink(
                      "Hi Aztech! I'd like to know more about your coworking & enterprise spaces in Coimbatore.",
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" /> Chat on WhatsApp
                  </a>
                </Button>
              </div>
              <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
                <AnimatedStat label="Branches" end={6} />
                <AnimatedStat label="Total seats" end={totalSeats} format={(n) => n.toLocaleString("en-IN")} />
                <AnimatedStat label="Avg. NPS" end={78} />
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute -left-12 -top-12 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
              <div className="absolute -bottom-12 -right-12 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
              <div className="relative grid grid-cols-2 gap-3">
                <img
                  src={unsplash("photo-1497366216548-37526070297c", 700, 900)}
                  alt="Modern coworking lounge"
                  className="aspect-[3/4] w-full rounded-2xl object-cover shadow-elegant"
                  loading="eager"
                  width={700}
                  height={900}
                />
                <div className="space-y-3 pt-10">
                  <img
                    src={unsplash("photo-1556761175-5973dc0f32e7", 700, 500)}
                    alt="Meeting room"
                    className="aspect-[4/3] w-full rounded-2xl object-cover shadow-elegant"
                    loading="eager"
                    width={700}
                    height={500}
                  />
                  <img
                    src={unsplash("photo-1604328698692-f76ea9498e76", 700, 500)}
                    alt="Cafeteria"
                    className="aspect-[4/3] w-full rounded-2xl object-cover shadow-elegant"
                    loading="lazy"
                    width={700}
                    height={500}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TRUSTED BY ─── */}
        <section className="border-b border-border/60 bg-secondary/30 py-8">
          <div className="container mx-auto px-4 md:px-6">
            <p className="mb-5 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60 grayscale">
              {["Loop Analytics", "Cibyl Studios", "Northwind Labs", "OrangeFin", "Indigo Code", "BrewLab"].map(
                (name) => (
                  <span key={name} className="text-sm font-semibold tracking-tight text-foreground">
                    {name}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ─── BRANCHES ─── */}
        <section ref={branchesRef} className="container mx-auto px-4 py-16 opacity-0 md:px-6 md:py-24">
          <div className="flex items-end justify-between gap-6">
            <div>
              <Badge variant="outline" className="mb-3">6 Branches in Coimbatore</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Find a branch near you</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Live seat availability across every Aztech location.
              </p>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link to="/branches">All branches <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((b) => (
              <Link key={b.id} to="/branches/$slug" params={{ slug: b.slug }} className="group">
                <Card className="overflow-hidden border-border/60 bg-card-soft transition hover:shadow-elegant">
                  <div className="relative overflow-hidden">
                    <img
                      src={unsplash(b.photo, 800, 500)}
                      alt={b.name}
                      className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                      width={800}
                      height={500}
                    />
                    <Badge className="absolute left-3 top-3 bg-background/90 text-foreground hover:bg-background">
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
                      {b.availableSeats} seats free
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="group-hover:text-accent transition-colors">{b.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {b.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">{b.totalSeats} seats · {b.hours.split("·")[0]}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Button asChild variant="outline">
              <Link to="/branches">All branches <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section ref={pricingRef} className="bg-secondary/40 py-16 opacity-0 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-3">Pricing</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Pick the workspace that fits</h2>
              <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                Transparent, all-inclusive monthly pricing. GST extra. Switch anytime.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((p, i) => (
                <Card
                  key={p.id}
                  className={`relative flex flex-col border-border/60 transition hover:shadow-elegant ${
                    i === 1 ? "border-accent/40 shadow-glow" : ""
                  }`}
                >
                  {i === 1 && (
                    <Badge className="absolute -top-3 right-4 bg-accent text-accent-foreground">Most popular</Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                    <div className="mt-3">
                      <div className="text-3xl font-bold tracking-tight">{inr(p.basePrice)}</div>
                      <div className="text-xs text-muted-foreground">per seat / month · +{p.gstRate}% GST</div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button asChild className="w-full" variant={i === 1 ? "default" : "outline"}>
                      <Link to="/pricing">See details</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── AMENITIES ─── */}
        <section ref={amenitiesRef} className="container mx-auto px-4 py-16 opacity-0 md:px-6 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="outline" className="mb-3">Amenities</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Every detail, designed for deep work.
              </h2>
              <p className="mt-3 text-muted-foreground">
                We sweat the small stuff so you don't have to. From silent phone booths to ergonomic chairs to
                that one truly excellent espresso — we're obsessed with the day-to-day experience.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Amenity icon={Wifi} title="1 Gbps fibre" desc="Redundant ISPs, 99.9% uptime." />
                <Amenity icon={Coffee} title="Café-grade coffee" desc="Single-origin beans, daily." />
                <Amenity icon={Clock} title="24/7 access" desc="For members. Always open." />
                <Amenity icon={Shield} title="Power backup" desc="Full UPS + DG. Zero downtime." />
                <Amenity icon={Users} title="Meeting rooms" desc="Bookable in-app by the hour." />
                <Amenity icon={Building2} title="Phone booths" desc="Quiet, private calls on demand." />
              </div>
            </div>
            <div className="relative">
              <img
                src={unsplash("photo-1568992687947-868a62a9f521", 900, 1100)}
                alt="Workspace lounge"
                className="aspect-[4/5] w-full rounded-3xl object-cover shadow-elegant"
                loading="lazy"
                width={900}
                height={1100}
              />
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-elegant md:block">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">4.9 / 5</div>
                    <div className="text-xs text-muted-foreground">324 Google reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section ref={testimonialsRef} className="bg-secondary/40 py-16 opacity-0 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-3">Loved by founders</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Built with our members, every day.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.id} className="border-border/60 bg-card transition hover:shadow-soft">
                  <CardContent className="pt-6">
                    <Quote className="h-6 w-6 text-accent" />
                    <p className="mt-3 text-sm leading-relaxed">"{t.quote}"</p>
                    <div className="mt-5 flex items-center gap-3">
                      <img
                        src={unsplash(t.avatar, 100, 100)}
                        alt={t.name}
                        className="h-10 w-10 rounded-full object-cover"
                        loading="lazy"
                        width={100}
                        height={100}
                      />
                      <div>
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}, {t.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CORPORATE CTA ─── */}
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="overflow-hidden rounded-3xl bg-hero p-10 text-white md:p-16">
            <div className="grid gap-8 md:grid-cols-[2fr_1fr] md:items-center">
              <div>
                <Badge className="border-white/20 bg-white/10 text-white">For teams of 10–200</Badge>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Need 30–150+ seats for your enterprise team?
                </h2>
                <p className="mt-3 max-w-xl text-white/75">
                  Custom build-outs, dedicated reception, enterprise SLAs, and zero brokerage. Move-in ready in 30 days.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/corporate">Talk to sales <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}

// ─── Sub-components ──────────────────────────────

function AnimatedStat({
  label,
  end,
  format = String,
}: {
  label: string;
  end: number;
  format?: (n: number) => string;
}) {
  const { value, ref } = useCounter(end);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <div className="text-3xl font-bold tracking-tight">{format(value)}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/55">{label}</div>
    </div>
  );
}

function Amenity({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Sparkles;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-soft transition hover:shadow-elegant">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

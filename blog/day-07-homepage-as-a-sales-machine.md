# Day 7: The Homepage as a Sales Machine — Real-Time Data on a Marketing Page

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #marketing #react #ux #conversion

---

Most coworking websites have a homepage with stock photos, a tagline like "Where ideas come to life," and a "Contact us" button that leads to a form that leads to an inbox that nobody checks.

Ours shows how many seats are available right now. In the hero section. Updating live.

## The Hero That Sells

The first thing you see when you land on the homepage:

```
[badge] 847 seats available right now

The workspace that works as hard as you do.

Six premium coworking & enterprise branches across Coimbatore.
1,200+ seats, fibre internet, meeting rooms, 24/7 access, and
a real community of founders, freelancers, and teams.

[Book a site visit]  [Chat on WhatsApp]

6          1,200+       78
Branches   Total seats  Avg. NPS
```

Every number on this page is real. The "847 seats available" badge pulls from the database. The animated counters count up from 0 when they scroll into view. The branch cards below show per-branch availability.

This isn't a brochure. It's a live dashboard wearing a marketing suit.

## How the Data Flows

```tsx
function Home() {
  const { data: branches = [] } = useBranches();
  const { data: plans = [] } = usePlans();
  const { data: testimonials = [] } = useTestimonials();

  const totalSeats = branches.reduce((a, b) => a + b.totalSeats, 0);
  const avail = branches.reduce((a, b) => a + b.availableSeats, 0);
  // ...
}
```

Three API calls. Three React Query hooks. TanStack Query caches the responses with a 60-second stale time, so navigating away and back doesn't re-fetch.

The `useBranches()` hook returns an array of 6 Branch objects, each with `totalSeats` and `availableSeats`. Simple reduce to get the totals. No derived state library. No computed values. Just `.reduce()`.

## Animated Counters

The "6 branches" and "1,200+ seats" numbers don't just appear — they count up from 0 when they scroll into view. It's a custom hook:

```tsx
function useCounter(end: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          setValue(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { value, ref };
}
```

IntersectionObserver watches for when the element enters the viewport. When it does, `requestAnimationFrame` drives a smooth animation from 0 to the target value with an ease-out curve. The observer disconnects after firing once — no re-triggering.

30 lines. Zero animation dependencies. Works on every browser. Looks great.

## Scroll Reveal Sections

Each section of the homepage (branches, pricing, amenities, testimonials) fades in and slides up as you scroll down:

```tsx
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-fade-in-up");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}
```

Elements start with `opacity-0` in the className. When they scroll into view, the CSS animation class triggers. One-shot. No scroll event listeners. No debouncing. Just the browser's native IntersectionObserver.

```tsx
<section ref={branchesRef} className="... opacity-0">
<section ref={pricingRef} className="... opacity-0">
<section ref={amenitiesRef} className="... opacity-0">
```

## Branch Cards with Live Availability

Each branch gets a card with a photo, address, total seats, hours, and a live availability badge:

```tsx
{branches.map((b) => (
  <Link key={b.id} to="/branches/$slug" params={{ slug: b.slug }}>
    <Card>
      <img src={unsplash(b.photo, 800, 500)} alt={b.name} loading="lazy" />
      <Badge>
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
        {b.availableSeats} seats free
      </Badge>
      <CardTitle>{b.name}</CardTitle>
      <CardDescription>
        <MapPin /> {b.address}
      </CardDescription>
    </Card>
  </Link>
))}
```

Green dot + "X seats free" — live from the database. Not a claim. A fact. When a member signs up and takes a dedicated desk, that number decreases across the entire site.

## Every Section Earns Its Place

I have a rule: no section exists just to fill space. Here's what each section does and why:

1. **Hero:** Hook + CTA + live stats. Establishes credibility and creates urgency ("847 seats available right now" — better grab yours).

2. **Trusted by:** Social proof strip. Six company names. This section is 3 lines of code but converts because it answers "who else uses this?"

3. **Branches:** Live availability cards. Answers "where can I work?" and shows it's a real, multi-location business.

4. **Pricing:** Transparent plans with feature lists. Answers "how much?" without forcing a sales call. The "Most popular" badge drives the dedicated desk plan.

5. **Amenities:** Feature grid with icons. Answers "what do I get?" — WiFi speed, coffee quality, 24/7 access, power backup.

6. **Testimonials:** Real quotes from real members. Answers "is it any good?"

7. **Corporate CTA:** Enterprise upsell for teams of 10-200. Answers "what if I need 50 desks?" and links to the corporate landing page.

No "About us" section. No "Our journey" timeline. No team photos. No mission statement. Every pixel converts or informs. That's it.

## The WhatsApp FAB

In India, WhatsApp is the conversion channel. Not email. Not "schedule a call." WhatsApp.

A floating green button sits in the bottom-right corner of every marketing page. Tap it, and WhatsApp opens with a pre-filled message:

```typescript
export const whatsappLink = (msg: string, phone = "918310696307") =>
  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
```

One function. Used across the homepage CTA button, every branch page, every lead card in the sales pipeline, and the floating action button. The business WhatsApp number receives the inquiry. The team responds.

This one button generates more leads than the contact form.

## The Result

A homepage that isn't a brochure. It's an application:

- Real-time data from the database
- Animated counters that tell a story
- Scroll-triggered section reveals
- Live seat availability per branch
- Two CTAs that work (site visit form + WhatsApp)
- Corporate upsell for enterprise deals

Built with React hooks, IntersectionObserver, and TanStack Query. No CMS. No page builder. No animation library. Just components that fetch data and display it beautifully.

---

**Tomorrow:** Day 8 — Building a Branch Detail Page with Dynamic Routes and Seat Inventory

**Image suggestions:**
- SCREENSHOT: Full homepage hero section with animated counters mid-animation
- SCREENSHOT: Branch cards section showing all 6 branches with availability badges
- SCREENSHOT: The pricing section with the "Most popular" badge highlighted
- SCREENSHOT: The amenities grid with icons
- SCREENSHOT: The WhatsApp FAB button in the corner
- SCREENSHOT: Mobile view of the homepage

**LinkedIn post:**

> The homepage of this coworking platform isn't a brochure. It's a live dashboard.
>
> "847 seats available right now" — from the database, not a marketing claim.
>
> Every section has one job:
> - Hero: Hook + urgency (live seat count)
> - Branches: Real-time availability per location
> - Pricing: Transparent, no "contact us for pricing"
> - Amenities: What you get
> - Testimonials: Why it's good
> - Corporate CTA: Enterprise upsell
>
> No "About us." No "Our journey." No team photos. No mission statement.
>
> Every pixel converts or informs. That's the rule.
>
> The WhatsApp button generates more leads than the contact form. In India, WhatsApp IS the conversion channel.
>
> Day 7 of 45: [link]

**X post:**

> Homepage design rule: every section earns its place or gets deleted.
>
> Real-time seat count in the hero. Live branch availability. Transparent pricing. WhatsApp CTA.
>
> Zero "About us" sections. Zero mission statements. Zero stock photo heroes.
>
> Every pixel converts or informs.
>
> Day 7/45

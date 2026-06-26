# Day 13: The oklch Color System — Building a Design System in Tailwind CSS 4

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #tailwindcss #design #css #oklch

---

Tailwind CSS 4 shipped with oklch color support. It sounds like an API endpoint. It's actually the best thing to happen to web design in years.

## What's oklch?

Most web developers think in hex codes (`#1a73e8`) or HSL (`hsl(217, 89%, 50%)`). oklch is a different color space that's perceptually uniform — meaning two colors with the same lightness value actually look equally bright to human eyes.

In HSL, `hsl(60, 100%, 50%)` (yellow) and `hsl(240, 100%, 50%)` (blue) have the same "lightness" of 50%. But yellow looks dramatically brighter than blue. The math says they're equal. Your eyes disagree.

oklch fixes this. It has three channels:
- **L** — Lightness (0% = black, 100% = white)
- **C** — Chroma (saturation/colorfulness)
- **H** — Hue (the color wheel angle)

Two colors with `L: 65%` actually look equally bright. This makes building coherent color palettes vastly easier.

## The Design Tokens

Instead of scattering hex codes across components, I defined semantic color tokens:

```css
:root {
  --color-hero: oklch(0.22 0.02 250);      /* Deep navy for hero sections */
  --color-accent: oklch(0.75 0.15 85);      /* Warm gold for CTAs */
  --color-success: oklch(0.65 0.2 145);     /* Green for positive states */
  --color-card-soft: oklch(0.97 0.005 250); /* Barely-there card background */
}
```

These tokens are used through Tailwind utility classes:

```html
<section className="bg-hero text-white">          <!-- Deep navy background -->
<button className="bg-accent text-accent-foreground"> <!-- Gold CTA -->
<Badge className="bg-success text-success-foreground"> <!-- Green status -->
<Card className="bg-card-soft">                    <!-- Subtle card bg -->
```

The component never knows the hex code. It knows the intent: "this is a hero section," "this is an accent color," "this is a success state."

## Custom Shadows

Beyond colors, I defined semantic shadow tokens:

```css
--shadow-soft: 0 2px 8px oklch(0 0 0 / 0.06);
--shadow-elegant: 0 4px 20px oklch(0 0 0 / 0.08);
--shadow-glow: 0 0 30px oklch(0.75 0.15 85 / 0.15);
```

Used as:

```html
<Card className="shadow-soft hover:shadow-elegant">  <!-- Subtle to pronounced -->
<Card className="shadow-glow">                       <!-- Gold glow on featured plan -->
```

The "shadow-glow" uses the accent color at 15% opacity, creating a warm glow around the "Most popular" plan card. It connects the shadow to the brand color — a detail most users won't notice consciously, but it makes the design feel cohesive.

## Why Semantic Tokens Beat Raw Values

Consider two approaches to styling a button:

**Raw values:**
```html
<button className="bg-[oklch(0.75_0.15_85)] text-[oklch(0.2_0.02_85)]">
```

**Semantic tokens:**
```html
<button className="bg-accent text-accent-foreground">
```

The semantic version is:
1. **Readable** — "accent" communicates intent. A hex code communicates nothing.
2. **Maintainable** — Change the accent color once in CSS, it updates everywhere.
3. **Consistent** — Every accent-colored element uses the same token. No drift.
4. **Themeable** — Define different token values for dark mode, and every component adapts.

## The Brand Palette

The Aztech Co-Works brand uses three primary colors:

- **Hero (navy)** — Deep, professional, trustworthy. Used for hero sections and the dashboard sidebar.
- **Accent (gold)** — Warm, premium, attention-grabbing. Used for CTAs, badges, and highlights.
- **Success (green)** — Positive, available, active. Used for availability dots, paid badges, and active statuses.

These three colors, combined with the neutral gray scale from Tailwind, cover every design need:

```html
<!-- Hero section -->
<section className="bg-hero text-white">

<!-- Available seats badge -->
<Badge className="bg-success">147 seats free</Badge>

<!-- CTA button -->
<Button className="bg-accent text-accent-foreground">Book a visit</Button>

<!-- Muted secondary text -->
<span className="text-muted-foreground">per seat / month</span>

<!-- Card with subtle background -->
<Card className="border-border/60 bg-card-soft">
```

## The `/60` Opacity Trick

Tailwind CSS 4 supports opacity modifiers on any color:

```html
<div className="border-border/60">    <!-- Border at 60% opacity -->
<div className="bg-white/10">         <!-- White at 10% opacity -->
<div className="text-white/75">       <!-- White text at 75% opacity -->
```

I use this extensively for layered designs:

```html
<!-- Hero section overlays -->
<Badge className="border-white/20 bg-white/10 text-white backdrop-blur">
```

A badge that's slightly frosted glass: white border at 20% opacity, white background at 10% opacity, full white text, and a backdrop blur. It floats over the hero image without obscuring it.

## The Gradient Text

The homepage headline uses a gradient text effect:

```html
<span className="bg-gradient-to-r from-accent to-amber-200 bg-clip-text text-transparent">
  works as hard
</span>
```

Gold-to-amber gradient clipped to text. It's a subtle brand touch that makes the headline memorable. The `from-accent` uses the design token, so if I change the accent color, the gradient updates too.

## What I Didn't Build

I didn't build a design system library. No Storybook. No Figma tokens import pipeline. No `@aztech/design-system` npm package.

Instead:
- 15 CSS custom properties (colors + shadows)
- Tailwind utility classes that reference those properties
- shadcn/ui components that use those utilities

The "design system" is 30 lines of CSS and consistent usage of utility classes. For a platform with one designer (me), that's enough. A design token system should match the team size and the design complexity. One person doesn't need a Storybook.

## Dark Mode (The Easy Part)

oklch makes dark mode trivial. Override the tokens at the `[data-theme="dark"]` level:

```css
[data-theme="dark"] {
  --color-hero: oklch(0.15 0.02 250);
  --color-card-soft: oklch(0.18 0.005 250);
  --color-accent: oklch(0.80 0.15 85);
}
```

Same token names. Different values. Every component that uses `bg-hero` or `bg-card-soft` automatically adapts. Zero component changes. The design system does the work.

---

**Tomorrow:** Day 14 — shadcn/ui: Owning Your Components Instead of Fighting a Library

**Image suggestions:**
- SCREENSHOT: Homepage hero showing the gradient text and accent-colored CTA
- SCREENSHOT: Branch cards showing the shadow-elegant hover effect
- SCREENSHOT: The pricing card with shadow-glow on the featured plan
- CODE SCREENSHOT: The CSS custom properties definition

**LinkedIn post:**

> The oklch color system in Tailwind CSS 4 is underrated.
>
> My entire design system is 15 CSS custom properties:
>
> --color-hero (deep navy)
> --color-accent (warm gold)
> --color-success (green)
> --shadow-soft (subtle hover)
> --shadow-elegant (pronounced hover)
> --shadow-glow (accent-colored glow on featured items)
>
> Every component uses semantic classes:
> bg-hero, bg-accent, shadow-elegant
>
> Never a hex code in a component. Never a magic number.
>
> Change the accent color? One line of CSS. Every CTA, badge, gradient, and glow updates everywhere.
>
> No Storybook. No design token pipeline. No npm package. 30 lines of CSS + consistent Tailwind usage.
>
> The design system should match the team size.
>
> Day 13 of 45: [link]

**X post:**

> oklch in Tailwind CSS 4:
>
> --color-accent: oklch(0.75 0.15 85);
>
> Used as: bg-accent, text-accent, shadow-glow
>
> Change the accent once → every CTA, badge, gradient, glow updates. Zero component changes.
>
> The entire design system is 15 CSS variables. 30 lines.
>
> Day 13/45

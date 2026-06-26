# Day 43: The Unsplash Image Helper — Placeholder Images Done Right

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #images #unsplash #performance #ux

---

Real branch photos aren't ready yet. Instead of broken image icons or gray boxes, every image on the site uses Unsplash photos that look like real coworking spaces.

## The Helper

```typescript
export const unsplash = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format`;
```

One function. Takes a photo ID, width, and height. Returns an optimized image URL.

Unsplash's CDN handles:
- **Resizing** — `w=800&h=500` serves exactly that size
- **Format negotiation** — `auto=format` serves WebP to browsers that support it
- **Cropping** — `fit=crop` centers the image

## Usage

```tsx
<img
  src={unsplash("photo-1497366216548-37526070297c", 700, 900)}
  alt="Modern coworking lounge"
  loading="lazy"
  width={700}
  height={700}
/>
```

Each branch has a photo ID stored in its data:

```typescript
{ id: "br_bk", name: "Aztech Brookfields", photo: "photo-1497366216548-37526070297c", ... }
```

When real branch photos are available, I'll replace the Unsplash IDs with actual image URLs. The `unsplash()` function calls become direct URLs. Zero component changes.

## Performance

- `loading="lazy"` — Images below the fold don't load until scrolled into view
- `width` and `height` attributes — Prevents layout shift (CLS)
- Unsplash CDN — Global edge delivery, auto-format optimization

The hero images use `loading="eager"` (they're above the fold). Everything else is `lazy`.

## The Temporary Nature

These are placeholders. They look good enough for demos and stakeholder reviews. But the production site needs real photos of real branches — the actual desks, cabins, meeting rooms, and cafeterias.

The architecture makes swapping easy: change the photo field in the branch data from an Unsplash ID to a real image URL. That's a data change, not a code change.

---

**Tomorrow:** Day 44 — What's Left: The Production Checklist

**LinkedIn post:**

> No real branch photos yet. Instead: Unsplash with a helper function.
>
> unsplash(id, w, h) → optimized URL with resize, crop, and auto-format.
>
> loading="lazy" for below-fold. width/height for no layout shift. Unsplash CDN for global delivery.
>
> When real photos are ready: change the data, not the code. The architecture handles it.
>
> Day 43 of 45: [link]

**X post:**

> No real photos yet. Unsplash placeholder helper:
>
> unsplash(id, 800, 500) → resized, cropped, WebP-optimized URL
>
> When real photos arrive: change data, not code. Architecture-level swap.
>
> Day 43/45

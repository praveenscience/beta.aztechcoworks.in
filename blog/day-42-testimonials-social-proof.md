# Day 42: Testimonials — Social Proof That Converts

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #testimonials #socialproof #marketing #ux

---

Three testimonial cards on the homepage. Real quotes from real members. Name, role, company, photo. The simplest feature on the site — and one of the most effective for conversion.

## The Component

```tsx
{testimonials.map((t) => (
  <Card key={t.id}>
    <CardContent>
      <Quote className="h-6 w-6 text-accent" />
      <p className="mt-3 text-sm">"{t.quote}"</p>
      <div className="mt-5 flex items-center gap-3">
        <img src={unsplash(t.avatar, 100, 100)} alt={t.name}
             className="h-10 w-10 rounded-full object-cover" />
        <div>
          <div className="text-sm font-semibold">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.role}, {t.company}</div>
        </div>
      </div>
    </CardContent>
  </Card>
))}
```

A quote icon. The quote text. A circular photo. Name and title. Card with hover shadow. That's it.

## Why Testimonials Work

A prospect visiting the homepage has one implicit question: "Is this place any good?"

They don't trust our marketing copy. They don't trust our feature list. They trust other people who look like them.

A quote from "Sneha Verma, Founder, Loop Analytics" tells a freelance founder: "Someone like me uses this. And likes it." That's worth more than 10 paragraphs of marketing.

## Data-Driven, Not Hardcoded

```tsx
const { data: testimonials = [] } = useTestimonials();
```

Testimonials come from the API. The admin can add, edit, or rotate testimonials without a code deploy. Add a new member success story → it appears on the homepage.

## Placement

The testimonials section is positioned after amenities and before the corporate CTA. By this point, the visitor has seen branches (credibility), pricing (affordability), and amenities (value). The testimonials seal the deal before the final CTA.

---

**Tomorrow:** Day 43 — The Unsplash Image Helper: Placeholder Images Done Right

**LinkedIn post:**

> 3 testimonial cards. Real quotes. Real names. Real photos. Positioned after amenities, before the CTA.
>
> By the time a prospect reaches testimonials, they've seen the branches, the pricing, and the features. The testimonials answer the final question: "Is it any good?"
>
> Data-driven (from API, not hardcoded). Admin can rotate testimonials without deploying code.
>
> The simplest feature. One of the most effective for conversion.
>
> Day 42 of 45: [link]

**X post:**

> 3 testimonial cards on the homepage. The simplest feature. The highest conversion impact.
>
> "Sneha Verma, Founder" tells a founder: "Someone like me uses this."
>
> That's worth more than 10 paragraphs of marketing copy.
>
> Day 42/45

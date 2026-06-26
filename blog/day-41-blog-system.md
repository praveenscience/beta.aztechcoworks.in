# Day 41: The Blog System — Content as a Feature, Not an Afterthought

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #blog #content #seo #react

---

The blog isn't a WordPress site linked from the nav bar. It's a first-class route in the SPA, fetching posts from the same API that powers everything else.

## Blog Posts as Data

```typescript
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  publishedAt: string;
  author: string;
  tags: string[];
}
```

Posts are stored in the database alongside branches, leads, and invoices. They come from the same API. They use the same caching strategy. They're rendered by the same React components.

## The Routes

```
/_public/blog.index.tsx  → /blog        → Blog listing
/_public/blog.$slug.tsx  → /blog/hello  → Single post
```

The listing page:

```tsx
const { data: posts = [] } = useBlog();
```

The single post page:

```tsx
const { slug } = Route.useParams();
const { data: post } = useBlogPost(slug);
```

Same patterns as branches, plans, and leads. TanStack Query caching. Type-safe route params. Code-split bundles.

## SEO for Blog Posts

Each post gets its own meta tags:

```tsx
head: () => ({
  meta: [
    { title: `${post.title} | Aztech Co-Works Blog` },
    { name: "description", content: post.excerpt },
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.excerpt },
  ],
})
```

When someone shares a blog post on LinkedIn or WhatsApp, the preview shows the post title and excerpt. Not a generic "Aztech Co-Works" card.

## Why Not a CMS?

A headless CMS (Contentful, Sanity, Strapi) would give me:
- Rich text editing
- Image optimization
- Draft/publish workflow
- Multiple authors

But it would also add:
- Another service to manage
- Another API to authenticate
- Another billing relationship
- Another point of failure

For a coworking blog publishing 2-4 posts per month, storing posts in SQLite is simpler. The admin can add posts through a future blog editor in the admin panel, or I can seed them directly.

The architecture supports migration to a CMS later — just swap the `useBlog()` hook's query function from `api.get("/api/blog")` to a CMS API call. The components don't change.

---

**Tomorrow:** Day 42 — The Testimonial System: Social Proof That Converts

**LinkedIn post:**

> The blog is a first-class route in the SPA. Not a WordPress link. Not a subdomain. Same API. Same caching. Same SEO patterns.
>
> BlogPost entity with title, slug, body, cover, tags. Same database as branches and invoices. Same React Query hooks.
>
> Why not a CMS? For 2-4 posts/month, SQLite is simpler. Zero extra services.
>
> The hook can be swapped to a CMS API later without changing components.
>
> Day 41 of 45: [link]

**X post:**

> Blog as a database entity, not a separate CMS.
>
> Same API. Same cache. Same SEO patterns. Same codebase.
>
> For 2-4 posts/month, SQLite > Contentful. Swap the hook later if needed.
>
> Day 41/45

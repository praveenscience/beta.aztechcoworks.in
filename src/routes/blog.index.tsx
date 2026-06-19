import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader, SiteFooter, WhatsAppFab } from "@/components/site-chrome";
import { useStore } from "@/lib/store";
import { unsplash } from "@/lib/format";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Aztech Co-Works" },
      { name: "description", content: "Workspace strategy, productivity, and startup guides from the Aztech editorial team." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = useStore((s) => s.blog);
  const gridRef = useScrollReveal<HTMLDivElement>();
  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <Badge variant="outline" className="mb-3">Editorial</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">The Aztech Journal</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Workspace strategy, productivity, and startup guides — written for Coimbatore's founders.
        </p>
        <div ref={gridRef} className="mt-10 grid gap-6 opacity-0 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }}>
              <Card className="overflow-hidden transition hover:shadow-elegant">
                <img src={unsplash(p.cover, 800, 500)} alt={p.title} className="aspect-[16/10] w-full object-cover" loading="lazy" width={800} height={500} />
                <CardHeader>
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                  <CardDescription>{p.excerpt}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> {new Date(p.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

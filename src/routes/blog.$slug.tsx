import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useStore } from "@/lib/store";
import { unsplash } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const post = useStore((s) => s.blog.find((p) => p.slug === slug));
  if (!post) throw notFound();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <Button asChild variant="ghost" size="sm">
          <Link to="/blog"><ArrowLeft className="mr-1 h-4 w-4" /> All posts</Link>
        </Button>
        <article className="mt-6">
          <div className="text-xs text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("en-IN", { dateStyle: "long" })} · {post.author}
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{post.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
          <img
            src={unsplash(post.cover, 1400, 800)}
            alt={post.title}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-elegant"
          />
          <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
            <p>{post.body}</p>
            <p>
              This post is a placeholder excerpt — admins can author full posts from the Marketing dashboard.
              The editorial system supports markdown, cover images, tags, and SEO metadata per post.
            </p>
            <h2>What's next</h2>
            <p>Book a site visit at any of our 5 Coimbatore branches and feel the difference in 10 minutes.</p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

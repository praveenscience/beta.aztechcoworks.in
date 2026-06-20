import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBranches } from "@/lib/queries";
import { unsplash } from "@/lib/format";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export const Route = createFileRoute("/_public/branches/")({
  head: () => ({
    meta: [
      { title: "Branches — Aztech Co-Works (5 locations in Coimbatore)" },
      { name: "description", content: "Find an Aztech Co-Works branch near you. R.S. Puram, Peelamedu, Gandhipuram, Saravanampatti, Avinashi Road." },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const { data: branches = [] } = useBranches();
  const gridRef = useScrollReveal<HTMLDivElement>();
  return (
      <main className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3">5 branches</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Aztech across Coimbatore</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Premium workspaces in every key business district. Live availability across every branch.
          </p>
        </div>
        <div ref={gridRef} className="grid gap-6 opacity-0 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <Card key={b.id} className="group overflow-hidden border-border/60 transition hover:shadow-elegant">
              <div className="relative overflow-hidden">
                <img src={unsplash(b.photo, 900, 600)} alt={b.name} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" width={900} height={563} />
                <Badge className="absolute left-3 top-3 bg-background/90 text-foreground hover:bg-background">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
                  {b.availableSeats} seats free
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>{b.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {b.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{b.totalSeats} seats · {b.hours.split("·")[0]}</div>
                <Button asChild size="sm">
                  <Link to="/branches/$slug" params={{ slug: b.slug }}>
                    View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
  );
}

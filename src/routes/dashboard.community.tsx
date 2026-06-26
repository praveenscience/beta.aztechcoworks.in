import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useUsers, useBranches } from "@/lib/queries";
import { Search } from "lucide-react";

export const Route = createFileRoute("/dashboard/community")({
  component: CommunityPage,
});

function CommunityPage() {
  const { data: allUsers = [] } = useUsers();
  const { data: branches = [] } = useBranches();
  const users = allUsers.filter((u) => u.role === "member");
  const [q, setQ] = useState("");
  const filtered = users.filter((u) =>
    `${u.name} ${u.company ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Community" description="Network with the founders, freelancers, and teams across Aztech." />
      <div className="mb-6 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or company" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((u) => {
          const branch = branches.find((b) => b.id === u.branchId);
          return (
            <Card key={u.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground font-semibold">
                    {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.company ?? "Member"}</div>
                  </div>
                </div>
                {branch && <Badge variant="secondary" className="mt-3">{branch.name}</Badge>}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No members match.</p>}
      </div>
    </>
  );
}

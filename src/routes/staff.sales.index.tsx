import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, ArrowRight, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads, useUsers, useMe, useUpdateLead } from "@/lib/queries";
import type { LeadStage } from "@/types";
import { stageLabels, inr, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/staff/sales/")({
  component: SalesPipeline,
});

const STAGES: LeadStage[] = ["new", "contacted", "qualified", "site_visit", "proposal", "negotiation", "won", "lost"];

function SalesPipeline() {
  const { data: leads = [] } = useLeads();
  const { data: users = [] } = useUsers();
  const { data: me } = useMe();
  const updateLead = useUpdateLead();
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const moveLeadStage = (id: string, stage: LeadStage) => {
    updateLead.mutate({ id, stage });
  };

  const visible = leads.filter((l) => {
    if (me?.role === "sales_exec" && ownerFilter === "mine") return l.ownerId === me.id;
    if (ownerFilter !== "all" && ownerFilter !== "mine") return l.ownerId === ownerFilter;
    return true;
  });

  const wonValue = visible.filter((l) => l.stage === "won").reduce((s, l) => s + (l.budget ?? 0), 0);
  const conversionRate = visible.length ? Math.round((visible.filter((l) => l.stage === "won").length / visible.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Sales pipeline"
        description="Manage every lead from inquiry to membership."
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {me?.role === "sales_exec" && <SelectItem value="mine">My leads</SelectItem>}
                {users.filter((u) => u.role === "sales_exec" || u.role === "sales_manager").map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Kpi label="Total leads" value={String(visible.length)} />
        <Kpi label="Won value" value={inr(wonValue)} />
        <Kpi label="Conversion" value={`${conversionRate}%`} />
        <Kpi label="Avg score" value={String(Math.round(visible.reduce((s, l) => s + l.score, 0) / Math.max(visible.length, 1)))} />
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "table")}>
        <TabsList><TabsTrigger value="kanban">Kanban</TabsTrigger><TabsTrigger value="table">Table</TabsTrigger></TabsList>
        <TabsContent value="kanban" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageLeads = visible.filter((l) => l.stage === stage);
              return (
                <div key={stage} className="min-w-[280px] flex-1">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">{stageLabels[stage]}</div>
                    <Badge variant="secondary">{stageLeads.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {stageLeads.map((l) => (
                      <Link key={l.id} to="/staff/sales/$leadId" params={{ leadId: l.id }}>
                        <Card className="transition hover:shadow-soft">
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold">{l.name}</div>
                              <Badge variant={l.score > 80 ? "default" : "secondary"} className={l.score > 80 ? "bg-accent text-accent-foreground" : ""}>
                                {l.score}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{l.email}</div>
                            {l.budget && <div className="text-xs font-mono">{inr(l.budget)}/mo</div>}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{l.source}</span>
                              <a
                                onClick={(e) => e.stopPropagation()}
                                href={whatsappLink(`Hi ${l.name.split(" ")[0]}, this is ${users.find((u) => u.id === l.ownerId)?.name ?? "Aztech"}.`, l.phone.replace(/\D/g, ""))}
                                target="_blank"
                                rel="noreferrer"
                                className="text-success"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Lead</th><th>Source</th><th>Budget</th><th>Score</th><th>Stage</th><th>Owner</th><th></th></tr>
                </thead>
                <tbody>
                  {visible.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="py-3">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-muted-foreground">{l.email}</div>
                      </td>
                      <td><Badge variant="secondary">{l.source}</Badge></td>
                      <td className="font-mono">{l.budget ? inr(l.budget) : "—"}</td>
                      <td><Badge className={l.score > 80 ? "bg-accent text-accent-foreground" : ""}>{l.score}</Badge></td>
                      <td>
                        <Select value={l.stage} onValueChange={(v) => moveLeadStage(l.id, v as LeadStage)}>
                          <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="text-xs">{users.find((u) => u.id === l.ownerId)?.name ?? "—"}</td>
                      <td>
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/staff/sales/$leadId" params={{ leadId: l.id }}><ArrowRight className="h-4 w-4" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="pt-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </CardContent></Card>
  );
}

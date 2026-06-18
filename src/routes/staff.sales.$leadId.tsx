import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useStore, stageLabels, inr, type LeadStage, whatsappLink } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { ArrowLeft, MessageCircle, Phone, Mail, Plus } from "lucide-react";
import { toast } from "sonner";

const STAGES: LeadStage[] = ["new", "contacted", "qualified", "site_visit", "proposal", "negotiation", "won", "lost"];

export const Route = createFileRoute("/staff/sales/$leadId")({
  ssr: false,
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  const lead = useStore((s) => s.leads.find((l) => l.id === leadId));
  const users = useStore((s) => s.users);
  const activities = useStore(useShallow((s) => s.leadActivities.filter((a) => a.leadId === leadId)));
  const tasks = useStore(useShallow((s) => s.tasks.filter((t) => t.leadId === leadId)));
  const moveLeadStage = useStore((s) => s.moveLeadStage);
  const updateLead = useStore((s) => s.updateLead);
  const addLeadActivity = useStore((s) => s.addLeadActivity);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));

  const [note, setNote] = useState("");
  const [newTask, setNewTask] = useState("");

  if (!lead) throw notFound();

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/staff/sales"><ArrowLeft className="mr-1 h-4 w-4" /> Pipeline</Link>
      </Button>
      <PageHeader
        title={lead.name}
        description={`${lead.email} · ${lead.phone}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><a href={`mailto:${lead.email}`}><Mail className="mr-1.5 h-4 w-4" />Email</a></Button>
            <Button asChild variant="outline" size="sm"><a href={`tel:${lead.phone}`}><Phone className="mr-1.5 h-4 w-4" />Call</a></Button>
            <Button asChild size="sm">
              <a href={whatsappLink(`Hi ${lead.name.split(" ")[0]}!`, lead.phone.replace(/\D/g, ""))} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source" value={lead.source} />
                <Field label="Team size" value={lead.teamSize?.toString() ?? "—"} />
                <Field label="Budget" value={lead.budget ? inr(lead.budget) + "/mo" : "—"} />
                <Field label="Timeline" value={lead.timeline ?? "—"} />
                <Field label="Score" value={String(lead.score)} />
                <Field label="Created" value={new Date(lead.createdAt).toLocaleString("en-IN")} />
              </div>
              {lead.message && (
                <div className="mt-4 rounded-md bg-secondary/40 p-3 text-sm">
                  <div className="text-xs uppercase text-muted-foreground">Message</div>
                  <div className="mt-1">{lead.message}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
              <CardDescription>Notes, stage changes, emails, WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note) return;
                  addLeadActivity({ leadId: lead.id, type: "note", description: note, actorId: me?.id });
                  setNote("");
                  toast.success("Note added");
                }}
                className="mb-4 flex gap-2"
              >
                <Textarea rows={2} placeholder="Log a call, note, or summary…" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button type="submit">Save</Button>
              </form>
              <div className="space-y-3">
                {activities.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3 border-l-2 border-accent/60 pl-4">
                    <div className="flex-1">
                      <div className="text-sm">{a.description}</div>
                      <div className="text-xs text-muted-foreground">{a.type} · {new Date(a.createdAt).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Stage</Label>
                <Select value={lead.stage} onValueChange={(v) => { moveLeadStage(lead.id, v as LeadStage); toast.success(`Moved to ${stageLabels[v as LeadStage]}`); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner</Label>
                <Select value={lead.ownerId ?? ""} onValueChange={(v) => updateLead(lead.id, { ownerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {users.filter((u) => u.role === "sales_exec" || u.role === "sales_manager").map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {lead.stage === "lost" && (
                <div>
                  <Label>Lost reason</Label>
                  <Input value={lead.lostReason ?? ""} onChange={(e) => updateLead(lead.id, { lostReason: e.target.value })} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTask) return;
                  addTask({
                    leadId: lead.id,
                    assigneeId: lead.ownerId ?? me?.id ?? "u_sales",
                    title: newTask,
                    dueAt: new Date(Date.now() + 86400000).toISOString(),
                    done: false,
                  });
                  setNewTask("");
                }}
                className="mb-3 flex gap-2"
              >
                <Input placeholder="New task…" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
              </form>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                    <span className={t.done ? "line-through text-muted-foreground" : ""}>{t.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(t.dueAt).toLocaleDateString("en-IN")}</span>
                  </label>
                ))}
                {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium capitalize">{value.replace(/_/g, " ")}</div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Workflow as WfIcon } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { WorkflowRule } from "@/types";

export const Route = createFileRoute("/admin/workflows")({
  component: WorkflowsPage,
});

const TRIGGERS: WorkflowRule["trigger"][] = ["lead_created", "stage_changed", "site_visit_scheduled"];
const ACTION_TYPES: WorkflowRule["actions"][number]["type"][] = ["assign_owner", "create_task", "send_email", "change_stage", "whatsapp_cta"];

function WorkflowsPage() {
  const rules = useStore((s) => s.workflowRules);
  const upsert = useStore((s) => s.upsertWorkflow);

  return (
    <>
      <PageHeader
        title="Workflows"
        description="If/then automations that fire when leads move through the pipeline."
        actions={
          <Button onClick={() => upsert({
            id: `wf_${Math.random().toString(36).slice(2, 7)}`,
            name: "New rule",
            trigger: "lead_created",
            conditions: [],
            actions: [{ type: "assign_owner", payload: { userId: "u_sales" } }],
            isActive: true,
          })}><Plus className="mr-1.5 h-4 w-4" /> New rule</Button>
        }
      />
      <div className="space-y-4">
        {rules.map((r) => <RuleEditor key={r.id} rule={r} onSave={(nr) => { upsert(nr); toast.success("Saved"); }} />)}
      </div>
    </>
  );
}

function RuleEditor({ rule, onSave }: { rule: WorkflowRule; onSave: (r: WorkflowRule) => void }) {
  const [r, setR] = useState(rule);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><WfIcon className="h-5 w-5 text-accent" /> {r.name}</span>
          <div className="flex items-center gap-2">
            <Switch checked={r.isActive} onCheckedChange={(v) => setR({ ...r, isActive: v })} />
            <Label className="text-xs">{r.isActive ? "Active" : "Off"}</Label>
          </div>
        </CardTitle>
        <CardDescription>When <Badge variant="secondary">{r.trigger.replace("_", " ")}</Badge> matches, run these actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Rule name</Label><Input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} /></div>
          <div>
            <Label>Trigger</Label>
            <Select value={r.trigger} onValueChange={(v) => setR({ ...r, trigger: v as WorkflowRule["trigger"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TRIGGERS.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Conditions</div>
          <div className="space-y-2">
            {r.conditions.map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
                <Input value={c.field} onChange={(e) => { const conds = [...r.conditions]; conds[i] = { ...c, field: e.target.value }; setR({ ...r, conditions: conds }); }} />
                <Select value={c.op} onValueChange={(v) => { const conds = [...r.conditions]; conds[i] = { ...c, op: v as "eq" | "gt" | "lt" }; setR({ ...r, conditions: conds }); }}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="eq">=</SelectItem><SelectItem value="gt">{">"}</SelectItem><SelectItem value="lt">{"<"}</SelectItem></SelectContent>
                </Select>
                <Input value={String(c.value)} onChange={(e) => { const conds = [...r.conditions]; conds[i] = { ...c, value: e.target.value }; setR({ ...r, conditions: conds }); }} />
                <Button variant="ghost" size="icon" onClick={() => setR({ ...r, conditions: r.conditions.filter((_, ix) => ix !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setR({ ...r, conditions: [...r.conditions, { field: "budget", op: "gt", value: 0 }] })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add condition
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Actions</div>
          <div className="space-y-2">
            {r.actions.map((a, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <Select value={a.type} onValueChange={(v) => { const acts = [...r.actions]; acts[i] = { ...a, type: v as typeof a.type }; setR({ ...r, actions: acts }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={JSON.stringify(a.payload)} onChange={(e) => { try { const acts = [...r.actions]; acts[i] = { ...a, payload: JSON.parse(e.target.value) }; setR({ ...r, actions: acts }); } catch { /* ignore */ } }} />
                <Button variant="ghost" size="icon" onClick={() => setR({ ...r, actions: r.actions.filter((_, ix) => ix !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setR({ ...r, actions: [...r.actions, { type: "create_task", payload: { title: "Follow up", dueInDays: 1 } }] })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add action
            </Button>
          </div>
        </div>

        <Button onClick={() => onSave(r)}>Save rule</Button>
      </CardContent>
    </Card>
  );
}

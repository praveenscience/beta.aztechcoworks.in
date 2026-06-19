import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { FormDefinition, FormField } from "@/types";

export const Route = createFileRoute("/admin/forms")({
  component: FormsBuilder,
});

const TYPES: FormField["type"][] = ["text", "email", "phone", "number", "select", "textarea", "date"];

function FormsBuilder() {
  const forms = useStore((s) => s.forms);
  return (
    <>
      <PageHeader title="Forms" description="Edit the lead & corporate forms. Changes go live instantly on the public site." />
      <Tabs defaultValue={forms[0]?.key}>
        <TabsList>{forms.map((f) => <TabsTrigger key={f.key} value={f.key} className="capitalize">{f.key}</TabsTrigger>)}</TabsList>
        {forms.map((f) => (
          <TabsContent key={f.key} value={f.key} className="mt-4">
            <FormEditor form={f} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function FormEditor({ form }: { form: FormDefinition }) {
  const upsertForm = useStore((s) => s.upsertForm);
  const [fields, setFields] = useState(form.fields);

  const update = (i: number, patch: Partial<FormField>) => setFields(fields.map((f, ix) => ix === i ? { ...f, ...patch } : f));
  const remove = (i: number) => setFields(fields.filter((_, ix) => ix !== i));
  const add = () => setFields([...fields, { key: `field_${fields.length + 1}`, label: "New field", type: "text", required: false }]);
  const move = (i: number, dir: -1 | 1) => {
    const next = [...fields];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setFields(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{form.key} form</CardTitle>
        <CardDescription>{fields.length} fields</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="grid items-end gap-2 rounded-lg border p-3 md:grid-cols-[auto_1.5fr_1fr_1fr_auto_auto]">
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></button>
            </div>
            <div><Label>Label</Label><Input value={f.label} onChange={(e) => update(i, { label: e.target.value })} /></div>
            <div><Label>Key</Label><Input value={f.key} onChange={(e) => update(i, { key: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={f.type} onValueChange={(v) => update(i, { type: v as FormField["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={f.required} onCheckedChange={(v) => update(i, { required: v })} />
              <Label className="text-xs">Required</Label>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Add field</Button>
          <Button onClick={() => { upsertForm({ ...form, fields }); toast.success("Form saved"); }}>Save form</Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useVisitors, useBranches, useMe, useCreateLead, useCheckInVisitor, useCheckOutVisitor, useSiteVisits, useLeads } from "@/lib/queries";
import { LogIn, LogOut, ScanLine, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/staff/reception")({
  component: Reception,
});

function Reception() {
  const { data: me } = useMe();
  const { data: visitors = [] } = useVisitors();
  const { data: branches = [] } = useBranches();
  const { data: siteVisits = [] } = useSiteVisits();
  const { data: leads = [] } = useLeads();
  const checkInMutation = useCheckInVisitor();
  const checkOutMutation = useCheckOutVisitor();
  const createLeadMutation = useCreateLead();
  const [walkin, setWalkin] = useState({ name: "", phone: "" });

  const branchId = me?.branchId;
  const branchVisitors = visitors.filter((v) => !branchId || v.branchId === branchId);
  const today = new Date().toDateString();
  const todaysVisits = siteVisits.filter((sv) => new Date(sv.scheduledAt).toDateString() === today && (!branchId || sv.branchId === branchId));
  const occupancyBranch = branches.find((b) => b.id === branchId);
  const occupancy = occupancyBranch ? Math.round(((occupancyBranch.totalSeats - occupancyBranch.availableSeats) / occupancyBranch.totalSeats) * 100) : null;

  return (
    <>
      <PageHeader
        title="Reception desk"
        description={occupancyBranch ? `${occupancyBranch.name} · ${occupancy}% occupied today` : "All branches"}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's site visits</CardTitle>
            <CardDescription>Scheduled tours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysVisits.length === 0 && <p className="text-sm text-muted-foreground">No visits today.</p>}
            {todaysVisits.map((sv) => {
              const lead = leads.find((l) => l.id === sv.leadId);
              return (
                <div key={sv.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-semibold">{lead?.name}</div>
                    <div className="text-xs text-muted-foreground">{lead?.phone} · {new Date(sv.scheduledAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}</div>
                  </div>
                  <Badge>{sv.status}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitors</CardTitle>
            <CardDescription>Scan QR or check in manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {branchVisitors.length === 0 && <p className="text-sm text-muted-foreground">No pre-registered visitors.</p>}
            {branchVisitors.slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-semibold">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.purpose} · QR <span className="font-mono">{v.qrToken}</span></div>
                </div>
                <div className="flex gap-1">
                  {!v.checkedInAt && <Button size="sm" variant="outline" onClick={() => checkInMutation.mutate(v.id, { onSuccess: () => toast.success("Checked in") })}><LogIn className="mr-1 h-3.5 w-3.5" /> In</Button>}
                  {v.checkedInAt && !v.checkedOutAt && <Button size="sm" variant="outline" onClick={() => checkOutMutation.mutate(v.id, { onSuccess: () => toast.success("Checked out") })}><LogOut className="mr-1 h-3.5 w-3.5" /> Out</Button>}
                  {v.checkedOutAt && <Badge variant="secondary">Done</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add a walk-in lead</CardTitle>
            <CardDescription>Capture walk-ins into the sales pipeline instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createLeadMutation.mutate(
                  {
                    name: walkin.name,
                    email: `walkin+${Date.now()}@aztech.local`,
                    phone: walkin.phone,
                    source: "walk_in",
                    branchId,
                    message: "Walked in to reception",
                  },
                  { onSuccess: () => { toast.success("Walk-in added to pipeline"); setWalkin({ name: "", phone: "" }); } },
                );
              }}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Input required placeholder="Visitor name" value={walkin.name} onChange={(e) => setWalkin({ ...walkin, name: e.target.value })} />
              <Input required placeholder="Phone" value={walkin.phone} onChange={(e) => setWalkin({ ...walkin, phone: e.target.value })} />
              <Button type="submit"><UserPlus className="mr-1.5 h-4 w-4" /> Add lead</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>QR scanner</CardTitle>
            <CardDescription>Scan member or visitor QR to verify entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed bg-secondary/40 py-12 text-center text-sm text-muted-foreground">
              <div>
                <ScanLine className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="mt-3">Camera-based QR scanning ships in phase 2.</div>
                <div className="text-xs">Until then, type the code in the visitor list.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

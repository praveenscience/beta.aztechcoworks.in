import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, Copy } from "lucide-react";
import { toast } from "sonner";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, usePlans, useBranches } from "@/lib/queries";
import { inr } from "@/lib/format";
import type { Coupon, CouponDiscountType, CouponServiceScope } from "@/types";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

const DISCOUNT_TYPES: { value: CouponDiscountType; label: string }[] = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "flat", label: "Flat amount (₹)" },
  { value: "free_days", label: "Free days" },
];

const SERVICE_SCOPES: { value: CouponServiceScope; label: string }[] = [
  { value: "all", label: "All services" },
  { value: "membership", label: "Memberships only" },
  { value: "meeting_room", label: "Meeting rooms only" },
  { value: "day_pass", label: "Day passes only" },
];

const SEAT_TYPES = ["hot_desk", "dedicated", "cabin", "team_office", "enterprise"];

function discountLabel(c: Coupon) {
  if (c.discountType === "percentage") return `${c.discountValue}%${c.maxDiscountAmount ? ` (max ${inr(c.maxDiscountAmount)})` : ""}`;
  if (c.discountType === "flat") return inr(c.discountValue);
  return `${c.discountValue} days`;
}

function statusColor(s: string) {
  if (s === "active") return "default" as const;
  if (s === "expired") return "destructive" as const;
  return "secondary" as const;
}

function AdminCoupons() {
  const { data: coupons = [] } = useCoupons();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing({
      code: "", description: "",
      discountType: "percentage", discountValue: 10,
      serviceScope: "all", allowedPlanIds: [], allowedBranchIds: [], allowedSeatTypes: [],
      minOrderValue: 0, minDurationMonths: 0, firstPurchaseOnly: false,
      maxUsesTotal: 0, maxUsesPerUser: 1,
      stackable: false, isReferralCoupon: false,
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: "2027-12-31", status: "active",
    });
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing({ ...c, validFrom: (c.validFrom ?? "").slice(0, 10), validUntil: (c.validUntil ?? "").slice(0, 10) });
    setOpen(true);
  };

  const save = (data: Partial<Coupon>) => {
    if (data.id) {
      updateMutation.mutate(data as Coupon, {
        onSuccess: () => { toast.success(`Updated ${data.code}`); setOpen(false); setEditing(null); },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { toast.success(`Created ${data.code}`); setOpen(false); setEditing(null); },
      });
    }
  };

  const deactivate = (c: Coupon) => {
    if (!confirm(`Deactivate coupon "${c.code}"?`)) return;
    deleteMutation.mutate(c.id, { onSuccess: () => toast.success(`Deactivated ${c.code}`) });
  };

  const duplicate = (c: Coupon) => {
    setEditing({
      ...c,
      id: undefined,
      code: c.code + "_COPY",
      currentUsesTotal: 0,
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: (c.validUntil ?? "").slice(0, 10),
    });
    setOpen(true);
  };

  const active = coupons.filter((c) => c.status === "active");
  const inactive = coupons.filter((c) => c.status !== "active");

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Create and manage promotional codes, discounts, and referral offers."
        actions={<Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> New coupon</Button>}
      />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <CouponDialog key={editing?.id ?? editing?.code ?? "new"} coupon={editing} onSave={save} />
      </Dialog>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Active coupons</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{active.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total redemptions</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{coupons.reduce((s, c) => s + (c.currentUsesTotal ?? 0), 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Inactive / Expired</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{inactive.length}</div></CardContent>
        </Card>
      </div>

      {/* Coupon table */}
      <Card>
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Code</th>
                  <th className="pr-3">Discount</th>
                  <th className="pr-3">Scope</th>
                  <th className="pr-3">Usage</th>
                  <th className="pr-3">Valid until</th>
                  <th className="pr-3">Status</th>
                  <th className="w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono font-semibold">{c.code}</span>
                      </div>
                      {c.description && <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>}
                    </td>
                    <td className="pr-3 font-medium">{discountLabel(c)}</td>
                    <td className="pr-3 capitalize">{c.serviceScope.replace("_", " ")}</td>
                    <td className="pr-3">
                      <span className="font-mono">{c.currentUsesTotal ?? 0}</span>
                      {c.maxUsesTotal > 0 && <span className="text-muted-foreground"> / {c.maxUsesTotal}</span>}
                      {c.maxUsesPerUser > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">({c.maxUsesPerUser}/user)</span>
                      )}
                    </td>
                    <td className="pr-3 text-xs">{(c.validUntil ?? "").slice(0, 10)}</td>
                    <td className="pr-3"><Badge variant={statusColor(c.status)}>{c.status}</Badge></td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => duplicate(c)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                        {c.status === "active" && (
                          <Button size="sm" variant="ghost" onClick={() => deactivate(c)} title="Deactivate"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No coupons yet. Create your first one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function CouponDialog({ coupon, onSave }: { coupon: Partial<Coupon> | null; onSave: (c: Partial<Coupon>) => void }) {
  const { data: plans = [] } = usePlans();
  const { data: allBranches = [] } = useBranches();
  const branches = allBranches.filter((b) => b.isActive);
  const [c, setC] = useState<Partial<Coupon>>(coupon ?? {});

  if (!coupon) return null;

  const isEdit = !!c.id;

  const toggleArrayItem = (field: "allowedPlanIds" | "allowedBranchIds" | "allowedSeatTypes", value: string) => {
    const arr = (c[field] as string[]) ?? [];
    setC({ ...c, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] });
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{isEdit ? "Edit coupon" : "New coupon"}</DialogTitle></DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Code & description */}
        <div>
          <Label>Code</Label>
          <Input value={c.code ?? ""} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase() })} placeholder="LAUNCH26" className="font-mono" />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={c.description ?? ""} onChange={(e) => setC({ ...c, description: e.target.value })} placeholder="Internal label" />
        </div>

        {/* Discount type & value */}
        <div>
          <Label>Discount type</Label>
          <Select value={c.discountType ?? "percentage"} onValueChange={(v) => setC({ ...c, discountType: v as CouponDiscountType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{c.discountType === "percentage" ? "Percentage" : c.discountType === "flat" ? "Amount (₹)" : "Days"}</Label>
          <Input type="number" min={0} value={c.discountValue ?? 0} onChange={(e) => setC({ ...c, discountValue: Number(e.target.value) })} />
        </div>

        {/* Max discount cap (percentage only) */}
        {c.discountType === "percentage" && (
          <div className="sm:col-span-2">
            <Label>Max discount cap (₹, optional)</Label>
            <Input type="number" min={0} value={c.maxDiscountAmount ?? ""} onChange={(e) => setC({ ...c, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })} placeholder="No cap" />
          </div>
        )}

        {/* Service scope */}
        <div className="sm:col-span-2">
          <Label>Service scope</Label>
          <Select value={c.serviceScope ?? "all"} onValueChange={(v) => setC({ ...c, serviceScope: v as CouponServiceScope })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERVICE_SCOPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Plan restrictions */}
        {(c.serviceScope === "all" || c.serviceScope === "membership") && (
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Restrict to plans (empty = all plans)</Label>
            <div className="flex flex-wrap gap-2">
              {plans.map((p) => (
                <Badge
                  key={p.id}
                  variant={(c.allowedPlanIds ?? []).includes(p.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem("allowedPlanIds", p.id)}
                >
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Branch restrictions */}
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block">Restrict to branches (empty = all branches)</Label>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => (
              <Badge
                key={b.id}
                variant={(c.allowedBranchIds ?? []).includes(b.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayItem("allowedBranchIds", b.id)}
              >
                {b.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Seat type restrictions */}
        {(c.serviceScope === "all" || c.serviceScope === "membership") && (
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Restrict to seat types (empty = all)</Label>
            <div className="flex flex-wrap gap-2">
              {SEAT_TYPES.map((t) => (
                <Badge
                  key={t}
                  variant={(c.allowedSeatTypes ?? []).includes(t) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleArrayItem("allowedSeatTypes", t)}
                >
                  {t.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Min order & duration */}
        <div>
          <Label>Min order value (₹)</Label>
          <Input type="number" min={0} value={c.minOrderValue ?? 0} onChange={(e) => setC({ ...c, minOrderValue: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Min duration (months)</Label>
          <Input type="number" min={0} value={c.minDurationMonths ?? 0} onChange={(e) => setC({ ...c, minDurationMonths: Number(e.target.value) })} />
        </div>

        {/* Usage limits */}
        <div>
          <Label>Max uses total (0 = unlimited)</Label>
          <Input type="number" min={0} value={c.maxUsesTotal ?? 0} onChange={(e) => setC({ ...c, maxUsesTotal: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Max uses per user (0 = unlimited)</Label>
          <Input type="number" min={0} value={c.maxUsesPerUser ?? 0} onChange={(e) => setC({ ...c, maxUsesPerUser: Number(e.target.value) })} />
        </div>

        {/* Validity */}
        <div>
          <Label>Valid from</Label>
          <Input type="date" value={(c.validFrom ?? "").slice(0, 10)} onChange={(e) => setC({ ...c, validFrom: e.target.value })} />
        </div>
        <div>
          <Label>Valid until</Label>
          <Input type="date" value={(c.validUntil ?? "").slice(0, 10)} onChange={(e) => setC({ ...c, validUntil: e.target.value })} />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <Switch checked={c.firstPurchaseOnly ?? false} onCheckedChange={(v) => setC({ ...c, firstPurchaseOnly: v })} />
          <Label>First purchase only</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={c.stackable ?? false} onCheckedChange={(v) => setC({ ...c, stackable: v })} />
          <Label>Stackable with other coupons</Label>
        </div>

        {/* Status (edit only) */}
        {isEdit && (
          <div className="sm:col-span-2">
            <Label>Status</Label>
            <Select value={c.status ?? "active"} onValueChange={(v) => setC({ ...c, status: v as Coupon["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {(c.currentUsesTotal ?? 0) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Used {c.currentUsesTotal} time(s) so far.</p>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={() => onSave(c)} disabled={!c.code?.trim() || !c.discountValue}>
          {isEdit ? "Save changes" : "Create coupon"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

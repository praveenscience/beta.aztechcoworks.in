import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileJson, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useImportData } from "@/lib/queries";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const Route = createFileRoute("/admin/data")({
  component: AdminData,
});

const EXPORTABLE_TABLES = [
  { key: "users", label: "Users", desc: "All user accounts (passwords excluded)" },
  { key: "branches", label: "Branches", desc: "Branch details, seats, photos" },
  { key: "plans", label: "Plans", desc: "Pricing plans and features" },
  { key: "leads", label: "Leads", desc: "CRM leads and pipeline data" },
  { key: "memberships", label: "Memberships", desc: "Active and past memberships" },
  { key: "bookings", label: "Bookings", desc: "Meeting room and day pass bookings" },
  { key: "invoices", label: "Invoices", desc: "All invoices and payment status" },
  { key: "payments", label: "Payments", desc: "Razorpay payment records" },
  { key: "visitors", label: "Visitors", desc: "Visitor pre-registrations" },
  { key: "coupons", label: "Coupons", desc: "All coupon codes and settings" },
  { key: "coupon_usages", label: "Coupon usages", desc: "Coupon redemption history" },
  { key: "user_deals", label: "User deals", desc: "Personalized deals assigned to users" },
  { key: "testimonials", label: "Testimonials", desc: "Customer testimonials" },
  { key: "blog", label: "Blog posts", desc: "Published blog articles" },
  { key: "audit_logs", label: "Audit logs", desc: "Admin action history" },
];

function AdminData() {
  const importMutation = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<Record<string, number> | null>(null);

  const downloadCsv = (table: string) => {
    window.open(`${API_BASE}/api/dashboard/export/${table}.csv`, "_blank");
  };

  const downloadBackup = () => {
    window.open(`${API_BASE}/api/dashboard/export-all`, "_blank");
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.tables) {
        toast.error("Invalid backup file. Expected JSON with 'tables' key.");
        return;
      }
      importMutation.mutate(data, {
        onSuccess: (result) => {
          setImportResult(result.imported);
          toast.success("Data imported successfully");
        },
        onError: (e: any) => toast.error(e.message || "Import failed"),
      });
    } catch {
      toast.error("Failed to parse JSON file");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <PageHeader title="Data management" description="Export, import, and backup your database." />

      {/* Full backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-accent" /> Full database backup
          </CardTitle>
          <CardDescription>
            Download the entire database as a single JSON file. Includes all tables except passwords.
            Use this for backups, migration, or restoring on another instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={downloadBackup}>
            <Download className="mr-1.5 h-4 w-4" /> Download full backup (JSON)
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" /> Import data
          </CardTitle>
          <CardDescription>
            Restore from a JSON backup file. Data is merged (upserted) — existing records with the same ID are updated, new records are inserted.
            Passwords are not imported; imported users get default password "changeme123".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={importing || importMutation.isPending}
            >
              {importing || importMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              Select backup file (JSON)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 p-3 text-sm dark:border-amber-500/20 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span className="text-amber-800 dark:text-amber-200">
              Import will overwrite existing records with matching IDs. Make a backup first before importing.
            </span>
          </div>

          {importResult && (
            <div className="mt-4 rounded-lg border border-green-300/40 bg-green-50/50 p-4 dark:border-green-500/20 dark:bg-green-950/20">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" /> Import completed
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(importResult).map(([table, count]) => (
                  <Badge key={table} variant="secondary" className="font-mono">
                    {table}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-table CSV export */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" /> Export individual tables (CSV)
          </CardTitle>
          <CardDescription>
            Download specific tables as CSV files. Useful for analysis in Excel, Google Sheets, or other tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EXPORTABLE_TABLES.map((t) => (
              <button
                key={t.key}
                onClick={() => downloadCsv(t.key)}
                className="flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition hover:bg-accent/5 hover:border-accent/30"
              >
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

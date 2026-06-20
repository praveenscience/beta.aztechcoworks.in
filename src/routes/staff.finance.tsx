import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useAllInvoices, useUsers } from "@/lib/queries";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/staff/finance")({
  component: FinancePage,
});

function FinancePage() {
  const { data: invoices = [] } = useAllInvoices();
  const { data: users = [] } = useUsers();
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalGST = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.gst, 0);
  const pending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.total, 0);

  const exportCSV = () => {
    const rows = [["Number", "User", "Subtotal", "GST", "Total", "Status", "Issued"]];
    invoices.forEach((i) => rows.push([
      i.number, users.find((u) => u.id === i.userId)?.name ?? "—",
      String(i.subtotal), String(i.gst), String(i.total), i.status, i.issuedAt,
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aztech-invoices-${Date.now()}.csv`;
    a.click();
    toast.success("CSV exported");
  };

  return (
    <>
      <PageHeader
        title="Finance"
        description="Invoices, payments, refunds, GST exports."
        actions={<Button onClick={exportCSV} variant="outline"><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Total revenue (paid)" value={inr(totalRevenue)} />
        <Kpi label="GST collected" value={inr(totalGST)} />
        <Kpi label="Pending" value={inr(pending)} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>All invoices</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Number</th><th>Customer</th><th>Issued</th><th>Subtotal</th><th>GST</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="py-3 font-mono">{i.number}</td>
                  <td>{users.find((u) => u.id === i.userId)?.name ?? "—"}</td>
                  <td>{new Date(i.issuedAt).toLocaleDateString("en-IN")}</td>
                  <td className="font-mono">{inr(i.subtotal)}</td>
                  <td className="font-mono">{inr(i.gst)}</td>
                  <td className="font-mono font-semibold">{inr(i.total)}</td>
                  <td><Badge className={i.status === "paid" ? "bg-success text-success-foreground hover:bg-success" : ""}>{i.status}</Badge></td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No invoices.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
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

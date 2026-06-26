import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Download } from "lucide-react";
import { toast } from "sonner";
import { useMe, useMyInvoices } from "@/lib/queries";
import { inr } from "@/lib/format";
import { payInvoice } from "@/lib/razorpay";

export const Route = createFileRoute("/dashboard/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const { data: me } = useMe();
  const { data: invoices = [] } = useMyInvoices();
  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePay = async (invoiceId: string) => {
    if (!me) return;
    setPayingId(invoiceId);
    try {
      await payInvoice(invoiceId, { name: me.name, email: me.email, phone: me.phone });
      toast.success("Payment successful!");
    } catch (err: any) {
      if (err.message !== "Payment cancelled") toast.error(err.message || "Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <>
      <PageHeader title="Invoices" description="GST-compliant invoices for every transaction." />
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Number</th><th>Issued</th><th>Subtotal</th><th>GST</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="py-3 font-mono">{i.number}</td>
                  <td>{new Date(i.issuedAt).toLocaleDateString("en-IN")}</td>
                  <td className="font-mono">{inr(i.subtotal)}</td>
                  <td className="font-mono">{inr(i.gst)}</td>
                  <td className="font-mono font-semibold">{inr(i.total)}</td>
                  <td>
                    <Badge className={i.status === "paid" ? "bg-success text-success-foreground hover:bg-success" : ""}>
                      {i.status}
                    </Badge>
                  </td>
                  <td className="space-x-1">
                    {i.status === "pending" && (
                      <Button size="sm" onClick={() => handlePay(i.id)} disabled={payingId === i.id}>
                        <CreditCard className="mr-1 h-3 w-3" />
                        {payingId === i.id ? "Paying..." : "Pay now"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => toast.success(`Downloading ${i.number}.pdf (demo)`)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

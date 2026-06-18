import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore, inr } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/invoices")({
  ssr: false,
  component: InvoicesPage,
});

function InvoicesPage() {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const invoices = useStore(useShallow((s) => s.invoices.filter((i) => i.userId === me?.id)));

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
                  <td>
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

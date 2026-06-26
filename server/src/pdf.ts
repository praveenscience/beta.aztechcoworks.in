// PDF invoice generation using PDFKit (native Node.js PDF library).

import PDFDocument from "pdfkit";

interface InvoiceData {
  number: string;
  issuedAt: string;
  status: string;
  subtotal: number;
  gst: number;
  total: number;
  userName: string;
  userEmail: string;
  userCompany?: string;
  planName?: string;
  branchName?: string;
  description: string;
}

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const cgst = Math.round(data.gst / 2);
    const sgst = data.gst - cgst;
    const pageWidth = doc.page.width - 80; // 40px margin each side

    // ─── Header ───────────────────────────────────
    doc.fontSize(16).font("Helvetica-Bold").text("AZTECH CO-WORKS", 40, 40);
    doc.fontSize(9).font("Helvetica").fillColor("#64748b")
      .text("Premium Coworking & Managed Offices", 40, 58);
    doc.fillColor("#475569")
      .text("Coimbatore, Tamil Nadu, India", 40, 70)
      .text("GSTIN: ______________", 40, 82);

    // Invoice title (right-aligned)
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#000000")
      .text("TAX INVOICE", 0, 40, { align: "right", width: pageWidth + 40 });
    doc.fontSize(11).font("Helvetica").fillColor("#64748b")
      .text(`#${data.number}`, 0, 62, { align: "right", width: pageWidth + 40 });

    // ─── Bill To + Meta ───────────────────────────
    const billY = 115;
    doc.fontSize(9).font("Helvetica").fillColor("#64748b")
      .text("Bill To:", 40, billY);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000")
      .text(data.userName, 40, billY + 14);

    let billOffset = billY + 28;
    if (data.userCompany) {
      doc.fontSize(9).font("Helvetica").fillColor("#475569")
        .text(data.userCompany, 40, billOffset);
      billOffset += 12;
    }
    doc.fontSize(9).font("Helvetica").fillColor("#475569")
      .text(data.userEmail, 40, billOffset);

    // Right side: date, status, branch
    const dateStr = new Date(data.issuedAt).toLocaleDateString("en-IN", { dateStyle: "long" });
    doc.fontSize(9).font("Helvetica").fillColor("#000000")
      .text(`Date: ${dateStr}`, 0, billY, { align: "right", width: pageWidth + 40 })
      .text(`Status: ${data.status.toUpperCase()}`, 0, billY + 14, { align: "right", width: pageWidth + 40 });
    if (data.branchName) {
      doc.text(`Branch: ${data.branchName}`, 0, billY + 28, { align: "right", width: pageWidth + 40 });
    }

    // ─── Line Items Table ─────────────────────────
    const tableY = 185;
    const col1 = 40;
    const col2 = 320;
    const col3 = 400;
    const col4 = pageWidth + 40;

    // Header row
    doc.rect(col1, tableY, pageWidth, 20).fill("#f1f5f9");
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000")
      .text("Description", col1 + 5, tableY + 5)
      .text("HSN/SAC", col2, tableY + 5)
      .text("Qty", col3, tableY + 5, { width: 40, align: "center" })
      .text("Amount", col4 - 80, tableY + 5, { width: 75, align: "right" });

    // Data row
    const rowY = tableY + 22;
    doc.font("Helvetica").fillColor("#000000")
      .text(data.description, col1 + 5, rowY + 5, { width: col2 - col1 - 10 })
      .text("997212", col2, rowY + 5)
      .text("1", col3, rowY + 5, { width: 40, align: "center" })
      .text(inr(data.subtotal), col4 - 80, rowY + 5, { width: 75, align: "right" });

    // Row border
    doc.moveTo(col1, rowY + 20).lineTo(col1 + pageWidth, rowY + 20).strokeColor("#e2e8f0").stroke();

    // ─── Totals ───────────────────────────────────
    const totalsX = col4 - 200;
    let totalsY = rowY + 40;

    const totalRow = (label: string, value: string, bold = false) => {
      doc.fontSize(bold ? 12 : 9)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(bold ? "#000000" : "#64748b")
        .text(label, totalsX, totalsY);
      doc.fillColor("#000000")
        .text(value, col4 - 80, totalsY, { width: 75, align: "right" });
      totalsY += bold ? 22 : 16;
    };

    totalRow("Subtotal", inr(data.subtotal));
    totalRow("CGST (9%)", inr(cgst));
    totalRow("SGST (9%)", inr(sgst));
    totalsY += 4;
    totalRow("Total", inr(data.total), true);

    // ─── Footer ───────────────────────────────────
    const footerY = totalsY + 40;
    doc.moveTo(40, footerY).lineTo(pageWidth + 40, footerY).strokeColor("#e2e8f0").stroke();
    doc.fontSize(8).font("Helvetica").fillColor("#94a3b8")
      .text("This is a computer-generated invoice and does not require a signature.", 40, footerY + 10, { align: "center", width: pageWidth })
      .text("Aztech Co-Works | +91 83106 96307 | aztechcoworks.in", 40, footerY + 22, { align: "center", width: pageWidth });

    doc.end();
  });
}

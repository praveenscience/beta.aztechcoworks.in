// PDF invoice generation using pdfmake (pure JS, no native deps).

import PdfPrinter from "pdfmake";
import type { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";

const fonts: TFontDictionary = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

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
  const cgst = Math.round(data.gst / 2);
  const sgst = data.gst - cgst;

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: { font: "Helvetica", fontSize: 10 },
    pageSize: "A4",
    pageMargins: [40, 40, 40, 60],
    content: [
      // Header
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "AZTECH CO-WORKS", style: "company" },
              { text: "Premium Coworking & Managed Offices", style: "tagline" },
              { text: "Coimbatore, Tamil Nadu, India", style: "subtext" },
              { text: "GSTIN: ______________", style: "subtext" },
            ],
          },
          {
            width: "auto",
            stack: [
              { text: "TAX INVOICE", style: "invoiceTitle" },
              { text: `#${data.number}`, style: "invoiceNumber" },
            ],
            alignment: "right",
          },
        ],
      },
      { canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: "#e2e8f0" }] },

      // Invoice meta
      {
        margin: [0, 15, 0, 15],
        columns: [
          {
            width: "*",
            stack: [
              { text: "Bill To:", style: "label" },
              { text: data.userName, bold: true, fontSize: 11 },
              ...(data.userCompany ? [{ text: data.userCompany, style: "subtext" }] : []),
              { text: data.userEmail, style: "subtext" },
            ],
          },
          {
            width: "auto",
            stack: [
              { text: [{ text: "Date: ", style: "label" }, new Date(data.issuedAt).toLocaleDateString("en-IN", { dateStyle: "long" })], alignment: "right" },
              { text: [{ text: "Status: ", style: "label" }, data.status.toUpperCase()], alignment: "right" },
              ...(data.branchName ? [{ text: [{ text: "Branch: ", style: "label" as const }, data.branchName], alignment: "right" as const }] : []),
            ],
          },
        ],
      },

      // Line items table
      {
        margin: [0, 5, 0, 15],
        table: {
          headerRows: 1,
          widths: ["*", 60, 80, 80],
          body: [
            [
              { text: "Description", style: "tableHeader" },
              { text: "HSN/SAC", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "center" },
              { text: "Amount", style: "tableHeader", alignment: "right" },
            ],
            [
              data.description,
              "997212",
              { text: "1", alignment: "center" },
              { text: inr(data.subtotal), alignment: "right" },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0,
          vLineWidth: () => 0,
          hLineColor: () => "#e2e8f0",
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },

      // Totals
      {
        margin: [0, 0, 0, 20],
        columns: [
          { width: "*", text: "" },
          {
            width: 200,
            table: {
              widths: ["*", "auto"],
              body: [
                [{ text: "Subtotal", style: "label" }, { text: inr(data.subtotal), alignment: "right" }],
                [{ text: "CGST (9%)", style: "label" }, { text: inr(cgst), alignment: "right" }],
                [{ text: "SGST (9%)", style: "label" }, { text: inr(sgst), alignment: "right" }],
                [
                  { text: "Total", bold: true, fontSize: 12 },
                  { text: inr(data.total), bold: true, fontSize: 12, alignment: "right" },
                ],
              ],
            },
            layout: {
              hLineWidth: (i: number) => (i === 3) ? 1 : 0,
              vLineWidth: () => 0,
              hLineColor: () => "#0f172a",
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
      },

      // Footer note
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#e2e8f0" }] },
      { text: "This is a computer-generated invoice and does not require a signature.", style: "footnote", margin: [0, 10, 0, 0] },
      { text: "Aztech Co-Works | +91 83106 96307 | aztechcoworks.in", style: "footnote" },
    ],
    styles: {
      company: { fontSize: 16, bold: true, color: "#0f172a" },
      tagline: { fontSize: 9, color: "#64748b", margin: [0, 2, 0, 2] },
      invoiceTitle: { fontSize: 18, bold: true, color: "#0f172a" },
      invoiceNumber: { fontSize: 11, color: "#64748b" },
      label: { fontSize: 9, color: "#64748b" },
      subtext: { fontSize: 9, color: "#475569" },
      tableHeader: { bold: true, fontSize: 9, color: "#475569", fillColor: "#f8fafc" },
      footnote: { fontSize: 8, color: "#94a3b8", alignment: "center" },
    },
  };

  return new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

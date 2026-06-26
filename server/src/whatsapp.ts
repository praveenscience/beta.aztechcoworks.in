// WhatsApp Business API integration via BSP (Interakt/Wati/Gupshup).
// Falls back to console.log when WHATSAPP_API_KEY is not set.

const API_KEY = process.env.WHATSAPP_API_KEY || "";
const API_URL = process.env.WHATSAPP_API_URL || ""; // BSP endpoint
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";

interface TemplateMessage {
  to: string; // phone number with country code, e.g. "919876543210"
  template: string;
  params: string[];
}

async function sendTemplate(msg: TemplateMessage) {
  if (!API_KEY || !API_URL) {
    console.log(`[WHATSAPP PREVIEW] To: ${msg.to} | Template: ${msg.template} | Params: ${msg.params.join(", ")}`);
    return;
  }

  // Meta Cloud API format (works with most BSPs)
  await fetch(`${API_URL}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: msg.to,
      type: "template",
      template: {
        name: msg.template,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: msg.params.map((p) => ({ type: "text", text: p })),
          },
        ],
      },
    }),
  });
}

// ─── Pre-built message senders ──────────────────

export async function sendLeadWelcome(phone: string, name: string) {
  await sendTemplate({
    to: phone.replace(/\D/g, ""),
    template: "lead_welcome",
    params: [name],
  });
}

export async function sendVisitReminder(phone: string, name: string, branchName: string, dateTime: string) {
  await sendTemplate({
    to: phone.replace(/\D/g, ""),
    template: "visit_reminder",
    params: [name, branchName, dateTime],
  });
}

export async function sendBookingConfirmation(phone: string, name: string, roomName: string, dateTime: string, amount: string) {
  await sendTemplate({
    to: phone.replace(/\D/g, ""),
    template: "booking_confirmation",
    params: [name, roomName, dateTime, amount],
  });
}

export async function sendPaymentReceipt(phone: string, name: string, amount: string, invoiceNumber: string) {
  await sendTemplate({
    to: phone.replace(/\D/g, ""),
    template: "payment_receipt",
    params: [name, amount, invoiceNumber],
  });
}

// Transactional email via Resend.
// Falls back to console.log when RESEND_API_KEY is not set.

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM || "Aztech Co-Works <noreply@aztechcoworks.in>";
const SITE_URL = process.env.SITE_URL || "http://localhost:5173";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function send(payload: EmailPayload) {
  if (!resend) {
    console.log(`[EMAIL PREVIEW] To: ${payload.to} | Subject: ${payload.subject}`);
    console.log(payload.html.replace(/<[^>]+>/g, "").slice(0, 200));
    return;
  }
  await resend.emails.send({ from: FROM, ...payload });
}

// ─── Templates ──────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  await send({
    to,
    subject: "Welcome to Aztech Co-Works!",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created at Aztech Co-Works.</p>
      <p>You can now <a href="${SITE_URL}/auth">sign in</a> to explore branches, book meeting rooms, and manage your membership.</p>
      <p>Questions? WhatsApp us at <a href="https://wa.me/918310696307">+91 83106 96307</a>.</p>
      <br/>
      <p>— Aztech Co-Works, Coimbatore</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${SITE_URL}/auth/reset?token=${token}`;
  await send({
    to,
    subject: "Reset your password — Aztech Co-Works",
    html: `
      <h2>Password reset requested</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a></p>
      <p>Or copy this URL: ${resetUrl}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <br/>
      <p>— Aztech Co-Works</p>
    `,
  });
}

export async function sendBookingConfirmationEmail(
  to: string, name: string,
  details: { roomName: string; branchName: string; date: string; time: string; amount: number },
) {
  await send({
    to,
    subject: `Booking confirmed — ${details.roomName} at ${details.branchName}`,
    html: `
      <h2>Booking confirmed!</h2>
      <p>Hi ${name},</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Room</td><td><strong>${details.roomName}</strong></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Branch</td><td>${details.branchName}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Date</td><td>${details.date}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Time</td><td>${details.time}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Amount</td><td>&#8377;${details.amount.toLocaleString("en-IN")}</td></tr>
      </table>
      <p>Show this email at reception when you arrive.</p>
      <br/>
      <p>— Aztech Co-Works</p>
    `,
  });
}

export async function sendInvoiceEmail(
  to: string, name: string,
  invoice: { number: string; subtotal: number; gst: number; total: number; issuedAt: string },
) {
  await send({
    to,
    subject: `Invoice ${invoice.number} — Aztech Co-Works`,
    html: `
      <h2>Invoice ${invoice.number}</h2>
      <p>Hi ${name},</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Invoice #</td><td><strong>${invoice.number}</strong></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Date</td><td>${invoice.issuedAt}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Subtotal</td><td>&#8377;${invoice.subtotal.toLocaleString("en-IN")}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">GST (18%)</td><td>&#8377;${invoice.gst.toLocaleString("en-IN")}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Total</td><td><strong>&#8377;${invoice.total.toLocaleString("en-IN")}</strong></td></tr>
      </table>
      <p>View your invoices at <a href="${SITE_URL}/dashboard/invoices">your dashboard</a>.</p>
      <br/>
      <p>— Aztech Co-Works</p>
    `,
  });
}

export async function sendSiteVisitConfirmationEmail(
  to: string, name: string,
  details: { branchName: string; branchAddress: string; scheduledAt: string },
) {
  await send({
    to,
    subject: `Site visit confirmed — ${details.branchName}`,
    html: `
      <h2>Site visit confirmed!</h2>
      <p>Hi ${name},</p>
      <p>Your site visit has been scheduled:</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Branch</td><td><strong>${details.branchName}</strong></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Address</td><td>${details.branchAddress}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">When</td><td>${details.scheduledAt}</td></tr>
      </table>
      <p>Our team will be ready to welcome you. Need to reschedule? Call or WhatsApp <a href="https://wa.me/918310696307">+91 83106 96307</a>.</p>
      <br/>
      <p>— Aztech Co-Works</p>
    `,
  });
}

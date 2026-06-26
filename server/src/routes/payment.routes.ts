import { Router } from "express";
import Razorpay from "razorpay";
import { createHmac } from "node:crypto";
import { requireAuth } from "../auth.js";
import { db } from "../store.js";
import { uid } from "../uid.js";
import { validate } from "../validation.js";
import { z } from "zod";
import { sendInvoiceEmail } from "../email.js";
import { sendPaymentReceipt } from "../whatsapp.js";

const router = Router();

// ─── Razorpay instance ─────────────────────────

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

let razorpay: Razorpay | null = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

// ─── Schemas ───────────────────────────────────

const createOrderSchema = z.object({
  invoiceId: z.string().min(1).max(50),
});

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

function notifyPaymentSuccess(invoiceId: string) {
  const invoice = db.invoices.find(invoiceId);
  const user = invoice ? db.users.find(invoice.userId) : null;
  if (invoice && user) {
    sendInvoiceEmail(user.email, user.name, invoice).catch(() => {});
    if (user.phone) {
      const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(invoice.total);
      sendPaymentReceipt(user.phone, user.name, inr, invoice.number).catch(() => {});
    }
  }
}

// ─── GET /api/payments/key — public key for frontend ─

router.get("/key", (_req, res) => {
  res.json({ key: RAZORPAY_KEY_ID });
});

// ─── POST /api/payments/create-order ─────────────

router.post("/create-order", requireAuth, validate(createOrderSchema), async (req, res) => {
  const { invoiceId } = req.body;

  const invoice = db.invoices.find(invoiceId);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (invoice.status === "paid") {
    res.status(400).json({ error: "Invoice already paid" });
    return;
  }

  // Check if order already exists for this invoice
  const existing = db.payments.byInvoice(invoiceId);
  if (existing && existing.status === "created") {
    res.json({ orderId: existing.orderId, amount: existing.amount, currency: existing.currency, paymentId: existing.id });
    return;
  }

  if (!razorpay) {
    // Demo mode — create a mock order
    const payment = {
      id: uid("pay"),
      orderId: `order_demo_${Date.now()}`,
      invoiceId,
      amount: invoice.total * 100, // Razorpay uses paise
      currency: "INR",
      status: "created",
      createdAt: new Date().toISOString(),
    };
    db.payments.insert(payment);
    res.json({ orderId: payment.orderId, amount: payment.amount, currency: payment.currency, paymentId: payment.id, demo: true });
    return;
  }

  try {
    const order = await razorpay.orders.create({
      amount: invoice.total * 100, // paise
      currency: "INR",
      receipt: invoice.number,
    });

    const payment = {
      id: uid("pay"),
      orderId: order.id,
      invoiceId,
      amount: invoice.total * 100,
      currency: "INR",
      status: "created",
      createdAt: new Date().toISOString(),
    };
    db.payments.insert(payment);

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, paymentId: payment.id });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create payment order", details: err.message });
  }
});

// ─── POST /api/payments/verify ───────────────────

router.post("/verify", requireAuth, validate(verifySchema), (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const payment = db.payments.findByOrderId(razorpay_order_id);
  if (!payment) {
    res.status(404).json({ error: "Payment order not found" });
    return;
  }

  // Demo mode — auto-verify
  if (razorpay_order_id.startsWith("order_demo_")) {
    db.payments.update(payment.id, {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "captured",
    });
    if (payment.invoiceId) {
      db.invoices.update(payment.invoiceId, { status: "paid" });
      notifyPaymentSuccess(payment.invoiceId);
    }
    res.json({ verified: true, paymentId: payment.id });
    return;
  }

  // Verify Razorpay signature
  const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    db.payments.update(payment.id, { status: "failed" });
    res.status(400).json({ error: "Payment verification failed" });
    return;
  }

  db.payments.update(payment.id, {
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    status: "captured",
  });

  // Mark invoice as paid
  if (payment.invoiceId) {
    db.invoices.update(payment.invoiceId, { status: "paid" });
    const invoice = db.invoices.find(payment.invoiceId);
    const user = invoice ? db.users.find(invoice.userId) : null;
    if (invoice && user) {
      sendInvoiceEmail(user.email, user.name, invoice).catch(() => {});
    }
  }

  res.json({ verified: true, paymentId: payment.id });
});

// ─── GET /api/payments/history ───────────────────

router.get("/history", requireAuth, (req, res) => {
  const userId = req.session.userId!;
  const userInvoices = db.invoices.byUser(userId);
  const invoiceIds = new Set(userInvoices.map((i) => i.id));
  const allPayments = db.payments.all();
  res.json(allPayments.filter((p: any) => p.invoiceId && invoiceIds.has(p.invoiceId)));
});

// ─── POST /api/payments/webhook — Razorpay async events ─

router.post("/webhook", (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    res.status(200).json({ ok: true });
    return;
  }

  const signature = req.headers["x-razorpay-signature"] as string;
  const expectedSig = createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expectedSig) {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  const event = req.body.event;
  const entity = req.body.payload?.payment?.entity;

  if (event === "payment.captured" && entity?.order_id) {
    const payment = db.payments.findByOrderId(entity.order_id);
    if (payment && payment.status !== "captured") {
      db.payments.update(payment.id, {
        razorpayPaymentId: entity.id,
        status: "captured",
      });
      if (payment.invoiceId) {
        db.invoices.update(payment.invoiceId, { status: "paid" });
      }
    }
  }

  res.status(200).json({ ok: true });
});

export default router;

// Razorpay checkout integration for the frontend.

import { api } from "./api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  paymentId: string;
  demo?: boolean;
}

interface PaymentResult {
  verified: boolean;
  paymentId: string;
}

export async function payInvoice(
  invoiceId: string,
  userInfo: { name: string; email: string; phone?: string },
): Promise<PaymentResult> {
  // 1. Create order on backend
  const order = await api.post<CreateOrderResult>("/api/payments/create-order", { invoiceId });

  // 2. Demo mode — skip Razorpay modal
  if (order.demo) {
    return api.post<PaymentResult>("/api/payments/verify", {
      razorpay_order_id: order.orderId,
      razorpay_payment_id: `pay_demo_${Date.now()}`,
      razorpay_signature: "demo_signature",
    });
  }

  // 3. Fetch Razorpay public key
  const { key } = await api.get<{ key: string }>("/api/payments/key");

  // 4. Open Razorpay checkout modal
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay not loaded. Please refresh and try again."));
      return;
    }

    const rzp = new window.Razorpay({
      key,
      amount: order.amount,
      currency: order.currency,
      name: "Aztech Co-Works",
      description: `Invoice payment`,
      order_id: order.orderId,
      prefill: {
        name: userInfo.name,
        email: userInfo.email,
        contact: userInfo.phone || "",
      },
      theme: { color: "#0f172a" },
      handler: async (response: any) => {
        try {
          const result = await api.post<PaymentResult>("/api/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });

    rzp.on("payment.failed", (response: any) => {
      reject(new Error(response.error?.description || "Payment failed"));
    });

    rzp.open();
  });
}

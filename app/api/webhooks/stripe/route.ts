import { createHmac, timingSafeEqual } from "node:crypto";
import { applyPaymentEvent } from "../../../lib/order-store";
import type { PaymentStatus } from "../../../lib/orders";
import { isValidOrderId, noStoreJson } from "../../../lib/security";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const values = signatureHeader.split(",").reduce<Record<string, string[]>>((all, part) => {
    const [key, value] = part.split("=");
    if (key && value) (all[key] ||= []).push(value);
    return all;
  }, {});
  const timestamp = values.t?.[0];
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return (values.v1 || []).some((candidate) => {
    if (!/^[a-f0-9]{64}$/i.test(candidate) || candidate.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(expected, "hex"));
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return noStoreJson({ error: "Stripe webhook is not configured." }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 1_000_000) return noStoreJson({ error: "Payload too large." }, { status: 413 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!verifyStripeSignature(payload, signature, secret)) return noStoreJson({ error: "Invalid signature." }, { status: 400 });

  let event: { id?: string; type?: string; data?: { object?: { id?: string; client_reference_id?: string; payment_status?: string; metadata?: { orderId?: string } } } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return noStoreJson({ error: "Invalid JSON payload." }, { status: 400 });
  }
  const object = event.data?.object;
  const orderId = object?.client_reference_id || object?.metadata?.orderId;
  if (!orderId || !isValidOrderId(orderId) || !event.id || event.id.length > 180 || !event.type) return noStoreJson({ received: true });

  const statuses: Record<string, PaymentStatus> = {
    "checkout.session.async_payment_succeeded": "paid",
    "checkout.session.async_payment_failed": "failed",
    "checkout.session.expired": "expired",
  };
  const paymentStatus = event.type === "checkout.session.completed"
    ? object?.payment_status === "paid" ? "paid" : "pending"
    : statuses[event.type];
  if (paymentStatus) {
    await applyPaymentEvent({
      provider: "stripe",
      eventId: event.id,
      orderId,
      paymentStatus,
      outcome: event.type,
      providerReference: object?.id,
    });
  }
  return noStoreJson({ received: true });
}

import { timingSafeEqual } from "node:crypto";
import { applyPaymentEvent } from "../../../lib/order-store";
import type { PaymentStatus } from "../../../lib/orders";
import { isValidOrderId, noStoreJson } from "../../../lib/security";

export const runtime = "nodejs";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const username = process.env.WORLDPAY_WEBHOOK_USERNAME;
  const password = process.env.WORLDPAY_WEBHOOK_PASSWORD;
  if (!username || !password) return noStoreJson({ error: "Worldpay webhook authentication is not configured." }, { status: 503 });
  const expected = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  if (!safeEqual(request.headers.get("authorization") || "", expected)) return noStoreJson({ error: "Unauthorized." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 1_000_000) return noStoreJson({ error: "Payload too large." }, { status: 413 });

  let event: Record<string, unknown>;
  try {
    event = await request.json() as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: "Invalid JSON payload." }, { status: 400 });
  }
  const details = event.eventDetails && typeof event.eventDetails === "object" ? event.eventDetails as Record<string, unknown> : event;
  const orderId = [details.transactionReference, event.transactionReference].find((value) => typeof value === "string") as string | undefined;
  const eventId = [event.eventId, event.id].find((value) => typeof value === "string") as string | undefined;
  const eventType = String(details.type || event.type || details.outcome || "unknown");
  if (!orderId || !isValidOrderId(orderId) || !eventId || eventId.length > 180) return noStoreJson({ received: true });

  const lowered = eventType.toLowerCase();
  let paymentStatus: PaymentStatus | undefined;
  if (lowered.includes("authorized") || lowered.includes("settled") || lowered.includes("captured")) paymentStatus = "paid";
  else if (lowered.includes("refused") || lowered.includes("failed") || lowered.includes("error")) paymentStatus = "failed";
  else if (lowered.includes("cancel")) paymentStatus = "cancelled";
  else if (lowered.includes("expire")) paymentStatus = "expired";
  if (paymentStatus) await applyPaymentEvent({ provider: "worldpay", eventId, orderId, paymentStatus, outcome: eventType });
  return noStoreJson({ received: true });
}

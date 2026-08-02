import { createHash, randomBytes } from "node:crypto";
import { createOrder, getOrderByIdempotencyHash, updateOrder, applyPaymentEvent } from "../../lib/order-store";
import { CheckoutValidationError, type OrderRecord, validateCheckout } from "../../lib/orders";
import { setOrderAccess, isOrderAccessConfigured } from "../../lib/order-access";
import { createStripeCheckout, isStripeConfigured } from "../../lib/payments/stripe";
import { authorizeWorldpay, isWorldpayCheckoutEnabled } from "../../lib/payments/worldpay";
import { checkRateLimit, configuredSiteOrigin, getClientAddress, isTrustedOrigin, noStoreJson } from "../../lib/security";

export const runtime = "nodejs";

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function checkoutFingerprint(checkout: ReturnType<typeof validateCheckout>) {
  return digest(JSON.stringify({
    provider: checkout.provider,
    fulfilment: checkout.fulfilment,
    customer: checkout.customer,
    deliveryAddress: checkout.deliveryAddress,
    requestedTime: checkout.requestedTime,
    orderNote: checkout.orderNote,
    lines: checkout.lines,
    totalPence: checkout.totalPence,
  }));
}

function orderResponse(body: unknown, orderId: string, init: ResponseInit = {}) {
  const response = noStoreJson(body, init);
  setOrderAccess(response, orderId);
  return response;
}

export async function POST(request: Request) {
  let order: OrderRecord | undefined;
  try {
    if (!isTrustedOrigin(request)) return noStoreJson({ error: "Invalid request origin." }, { status: 403 });
    const rate = checkRateLimit("checkout", getClientAddress(request), 12, 10 * 60_000);
    if (!rate.allowed) {
      const response = noStoreJson({ error: "Too many checkout attempts. Please wait and try again." }, { status: 429 });
      response.headers.set("Retry-After", String(rate.retryAfterSeconds));
      return response;
    }
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 64_000) return noStoreJson({ error: "Checkout request is too large." }, { status: 413 });
    if (!isOrderAccessConfigured()) throw new Error("Order access signing is not configured.");

    const checkout = validateCheckout(await request.json());
    const requestedKey = request.headers.get("idempotency-key") || "";
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestedKey)) {
      throw new CheckoutValidationError("A valid idempotency key is required.");
    }
    if (checkout.provider === "stripe" && !isStripeConfigured()) throw new CheckoutValidationError("Stripe checkout is not available.");
    if (checkout.provider === "worldpay" && !isWorldpayCheckoutEnabled()) throw new CheckoutValidationError("Worldpay checkout is not available.");

    const idempotencyKeyHash = digest(requestedKey);
    const requestFingerprint = checkoutFingerprint(checkout);
    const existing = await getOrderByIdempotencyHash(idempotencyKeyHash);
    if (existing && existing.requestFingerprint !== requestFingerprint) {
      return noStoreJson({ error: "This checkout key was already used for a different order." }, { status: 409 });
    }
    if (existing?.providerCheckoutUrl) {
      return orderResponse({ orderId: existing.id, redirectUrl: existing.providerCheckoutUrl }, existing.id);
    }
    if (existing) return orderResponse({ error: "This checkout request is already being processed.", orderId: existing.id }, existing.id, { status: 409 });

    const orderId = `ord_${randomBytes(24).toString("base64url")}`;
    const now = new Date().toISOString();
    const createdOrder: OrderRecord = {
      id: orderId, createdAt: now, updatedAt: now, status: "pending_payment", paymentStatus: "pending", provider: checkout.provider,
      idempotencyKeyHash, requestFingerprint,
      customer: checkout.customer, fulfilment: checkout.fulfilment, requestedTime: checkout.requestedTime,
      deliveryAddress: checkout.deliveryAddress, orderNote: checkout.orderNote, lines: checkout.lines,
      subtotalPence: checkout.subtotalPence, deliveryFeePence: checkout.deliveryFeePence,
      totalPence: checkout.totalPence, currency: "GBP",
      statusHistory: [{ status: "pending_payment", at: now, actor: "system" }],
    };
    order = createdOrder;
    await createOrder(createdOrder);
    const baseUrl = configuredSiteOrigin(request);

    if (createdOrder.provider === "stripe") {
      const payment = await createStripeCheckout(createdOrder, baseUrl);
      await updateOrder(createdOrder.id, { providerReference: payment.providerReference, providerCheckoutUrl: payment.redirectUrl });
      return orderResponse({ orderId: createdOrder.id, redirectUrl: payment.redirectUrl }, createdOrder.id);
    }

    const payment = await authorizeWorldpay(createdOrder, checkout.worldpaySessions);
    await applyPaymentEvent({
      provider: "worldpay",
      eventId: `authorization:${payment.providerReference}:${payment.outcome}`,
      orderId: createdOrder.id,
      paymentStatus: payment.paid ? "paid" : "pending",
      outcome: payment.outcome,
      providerReference: payment.providerReference,
    });
    if (payment.paid) return orderResponse({ orderId: createdOrder.id, redirectUrl: `${baseUrl}/checkout/success?order_id=${createdOrder.id}&provider=worldpay` }, createdOrder.id);
    if (payment.actionUrl) return orderResponse({ orderId: createdOrder.id, actionRequired: true, actionUrl: payment.actionUrl, outcome: payment.outcome }, createdOrder.id, { status: 202 });
    await applyPaymentEvent({ provider: "worldpay", eventId: `failure:${createdOrder.id}:${Date.now()}`, orderId: createdOrder.id, paymentStatus: "failed", outcome: payment.outcome, providerReference: payment.providerReference });
    return orderResponse({ error: "Worldpay could not authorize this payment. Please try another payment method.", orderId: createdOrder.id }, createdOrder.id, { status: 402 });
  } catch (error) {
    if (order) await applyPaymentEvent({
      provider: order.provider,
      eventId: `checkout-error:${order.id}:${Date.now()}`,
      orderId: order.id,
      paymentStatus: "failed",
      outcome: "checkout_error",
    }).catch(() => false);
    const status = error instanceof CheckoutValidationError ? 400 : 500;
    if (!(error instanceof CheckoutValidationError)) console.error("Checkout could not be started.", error instanceof Error ? error.name : "UnknownError");
    return noStoreJson({ error: error instanceof CheckoutValidationError ? error.message : "Checkout could not be started securely. Please try again." }, { status });
  }
}

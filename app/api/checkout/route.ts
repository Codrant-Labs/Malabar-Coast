import { createHash, randomBytes } from "node:crypto";
import { applyPaymentEvent, attachCheckoutProviderReference, createCheckoutOrderAtomic } from "../../lib/order-store";
import { CheckoutValidationError, type OrderRecord, validateCheckout } from "../../lib/orders";
import { setOrderAccess, isOrderAccessConfigured } from "../../lib/order-access";
import { createStripeCheckout, isStripeConfigured } from "../../lib/payments/stripe";
import { authorizeWorldpay, isWorldpayCheckoutEnabled } from "../../lib/payments/worldpay";
import { checkRateLimit, configuredSiteOrigin, getClientAddress, isTrustedOrigin, noStoreJson, readLimitedJson, RequestBodyTooLargeError } from "../../lib/security";

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
  let createdByRequest = false;
  try {
    if (!isTrustedOrigin(request)) return noStoreJson({ error: "Invalid request origin." }, { status: 403 });
    const rate = checkRateLimit("checkout", getClientAddress(request), 12, 10 * 60_000);
    if (!rate.allowed) {
      const response = noStoreJson({ error: "Too many checkout attempts. Please wait and try again." }, { status: 429 });
      response.headers.set("Retry-After", String(rate.retryAfterSeconds));
      return response;
    }
    if (!isOrderAccessConfigured()) throw new Error("Order access signing is not configured.");

    const checkout = validateCheckout(await readLimitedJson(request, 64_000));
    const requestedKey = request.headers.get("idempotency-key") || "";
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestedKey)) {
      throw new CheckoutValidationError("A valid idempotency key is required.");
    }
    if (checkout.provider === "stripe" && !isStripeConfigured()) throw new CheckoutValidationError("Stripe checkout is not available.");
    if (checkout.provider === "worldpay" && !isWorldpayCheckoutEnabled()) throw new CheckoutValidationError("Worldpay checkout is not available.");

    const idempotencyKeyHash = digest(requestedKey);
    const requestFingerprint = checkoutFingerprint(checkout);
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
    const atomic = await createCheckoutOrderAtomic(createdOrder);
    order = atomic.order;
    createdByRequest = atomic.result === "created";
    if (atomic.result === "conflict") {
      return noStoreJson({ error: "This checkout key was already used for a different order." }, { status: 409 });
    }
    if (atomic.order.providerCheckoutUrl) {
      return orderResponse({ orderId: atomic.order.id, redirectUrl: atomic.order.providerCheckoutUrl }, atomic.order.id);
    }
    const baseUrl = configuredSiteOrigin(request);

    if (atomic.order.provider === "stripe") {
      // Stripe uses the stable order ID as its idempotency key, so this also safely
      // recovers a process that stopped after session creation but before persistence.
      const payment = await createStripeCheckout(atomic.order, baseUrl);
      const attached = await attachCheckoutProviderReference(atomic.order.id, "stripe", payment.providerReference, payment.redirectUrl);
      if (!attached) throw new Error("Stripe checkout identity could not be attached to the order.");
      return orderResponse({ orderId: atomic.order.id, redirectUrl: payment.redirectUrl }, atomic.order.id);
    }

    if (!createdByRequest) {
      return orderResponse({ error: "This checkout request is already being processed.", orderId: atomic.order.id }, atomic.order.id, { status: 409 });
    }

    const payment = await authorizeWorldpay(atomic.order, checkout.worldpaySessions);
    await applyPaymentEvent({
      provider: "worldpay",
      eventId: `authorization:${payment.providerReference}:${payment.outcome}`,
      orderId: atomic.order.id,
      paymentStatus: payment.paid ? "paid" : "pending",
      outcome: payment.outcome,
      providerReference: payment.providerReference,
      amountPence: atomic.order.totalPence,
      currency: atomic.order.currency,
    });
    if (payment.paid) return orderResponse({ orderId: atomic.order.id, redirectUrl: `${baseUrl}/checkout/success?order_id=${atomic.order.id}&provider=worldpay` }, atomic.order.id);
    if (payment.actionUrl) return orderResponse({ orderId: atomic.order.id, actionRequired: true, actionUrl: payment.actionUrl, outcome: payment.outcome }, atomic.order.id, { status: 202 });
    await applyPaymentEvent({ provider: "worldpay", eventId: `failure:${atomic.order.id}:${Date.now()}`, orderId: atomic.order.id, paymentStatus: "failed", outcome: payment.outcome, providerReference: payment.providerReference, amountPence: atomic.order.totalPence, currency: atomic.order.currency });
    return orderResponse({ error: "Worldpay could not authorize this payment. Please try another payment method.", orderId: atomic.order.id }, atomic.order.id, { status: 402 });
  } catch (error) {
    if (order && createdByRequest) await applyPaymentEvent({
      provider: order.provider,
      eventId: `checkout-error:${order.id}:${Date.now()}`,
      orderId: order.id,
      paymentStatus: "failed",
      outcome: "checkout_error",
    }).catch(() => false);
    const status = error instanceof RequestBodyTooLargeError ? 413 : error instanceof CheckoutValidationError || error instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error("Checkout could not be started.", error instanceof Error ? error.name : "UnknownError");
    const message = error instanceof RequestBodyTooLargeError
      ? "Checkout request is too large."
      : error instanceof CheckoutValidationError
        ? error.message
        : error instanceof SyntaxError
          ? "Checkout details are invalid."
          : "Checkout could not be started securely. Please try again.";
    return noStoreJson({ error: message }, { status });
  }
}

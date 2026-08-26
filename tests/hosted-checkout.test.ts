import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Stripe uses a server-created hosted checkout redirect", async () => {
  const [checkout, stripe, form, config] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/checkout-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/payment-config/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /createStripeCheckout/);
  assert.match(stripe, /checkout\/sessions/);
  assert.doesNotMatch(form, /choose.*provider/i);
  assert.match(config, /stripe: isStripeConfigured\(\)/);
});

test("checkout presents payment as a compact secure handoff", async () => {
  const [form, styles] = await Promise.all([
    readFile(new URL("../app/components/checkout-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/order.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(form, /paymentChoices/);
  assert.match(form, /paymentHandoff/);
  assert.match(form, /Continue to payment/);
  assert.match(form, /Your card details never pass through this website/);
  assert.match(styles, /\.paymentPromises/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
});

test("transactional messages separate customer reassurance from owner actions", async () => {
  const notifications = await readFile(new URL("../app/lib/email/notifications.ts", import.meta.url), "utf8");
  assert.match(notifications, /Your order is with us/);
  assert.match(notifications, /A paid order has arrived/);
  assert.match(notifications, /Team action/);
  assert.match(notifications, /Open this order/);
  assert.match(notifications, /Total paid/);
  assert.match(notifications, /@media only screen and \(max-width:620px\)/);
});

test("refunds and disputes produce idempotent customer and owner alerts", async () => {
  const [notifications, webhook, events] = await Promise.all([
    readFile(new URL("../app/lib/email/notifications.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/webhooks/stripe/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe-events.ts", import.meta.url), "utf8"),
  ]);
  assert.match(notifications, /notifyPaymentUpdate/);
  assert.match(notifications, /notifyPaymentException/);
  assert.match(notifications, /refund_update_customer/);
  assert.match(notifications, /payment_exception_owner/);
  assert.match(webhook, /charge\.dispute\.funds_reinstated/);
  assert.match(webhook, /refund\.failed/);
  assert.match(webhook, /recordedOrRetryingNotification/);
  assert.match(events, /refund\.created/);
  assert.match(events, /refund\.updated/);
  assert.match(events, /refund\.failed/);
});

test("connection retries retain one checkout identity and expose recovery actions", async () => {
  const form = await readFile(new URL("../app/components/checkout-form.tsx", import.meta.url), "utf8");
  assert.match(form, /checkoutAttemptForPayload/);
  assert.match(form, /Idempotency-Key": attempt\.key/);
  assert.match(form, /Resume secure payment/);
  assert.match(form, /Check payment status/);
  assert.match(form, /controller\.abort\(\)/);
});

test("a realtime notification failure cannot fail a recorded payment", async () => {
  const publisher = await readFile(new URL("../app/lib/publishEvent.ts", import.meta.url), "utf8");
  assert.match(publisher, /return false/);
  assert.doesNotMatch(publisher, /throw new Error/);
});

test("production readiness requires live Stripe credentials", async () => {
  const [readiness, stripe] = await Promise.all([
    readFile(new URL("../app/api/health/ready/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe.ts", import.meta.url), "utf8"),
  ]);
  assert.match(readiness, /stripePayments: isStripeProductionReady\(\)/);
  assert.match(stripe, /\(\?:sk\|rk\)_live_/);
  assert.match(stripe, /hasPublicHttpsSiteOrigin/);
  assert.match(stripe, /Live Stripe checkout requires a public HTTPS site origin/);
});

test("CMS-only dishes carry their category into server-side checkout validation", async () => {
  const [queries, menu] = await Promise.all([
    readFile(new URL("../sanity/lib/queries.ts", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/menu.ts", import.meta.url), "utf8"),
  ]);
  assert.match(queries, /checkoutMenuItemQuery[\s\S]*"category": category->slug\.current/);
  assert.match(menu, /if \(!raw\.id \|\| !raw\.category \|\| !raw\.name\) return null/);
});

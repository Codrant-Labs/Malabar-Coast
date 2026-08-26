import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutAttemptForPayload,
  isSafeStripeCheckoutUrl,
  parseCheckoutAttempt,
} from "../app/lib/checkout-recovery";

test("an interrupted retry reuses the same idempotency key", () => {
  const first = checkoutAttemptForPayload('{"cart":[1]}', null, () => "attempt_1234567890abcdef", 1_000);
  const retry = checkoutAttemptForPayload('{"cart":[1]}', first, () => "attempt_should_not_change", 2_000);
  assert.equal(retry.key, first.key);
  assert.equal(retry, first);
});

test("a changed checkout creates a new idempotency key", () => {
  const first = checkoutAttemptForPayload('{"cart":[1]}', null, () => "attempt_1234567890abcdef", 1_000);
  const changed = checkoutAttemptForPayload('{"cart":[2]}', first, () => "attempt_fedcba0987654321", 2_000);
  assert.notEqual(changed.key, first.key);
});

test("stored recovery rejects expired or unsafe checkout destinations", () => {
  const safe = JSON.stringify({
    key: "attempt_1234567890abcdef",
    payload: "{}",
    createdAt: 1_000,
    orderId: "ord_1234567890abcdefghijklmnop",
    redirectUrl: "https://checkout.stripe.com/c/pay/cs_test_example",
  });
  assert.ok(parseCheckoutAttempt(safe, 2_000));
  assert.equal(parseCheckoutAttempt(safe, 25 * 60 * 60_000), null);
  assert.equal(isSafeStripeCheckoutUrl("https://checkout.stripe.com/c/pay/example"), true);
  assert.equal(isSafeStripeCheckoutUrl("https://checkout.stripe.com.evil.example/pay"), false);
  assert.equal(isSafeStripeCheckoutUrl("javascript:alert(1)"), false);
});

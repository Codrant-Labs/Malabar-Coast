import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedAdminTransitions, resolvePaymentTransition } from "../app/lib/orders";

test("admin fulfilment stays locked until payment is exactly paid", () => {
  assert.deepEqual(getAllowedAdminTransitions({ status: "paid", paymentStatus: "pending", fulfilment: "delivery" }), []);
  assert.deepEqual(getAllowedAdminTransitions({ status: "paid", paymentStatus: "paid", fulfilment: "delivery" }), ["confirmed"]);
  assert.deepEqual(getAllowedAdminTransitions({ status: "ready", paymentStatus: "paid", fulfilment: "collection" }), ["completed"]);
  assert.deepEqual(getAllowedAdminTransitions({ status: "ready", paymentStatus: "paid", fulfilment: "delivery" }), ["out_for_delivery", "completed"]);
});

test("a failure after confirmation becomes a reversal and stops fulfilment", () => {
  assert.deepEqual(
    resolvePaymentTransition({ status: "preparing", paymentStatus: "paid" }, "failed"),
    { paymentStatus: "reversed", orderStatus: "payment_reversed" },
  );
});

test("refunds and disputes become explicit terminal payment states", () => {
  assert.deepEqual(
    resolvePaymentTransition({ status: "ready", paymentStatus: "paid" }, "refunded"),
    { paymentStatus: "refunded", orderStatus: "refunded" },
  );
  assert.deepEqual(
    resolvePaymentTransition({ status: "confirmed", paymentStatus: "paid" }, "disputed"),
    { paymentStatus: "disputed", orderStatus: "payment_disputed" },
  );
});

test("paid retries cannot reopen an irreversible payment state", () => {
  assert.deepEqual(
    resolvePaymentTransition({ status: "refunded", paymentStatus: "refunded" }, "paid"),
    { paymentStatus: "refunded", orderStatus: "refunded" },
  );
  assert.deepEqual(
    resolvePaymentTransition({ status: "ready", paymentStatus: "partially_refunded" }, "paid"),
    { paymentStatus: "partially_refunded", orderStatus: "ready" },
  );
});

test("a partial refund is visible and terminal for automated fulfilment", () => {
  assert.deepEqual(
    resolvePaymentTransition({ status: "preparing", paymentStatus: "paid" }, "partially_refunded"),
    { paymentStatus: "partially_refunded", orderStatus: "payment_partially_refunded" },
  );
});

test("a pre-payment failure remains recoverable by a later verified payment", () => {
  assert.deepEqual(
    resolvePaymentTransition({ status: "pending_payment", paymentStatus: "pending" }, "failed"),
    { paymentStatus: "failed", orderStatus: "payment_failed" },
  );
  assert.deepEqual(
    resolvePaymentTransition({ status: "payment_failed", paymentStatus: "failed" }, "paid"),
    { paymentStatus: "paid", orderStatus: "paid" },
  );
});

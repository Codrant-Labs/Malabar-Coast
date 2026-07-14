import type { OrderRecord } from "../orders";

type Sessions = { card?: string; cvv?: string };

export async function authorizeWorldpay(order: OrderRecord, sessions: Sessions | undefined) {
  const username = process.env.WORLDPAY_USERNAME;
  const password = process.env.WORLDPAY_PASSWORD;
  const entity = process.env.WORLDPAY_MERCHANT_ENTITY;
  if (!username || !password || !entity) throw new Error("Worldpay is not configured.");
  if (!sessions?.card || !sessions?.cvv) throw new Error("Secure Worldpay card sessions are missing or expired.");

  const live = process.env.WORLDPAY_ENVIRONMENT === "live";
  const response = await fetch(`${live ? "https://access.worldpay.com" : "https://try.access.worldpay.com"}/payments/authorizations`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "Content-Type": "application/vnd.worldpay.payments-v6+json",
      Accept: "application/vnd.worldpay.payments-v6.hal+json",
    },
    body: JSON.stringify({
      transactionReference: order.id,
      merchant: { entity },
      instruction: {
        narrative: { line1: process.env.WORLDPAY_NARRATIVE || "Malabar Coast" },
        value: { currency: "GBP", amount: order.totalPence },
        paymentInstrument: { type: "card/checkout", sessionHref: sessions.card, cvcHref: sessions.cvv },
      },
    }),
  });
  const result = await response.json() as Record<string, unknown>;
  const outcome = typeof result.outcome === "string" ? result.outcome : "unknown";
  if (!response.ok) {
    const description = typeof result.description === "string" ? result.description : "Worldpay could not authorize this payment.";
    throw new Error(description);
  }
  const reference = typeof result.paymentId === "string" ? result.paymentId : order.id;
  if (["authorized", "sentForSettlement"].includes(outcome)) return { providerReference: reference, outcome, paid: true };

  const actions = (result._actions || result._links) as Record<string, { href?: string }> | undefined;
  const nextAction = actions && ["3dsDeviceData", "supply3dsDeviceData", "3dsChallenge", "supply3dsChallenge"].map((key) => actions[key]).find((action) => action?.href);
  return { providerReference: reference, outcome, paid: false, actionUrl: nextAction?.href };
}

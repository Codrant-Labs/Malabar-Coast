export const CHECKOUT_ATTEMPT_STORAGE_KEY = "malabar-coast.checkout-attempt.v1";
const checkoutAttemptLifetimeMs = 24 * 60 * 60_000;

export type CheckoutAttempt = {
  key: string;
  payload: string;
  createdAt: number;
  orderId?: string;
  redirectUrl?: string;
};

export function isSafeStripeCheckoutUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

export function parseCheckoutAttempt(value: string | null, now = Date.now()): CheckoutAttempt | null {
  if (!value) return null;
  try {
    const attempt = JSON.parse(value) as Partial<CheckoutAttempt>;
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(attempt.key || "")) return null;
    if (typeof attempt.payload !== "string" || attempt.payload.length > 64_000) return null;
    if (typeof attempt.createdAt !== "number" || now - attempt.createdAt > checkoutAttemptLifetimeMs || attempt.createdAt > now + 60_000) return null;
    if (attempt.orderId && !/^ord_[a-zA-Z0-9_-]{20,80}$/.test(attempt.orderId)) return null;
    if (attempt.redirectUrl && !isSafeStripeCheckoutUrl(attempt.redirectUrl)) return null;
    return attempt as CheckoutAttempt;
  } catch {
    return null;
  }
}

export function checkoutAttemptForPayload(
  payload: string,
  previous: CheckoutAttempt | null,
  createKey: () => string = () => crypto.randomUUID(),
  now = Date.now(),
): CheckoutAttempt {
  if (previous?.payload === payload && now - previous.createdAt <= checkoutAttemptLifetimeMs) return previous;
  return {key: createKey(), payload, createdAt: now};
}

export function readCheckoutAttempt() {
  if (typeof window === "undefined") return null;
  try {
    return parseCheckoutAttempt(window.sessionStorage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveCheckoutAttempt(attempt: CheckoutAttempt) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // Checkout still works when browser storage is unavailable; only recovery is reduced.
  }
}

export function clearCheckoutAttempt() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

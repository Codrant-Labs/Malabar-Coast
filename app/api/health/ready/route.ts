import { isAdminConfigured } from "../../../lib/admin-auth";
import { checkDurableOrderStorage, isDurableOrderStorageConfigured } from "../../../lib/order-store";
import { isProductionOrderAccessConfigured } from "../../../lib/order-access";
import { isStripeConfigured } from "../../../lib/payments/stripe";
import { isWorldpayCheckoutEnabled } from "../../../lib/payments/worldpay";
import { checkRateLimit, getClientAddress, noStoreJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rate = checkRateLimit("readiness", getClientAddress(request), 60, 60_000);
  if (!rate.allowed) {
    const response = noStoreJson({ status: "rate_limited" }, { status: 429 });
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  const storageConfigured = isDurableOrderStorageConfigured();
  const storageReachable = storageConfigured ? await checkDurableOrderStorage() : false;
  const canonicalHttps = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").protocol === "https:"; } catch { return false; }
  })();
  const checks = {
    canonicalHttps,
    durableStorage: storageConfigured && storageReachable,
    orderAccessSigning: isProductionOrderAccessConfigured(),
    administratorAccess: isAdminConfigured(),
    paymentProvider: isStripeConfigured() || isWorldpayCheckoutEnabled(),
  };
  const ready = Object.values(checks).every(Boolean);
  return noStoreJson({ status: ready ? "ready" : "not_ready", checks, time: new Date().toISOString() }, { status: ready ? 200 : 503 });
}

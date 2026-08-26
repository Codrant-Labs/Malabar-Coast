import {checkAdminAuthSchema} from "../app/lib/admin-auth";
import {checkBrevoConnection} from "../app/lib/email/brevo";
import {isProductionOrderAccessConfigured} from "../app/lib/order-access";
import {checkDurableOrderStorage} from "../app/lib/order-store";
import {isStripeProductionReady} from "../app/lib/payments/stripe";
import {requiredStripeWebhookEvents} from "../app/lib/payments/stripe-events";
import {supabaseServerRpc} from "../app/lib/supabase/server";

async function stripeReadiness() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const configuredSite = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://invalid.local");
  const liveCredentialsPresent = Boolean(secret && /^(?:sk|rk)_live_/.test(secret));
  const webhookSecretPresent = Boolean(webhookSecret?.startsWith("whsec_"));
  const localApplicationReady = isStripeProductionReady();
  if (!secret || !liveCredentialsPresent || !webhookSecretPresent) {
    return {liveCredentialsPresent, webhookSecretPresent, localApplicationReady};
  }
  const headers = {Authorization: `Bearer ${secret}`};
  const [accountResponse, endpointsResponse] = await Promise.all([
    fetch("https://api.stripe.com/v1/account", {headers, signal: AbortSignal.timeout(10_000)}),
    fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", {headers, signal: AbortSignal.timeout(10_000)}),
  ]);
  if (!accountResponse.ok || !endpointsResponse.ok) {
    return {liveCredentialsPresent, webhookSecretPresent, localApplicationReady, providerReachable: false, accountStatus: accountResponse.status, endpointsStatus: endpointsResponse.status};
  }
  const account = await accountResponse.json() as {charges_enabled?: boolean; payouts_enabled?: boolean; country?: string; default_currency?: string};
  const endpoints = await endpointsResponse.json() as {data?: Array<{url?: string; status?: string; enabled_events?: string[]}>};
  const expectedPath = "/api/webhooks/stripe";
  const webhookCandidates = (endpoints.data || []).filter((entry) => {
    try { return new URL(entry.url || "").pathname === expectedPath; } catch { return false; }
  });
  const endpoint = webhookCandidates.find((entry) => {
    try {
      const url = new URL(entry.url || "");
      return url.origin === configuredSite.origin && url.pathname === expectedPath;
    } catch { return false; }
  });
  const enabled = new Set(endpoint?.enabled_events || []);
  return {
    liveCredentialsPresent,
    webhookSecretPresent,
    localApplicationReady,
    providerReachable: true,
    liveAccount: secret.includes("_live_"),
    chargesEnabled: account.charges_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
    country: account.country,
    currency: account.default_currency?.toUpperCase(),
    deploymentWebhookPresent: Boolean(endpoint),
    deploymentWebhookEnabled: endpoint?.status === "enabled",
    requiredEventsPresent: requiredStripeWebhookEvents.every((event) => enabled.has(event) || enabled.has("*")),
    missingEvents: requiredStripeWebhookEvents.filter((event) => !enabled.has(event) && !enabled.has("*")),
    webhookCandidates: webhookCandidates.map((entry) => {
      const endpointEvents = new Set(entry.enabled_events || []);
      return {
        origin: new URL(entry.url!).origin,
        enabled: entry.status === "enabled",
        requiredEventsPresent: requiredStripeWebhookEvents.every((event) => endpointEvents.has(event) || endpointEvents.has("*")),
      };
    }),
  };
}

async function databaseHealthDetails() {
  const result: Record<string, unknown> = {};
  for (const name of ["order_database_health", "admin_auth_health"] as const) {
    try { result[name] = await supabaseServerRpc(name, {}); }
    catch (error) { result[name] = {error: error instanceof Error ? error.message.replace(/https?:\/\/[^\s]+/g, "[endpoint]") : "unavailable"}; }
  }
  return result;
}

async function main() {
  const [databaseContract, adminAuth, emailProvider, stripe, databaseHealth] = await Promise.all([
    checkDurableOrderStorage(),
    checkAdminAuthSchema(),
    checkBrevoConnection(),
    stripeReadiness(),
    databaseHealthDetails(),
  ]);
  console.log(JSON.stringify({
    canonicalHttps: (() => { try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").protocol === "https:"; } catch { return false; } })(),
    orderAccessSigning: isProductionOrderAccessConfigured(),
    databaseContract,
    adminAuth,
    emailProvider,
    stripe,
    databaseHealth,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Production readiness audit failed.");
  process.exitCode = 1;
});

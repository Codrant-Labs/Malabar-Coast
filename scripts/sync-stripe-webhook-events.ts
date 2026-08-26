import {requiredStripeWebhookEvents} from "../app/lib/payments/stripe-events";

type StripeWebhookEndpoint = {
  id?: string;
  url?: string;
  status?: string;
  enabled_events?: string[];
};

async function stripeRequest(path: string, init?: RequestInit) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error("STRIPE_SECRET_KEY is required.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${secret}`,
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Stripe returned ${response.status} while updating webhook configuration.`);
  return response;
}

async function main() {
  const target = process.env.STRIPE_WEBHOOK_URL?.trim();
  if (!target || new URL(target).protocol !== "https:") throw new Error("Set STRIPE_WEBHOOK_URL to the exact public HTTPS endpoint.");
  const endpointsResponse = await stripeRequest("webhook_endpoints?limit=100");
  const endpoints = await endpointsResponse.json() as {data?: StripeWebhookEndpoint[]};
  const endpoint = (endpoints.data || []).find((entry) => entry.url === target);
  if (!endpoint?.id) throw new Error("No Stripe webhook endpoint exactly matches STRIPE_WEBHOOK_URL.");

  const current = new Set(endpoint.enabled_events || []);
  const missing = current.has("*") ? [] : requiredStripeWebhookEvents.filter((event) => !current.has(event));
  if (missing.length === 0) {
    console.log(JSON.stringify({target, enabled: endpoint.status === "enabled", changed: false, missing: []}, null, 2));
    return;
  }
  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({target, enabled: endpoint.status === "enabled", changed: false, missing, instruction: "Run again with --apply to add these events."}, null, 2));
    return;
  }

  const desired = [...new Set([...(endpoint.enabled_events || []), ...requiredStripeWebhookEvents])].sort();
  const body = new URLSearchParams();
  desired.forEach((event) => body.append("enabled_events[]", event));
  const updateResponse = await stripeRequest(`webhook_endpoints/${encodeURIComponent(endpoint.id)}`, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body,
  });
  const updated = await updateResponse.json() as StripeWebhookEndpoint;
  const updatedEvents = new Set(updated.enabled_events || []);
  const stillMissing = requiredStripeWebhookEvents.filter((event) => !updatedEvents.has(event) && !updatedEvents.has("*"));
  if (stillMissing.length > 0) throw new Error(`Stripe did not retain ${stillMissing.length} required webhook events.`);
  console.log(JSON.stringify({target, enabled: updated.status === "enabled", changed: true, eventCount: updatedEvents.size, missing: []}, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Stripe webhook update failed.");
  process.exitCode = 1;
});

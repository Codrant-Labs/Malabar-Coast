import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPublicHttpsSiteOrigin,
  isStripeConfigured,
  isStripeProductionReady,
} from "../app/lib/payments/stripe";

const originalEnvironment = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  stripeSecret: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

test.afterEach(() => {
  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  restore("NEXT_PUBLIC_SITE_URL", originalEnvironment.siteUrl);
  restore("STRIPE_SECRET_KEY", originalEnvironment.stripeSecret);
  restore("STRIPE_WEBHOOK_SECRET", originalEnvironment.webhookSecret);
});

test("live Stripe is unavailable on localhost", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.STRIPE_SECRET_KEY = "sk_live_example";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";

  assert.equal(hasPublicHttpsSiteOrigin(), false);
  assert.equal(isStripeConfigured(), false);
  assert.equal(isStripeProductionReady(), false);
});

test("test-mode Stripe remains available for local verification", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.STRIPE_SECRET_KEY = "sk_test_example";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";

  assert.equal(isStripeConfigured(), true);
  assert.equal(isStripeProductionReady(), false);
});

test("production readiness requires a public HTTPS origin", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://malabarcoast.co.uk";
  process.env.STRIPE_SECRET_KEY = "sk_live_example";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";

  assert.equal(hasPublicHttpsSiteOrigin(), true);
  assert.equal(isStripeConfigured(), true);
  assert.equal(isStripeProductionReady(), true);
});

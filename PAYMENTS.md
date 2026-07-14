# Orders and payments

The menu catalogue in `app/lib/menu.ts` is the only price source. Checkout sends menu IDs and quantities; `app/lib/orders.ts` rebuilds every order and total on the server before a payment is created.

## Local setup

1. Copy `.env.example` to `.env.local` and add test credentials.
2. Run `npm run dev`.
3. In development only, orders fall back to `.data/orders.json`. Production deliberately refuses new orders without Supabase.
4. For production, run `supabase/schema.sql` in the Supabase SQL editor and set `SUPABASE_URL` plus the server-only service-role key.

## Stripe

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Register `POST /api/webhooks/stripe` for Checkout Session events, including completed, async succeeded/failed, and expired. The adapter creates a hosted Checkout Session and the webhook is authoritative for payment status.

## Worldpay

Set the Checkout Web SDK ID, Access API username/password, merchant entity, and `WORLDPAY_ENVIRONMENT=try` for testing. Card fields are Worldpay-hosted; card and CVC sessions are sent directly to the Payments API and never stored by this app.

Register `POST /api/webhooks/worldpay` and configure matching HTTP Basic credentials in Worldpay and the two `WORLDPAY_WEBHOOK_*` variables. The endpoint is idempotent by event ID. Test authorization, refusal, cancellation, expiry and delayed webhook cases before switching `WORLDPAY_ENVIRONMENT` to `live`.

Some Worldpay cards require a 3DS device-data or challenge continuation. The API detects and preserves that outcome, but the provider-specific challenge handoff must be validated with the merchant's enabled Worldpay products and test account before live launch.

## Operational notes

- Never expose Stripe, Worldpay API, webhook, or Supabase service-role secrets to the browser.
- Use separate test and live environment variables.
- Keep `NEXT_PUBLIC_SITE_URL` on the final HTTPS origin so provider redirects return correctly.
- Delivery is enabled with a configurable fee. Confirm the service radius, opening times, lead times, minimum order and refund policy before launch.

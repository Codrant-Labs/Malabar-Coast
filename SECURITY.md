# Security and operations

## Trust boundaries

- Menu IDs and quantities are accepted from the browser; names, availability, prices and totals are rebuilt on the server.
- Stripe and Worldpay secrets, webhook credentials and the Supabase service-role key are server-only.
- Customer order pages and `/api/orders/[id]` require a signed HTTP-only order-access cookie.
- `/admin` requires a signed eight-hour administrator session. Status updates also require a same-origin request and a session-bound CSRF token.
- Payment state can only be applied through authenticated provider events or a Stripe Checkout Session verified directly with Stripe.

## Response protection

`next.config.ts` applies a restrictive Content Security Policy, clickjacking protection, MIME sniffing protection, HTTPS transport policy, limited browser permissions and strict referrer handling. Admin, order, checkout and API routes also receive no-store and no-index headers.

## Payment event integrity

`supabase/schema.sql` contains `apply_order_payment_event`, a transaction that locks the matching provider order, deduplicates the provider event and updates payment state atomically. Run the current schema before enabling production checkout. Webhooks fail closed when authentication or the database function is missing.

Administrator controls cannot manually mark an order paid. The allowed fulfilment sequence is:

`paid → confirmed → preparing → ready → out for delivery/completed → completed`

Collection orders omit the delivery step.

## Production launch checklist

- Use a final HTTPS `NEXT_PUBLIC_SITE_URL`; never rely on the request Host header for payment returns.
- Configure Supabase and run the current schema. Production checkout must not use local JSON storage.
- Configure Stripe test keys and signed webhooks, then test paid, asynchronous, failed and expired sessions.
- Keep Worldpay disabled until the merchant-specific 3DS continuation has passed provider testing.
- Generate separate high-entropy values for `ADMIN_SESSION_SECRET` and `ORDER_ACCESS_SECRET`.
- Store all secrets in the deployment secret manager, not source control or public variables.
- Apply platform/WAF throttling to `/api/checkout`, `/api/orders/*`, `/api/admin/*` and both webhook paths.
- Confirm refunds, delivery radius, operating hours, lead times, minimum order and privacy/retention policy before launch.
- Configure monitoring for checkout failures, webhook failures and repeated administrator login rejection.
- Back up Supabase and define an order/customer-data retention and deletion schedule.

## Verification before each release

1. Run `pnpm lint` and `pnpm build`.
2. Inspect headers on `/`, `/checkout`, `/order/test`, `/admin/login` and `/api/payment-config`.
3. Confirm private routes return `X-Robots-Tag` and `Cache-Control: no-store`.
4. Confirm unsigned Stripe and Worldpay webhook requests are rejected.
5. Confirm order status is unavailable without its signed cookie.
6. Confirm an administrator cannot skip fulfilment steps or establish payment manually.

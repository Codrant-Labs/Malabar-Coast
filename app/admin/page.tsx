import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../lib/admin-auth";
import { listOrders } from "../lib/order-store";
import { inferPaymentStatus, orderStatusLabels } from "../lib/orders";
import { isProductionOrderAccessConfigured } from "../lib/order-access";
import { isStripeConfigured } from "../lib/payments/stripe";
import { isWorldpayCheckoutEnabled } from "../lib/payments/worldpay";

export const dynamic = "force-dynamic";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const orders = await listOrders(100);
  const paidOrders = orders.filter((order) => inferPaymentStatus(order) === "paid");
  const activeOrders = orders.filter((order) => ["paid", "confirmed", "preparing", "ready", "out_for_delivery"].includes(order.status));
  const revenue = paidOrders.reduce((total, order) => total + order.totalPence, 0);
  const storageReady = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const canonicalReady = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").protocol === "https:"; } catch { return false; }
  })();

  const checks = [
    { label: "Durable order storage", ready: storageReady, detail: storageReady ? "Supabase service storage configured" : "Required before production ordering" },
    { label: "Stripe and signed webhooks", ready: isStripeConfigured(), detail: isStripeConfigured() ? "Checkout and webhook secret configured" : "Checkout remains unavailable" },
    { label: "Worldpay checkout", ready: isWorldpayCheckoutEnabled(), detail: isWorldpayCheckoutEnabled() ? "Explicitly enabled with webhook authentication" : "Disabled until the complete 3DS path is approved" },
    { label: "Customer order access", ready: isProductionOrderAccessConfigured(), detail: isProductionOrderAccessConfigured() ? "Production signing secret configured" : "Add the production signing secret" },
    { label: "Canonical HTTPS origin", ready: canonicalReady, detail: canonicalReady ? "Secure return origin configured" : "Use the live HTTPS URL before launch" },
  ];

  return (
    <main className="adminShell adminDashboard">
      <header className="adminTopbar">
        <div><p>Malabar Coast · Operations</p><h1>Order control.</h1></div>
        <form action="/api/admin/logout" method="post"><input type="hidden" name="csrf" value={session.csrfToken} /><button type="submit">Secure sign out</button></form>
      </header>

      <section className="adminMetrics" aria-label="Order summary">
        <article><span>Recent orders</span><strong>{orders.length}</strong><small>Latest 100 records</small></article>
        <article><span>Active kitchen flow</span><strong>{activeOrders.length}</strong><small>Paid through delivery</small></article>
        <article><span>Confirmed payment value</span><strong>{money(revenue)}</strong><small>Includes completed paid orders</small></article>
      </section>

      <section className="adminPanel" aria-labelledby="orders-heading">
        <div className="adminPanelHeading"><div><p>Live workflow</p><h2 id="orders-heading">Orders</h2></div><span>{orders.length} records</span></div>
        {orders.length ? (
          <div className="adminTableWrap">
            <table>
              <thead><tr><th>Reference</th><th>Customer</th><th>Requested</th><th>Method</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>{orders.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/admin/orders/${order.id}`}>{order.id}</Link><small>{displayDate(order.createdAt)}</small></td>
                  <td>{order.customer.name}<small>{order.customer.email}</small></td>
                  <td>{order.requestedTime.replace("T", " ")}</td>
                  <td>{order.fulfilment}<small>{order.provider}</small></td>
                  <td><span className={`adminStatus status_${order.status}`}>{orderStatusLabels[order.status]}</span></td>
                  <td>{money(order.totalPence)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="adminEmpty">No orders have been created in this environment.</div>}
      </section>

      <section className="adminPanel" aria-labelledby="security-heading">
        <div className="adminPanelHeading"><div><p>Deployment readiness</p><h2 id="security-heading">Security checks</h2></div></div>
        <div className="adminChecks">{checks.map((check) => (
          <article key={check.label} className={check.ready ? "isReady" : "isMissing"}>
            <i aria-hidden="true" /><div><strong>{check.label}</strong><span>{check.detail}</span></div><b>{check.ready ? "Ready" : "Action needed"}</b>
          </article>
        ))}</div>
      </section>
    </main>
  );
}

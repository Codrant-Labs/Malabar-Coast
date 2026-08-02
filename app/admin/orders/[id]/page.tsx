import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import { getOrder } from "../../../lib/order-store";
import { getAllowedAdminTransitions, inferPaymentStatus, orderStatusLabels, paymentStatusLabels } from "../../../lib/orders";
import { isValidOrderId } from "../../../lib/security";

export const dynamic = "force-dynamic";

const money = (pence: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
const date = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));

export default async function AdminOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ update?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  if (!isValidOrderId(id)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  const { update } = await searchParams;
  const transitions = getAllowedAdminTransitions(order);
  const paymentStatus = inferPaymentStatus(order);

  return (
    <main className="adminShell adminOrderPage">
      <header className="adminTopbar adminOrderTopbar">
        <div><Link href="/admin">← All orders</Link><p>Order detail</p><h1>{order.id}</h1></div>
        <span className={`adminStatus status_${order.status}`}>{orderStatusLabels[order.status]}</span>
      </header>
      {update === "success" && <div className="adminAlert isSuccess" role="status">The order moved to its next verified stage.</div>}
      {update === "rejected" && <div className="adminAlert isError" role="alert">That status change was rejected because the order state changed or the transition is not allowed.</div>}

      <section className="adminOrderGrid">
        <article className="adminPanel adminOrderSummary">
          <div className="adminPanelHeading"><div><p>Payment and fulfilment</p><h2>Order state</h2></div></div>
          <dl>
            <div><dt>Payment</dt><dd>{paymentStatusLabels[paymentStatus]}</dd></div>
            <div><dt>Provider</dt><dd>{order.provider}</dd></div>
            <div><dt>Provider reference</dt><dd>{order.providerReference || "Awaiting provider"}</dd></div>
            <div><dt>Provider outcome</dt><dd>{order.providerOutcome || "Awaiting provider"}</dd></div>
            <div><dt>Fulfilment</dt><dd>{order.fulfilment}</dd></div>
            <div><dt>Requested</dt><dd>{order.requestedTime.replace("T", " ")}</dd></div>
            <div><dt>Created</dt><dd>{date(order.createdAt)}</dd></div>
            <div><dt>Updated</dt><dd>{date(order.updatedAt)}</dd></div>
          </dl>
          {paymentStatus !== "paid" && <div className="adminAlert isError" role="alert">Fulfilment is locked until the payment state is securely reconciled.</div>}
          {transitions.length > 0 && <div className="adminTransitions"><p>Advance fulfilment</p>{transitions.map((status) => (
            <form action={`/api/admin/orders/${order.id}/status`} method="post" key={status}>
              <input type="hidden" name="csrf" value={session.csrfToken} /><input type="hidden" name="status" value={status} />
              <button type="submit">Move to {orderStatusLabels[status]} <span aria-hidden="true">→</span></button>
            </form>
          ))}</div>}
        </article>

        <article className="adminPanel adminCustomer">
          <div className="adminPanelHeading"><div><p>Private customer data</p><h2>Customer</h2></div></div>
          <address><strong>{order.customer.name}</strong><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></address>
          {order.deliveryAddress && <address className="adminDeliveryAddress"><span>{order.deliveryAddress.line1}</span>{order.deliveryAddress.line2 && <span>{order.deliveryAddress.line2}</span>}<span>{order.deliveryAddress.city}</span><span>{order.deliveryAddress.postcode}</span></address>}
          {order.orderNote && <div className="adminOrderNote"><span>Order note</span><p>{order.orderNote}</p></div>}
        </article>
      </section>

      <section className="adminPanel adminLines">
        <div className="adminPanelHeading"><div><p>Server-priced basket</p><h2>Items</h2></div><strong>{money(order.totalPence)}</strong></div>
        {order.lines.map((line) => <article key={line.menuItemId}><div><span>{line.quantity} ×</span><strong>{line.name}</strong>{line.note && <small>{line.note}</small>}</div><b>{money(line.lineTotalPence)}</b></article>)}
        <dl><div><dt>Subtotal</dt><dd>{money(order.subtotalPence)}</dd></div><div><dt>Delivery</dt><dd>{money(order.deliveryFeePence)}</dd></div><div><dt>Total</dt><dd>{money(order.totalPence)}</dd></div></dl>
      </section>

      <section className="adminPanel adminTimeline">
        <div className="adminPanelHeading"><div><p>Audit trail</p><h2>Status history</h2></div></div>
        <ol>{(order.statusHistory || [{ status: order.status, at: order.createdAt, actor: "system" as const }]).map((entry, index) => (
          <li key={`${entry.at}-${index}`}><i /><div><strong>{orderStatusLabels[entry.status]}</strong><span>{entry.actor.replace("_", " ")} · {date(entry.at)}</span>{entry.note && <p>{entry.note}</p>}</div></li>
        ))}</ol>
      </section>
    </main>
  );
}

import { CheckoutResult } from "../../components/checkout-result";
import { hasOrderAccess } from "../../lib/order-access";
import { applyPaymentEvent, getOrder } from "../../lib/order-store";
import { isPaymentConfirmed } from "../../lib/orders";
import { verifyStripeCheckoutSession } from "../../lib/payments/stripe";
import { isValidOrderId } from "../../lib/security";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string; session_id?: string }> }) {
  const { order_id, session_id } = await searchParams;
  if (!order_id || !isValidOrderId(order_id) || !(await hasOrderAccess(order_id))) return <CheckoutResult kind="pending" />;
  let order = await getOrder(order_id);
  if (order?.provider === "stripe" && session_id && !isPaymentConfirmed(order) && await verifyStripeCheckoutSession(session_id, order)) {
    await applyPaymentEvent({ provider: "stripe", eventId: `return:${session_id}`, orderId: order.id, paymentStatus: "paid", outcome: "verified_checkout_return", providerReference: session_id });
    order = await getOrder(order_id);
  }
  const confirmed = Boolean(order && isPaymentConfirmed(order));
  return <CheckoutResult kind={confirmed ? "success" : "pending"} orderId={order?.id} />;
}

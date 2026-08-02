import { hasOrderAccess } from "../../../lib/order-access";
import { getOrder } from "../../../lib/order-store";
import { inferPaymentStatus, orderStatusLabels } from "../../../lib/orders";
import { checkRateLimit, getClientAddress, isValidOrderId, noStoreJson } from "../../../lib/security";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isValidOrderId(id) || !(await hasOrderAccess(id))) return noStoreJson({ error: "Order not found." }, { status: 404 });
  const rate = checkRateLimit("order-status", getClientAddress(request), 60, 60_000);
  if (!rate.allowed) {
    const response = noStoreJson({ error: "Too many status checks." }, { status: 429 });
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }
  const order = await getOrder(id);
  if (!order) return noStoreJson({ error: "Order not found." }, { status: 404 });
  return noStoreJson({
    id: order.id,
    status: order.status,
    statusLabel: orderStatusLabels[order.status],
    paymentStatus: inferPaymentStatus(order),
    provider: order.provider,
    fulfilment: order.fulfilment,
    requestedTime: order.requestedTime,
    totalPence: order.totalPence,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
}

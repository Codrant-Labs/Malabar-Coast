import { NextResponse } from "next/server";
import { getOrder } from "../../../lib/order-store";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ id: order.id, status: order.status, provider: order.provider, fulfilment: order.fulfilment, requestedTime: order.requestedTime, totalPence: order.totalPence, createdAt: order.createdAt });
}

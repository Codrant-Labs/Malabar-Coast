import { NextResponse } from "next/server";
import { getAdminSession, verifyAdminCsrf } from "../../../../../lib/admin-auth";
import { transitionOrderStatus } from "../../../../../lib/order-store";
import { orderStatusLabels, type OrderStatus } from "../../../../../lib/orders";
import { configuredSiteOrigin, isTrustedOrigin, isValidOrderId } from "../../../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!isTrustedOrigin(request) || !session) return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", { status: 403 });

  const { id } = await context.params;
  const nextStatus = String(form.get("status") || "") as OrderStatus;
  if (!isValidOrderId(id) || !Object.prototype.hasOwnProperty.call(orderStatusLabels, nextStatus)) {
    return new NextResponse("Invalid status request", { status: 400 });
  }

  const updated = await transitionOrderStatus(id, nextStatus);
  const url = new URL(`/admin/orders/${encodeURIComponent(id)}`, configuredSiteOrigin(request));
  url.searchParams.set("update", updated ? "success" : "rejected");
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

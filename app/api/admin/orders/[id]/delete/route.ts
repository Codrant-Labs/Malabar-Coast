import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../../../lib/admin-auth";
import {deleteOrderFromAdmin} from "../../../../../lib/order-store";
import {configuredSiteOrigin, isTrustedOrigin, isValidOrderId, readLimitedFormData} from "../../../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getAdminSession("orders:delete");
  if (!session || !isTrustedOrigin(request)) return new NextResponse("Forbidden", {status: 403});
  const form = await readLimitedFormData(request, 8_000);
  if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
  const {id} = await params;
  const deleted = isValidOrderId(id) ? await deleteOrderFromAdmin(id, session.userId) : false;
  return NextResponse.redirect(new URL(`/admin/orders?delete=${deleted ? "success" : "rejected"}`, configuredSiteOrigin(request)), 303);
}

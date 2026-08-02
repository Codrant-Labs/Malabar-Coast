import { NextResponse } from "next/server";
import { clearAdminSession, getAdminSession, verifyAdminCsrf } from "../../../lib/admin-auth";
import { configuredSiteOrigin, isTrustedOrigin } from "../../../lib/security";

export async function POST(request: Request) {
  const session = await getAdminSession();
  const form = await request.formData();
  if (!isTrustedOrigin(request) || !session || !verifyAdminCsrf(session, String(form.get("csrf") || ""))) {
    return new NextResponse("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const response = NextResponse.redirect(new URL("/admin/login", configuredSiteOrigin(request)), 303);
  clearAdminSession(response);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

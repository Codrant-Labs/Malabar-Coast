import { NextResponse } from "next/server";
import { isAdminConfigured, setAdminSession, verifyAdminCredentials } from "../../../lib/admin-auth";
import { checkRateLimit, configuredSiteOrigin, getClientAddress, isTrustedOrigin } from "../../../lib/security";

export const runtime = "nodejs";

function loginRedirect(request: Request, error?: string) {
  const url = new URL("/admin/login", configuredSiteOrigin(request));
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return loginRedirect(request, "request");
  if (!isAdminConfigured()) return loginRedirect(request, "configuration");

  const rate = checkRateLimit("admin-login", getClientAddress(request), 5, 15 * 60_000);
  if (!rate.allowed) {
    const response = loginRedirect(request, "rate-limit");
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 16_000) return loginRedirect(request, "request");
  const form = await request.formData();
  const username = String(form.get("username") || "").slice(0, 160);
  const password = String(form.get("password") || "").slice(0, 256);
  if (!verifyAdminCredentials(username, password)) return loginRedirect(request, "credentials");

  const response = NextResponse.redirect(new URL("/admin", configuredSiteOrigin(request)), 303);
  setAdminSession(response);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

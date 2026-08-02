import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const ADMIN_COOKIE = "malabar_admin_session";
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;

type AdminSessionPayload = {
  version: 1;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

function shouldUseSecureCookies() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost").protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export type AdminSession = AdminSessionPayload & { csrfToken: string };

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return secret;
}

function sign(value: string, purpose: string) {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`${purpose}.${value}`).digest("base64url");
}

function createCsrfToken(nonce: string) {
  return sign(nonce, "admin-csrf") || "";
}

function parseSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded, "admin-session");
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminSessionPayload;
    if (payload.version !== 1 || !payload.nonce || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return { ...payload, csrfToken: createCsrfToken(payload.nonce) };
  } catch {
    return null;
  }
}

export function isAdminConfigured() {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
  return Boolean(process.env.ADMIN_USERNAME?.trim() && /^scrypt\$[^$]+\$[^$]+$/.test(hash) && getSessionSecret());
}

export function verifyAdminCredentials(username: string, password: string) {
  if (!isAdminConfigured() || password.length < 12 || password.length > 256) return false;
  const expectedUsername = process.env.ADMIN_USERNAME!.trim().toLowerCase();
  const usernameMatches = safeEqual(username.trim().toLowerCase(), expectedUsername);

  const [, salt, encodedHash] = process.env.ADMIN_PASSWORD_HASH!.trim().split("$");
  try {
    const expectedHash = Buffer.from(encodedHash, "base64url");
    const actualHash = scryptSync(password, salt, expectedHash.length);
    return usernameMatches && expectedHash.length >= 32 && timingSafeEqual(expectedHash, actualHash);
  } catch {
    return false;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return parseSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function setAdminSession(response: NextResponse) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    version: 1,
    issuedAt: now,
    expiresAt: now + SESSION_LIFETIME_SECONDS,
    nonce: randomBytes(24).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded, "admin-session");
  if (!signature) throw new Error("Admin authentication is not configured.");

  response.cookies.set(ADMIN_COOKIE, `${encoded}.${signature}`, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
    priority: "high",
  });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function verifyAdminCsrf(session: AdminSession, candidate: string) {
  return Boolean(candidate && safeEqual(candidate, session.csrfToken));
}

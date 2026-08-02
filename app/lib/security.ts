import { NextResponse } from "next/server";

type RateEntry = { count: number; resetAt: number };

const globalRateState = globalThis as typeof globalThis & {
  malabarRateLimits?: Map<string, RateEntry>;
};

const rateLimits = globalRateState.malabarRateLimits ?? new Map<string, RateEntry>();
globalRateState.malabarRateLimits = rateLimits;

export function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRateLimit(bucket: string, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const compositeKey = `${bucket}:${key}`;
  const current = rateLimits.get(compositeKey);

  if (!current || current.resetAt <= now) {
    rateLimits.set(compositeKey, { count: 1, resetAt: now + windowMs });
    pruneRateLimits(now);
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function pruneRateLimits(now: number) {
  if (rateLimits.size < 2_000) return;
  for (const [key, value] of rateLimits) {
    if (value.resetAt <= now) rateLimits.delete(key);
  }
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const requestUrl = new URL(request.url);
    const configuredUrl = configured ? new URL(configured) : null;
    const requestIsLoopback = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
    const configuredIsLoopback = configuredUrl?.hostname === "localhost" || configuredUrl?.hostname === "127.0.0.1";
    const expected = requestIsLoopback && configuredIsLoopback ? requestUrl.origin : configuredUrl?.origin || requestUrl.origin;
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}

export function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readLimitedText(request: Request, maximumBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) throw new RequestBodyTooLargeError();
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }
    chunks.push(value);
  }
  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

export async function readLimitedJson(request: Request, maximumBytes: number): Promise<unknown> {
  return JSON.parse(await readLimitedText(request, maximumBytes));
}

export function isValidOrderId(value: string) {
  return /^ord_[A-Za-z0-9_-]{20,60}$/.test(value) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);
}

export function configuredSiteOrigin(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (isLoopback && request) {
      const requestUrl = new URL(request.url);
      const requestIsLoopback = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
      if (requestIsLoopback) return requestUrl.origin;
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:" && !isLoopback) {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
    }
    return url.origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  }
  return request ? new URL(request.url).origin : "http://localhost:3000";
}

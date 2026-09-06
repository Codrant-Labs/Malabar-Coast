const VERSION = "mc-admin-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith("/admin")) return;
  event.respondWith(fetch(request).catch(() => {
    if (request.mode !== "navigate") return Response.error();
    return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#071310"><title>MC Operations offline</title><body style="margin:0;background:#071310;color:#f5efe2;font:18px/1.5 Georgia,serif;display:grid;min-height:100svh;place-items:center"><main style="max-width:34rem;padding:max(2rem,env(safe-area-inset-top)) max(1.25rem,env(safe-area-inset-right)) max(2rem,env(safe-area-inset-bottom)) max(1.25rem,env(safe-area-inset-left))"><p style="letter-spacing:.14em;text-transform:uppercase;font:12px Arial,sans-serif;color:#c8a45d">Malabar Coast operations</p><h1 style="font-size:clamp(36px,12vw,48px);line-height:1;margin:.5rem 0 1rem">You are offline.</h1><p>Reconnect to securely load live orders, bookings and restaurant data.</p><button onclick="location.reload()" style="min-height:44px;margin-top:1rem;padding:.8rem 1rem;border:0;background:#c8a45d;color:#071310;font-weight:700">Try again</button></main></body></html>`, {headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Admin-Shell": VERSION}});
  }));
});

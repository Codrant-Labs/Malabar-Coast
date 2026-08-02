import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const canonicalSiteUsesHttps = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false;

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://try.access.worldpay.com https://access.worldpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google.com https://maps.gstatic.com https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://try.access.worldpay.com https://access.worldpay.com",
  "frame-src 'self' https://www.google.com https://maps.google.com https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://try.access.worldpay.com https://access.worldpay.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(!isDevelopment && canonicalSiteUsesHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(canonicalSiteUsesHttps
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const privateHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/order/:path*", headers: privateHeaders },
      { source: "/checkout/:path*", headers: privateHeaders },
      { source: "/api/:path*", headers: privateHeaders },
    ];
  },
};

export default nextConfig;

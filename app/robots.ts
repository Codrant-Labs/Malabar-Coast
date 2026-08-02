import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "./lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/admin/", "/order", "/order/", "/checkout", "/checkout/"],
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Google-Extended"],
        allow: "/",
        disallow: ["/api/", "/admin", "/admin/", "/order", "/order/", "/checkout", "/checkout/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}


import { faqItems } from "../lib/faq";
import { absoluteUrl, site } from "../lib/site";

export function GET() {
  return Response.json(
    {
      name: site.name,
      url: site.url,
      version: site.lastUpdated,
      lastUpdated: `${site.lastUpdated}T00:00:00.000Z`,
      category: "Southern Indian coastal restaurant",
      description: site.description,
      address: site.address,
      geo: site.geo,
      cuisine: site.cuisine,
      priceRange: site.priceRange,
      serviceModes: ["dine-in", "collection", "delivery"],
      sources: {
        menu: absoluteUrl("/menu"),
        restaurant: absoluteUrl("/restaurant"),
        faq: absoluteUrl("/faq"),
      },
      faq: faqItems.map(({ id, question, answer }) => ({ id, question, answer })),
      limitations: [
        "Opening hours are not currently published on this site.",
        "Telephone, email and social profiles are not currently published on this site.",
        "Menu availability and delivery eligibility can change during checkout.",
      ],
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}


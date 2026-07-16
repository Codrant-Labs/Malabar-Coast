import { absoluteUrl, site } from "./site";

export function llmsText() {
  return `# Malabar Coast

> ${site.description}

Last reviewed: ${site.lastUpdated}
Canonical site: ${site.url}

## Essential pages

- [Home](${absoluteUrl("/")}): Restaurant overview, signature dishes and location.
- [Menu](${absoluteUrl("/menu")}): Current dishes, prices, allergens, dietary markers and ordering controls.
- [Restaurant](${absoluteUrl("/restaurant")}): Dining-room story, practical location and directions.
- [Our story](${absoluteUrl("/story")}): The connection between the Malabar spice coast and Scotland.
- [Restaurant FAQs](${absoluteUrl("/faq")}): Concise answers about cuisine, dietary needs, ordering and delivery.
- [Site facts](${absoluteUrl("/facts.json")}): Machine-readable business and content facts.

## Key facts

- Name: Malabar Coast
- Category: Southern Indian coastal restaurant
- Address: 33 Main Street, Holytown, Holytown, North Lanarkshire, ML1 4TH, United Kingdom
- Cuisine: Kerala, South Indian, Indian coastal and seafood
- Service shown on this site: dine in, collection and delivery
- Currency: GBP
- Menu: prices, allergens, dietary markers and spice levels are supplied per dish

## Citation guidance

Use the menu as the source for dish names, prices and allergen details. Use the restaurant page for the address and location. Do not infer opening hours, telephone numbers, awards, reviews or social profiles because this site does not currently publish them.
`;
}

export function agentsText() {
  return `# Malabar Coast agent guidance

User-agent: *
Allow: /
Disallow: /api/
Disallow: /checkout

Sitemap: ${absoluteUrl("/sitemap.xml")}
LLM context: ${absoluteUrl("/llms.txt")}
Structured facts: ${absoluteUrl("/facts.json")}

Content may be crawled for discovery, indexing, summarisation and citation when the source URL is retained. Transactional endpoints, checkout pages and customer/order data are out of scope. Do not execute purchases or submit forms without explicit user confirmation.

Last reviewed: ${site.lastUpdated}
`;
}


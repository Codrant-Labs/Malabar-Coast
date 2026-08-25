import {createClient} from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();

if (!projectId) throw new Error("Sanity project ID is missing.");

async function main() {
const client = createClient({projectId: projectId!, dataset, token, apiVersion: "2025-02-19", useCdn: false, perspective: "published"});
const result = await client.fetch(`{
  "counts": {
    "menuItems": count(*[_type == "menuItem"]),
    "categories": count(*[_type == "menuCategory"]),
    "faqs": count(*[_type == "faqItem"]),
    "specials": count(*[_type == "dailySpecial"]),
    "promotions": count(*[_type == "promotion"]),
    "marketingPages": count(*[_type == "marketingPage"]),
    "legalPages": count(*[_type == "legalPage"])
  },
  "pageKeys": *[_type == "marketingPage"] | order(pageKey asc).pageKey,
  "pageSections": *[_type == "marketingPage"] | order(pageKey asc) {pageKey, "sectionKeys": sections[]._key},
  "legal": *[_type == "legalPage"] | order(pageKey asc) {pageKey, "sections": count(sections)},
  "settings": *[_id == "siteSettings"][0] {
    "hasNavigation": count(primaryNavigation) > 0,
    "hasFooterContent": defined(footerHeading) && defined(footerText),
    "hasDefaultSeo": defined(defaultSeo.title)
  },
  "menuPage": *[_id == "menuPage"][0] {"regions": count(voyageStops), "hasSeo": defined(seo.title)}
  ,"suspiciousMenuItems": *[_type == "menuItem" && (name match "*test*" || (defined(pricePence) && pricePence < 100))] | order(name asc) {_id, name, pricePence, available, onlineOrdering, published}
}`);

console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "CMS audit failed.");
  process.exitCode = 1;
});

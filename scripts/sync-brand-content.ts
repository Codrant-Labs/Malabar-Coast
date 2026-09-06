import {createClient} from "next-sanity";
import {foodOfMalabarContent, malabarCoastIntroduction, ourInspirationContent, ourRestaurantsContent} from "../app/lib/brand-content";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();
if (!projectId || !token) throw new Error("Sanity project configuration or write token is missing.");

const client = createClient({projectId, dataset, token, apiVersion: "2026-09-06", useCdn: false});
const block = (text: string, key: string) => ({_type: "block", _key: key, style: "normal", markDefs: [], children: [{_type: "span", _key: `${key}-text`, text, marks: []}]});
type Page = {_id: string; pageKey: string; sections?: Array<Record<string, unknown> & {_key?: string}>};
type LegalBlock = Record<string, unknown> & {children?: Array<{text?: string}>};
type LegalSection = Record<string, unknown> & {title?: string; sectionId?: {current?: string}; body?: LegalBlock[]};

function replaceSection(sections: Page["sections"], section: Record<string, unknown> & {_key: string}) {
  const current = sections || [];
  const index = current.findIndex((item) => item._key === section._key);
  if (index < 0) return [section, ...current];
  return current.map((item, itemIndex) => itemIndex === index ? {...item, ...section} : item);
}

async function updatePage(pageKey: string, sections: Array<Record<string, unknown> & {_key: string}>) {
  const page = await client.fetch<Page | null>(`*[_type == "marketingPage" && pageKey == $pageKey][0]{_id,pageKey,sections}`, {pageKey});
  if (!page) throw new Error(`The ${pageKey} marketing page does not exist in Sanity.`);
  const next = sections.reduce((all, section) => replaceSection(all, section), page.sections);
  await client.patch(page._id).set({sections: next}).commit();
  return page._id;
}

async function removeStripeLegalSection() {
  const page = await client.fetch<{_id: string; sections?: LegalSection[]} | null>(`*[_type == "legalPage" && pageKey == "payments"][0]{_id,sections}`, {});
  if (!page) return null;
  const sections = (page.sections || [])
    .filter((section) => section.sectionId?.current !== "payment-processing" && section.title !== "Payment processing")
    .map((section) => section.sectionId?.current === "overview" ? {
      ...section,
      body: (section.body || []).filter((block) => !block.children?.some((span) => span.text?.includes("Stripe"))),
    } : section);
  await client.patch(page._id).set({sections}).commit();
  return page._id;
}

function stripEmDashes(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/\s*—\s*/g, ", ");
  if (Array.isArray(value)) return value.map(stripEmDashes);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, stripEmDashes(child)]));
  return value;
}

async function cleanCmsPunctuation() {
  const documents = await client.fetch<Array<Record<string, unknown> & {_id: string}>>(`*[_type in ["marketingPage","legalPage","testimonial"]]`);
  const transaction = client.transaction();
  let mutations = 0;
  for (const document of documents) {
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(document)) {
      if (key.startsWith("_")) continue;
      const cleaned = stripEmDashes(value);
      if (JSON.stringify(cleaned) !== JSON.stringify(value)) updates[key] = cleaned;
    }
    if (Object.keys(updates).length) {
      transaction.patch(document._id, (patch) => patch.set(updates));
      mutations += 1;
    }
  }
  if (mutations) await transaction.commit();
  return mutations;
}

const homeOverview = {_type: "contentSection", _key: "home-overview", internalName: "What is Malabar Coast?", eyebrow: "Our restaurant", heading: "What is Malabar Coast?", body: malabarCoastIntroduction.map((paragraph,index)=>block(paragraph, `overview-copy-${index+1}`))};
const inspiration = {_type: "contentSection", _key: "story-inspiration", internalName: "Our Inspiration", eyebrow: ourInspirationContent.title, heading: ourInspirationContent.subtitle, body: ourInspirationContent.paragraphs.map((paragraph,index)=>block(paragraph, `inspiration-copy-${index+1}`))};
const restaurants = {_type: "contentSection", _key: "restaurant-restaurants", internalName: "Our Restaurants", eyebrow: ourRestaurantsContent.title, heading: ourRestaurantsContent.subtitle, body: [...ourRestaurantsContent.paragraphs.map((paragraph,index)=>block(paragraph, `restaurants-copy-${index+1}`)), block(ourRestaurantsContent.locationTitle, "restaurants-location-title"), block(ourRestaurantsContent.address, "restaurants-location-address")]};
const food = {_type: "contentSection", _key: "restaurant-food", internalName: "The Food of Malabar", eyebrow: foodOfMalabarContent.title, heading: foodOfMalabarContent.subtitle, body: foodOfMalabarContent.paragraphs.map((paragraph,index)=>block(paragraph, `food-copy-${index+1}`))};

async function main() {
  const updated = await Promise.all([
    updatePage("home", [homeOverview]),
    updatePage("story", [inspiration]),
    updatePage("restaurant", [restaurants, food]),
    removeStripeLegalSection(),
  ]);
  const punctuationDocumentsUpdated = await cleanCmsPunctuation();
  const verification = await client.fetch<Array<{pageKey: string; text: string}>>(`*[_type == "marketingPage" && pageKey in ["home","story","restaurant"]]{pageKey,"text":pt::text(sections[].body)}`);
  const payment = await client.fetch<{sections?: LegalSection[]} | null>(`*[_type=="legalPage"&&pageKey=="payments"][0]{sections}`);
  const requiredText = [malabarCoastIntroduction[0], ourInspirationContent.paragraphs[0], foodOfMalabarContent.paragraphs[0], ourRestaurantsContent.paragraphs[0]];
  const allText = verification.map((page) => page.text).join("\n");
  const paymentText = JSON.stringify(payment?.sections || []);
  const hasStripeSection = payment?.sections?.some((section) => section.sectionId?.current === "payment-processing" || section.title === "Payment processing");
  if (requiredText.some((text) => !allText.includes(text)) || hasStripeSection || paymentText.includes("Stripe")) throw new Error("CMS verification did not match the requested brand and payment content.");
  console.log(JSON.stringify({updated, punctuationDocumentsUpdated, verified: true}, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Brand content sync failed.");
  process.exitCode = 1;
});

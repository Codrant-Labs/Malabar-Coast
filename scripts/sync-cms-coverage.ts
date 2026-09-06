import {createClient} from "next-sanity";
import type {IdentifiedSanityDocumentStub} from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();
if (!projectId || !token) throw new Error("Sanity project configuration or write token is missing.");

const client = createClient({projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false});
const block = (text: string, key: string) => ({_type: "block", _key: key, style: "normal", markDefs: [], children: [{_type: "span", _key: `${key}-text`, text, marks: []}]});
const hallFeatureItems = [
  {_type: "object", _key: "dedicated", shortLabel: "01", title: "Dedicated space", text: "A private room within the restaurant"},
  {_type: "object", _key: "bar", shortLabel: "02", title: "At one end", text: "A built-in wooden bar"},
  {_type: "object", _key: "stage", shortLabel: "03", title: "At the other", text: "A raised event stage"},
  {_type: "object", _key: "floor", shortLabel: "04", title: "Through the room", text: "A flexible open floor"},
];
const hallEnquiryItems = [
  {_type: "object", _key: "no-commitment", shortLabel: "01", title: "No payment or commitment at this stage"},
  {_type: "object", _key: "personal-confirmation", shortLabel: "02", title: "Availability confirmed personally by our team"},
  {_type: "object", _key: "plan-together", shortLabel: "03", title: "Layout, catering and access planned together"},
];

const missingPages = [
  {
    _id: "marketingPage-story-calicut", _type: "marketingPage", pageKey: "story-calicut", title: "Calicut story",
    eyebrow: "Archive 01 · The first port", heroHeading: "Calicut.",
    heroText: "Long before it appeared in a recipe book, Malabar pepper was measured here by hand and carried by the turning winds.",
    sections: [
      {_type: "contentSection", _key: "calicut-intro", internalName: "The beginning", eyebrow: "01 / The beginning", heading: "The harbour where flavour became history.", note: "Arabian Sea · Monsoon season", body: [block("Calicut was less a border than a threshold, the place where soil, sea and distant tables met.", "calicut-intro-copy")]},
      {_type: "contentSection", _key: "calicut-pepper", internalName: "Black gold", eyebrow: "The black gold of Malabar", heading: "Small enough to hold between two fingers. Valuable enough to redraw the world.", body: [block("Pepper thrived in the wet shade of the Western Ghats. Its clean, floral heat made it currency, medicine and obsession in ports thousands of miles away.", "calicut-pepper-copy")]},
      {_type: "contentSection", _key: "calicut-exchange", internalName: "Living exchange", eyebrow: "Port ledger · A living exchange", heading: "What arrived. What remained.", items: [
        {_type: "object", _key: "arabia", shortLabel: "01", title: "Arabia", text: "Rice, perfume, a language of hospitality"},
        {_type: "object", _key: "china", shortLabel: "02", title: "China", text: "Ceramics, fishing nets, quiet craft"},
        {_type: "object", _key: "portugal", shortLabel: "03", title: "Portugal", text: "Chilli, vinegar, a new kind of heat"},
        {_type: "object", _key: "malabar", shortLabel: "04", title: "Malabar", text: "Pepper, coconut, generosity without end"},
      ]},
      {_type: "contentSection", _key: "calicut-next", internalName: "Return link", eyebrow: "Return to the full journey", heading: "Our story"},
    ],
    seo: {title: "Calicut: The First Spice Port", description: "How pepper, monsoon winds and cultural exchange shaped the food of the Malabar Coast."},
  },
  {
    _id: "marketingPage-book-a-table", _type: "marketingPage", pageKey: "book-a-table", title: "Book a table",
    eyebrow: "Book your table · Holytown", heroHeading: "Come sit by the coast.",
    heroText: "Choose a date, arrival time and party size. Live restaurant capacity is checked before your table is confirmed.",
    heroPrimaryLink: {_type: "link", label: "See what's cooking", href: "/menu"},
    heroSecondaryLink: {_type: "link", label: "Planning something bigger?", href: "/hall"},
    sections: [{_type: "contentSection", _key: "booking-details", internalName: "Before you book", eyebrow: "Before you book", heading: "A table prepared for your people."}],
    seo: {title: "Book a Table", description: "Reserve a table at Malabar Coast in Holytown."},
  },
  {
    _id: "marketingPage-offers", _type: "marketingPage", pageKey: "offers", title: "Offers",
    eyebrow: "Current offers · From the coast", heroHeading: "Offers & specials.",
    heroText: "Seasonal plates, dining offers and moments worth gathering for. Every live offer and its terms are shown below.",
    seo: {title: "Offers & Promotions", description: "Current dining, collection and seasonal offers from Malabar Coast in Holytown."},
  },
  {
    _id: "marketingPage-faq", _type: "marketingPage", pageKey: "faq", title: "FAQs",
    eyebrow: "Good to know · Clear answers", heroHeading: "Before you come ashore.",
    heroText: "Direct answers about the food, private hall, dietary choices, location and ordering at Malabar Coast in Holytown.",
    sections: [{_type: "contentSection", _key: "faq-closing", internalName: "Closing prompt", eyebrow: "Ready for the table?", heading: "Follow the flavour."}],
    seo: {title: "Restaurant FAQs", description: "Answers about dining, the private hall, ordering and Southern Indian coastal food at Malabar Coast."},
  },
] as const;

async function main() {
  const before = await client.fetch<{pageKeys: string[]; paymentsLegal: boolean; testItem?: {_id: string; pricePence?: number}; hallPage?: {_id: string; sectionKeys?: string[]}}>(`{
    "pageKeys": *[_type == "marketingPage"].pageKey,
    "paymentsLegal": count(*[_type == "legalPage" && pageKey == "payments"]) > 0,
    "testItem": *[_type == "menuItem" && name == "Test1"][0]{_id, pricePence},
    "hallPage": *[_type == "marketingPage" && pageKey == "hall"][0]{_id, "sectionKeys": sections[]._key}
  }`);
  const transaction = client.transaction();
  for (const page of missingPages) {
    transaction.createIfNotExists(page as unknown as IdentifiedSanityDocumentStub);
  }
  transaction.createIfNotExists({
    _id: "legalPage-payments", _type: "legalPage", pageKey: "payments", title: "Payments and Website Terms",
    eyebrow: "Secure checkout · Website terms",
    summary: "Terms governing online ordering, hosted card payments and use of the website.",
    lastUpdated: "2026-08-25",
  });
  transaction.patch("siteSettings", (patch) => patch.setIfMissing({
    footerEyebrow: "Stay close to the coast",
    footerHeading: "Our socials",
    footerText: "Follow the kitchen, new dishes and moments from Malabar Coast.",
    footerCreditLabel: "Made by Codrantlabs.in",
    footerCreditUrl: "https://codrantlabs.in/",
  }));
  if (before.hallPage?._id) {
    transaction.patch(before.hallPage._id, (patch) => {
      let next = patch.setIfMissing({
        heroPrimaryLink: {_type: "link", label: "Start your enquiry", href: "#hall-enquiry", openInNewTab: false},
        heroSecondaryLink: {_type: "link", label: "Book a restaurant table", href: "/book-a-table", openInNewTab: false},
        'sections[_key=="hall-intro"].items': hallFeatureItems,
        'sections[_key=="hall-enquiry"].items': hallEnquiryItems,
      });
      if (!before.hallPage?.sectionKeys?.includes("hall-faq")) next = next.append("sections", [{_type: "contentSection", _key: "hall-faq", internalName: "Hall FAQ heading", eyebrow: "Before you plan · 04", heading: "Good to know."}]);
      if (!before.hallPage?.sectionKeys?.includes("hall-closing")) next = next.append("sections", [{_type: "contentSection", _key: "hall-closing", internalName: "Hall closing", eyebrow: "See it for yourself · Holytown", heading: "Come and see the room.", body: [block("Explore the location, look through the menu, or return to the enquiry above when you are ready. You do not need a finished plan to start the conversation.", "hall-closing-copy")]}]);
      return next;
    });
  }
  if (before.testItem?.pricePence === 30) {
    transaction.patch(before.testItem._id, (patch) => patch.set({published: false, available: false, onlineOrdering: false}));
  }
  const result = await transaction.commit();
  console.log(JSON.stringify({
    createdPageKeys: missingPages.map((page) => page.pageKey).filter((key) => !before.pageKeys.includes(key)),
    createdPaymentsLegalPage: !before.paymentsLegal,
    testItemHidden: before.testItem?.pricePence === 30,
    mutations: result.results.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "CMS coverage sync failed.");
  process.exitCode = 1;
});

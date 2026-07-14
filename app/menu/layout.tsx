import type { Metadata } from "next";
import { JsonLd } from "../components/json-ld";
import { categoryDetails, menuItems, type MenuCategory } from "../lib/menu";
import { absoluteUrl, site } from "../lib/site";

export const metadata: Metadata = {
  title: "South Indian Menu",
  description:
    "Explore Malabar Coast's Southern Indian menu in Holytown, with Kerala seafood, curries, biriyani, vegetarian and vegan dishes, prices and allergens.",
  alternates: { canonical: "/menu" },
  openGraph: {
    type: "website",
    url: "/menu",
    title: "South Indian Menu | Malabar Coast Holytown",
    description: "Kerala-inspired seafood, curries, biriyani and plant-based dishes with current prices and allergen details.",
    images: ["/menu/calicut-pepper-prawns.png"],
  },
};

const categoryOrder = Object.keys(categoryDetails) as MenuCategory[];

const menuSchema = {
  "@context": "https://schema.org",
  "@type": "Menu",
  "@id": `${absoluteUrl("/menu")}#menu`,
  name: "Malabar Coast menu",
  url: absoluteUrl("/menu"),
  inLanguage: "en-GB",
  dateModified: site.lastUpdated,
  mainEntityOfPage: absoluteUrl("/menu"),
  hasMenuSection: categoryOrder.map((category) => ({
    "@type": "MenuSection",
    name: categoryDetails[category].note,
    description: categoryDetails[category].title,
    hasMenuItem: menuItems.filter((item) => item.category === category).map((item) => ({
      "@type": "MenuItem",
      name: item.name,
      description: item.description,
      identifier: item.id,
      offers: {
        "@type": "Offer",
        price: (item.pricePence / 100).toFixed(2),
        priceCurrency: "GBP",
        availability: item.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `${absoluteUrl("/menu")}#${category}`,
      },
    })),
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Menu", item: absoluteUrl("/menu") },
  ],
};

export default function MenuLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={[menuSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}


import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./menu/menu.css";
import "./editorial.css";
import "./order.css";
import "./faq/faq.css";
import { SiteHeader } from "./components/site-header";
import { SmoothScroll } from "./components/smooth-scroll";
import { CartProvider } from "./components/cart-provider";
import { CustomCursor } from "./components/custom-cursor";
import { JsonLd } from "./components/json-ld";
import { absoluteUrl, site } from "./lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Malabar Coast | Southern Indian Restaurant in Holytown",
    template: "%s | Malabar Coast",
  },
  description: site.description,
  applicationName: site.name,
  category: "restaurant",
  creator: site.name,
  publisher: site.name,
  keywords: [
    "South Indian restaurant Holytown",
    "Kerala restaurant Motherwell",
    "Indian restaurant North Lanarkshire",
    "Malabar cuisine Scotland",
    "South Indian seafood",
    "Kerala food delivery Motherwell",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: site.name,
    title: "Malabar Coast | Southern Indian Restaurant in Holytown",
    description: site.description,
    images: [
      {
        url: "/malabar-restaurant-hero-v2.jpg",
        width: 1672,
        height: 941,
        alt: "A Kerala-inspired restaurant table with coastal dishes in a warm dining room",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malabar Coast | Southern Indian Restaurant in Holytown",
    description: site.shortDescription,
    images: ["/malabar-restaurant-hero-v2.jpg"],
  },
  icons: { icon: "/icon.svg" },
  formatDetection: { address: false, email: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#071310",
  colorScheme: "dark",
};

const globalSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": `${site.url}/#restaurant`,
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      logo: absoluteUrl("/logo-white.png"),
      image: [
        absoluteUrl("/restaurant/dining-room.png"),
        absoluteUrl("/menu/calicut-pepper-prawns.png"),
        absoluteUrl("/restaurant/table-for-two.png"),
      ],
      description: site.description,
      priceRange: site.priceRange,
      servesCuisine: site.cuisine,
      hasMenu: absoluteUrl("/menu"),
      address: {
        "@type": "PostalAddress",
        ...site.address,
      },
      geo: {
        "@type": "GeoCoordinates",
        ...site.geo,
      },
      areaServed: ["Holytown", "Motherwell", "North Lanarkshire"],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.shortDescription,
      inLanguage: "en-GB",
      publisher: { "@id": `${site.url}/#restaurant` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={globalSchema} />
        <SmoothScroll />
        <CustomCursor />
        <CartProvider>
          <SiteHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

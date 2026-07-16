import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AddToOrder } from "../components/add-to-order";
import { JsonLd } from "../components/json-ld";
import { Reveal } from "../components/reveal";
import { formatPrice, getMenuItem } from "../lib/menu";
import { absoluteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Restaurant in Holytown",
  description:
    "Coastal South Indian cooking, warm hospitality and a dining room shaped by Kerala at Malabar Coast in Holytown, Holytown.",
  alternates: { canonical: "/restaurant" },
  openGraph: {
    type: "website",
    url: "/restaurant",
    title: "Malabar Coast Restaurant in Holytown, Holytown",
    description: "A warm neighbourhood dining room for Kerala and Southern Indian coastal cooking at 33 Main Street, Holytown.",
    images: ["/restaurant/dining-room.png"],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Restaurant", item: absoluteUrl("/restaurant") },
  ],
};

const signatures = [
  {
    id: "pepper-tiger-prawns",
    image: "/menu/calicut-pepper-prawns.png",
    eyebrow: "From the coast",
    title: "Pepper, coconut, sea.",
    copy: "Seafood cooked with curry leaf, kokum and the deep warmth of Malabar black pepper.",
  },
  {
    id: "cape-malay-lamb",
    image: "/menu/cape-malay-lamb.png",
    eyebrow: "From the fire",
    title: "Spice with patience.",
    copy: "Slow braises, toasted masala and smoke — layered for depth, never heat for its own sake.",
  },
  {
    id: "cardamom-nata",
    image: "/menu/lisbon-custard-tart.png",
    eyebrow: "To finish",
    title: "A sweet crossing.",
    copy: "Desserts inspired by the ports and people linked by the old spice route.",
  },
];

export default function RestaurantPage() {
  return (
    <main className="editorialPage restaurantPage">
      <JsonLd data={breadcrumbSchema} />
      <section className="restaurantHero" aria-labelledby="restaurant-title">
        <Image
          src="/restaurant/dining-room.png"
          alt="The warmly lit Malabar Coast dining room with teak, cane and brass details"
          fill
          sizes="100vw"
          priority
        />
        <div className="editorialHeroShade" />
        <div className="restaurantHeroCopy">
          <p>Our restaurant · Holytown</p>
          <h1 id="restaurant-title"><span>Let us take you</span><span>to the coast.</span></h1>
        </div>
        <div className="heroChapterMark"><span>33 Main Street</span><i /><span>Holytown · ML1 4TH</span></div>
      </section>

      <section className="restaurantWelcome">
        <Reveal className="welcomeLabel">A warm arrival</Reveal>
        <Reveal as="h2" delay={70}>Welcomed<br />like home.</Reveal>
        <div className="welcomeCopy">
          <Reveal as="p">
            A neighbourhood dining room for the bright, generous cooking of Kerala and India&apos;s
            southern coast.
          </Reveal>
          <Reveal as="p" delay={80}>
            Our kitchen begins with curry leaf, coconut, tamarind, pepper and seafood. Familiar
            ingredients are cooked with the patience and balance that define Malabar food.
          </Reveal>
          <Reveal as="p" delay={140}>
            Come for a quick supper, a long family table or a celebration. The welcome is relaxed,
            the plates are made for sharing, and there is always room for one more.
          </Reveal>
        </div>
      </section>

      <section className="serviceNotes" aria-label="Restaurant service details">
        <Reveal><span>Cooking</span><strong>Coastal South Indian</strong></Reveal>
        <Reveal delay={60}><span>At the table</span><strong>Sharing encouraged</strong></Reveal>
        <Reveal delay={120}><span>Service</span><strong>Lunch &amp; dinner</strong></Reveal>
        <Reveal delay={180}><span>Good to know</span><strong>Vegetarian choices</strong></Reveal>
      </section>

      <section className="roomPortrait">
        <Reveal className="roomPortraitImage">
          <Image
            src="/restaurant/table-for-two.png"
            alt="An intimate table for two with brass cups, warm linen and handcrafted plates"
            fill
            sizes="(max-width: 820px) 100vw, 62vw"
          />
        </Reveal>
        <div className="roomPortraitText">
          <Reveal className="chapterIndex">The room · Material &amp; memory</Reveal>
          <Reveal as="h2" delay={70}>Grounded in<br />the coast.</Reveal>
          <Reveal as="p" delay={130}>
            Dark teak recalls the old trading vessels. Aged brass holds the warmth of the lamp.
            Cane, lime plaster, linen and laterite tones bring Kerala&apos;s textures into a
            contemporary Scottish dining room.
          </Reveal>
          <Reveal className="materialList" delay={170}>
            <span><i>01</i>Teak</span><span><i>02</i>Brass</span><span><i>03</i>Cane</span><span><i>04</i>Laterite</span>
          </Reveal>
        </div>
      </section>

      <section className="kitchenSignatures" aria-labelledby="kitchen-title">
        <Reveal className="chapterIndex">Inside the kitchen · 03</Reveal>
        <Reveal as="h2" id="kitchen-title" delay={60}>The flavours<br />that lead us.</Reveal>
        <div className="signatureGrid">
          {signatures.map((signature, index) => (
            <Reveal className="signatureCard" delay={index * 70} key={signature.id}>
              <div className="signatureImage">
                <Image src={signature.image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
              </div>
              <span>{signature.eyebrow}</span>
              <h3>{signature.title}</h3>
              <p>{signature.copy}</p>
              {(() => {
                const dish = getMenuItem(signature.id);
                return dish ? (
                  <div className="signatureOrder">
                    <span>{dish.name}</span>
                    <strong>{formatPrice(dish.pricePence)}</strong>
                    <AddToOrder id={dish.id} compact />
                  </div>
                ) : null;
              })()}
            </Reveal>
          ))}
        </div>
        <Reveal className="signatureCta"><Link href="/menu">Explore the full menu <span>↗</span></Link></Reveal>
      </section>

      <section className="hospitalityInterlude">
        <Image
          src="/restaurant/arched-passage.png"
          alt="A lime plaster arch and teak screen leading into the restaurant dining room"
          fill
          sizes="100vw"
        />
        <div className="hospitalityShade" />
        <Reveal className="hospitalityQuote">
          <p>At the heart of Malabar</p>
          <blockquote>Hospitality is not a gesture.<br />It is a way of life.</blockquote>
        </Reveal>
      </section>

      <section className="restaurantStoryBridge">
        <Reveal className="bridgeNumber">From one coast to another</Reveal>
        <Reveal as="h2" delay={70}>The past,<br />served today.</Reveal>
        <div>
          <Reveal as="p">
            Coastal Kerala has always looked outward. Traders, travellers and cooks left traces
            that still live in its food — in the pepper, the bread and the gentle acidity of a curry.
          </Reveal>
          <Reveal as="p" delay={80}>
            We honour that history without turning it into a museum: the cooking is rooted in
            tradition, made fresh for the table in front of us.
          </Reveal>
          <Reveal as="strong" delay={140}>This is more than dining — this is Malabar Coast.</Reveal>
          <Reveal className="bridgeLinks" delay={180}>
            <Link href="/story">Read our story <span>→</span></Link>
            <Link href="/menu">View the menu <span>↗</span></Link>
          </Reveal>
        </div>
      </section>

      <section className="locationSection" id="location" aria-labelledby="location-title">
        <div className="locationGrid" aria-hidden="true" />
        <Reveal className="locationLabel">Our restaurant · 01</Reveal>
        <Reveal as="h2" delay={70} id="location-title">Holytown.</Reveal>
        <Reveal className="locationDetails" delay={130}>
          <address>
            <span>33 Main Street</span>
            <span>Holytown, Holytown</span>
            <span>ML1 4TH</span>
          </address>
          <div className="locationCoordinates"><span>55.8207° N</span><i /><span>3.9735° W</span></div>
          <div className="locationActions">
            <a href="https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+Holytown+ML1+4TH" target="_blank" rel="noreferrer">Get directions <span>↗</span></a>
            <Link href="/#reservations">Reserve a table <span>→</span></Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

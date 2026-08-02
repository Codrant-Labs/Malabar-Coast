import type { Metadata } from "next";
import Image from "next/image";
import { StoryTransitionLink } from "../story-transition-link";
import { DetailCanvas } from "./detail-canvas";
import { JsonLd } from "../../components/json-ld";
import { absoluteUrl } from "../../lib/site";

export const metadata: Metadata = {
  title: "Calicut: The First Spice Port",
  description: "Enter the historic spice port of Calicut, where pepper, monsoon winds and cultures met.",
  alternates: { canonical: "/story/calicut" },
  openGraph: {
    type: "article",
    url: "/story/calicut",
    title: "Calicut: The First Spice Port | Malabar Coast",
    description: "How pepper, monsoon winds and cultural exchange shaped the food of the Malabar Coast.",
    images: ["/story/calicut-spice-port.png"],
  },
};

const calicutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Calicut: The First Spice Port",
      description: "How pepper, monsoon winds and cultural exchange shaped the food of the Malabar Coast.",
      image: absoluteUrl("/story/calicut-spice-port.png"),
      mainEntityOfPage: absoluteUrl("/story/calicut"),
      datePublished: "2026-07-13",
      dateModified: "2026-08-02",
      author: { "@id": `${absoluteUrl("/")}#restaurant` },
      publisher: { "@id": `${absoluteUrl("/")}#restaurant` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Our story", item: absoluteUrl("/story") },
        { "@type": "ListItem", position: 3, name: "Calicut", item: absoluteUrl("/story/calicut") },
      ],
    },
  ],
};

export default function CalicutStoryPage() {
  return (
    <DetailCanvas>
      <JsonLd data={calicutSchema} />
      <section className="calicutHero" aria-labelledby="calicut-title">
        <Image
          className="calicutHeroImage"
          src="/story/calicut-spice-port.png"
          alt="The historic spice port of Calicut opening onto the Arabian Sea"
          fill
          sizes="100vw"
          priority
        />
        <div className="calicutHeroShade" />
        <div className="calicutHeroGrid" aria-hidden="true" />
        <div className="calicutHeroMeta">
          <span>Archive 01 · The first port</span>
          <span>Calicut · Malabar Coast</span>
        </div>
        <h1 id="calicut-title" aria-label="Calicut">
          <span className="calicutTitleLine"><span>Cali</span></span>
          <span className="calicutTitleLine calicutTitleOffset"><span>cut.</span></span>
        </h1>
        <div className="calicutHeroFooter">
          <span>11.2588° N</span><i /><span>75.7804° E</span>
        </div>
      </section>

      <section className="calicutIntro" aria-labelledby="calicut-intro-title">
        <div data-detail-reveal>
          <span>01 / The beginning</span>
          <p>Arabian Sea · Monsoon season</p>
        </div>
        <h2 id="calicut-intro-title" data-detail-reveal>The harbour where flavour became history.</h2>
        <p data-detail-reveal>
          Long before it appeared in a recipe book, Malabar pepper was measured here by hand, loaded into wooden vessels and carried by the turning winds. Calicut was less a border than a threshold—the place where soil, sea and distant tables met.
        </p>
      </section>

      <section className="calicutArchive" aria-label="Objects from the spice trade">
        <figure className="calicutPlate calicutPlateWide" data-cursor-label="BLACK GOLD">
          <div>
            <Image
              src="/story/pepper-balance.png"
              alt="Peppercorns weighed on a brass merchant's balance"
              fill
              sizes="(max-width: 800px) 100vw, 68vw"
            />
          </div>
          <figcaption><span>Merchant’s balance · Black pepper</span><span>Object 01</span></figcaption>
        </figure>

        <aside data-detail-reveal>
          <span>The black gold of Malabar</span>
          <blockquote>Small enough to hold between two fingers. Valuable enough to redraw the world.</blockquote>
          <p>
            Pepper thrived in the wet shade of the Western Ghats. Its heat was clean, floral and enduring—qualities that made it currency, medicine and obsession in ports thousands of miles away.
          </p>
        </aside>

        <figure className="calicutPlate calicutPlateTall" data-cursor-label="FOLLOW THE MONSOON">
          <div>
            <Image
              src="/story/western-ghats.png"
              alt="Pepper vines climbing through the monsoon forest of the Western Ghats"
              fill
              sizes="(max-width: 800px) 100vw, 46vw"
            />
          </div>
          <figcaption><span>Western Ghats · Pepper vines</span><span>Landscape 02</span></figcaption>
        </figure>
      </section>

      <section className="calicutLedger" aria-labelledby="ledger-title">
        <div data-detail-reveal>
          <p>Port ledger · A living exchange</p>
          <h2 id="ledger-title">What arrived.<br />What remained.</h2>
        </div>
        <dl>
          <div data-detail-reveal><dt>Arabia</dt><dd>Rice, perfume, a language of hospitality</dd><span>01</span></div>
          <div data-detail-reveal><dt>China</dt><dd>Ceramics, fishing nets, quiet craft</dd><span>02</span></div>
          <div data-detail-reveal><dt>Portugal</dt><dd>Chilli, vinegar, a new kind of heat</dd><span>03</span></div>
          <div data-detail-reveal><dt>Malabar</dt><dd>Pepper, coconut, generosity without end</dd><span>04</span></div>
        </dl>
      </section>

      <footer className="calicutNext">
        <p>Return to the full journey</p>
        <StoryTransitionLink href="/story" data-cursor-label="BACK TO OUR STORY">
          <span>Our story</span><i>↗</i>
        </StoryTransitionLink>
        <small>Malabar Coast · India to Scotland</small>
      </footer>
    </DetailCanvas>
  );
}

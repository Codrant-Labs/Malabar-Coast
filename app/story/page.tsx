import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StoryCanvas } from "./story-canvas";
import { StoryTransitionLink } from "./story-transition-link";
import { JsonLd } from "../components/json-ld";
import { absoluteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Our Story: From Malabar to Scotland",
  description: "Follow the food story from Calicut's spice ports and Kerala's monsoon landscape to the Malabar Coast table in Holytown, Scotland.",
  alternates: { canonical: "/story" },
  openGraph: {
    type: "article",
    url: "/story",
    title: "From Malabar to Scotland | The Malabar Coast Story",
    description: "A cinematic journey through pepper, monsoon ports and the living coastal cuisine carried to Scotland.",
    images: ["/story/calicut-spice-port.png"],
  },
};

const storySchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "From Malabar to Scotland",
      description: "The food story connecting Calicut's spice coast with the Malabar Coast restaurant in Holytown.",
      image: absoluteUrl("/story/calicut-spice-port.png"),
      mainEntityOfPage: absoluteUrl("/story"),
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
      ],
    },
  ],
};

const chapters = [
  {
    number: "01",
    eyebrow: "The coast",
    title: "A gateway to the world.",
    copy: "For more than three thousand years, the ports of Malabar welcomed sailors, merchants and new ideas. Pepper left these wet shores and quietly changed kitchens across the world.",
    image: "/story/calicut-spice-port.png",
    alt: "A rain-washed historic spice port on the Malabar Coast with an uru vessel offshore",
    label: "Calicut · Arabian Sea",
    cursor: "ENTER CALICUT",
  },
  {
    number: "02",
    eyebrow: "The exchange",
    title: "Where cultures met.",
    copy: "Arabia, Rome, China and Europe arrived with the monsoon winds. What they carried home mattered; what they left behind became part of Malabar’s generous, layered table.",
    image: "/story/pepper-balance.png",
    alt: "Peppercorns being weighed by hand on an old brass balance",
    label: "Black pepper · The black gold",
    cursor: "VIEW ARCHIVE",
  },
  {
    number: "03",
    eyebrow: "The living landscape",
    title: "History, still alive.",
    copy: "From coconut-fringed sea to the rain-soaked Western Ghats, the landscape still writes the menu: pepper, cardamom, seafood, rice and the deep warmth of the coast.",
    image: "/story/western-ghats.png",
    alt: "Pepper vines growing through the misty Western Ghats after monsoon rain",
    label: "Western Ghats · After the monsoon",
    cursor: "FOLLOW THE RAIN",
  },
] as const;

const dishesFromTheStory = [
  {
    name: "Black pepper tiger prawns",
    link: "/menu#small-plates",
    image: "/menu/calicut-pepper-prawns.png",
    alt: "Black pepper tiger prawns inspired by Calicut's spice coast",
    connection: "Calicut · Pepper",
  },
  {
    name: "Highland haddock moilee",
    link: "/menu#seafood",
    image: "/menu/scotland-haddock.png",
    alt: "Scottish haddock served in a golden coconut moilee",
    connection: "Malabar to Scotland · Coconut",
  },
  {
    name: "Cardamom pastel de nata",
    link: "/menu#desserts",
    image: "/menu/lisbon-custard-tart.png",
    alt: "Cardamom custard tart with cashew and black pepper caramel",
    connection: "Lisbon · Cardamom",
  },
] as const;

export default function StoryPage() {
  return (
    <StoryCanvas>
      <JsonLd data={storySchema} />
      <a className="storySkip" href="#story-content">Skip to the story</a>

      <section className="storyFilmHero relative min-h-[100svh] overflow-hidden" aria-labelledby="story-title">
        <div className="storyFilmHeroMedia absolute inset-0">
          <Image
            className="storyFilmHeroImage object-cover"
            src="/story/calicut-spice-port.png"
            alt="A rain-washed historic spice port on the Malabar Coast"
            fill
            sizes="100vw"
            priority
          />
        </div>
        <div className="storyFilmHeroShade absolute inset-0" />
        <div className="storyFilmGrid absolute inset-0" aria-hidden="true" />

        <div className="storyFilmCopy">
          <div className="storyHeroMeta">
            <span>Our story · Chapter I</span>
            <span>11.2588° N · 75.7804° E</span>
          </div>
          <h1 id="story-title">
            <span className="storyHeroLine"><span>A coast that</span></span>
            <span className="storyHeroLine storyHeroLineOffset"><span>changed</span></span>
            <span className="storyHeroLine"><span>the table.</span></span>
          </h1>
        </div>

        <div className="storyFilmFooter">
          <span>Malabar Coast · Southern India</span>
          <div><i /><span>Scroll to follow the monsoon</span></div>
          <span>Est. in memory</span>
        </div>
      </section>

      <section className="storyManifesto" id="story-content" aria-labelledby="manifesto-title">
        <div className="storyManifestoMeta" data-reveal>
          <span>A culinary journey</span>
          <span>Malabar to Scotland</span>
        </div>
        <h2 className="storyManifestoTitle" id="manifesto-title" aria-label="Our story">
          <span>Our</span><span>story</span>
        </h2>
        <div className="storyManifestoCopy">
          <p data-reveal>
            A coastline shaped by rain, trade and welcome—where food became a language long before it became a menu.
          </p>
          <div data-reveal>
            <p>
              For over 3,000 years, this legendary shore welcomed travellers from Arabia, Rome, China and beyond, drawn by black pepper, cardamom, cinnamon and cloves.
            </p>
            <p>
              We carry that exchange forward in Scotland: not as nostalgia, but as a living coastal kitchen rooted in generosity, balance and the memory of the sea.
            </p>
          </div>
        </div>
      </section>

      <section className="storyAtlas" aria-label="Three chapters from the Malabar Coast">
        <div className="storyAtlasCopy">
          <div className="storyAtlasRail" aria-hidden="true"><span>01</span><i /><span>03</span></div>
          <div className="storyAtlasPanels">
            {chapters.map((chapter, index) => (
              <article className="storyAtlasPanel" key={chapter.number}>
                <p>{chapter.eyebrow} · Featured chapter</p>
                <strong>{chapter.number}</strong>
                <h2>{chapter.title}</h2>
                <span>{chapter.copy}</span>
                {index === 0 ? (
                  <StoryTransitionLink className="storyChapterLink" href="/story/calicut">
                    Enter the Calicut archive <i>↗</i>
                  </StoryTransitionLink>
                ) : (
                  <Link className="storyChapterLink" href="#story-finale">
                    Continue to the table <i>↓</i>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="storyAtlasVisuals">
          {chapters.map((chapter) => (
            <figure
              className="storyAtlasScene"
              data-cursor-label={chapter.cursor}
              key={chapter.number}
            >
              <div className="storyAtlasImage">
                <Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 900px) 100vw, 58vw" />
                <span className="storyAtlasShade" />
              </div>
              <figcaption><span>{chapter.label}</span><span>{chapter.number} / 03</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="storyTable" aria-labelledby="story-table-title">
        <div className="storyTableIntro" data-reveal>
          <p>On our table today · The story made edible</p>
          <h2 id="story-table-title">History,<br /><em>served warm.</em></h2>
          <span>
            The old sea road is still present in the pepper, coconut and cardamom we cook with
            every day. These are three places where the journey reaches the plate.
          </span>
        </div>
        <div className="storyTableGrid">
          {dishesFromTheStory.map((dish) => (
            <Link className="storyTableDish" href={dish.link} key={dish.name} data-reveal>
              <div>
                <Image src={dish.image} alt={dish.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
              </div>
              <span>{dish.connection}</span>
              <strong>{dish.name}</strong>
              <i aria-hidden="true">View dish ↗</i>
            </Link>
          ))}
        </div>
      </section>

      <footer className="storyConnect storyConnectCompact" id="story-finale">
        <p data-reveal>Our story continues at the table</p>
        <h2 data-reveal>Come to<br /><em>the coast.</em></h2>
        <div className="storyConnectBottom" data-reveal>
          <span>33 Main Street · Holytown · Holytown · ML1 4TH</span>
          <Link href="/#reservations" data-cursor-label="RESERVE A TABLE">
            Reserve your table <i>↗</i>
          </Link>
        </div>
      </footer>
    </StoryCanvas>
  );
}

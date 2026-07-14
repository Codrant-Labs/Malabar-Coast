"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, getMenuItem } from "../lib/menu";
import { AddToOrder } from "./add-to-order";

const featuredDishes = [
  {
    id: "pepper-tiger-prawns",
    image: "/menu/calicut-pepper-prawns.png",
    alt: "Black pepper tiger prawns with curry leaf and charred lime",
    note: "From Calicut · Small plate",
  },
  {
    id: "haddock-moilee",
    image: "/menu/scotland-haddock.png",
    alt: "Scottish haddock in golden coconut moilee with charred leek",
    note: "Two coasts · Our signature",
  },
  {
    id: "cape-malay-lamb",
    image: "/menu/cape-malay-lamb.png",
    alt: "Slow-braised Cape Malay lamb curry with flaky parotta",
    note: "From the fire · Made for sharing",
  },
] as const;

export function HomeSignatures() {
  return (
    <section className="homeSignatures" aria-labelledby="home-signatures-title">
      <div className="homeSignaturesIntro">
        <div className="homeSignaturesMeta">
          <span>Tonight at Malabar · 03 plates</span>
          <span>From our coastal kitchen</span>
        </div>
        <div className="homeSignaturesHeading">
          <h2 id="home-signatures-title">Come to<br />the table.</h2>
          <div>
            <p>
              Pepper warmed over fire, coconut softened with lime and seafood from the
              Scottish coast. Three plates that tell our journey through flavour.
            </p>
          </div>
        </div>
      </div>

      <div className="homeSignatureGrid">
        {featuredDishes.map((featured, index) => {
          const dish = getMenuItem(featured.id);
          if (!dish) return null;

          return (
            <article className={`homeSignatureCard homeSignatureCard${index + 1}`} key={dish.id}>
              <div className="homeSignatureImage">
                <Image
                  src={featured.image}
                  alt={featured.alt}
                  fill
                  sizes={index === 0 ? "(max-width: 720px) 100vw, 50vw" : "(max-width: 720px) 100vw, 25vw"}
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="homeSignatureCopy">
                <p>{featured.note}</p>
                <h3>{dish.name}</h3>
                <span>{dish.description}</span>
                <div className="homeSignatureOrder">
                  <strong>{formatPrice(dish.pricePence)}</strong>
                  <AddToOrder id={dish.id} compact />
                </div>
              </div>
            </article>
          );
        })}
        <Link className="homeSignatureMenuCta" href="/menu">
          <span>
            <small>Beyond the signatures</small>
            <strong>Explore the full menu</strong>
          </span>
          <i aria-hidden="true">↗</i>
        </Link>
      </div>
    </section>
  );
}

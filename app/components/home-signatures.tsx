"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, type MenuItem } from "../lib/menu";
import { AddToOrder } from "./add-to-order";
import type {DailySpecial} from "@/sanity/lib/daily-specials";

const featuredDishes = [
  {
    id: "malabar-coast-signature-konju-coconut-fry",
    image: "/menu/calicut-pepper-prawns.png",
    alt: "Black pepper tiger prawns with curry leaf and charred lime",
    note: "From Calicut · Small plate",
  },
  {
    id: "malabar-coast-signature-meen-moilee",
    image: "/menu/scotland-haddock.png",
    alt: "Scottish haddock in golden coconut moilee with charred leek",
    note: "Two coasts · Our signature",
  },
  {
    id: "malabar-coast-signature-aattirachi-kurumulak",
    image: "/menu/cape-malay-lamb.png",
    alt: "Pepper-spiced lamb with flaky porotta",
    note: "From the fire · Made for sharing",
  },
] as const;

export function HomeSignatures({items, specials, eyebrow, heading, introduction}: {items: MenuItem[]; specials: DailySpecial[]; eyebrow?: string; heading?: string; introduction?: string}) {
  const hasSpecials = specials.length > 0;
  return (
    <section className="homeSignatures" aria-labelledby="home-signatures-title">
      <div className="homeSignaturesIntro">
        <div className="homeSignaturesMeta">
          <span>{hasSpecials ? `Fresh from the kitchen · ${String(specials.length).padStart(2, "0")} special${specials.length === 1 ? "" : "s"}` : eyebrow || "Tonight at Malabar · 03 plates"}</span>
          <span>{hasSpecials ? "Updated in our Content Studio" : "From our coastal kitchen"}</span>
        </div>
        <div className="homeSignaturesHeading">
          <h2 id="home-signatures-title">{hasSpecials ? <>Today&apos;s<br />specials.</> : heading || <>Come to<br />the table.</>}</h2>
          <div>
            <p>
              {hasSpecials ? "A little extra from the kitchen, available today while each batch lasts. Check back often—the board changes with the cooks and the coast." : introduction || "Pepper warmed over fire, coconut softened with lime and seafood from the Scottish coast. Three plates that tell our journey through flavour."}
            </p>
            <Link className="homeSpecialsOfferLink" href="/offers">See posters &amp; offers <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>

      <div className="homeSignatureGrid">
        {hasSpecials ? specials.slice(0, 3).map((special, index) => {
          const canOrder = special.status === "active" && special.menuItem?.available && special.menuItem.onlineOrdering && !special.menuItem.isAlcoholic && special.menuItem.pricePence === special.pricePence;
          return <article className={`homeSignatureCard homeSignatureCard${index + 1} isDailySpecial`} key={special._id}>
            <div className="homeSignatureImage">
              <Image src={special.image.url} alt={special.image.alt} fill sizes={index === 0 ? "(max-width: 720px) 100vw, 50vw" : "(max-width: 720px) 100vw, 25vw"} placeholder={special.image.lqip ? "blur" : "empty"} blurDataURL={special.image.lqip} />
              <span>{String(index + 1).padStart(2, "0")}</span>
              {special.status === "soldOut" && <b className="homeSpecialSoldOut">Sold out today</b>}
            </div>
            <div className="homeSignatureCopy">
              <p>{special.badge || "Today from the kitchen"}</p>
              <h3>{special.title}</h3>
              <span>{special.description}</span>
              {special.dietaryNote && <small className="homeSpecialDietary">{special.dietaryNote}</small>}
              <div className="homeSignatureOrder">
                <span><strong>{formatPrice(special.pricePence)}</strong>{special.priceNote && <small>{special.priceNote}</small>}</span>
                {canOrder && special.menuItem && <AddToOrder id={special.menuItem.id} compact />}
                {!canOrder && special.callToAction?.href && <Link className="homeSpecialAction" href={special.callToAction.href}>{special.callToAction.label} <span aria-hidden="true">↗</span></Link>}
              </div>
            </div>
          </article>;
        }) : featuredDishes.map((featured, index) => {
          const dish = items.find((item) => item.id === featured.id);
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
                {dish.description && <span>{dish.description}</span>}
                <div className="homeSignatureOrder">
                  <strong>{formatPrice(dish.pricePence)}</strong>
                  {dish.onlineOrdering && <AddToOrder id={dish.id} compact />}
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

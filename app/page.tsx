"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeStoryScroll } from "./components/home-story-scroll";
import { HomeSignatures } from "./components/home-signatures";

const RETURNING_INTRO_DELAY_MS = 120;

function CompassMark() {
  return (
    <svg aria-hidden="true" className="compass" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="19.5" />
      <path d="M22 6v32M6 22h32" />
      <path className="compassNeedle" d="m22 10 3.2 9L22 34l-3.2-15L22 10Z" />
    </svg>
  );
}

function RouteChart() {
  return (
    <svg className="routeChart" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
      <path className="routeGhost" d="M35 378 C260 398 560 398 760 360 C870 338 920 175 955 42" />
      <path className="routeLine" d="M35 378 C260 398 560 398 760 360 C870 338 920 175 955 42" />
      <circle className="routeOrigin" cx="35" cy="378" r="5" />
      <circle className="routeDestination" cx="955" cy="42" r="5" />
    </svg>
  );
}

export default function Home() {
  const [introActive, setIntroActive] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introSeen = window.sessionStorage.getItem("malabar-intro-seen") === "true";

    window.sessionStorage.setItem("malabar-intro-seen", "true");

    if (!reducedMotion && !introSeen) return;

    const introTimer = window.setTimeout(
      () => setIntroActive(false),
      RETURNING_INTRO_DELAY_MS,
    );

    return () => window.clearTimeout(introTimer);
  }, []);

  return (
    <main
      className={`homePage ${introActive ? "introActive" : "introComplete"}`}
      aria-busy={introActive}
    >
      <section className="hero" aria-labelledby="hero-title">
      {introActive && (
        <div
          className="intro"
          role="status"
          aria-label="Welcoming you to Malabar Coast"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target && event.animationName === "introExit") {
              setIntroActive(false);
            }
          }}
        >
          <div className="introScene" aria-hidden="true" />
          <div className="introBokeh" aria-hidden="true" />
          <div className="introShade" aria-hidden="true" />
          <div className="introKicker" aria-hidden="true">
            <span>Southern Indian coastal kitchen</span>
            <i />
            <span>Holytown, Scotland</span>
          </div>
          <div className="introLogo" aria-hidden="true">
            <Image
              src="/logo-white.png"
              alt=""
              width={1372}
              height={285}
              priority
            />
          </div>
          <p className="introTagline" aria-hidden="true">From one coast. To another.</p>
          <div className="introRule" aria-hidden="true" />
          <div className="introCoordinates" aria-hidden="true">
            <span>11.2588° N</span>
            <b>Malabar</b>
            <i />
            <b>Scotland</b>
            <span>55.8207° N</span>
          </div>
          <button
            className="skipIntro"
            type="button"
            onClick={() => setIntroActive(false)}
          >
            Skip intro
          </button>
        </div>
      )}

      <div className="heroImage" aria-hidden="true">
        <Image
          src="/malabar-restaurant-hero-v2.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
        />
      </div>
      <div className="seaShimmer" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <RouteChart />

      <section className="heroContent" id="top" aria-labelledby="hero-title">
        <div className="eyebrow">
          <span>Southern Indian coastal kitchen</span>
          <i aria-hidden="true" />
          <span>Holytown · Scotland</span>
        </div>

        <h1 id="hero-title">
          <span>Shaped by sea.</span>
          <span className="indent">Grounded</span>
          <span>in land.</span>
        </h1>

        <div className="storyNote">
          <CompassMark />
          <div>
            <p>
              Malabar Coast is a Southern Indian coastal restaurant in Holytown,
              bringing Kerala&apos;s pepper, coconut and seafood to a Scottish table.
            </p>
            <div className="heroActions">
              <Link href="/menu">Explore the menu <span aria-hidden="true">↗</span></Link>
              <Link href="/restaurant#location">Plan your visit <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <Link className="heroDish" href="/story" aria-label="Read the story behind Malabar Coast">
        <span className="heroDishImage">
          <Image
            src="/malabar-hero.jpg"
            alt="An uru vessel crossing the old Malabar spice route"
            fill
            sizes="180px"
            priority
          />
        </span>
        <span className="heroDishCopy">
          <small>The story behind the table</small>
          <strong>From one coast to another</strong>
          <i>Follow the voyage ↗</i>
        </span>
      </Link>

      <div className="coordinates origin" aria-hidden="true">
        <small>11.2588° N</small>
        <strong>Calicut</strong>
        <span>Malabar Coast</span>
      </div>
      <div className="coordinates destination" aria-hidden="true">
        <small>55.8207° N</small>
        <strong>Holytown</strong>
        <span>Scotland</span>
      </div>

      <footer className="heroFooter">
        <div className="chapter">
          <span>Chapter I</span>
          <strong>The coast that changed the table</strong>
        </div>
        <div className="scrollCue" aria-hidden="true">
          <span>Begin the voyage</span>
          <i><b /></i>
        </div>
        <div className="year">
          <span>Est.</span>
          <strong>MMXXVI</strong>
        </div>
      </footer>
      </section>

      <section className="homeOverview" aria-labelledby="home-overview-title">
        <div className="homeOverviewMeta">
          <span>Malabar Coast · In brief</span>
          <time dateTime="2026-07-13">Last reviewed 13 July 2026</time>
        </div>
        <div className="homeOverviewLead">
          <h2 id="home-overview-title">What is<br />Malabar Coast?</h2>
          <div>
            <p>
              Malabar Coast is a Southern Indian coastal restaurant at 33 Main Street in
              Holytown, Motherwell. The kitchen connects Kerala&apos;s pepper, coconut, curry leaf
              and tamarind with Scottish seafood and produce in dishes designed for sharing.
            </p>
            <Link href="/faq">Restaurant questions answered <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <dl className="homeOverviewFacts">
          <div><dt>Cuisine</dt><dd>Kerala and Southern Indian coastal cooking</dd></div>
          <div><dt>Good to know</dt><dd>Vegetarian, vegan and gluten-free choices</dd></div>
          <div><dt>Ways to enjoy</dt><dd>Dine in, collect or order delivery</dd></div>
          <div><dt>Find us</dt><dd>33 Main Street · Holytown · ML1 4TH</dd></div>
        </dl>
      </section>

      <HomeSignatures />

      <HomeStoryScroll />

      <section className="homeReservations" id="reservations" aria-labelledby="reservations-title">
        <div className="homeReservationsMeta">
          <span>Plan your visit</span>
          <span>Holytown · Scotland</span>
        </div>
        <div className="homeReservationsGrid">
          <h2 id="reservations-title">Your table<br />by the coast.</h2>
          <div>
            <p>
              Join us at 33 Main Street for Southern Indian coastal cooking, warm hospitality,
              and a table shaped by the journey from Malabar to Scotland.
            </p>
            <div className="homeReservationsActions">
              <Link href="/restaurant#location">Plan your visit <span aria-hidden="true">→</span></Link>
              <Link href="/menu">Explore the menu <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

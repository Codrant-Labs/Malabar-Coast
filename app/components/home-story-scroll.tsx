"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

const homeStoryChapters = [
  {
    number: "01",
    label: "Calicut · The first port",
    title: "A coast open to the world.",
    copy: "For three thousand years, monsoon winds carried travellers to Malabar—and pepper from these shores to tables far beyond them.",
    image: "/story/calicut-spice-port.png",
    alt: "A historic spice port on the Malabar Coast opening onto the Arabian Sea",
  },
  {
    number: "02",
    label: "The Western Ghats · Living landscape",
    title: "The past, still growing.",
    copy: "Rain, forest, coconut and spice still shape the food of the coast. We bring that living inheritance to a new table in Scotland.",
    image: "/story/western-ghats.png",
    alt: "Pepper vines growing through the misty Western Ghats after monsoon rain",
  },
] as const;

export function HomeStoryScroll() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.motion = "reduced";
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        ".homeStoryHeading > span",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1,
          stagger: .1,
          ease: "power4.out",
          scrollTrigger: { trigger: ".homeStoryIntro", start: "top 72%", once: true },
        },
      );

      gsap.fromTo(
        ".homeStoryIntroMeta, .homeStoryIntroCopy",
        { autoAlpha: 0, y: 32 },
        {
          autoAlpha: 1,
          y: 0,
          duration: .8,
          stagger: .1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".homeStoryIntro", start: "top 70%", once: true },
        },
      );

      const panels = gsap.utils.toArray<HTMLElement>(".homeStoryPanel");
      const images = gsap.utils.toArray<HTMLElement>(".homeStoryFrame");
      const progress = root.querySelector<HTMLElement>(".homeStoryProgress i");

      gsap.set(panels[1], { autoAlpha: 0, y: 38 });
      gsap.set(images[1], { clipPath: "inset(100% 0 0 0)", scale: 1.08 });

      const journeyTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".homeStoryJourney",
          start: "top top",
          end: "bottom bottom",
          scrub: .8,
        },
      });

      journeyTimeline
        .to(images[0], { scale: 1.06, yPercent: -3, duration: 1, ease: "none" }, 0)
        .to(panels[0], { autoAlpha: 0, y: -30, duration: .22, ease: "power2.in" }, .36)
        .to(images[0], { clipPath: "inset(0 0 100% 0)", duration: .35, ease: "power3.inOut" }, .34)
        .to(images[1], { clipPath: "inset(0% 0 0 0)", scale: 1, duration: .42, ease: "power3.inOut" }, .4)
        .to(panels[1], { autoAlpha: 1, y: 0, duration: .3, ease: "power3.out" }, .48)
        .to(images[1], { yPercent: -3, duration: .5, ease: "none" }, .5);

      if (progress) {
        gsap.fromTo(
          progress,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".homeStoryJourney",
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
      }
    }, root);

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, []);

  return (
    <section className="homeStory" id="our-story" ref={rootRef} aria-labelledby="home-story-title">
      <div className="homeStoryIntro">
        <div className="homeStoryIntroMeta">
          <span>Our story · In brief</span>
          <span>11.2588° N → 55.8207° N</span>
        </div>
        <h2 className="homeStoryHeading" id="home-story-title">
          <span>From one coast.</span>
          <span>To another.</span>
        </h2>
        <div className="homeStoryIntroCopy">
          <p>A short passage through the places, people and ingredients that brought Malabar to this table.</p>
          <Link href="/story">Read the full story <span aria-hidden="true">↗</span></Link>
        </div>
      </div>

      <div className="homeStoryJourney">
        <div className="homeStoryStage">
          <div className="homeStoryStageCopy">
            {homeStoryChapters.map((chapter) => (
              <article className="homeStoryPanel" key={chapter.number}>
                <div><span>{chapter.number}</span><i /><span>02</span></div>
                <p>{chapter.label}</p>
                <h3>{chapter.title}</h3>
                <span>{chapter.copy}</span>
              </article>
            ))}
          </div>

          <div className="homeStoryMedia" data-cursor-label="OUR STORY">
            {homeStoryChapters.map((chapter) => (
              <figure className="homeStoryFrame" key={chapter.image}>
                <Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 820px) 100vw, 58vw" />
                <span />
              </figure>
            ))}
          </div>

          <div className="homeStoryProgress" aria-hidden="true"><i /></div>
        </div>
      </div>

      <div className="homeStoryExit">
        <p>Two shores. One living kitchen.</p>
        <Link href="/story">Continue the journey <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

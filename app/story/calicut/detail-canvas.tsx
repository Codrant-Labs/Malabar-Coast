"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useLayoutEffect, useRef } from "react";

export function DetailCanvas({ children }: Readonly<{ children: ReactNode }>) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .fromTo(".calicutHeroImage", { scale: 1.14 }, { scale: 1, duration: 2.2 })
        .fromTo(
          ".calicutTitleLine > span",
          { yPercent: 115 },
          { yPercent: 0, duration: 1.1, stagger: 0.1 },
          0.22,
        )
        .fromTo(
          ".calicutHeroMeta > *",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.08 },
          0.95,
        );

      gsap.to(".calicutHeroImage", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: ".calicutHero", start: "top top", end: "bottom top", scrub: true },
      });

      gsap.utils.toArray<HTMLElement>("[data-detail-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 58 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".calicutPlate").forEach((plate) => {
        const image = plate.querySelector("img");
        if (!image) return;

        gsap.fromTo(
          image,
          { yPercent: -8, scale: 1.08 },
          {
            yPercent: 8,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: plate, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    }, root);

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, []);

  return (
    <main className="calicutPage bg-coast-ink text-coast-ivory" ref={rootRef}>
      {children}
    </main>
  );
}

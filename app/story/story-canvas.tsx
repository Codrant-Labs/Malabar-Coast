"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useLayoutEffect, useRef } from "react";

type StoryCanvasProps = {
  children: ReactNode;
};

export function StoryCanvas({ children }: StoryCanvasProps) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.motion = "reduced";
      return;
    }

    const compactMotion = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;

    const context = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTimeline
        .fromTo(".storyFilmHeroImage", { scale: 1.13 }, { scale: 1, duration: 2.1 })
        .fromTo(
          ".storyHeroLine > span",
          { yPercent: 112, rotate: 1.5 },
          { yPercent: 0, rotate: 0, duration: 1.05, stagger: 0.12 },
          0.18,
        )
        .fromTo(
          ".storyHeroMeta > *",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
          0.85,
        );

      if (!compactMotion) {
        gsap.to(".storyFilmHeroImage", {
          yPercent: 13,
          ease: "none",
          scrollTrigger: {
            trigger: ".storyFilmHero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: compactMotion ? 28 : 54 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          },
        );
      });

      gsap.fromTo(
        ".storyManifestoTitle span",
        { clipPath: "inset(100% 0 0 0)", yPercent: 28 },
        {
          clipPath: "inset(0% 0 0 0)",
          yPercent: 0,
          stagger: 0.12,
          duration: compactMotion ? 0.8 : undefined,
          ease: "power4.out",
          scrollTrigger: compactMotion
            ? { trigger: ".storyManifestoTitle", start: "top 84%", once: true }
            : { trigger: ".storyManifestoTitle", start: "top 82%", end: "bottom 58%", scrub: 0.8 },
        },
      );

      const panels = gsap.utils.toArray<HTMLElement>(".storyAtlasPanel");
      const scenes = gsap.utils.toArray<HTMLElement>(".storyAtlasScene");

      gsap.set(panels, { autoAlpha: 0, y: 24 });
      gsap.set(panels[0], { autoAlpha: 1, y: 0 });

      const showPanel = (index: number) => {
        gsap.to(panels, { autoAlpha: 0, y: -18, duration: 0.28, overwrite: true });
        gsap.fromTo(
          panels[index],
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.62, ease: "power3.out", overwrite: true },
        );
      };

      scenes.forEach((scene, index) => {
        const image = scene.querySelector("img");

        ScrollTrigger.create({
          trigger: scene,
          start: "top 56%",
          end: "bottom 44%",
          onEnter: () => showPanel(index),
          onEnterBack: () => showPanel(index),
        });

        if (image && !compactMotion) {
          gsap.fromTo(
            image,
            { yPercent: -7, scale: 1.08 },
            {
              yPercent: 7,
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });

    }, root);

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, []);

  return (
    <main className="storyPage storyCanvas bg-coast-ink text-coast-ivory" id="story-main" ref={rootRef}>
      {children}
    </main>
  );
}

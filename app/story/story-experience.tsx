"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

type StoryExperienceProps = {
  children: ReactNode;
};

export function StoryExperience({ children }: StoryExperienceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const transitionRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    const handleTransitionClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[data-story-transition]")
        : null;
      const transition = transitionRef.current;

      if (!target || !transition || target.target === "_blank") return;

      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === pathname) return;

      event.preventDefault();
      isTransitioningRef.current = true;
      transition.setAttribute("aria-hidden", "false");

      gsap.killTweensOf(transition);
      gsap.fromTo(
        transition,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.72,
          ease: "power4.inOut",
          onComplete: () => router.push(`${destination.pathname}${destination.search}${destination.hash}`),
        },
      );
    };

    document.addEventListener("click", handleTransitionClick);
    return () => document.removeEventListener("click", handleTransitionClick);
  }, [pathname, router]);

  useEffect(() => {
    const transition = transitionRef.current;
    if (!transition || !isTransitioningRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      gsap.to(transition, {
        yPercent: -100,
        duration: 0.72,
        ease: "power4.inOut",
        onComplete: () => {
          gsap.set(transition, { yPercent: 100 });
          transition.setAttribute("aria-hidden", "true");
          isTransitioningRef.current = false;
        },
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div className="storyExperience">
      {children}
      <div className="storyTransition" ref={transitionRef} aria-hidden="true">
        <span>Malabar Coast</span>
        <i />
        <small>India · Scotland</small>
      </div>
    </div>
  );
}

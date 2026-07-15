"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const label = labelRef.current;
    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!cursor || !label || !hasFinePointer) return;

    document.documentElement.classList.add("hasCustomCursor");

    const moveX = gsap.quickTo(cursor, "x", { duration: 0.28, ease: "power3.out" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.28, ease: "power3.out" });

    const handlePointerMove = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
      cursor.dataset.visible = "true";
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-cursor-label]")
        : null;

      label.textContent = target?.dataset.cursorLabel ?? "";
      cursor.dataset.active = target ? "true" : "false";
    };

    const handlePointerLeave = () => {
      cursor.dataset.visible = "false";
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      document.documentElement.classList.remove("hasCustomCursor");
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerOver);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, []);

  return (
    <div className="customCursor" ref={cursorRef} aria-hidden="true">
      <span className="customCursorCross" />
      <span className="customCursorLabel" ref={labelRef} />
    </div>
  );
}

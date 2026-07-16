"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CARD_CYCLE_MS = 4600;
const CYCLE_RESUME_DELAY_MS = 1100;

const testimonialRecords = [
  {
    rating: "4.75",
    ratingLabel: "Rated 4.75 out of 5",
    ratingCount: "8 public ratings",
    text: "Eight early diners have already placed Malabar Coast at 4.75 out of 5—a warm first word from Holytown.",
    author: "Just Eat guests",
    role: "Independent delivery platform",
    sourceUrl: "https://www.just-eat.co.uk/area/ML1-Holytown",
    sourceLabel: "View source",
  },
  {
    rating: "5.0",
    ratingLabel: "Rated 5 out of 5",
    ratingCount: "2 public ratings",
    text: "The first two ratings arrived as a perfect 5.0 out of 5, carrying the earliest taste of the kitchen beyond our doors.",
    author: "Uber Eats guests",
    role: "Independent delivery platform",
    sourceUrl: "https://www.ubereats.com/gb/store/malabar-coast/fLSpFqDpXgaMbY7XNRZDVQ",
    sourceLabel: "View source",
  },
] as const;

function pickAnotherCard(currentIndex: number) {
  const candidate = Math.floor(Math.random() * (testimonialRecords.length - 1));
  return candidate >= currentIndex ? candidate + 1 : candidate;
}

export function HomeTestimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactionIndex, setInteractionIndex] = useState<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current === null) return;
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (interactionIndex !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cycleTimer = window.setInterval(() => {
      setActiveIndex((currentIndex) => pickAnotherCard(currentIndex));
    }, CARD_CYCLE_MS);

    return () => window.clearInterval(cycleTimer);
  }, [interactionIndex]);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  const handleCardEnter = (index: number) => {
    clearResumeTimer();
    setInteractionIndex(index);
    setActiveIndex(index);
  };

  const handleCardLeave = () => {
    clearResumeTimer();
    resumeTimerRef.current = window.setTimeout(() => {
      setInteractionIndex(null);
      resumeTimerRef.current = null;
    }, CYCLE_RESUME_DELAY_MS);
  };

  return (
    <section
      className="homeTestimonials"
      id="testimonials"
      aria-labelledby="home-testimonials-title"
    >
      <div className="homeTestimonialsMeta">
        <span>Gallery V · The guest book</span>
        <span>Holytown · MMXXVI</span>
      </div>

      <header className="homeTestimonialsHeading">
        <p>Words preserved at the table</p>
        <h2 id="home-testimonials-title">
          <span>Leaves from</span>
          <em>the guest book.</em>
        </h2>
      </header>

      <div className="homeTestimonialsArchive" aria-label="Guest records">
        <div className="homeTestimonialsHalo" aria-hidden="true" />
        <div className="homeTestimonialBackplates" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        {testimonialRecords.map((record, index) => {
          const isActive = activeIndex === index;

          return (
            <article
              className={`homeTestimonialCard homeTestimonialCard${index + 1} ${isActive ? "isActive" : ""}`}
              key={record.author}
              tabIndex={0}
              aria-current={isActive ? "true" : undefined}
              onMouseEnter={() => handleCardEnter(index)}
              onMouseLeave={handleCardLeave}
              onFocus={() => handleCardEnter(index)}
              onBlur={handleCardLeave}
            >
              <span className="homeTestimonialIndex" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="homeTestimonialRating" aria-label={record.ratingLabel}>
                <span className="homeTestimonialStars" aria-hidden="true">
                  <i>★</i><i>★</i><i>★</i><i>★</i><i>★</i>
                </span>
                <span className="homeTestimonialScore">
                  <strong>{record.rating}</strong><small>/ 5</small>
                </span>
                <span className="homeTestimonialCount">{record.ratingCount}</span>
              </div>
              <blockquote>
                <span className="homeTestimonialQuoteMark" aria-hidden="true">“</span>
                <p>{record.text}</p>
                <footer>
                  <span>
                    <cite>{record.author}</cite>
                    <small>{record.role}</small>
                  </span>
                  {"sourceUrl" in record && (
                    <a href={record.sourceUrl} target="_blank" rel="noreferrer">
                      {record.sourceLabel} <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </footer>
              </blockquote>
            </article>
          );
        })}
      </div>

      <footer className="homeTestimonialsFootnote">
        <span><i aria-hidden="true" /> Active leaf</span>
        <p>Hover or focus a manuscript to hold it in the light.</p>
        <time dateTime="2026-07-16">Public ratings checked 16 July 2026</time>
      </footer>
    </section>
  );
}

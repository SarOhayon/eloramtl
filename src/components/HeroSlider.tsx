"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { isUploaded } from "@/data/content";
import type { Photo } from "@/data/photos";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { ChevronIcon } from "./icons";

const INTERVAL = 6000;

export type HeroText = { eyebrow: string; title: string; lead: string; primary: string; secondary: string };

export function HeroSlider({ locale, slides: SLIDES, text }: { locale: Locale; slides: Photo[]; text: HeroText }) {
  // Editable text comes from the admin; button labels stay in the dictionary.
  const t = { ...getDictionary(locale).hero, ...text };
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => window.clearTimeout(id);
  }, [index, paused, SLIDES.length]);

  const go = (n: number) => setIndex((n + SLIDES.length) % SLIDES.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.title}
      className="relative h-[calc(100svh-4rem)] min-h-[520px] overflow-hidden bg-cream-deep pt-0 lg:h-[calc(100svh-5rem)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {SLIDES.map((photo, i) => (
        <div
          key={photo.src}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt[locale]}
            fill
            priority={i === 0}
            unoptimized={isUploaded(photo.src)}
            sizes="100vw"
            className={`object-cover transition-transform duration-[7000ms] ease-out ${i === index ? "scale-105" : "scale-100"}`}
          />
        </div>
      ))}

      {/* Soft shade at the bottom only, so the text reads without darkening the photo. */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-4 border border-gold-light/70 sm:inset-6" />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-8 pb-14 [text-shadow:0_1px_14px_rgba(36,25,18,0.45)] sm:px-12 lg:px-16 lg:pb-20">
        <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold-light">
          <span className="h-px w-8 bg-gold-light" />
          {t.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-6xl leading-none text-white sm:text-7xl lg:text-8xl">{t.title}</h1>
        <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">{t.lead}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#suites" className="inline-flex items-center justify-center rounded-sm bg-action px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:bg-action-deep">
            {t.primary}
          </a>
          <a href="#visit" className="inline-flex items-center justify-center rounded-sm px-8 py-4 text-sm uppercase tracking-[0.18em] text-white ring-1 ring-white/60 transition hover:bg-white/10">
            {t.secondary}
          </a>
        </div>

        <div className="mt-10 flex items-center gap-5 text-white">
          <button type="button" onClick={() => go(index - 1)} aria-label={t.prev} className="inline-flex size-10 items-center justify-center rounded-full ring-1 ring-white/50 transition hover:bg-white/10">
            <ChevronIcon dir="left" className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={t.goTo(i + 1)}
                aria-current={i === index}
                className={`h-px transition-all ${i === index ? "w-12 bg-gold-light" : "w-6 bg-white/50 hover:bg-white"}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(index + 1)} aria-label={t.next} className="inline-flex size-10 items-center justify-center rounded-full ring-1 ring-white/50 transition hover:bg-white/10">
            <ChevronIcon className="size-4" />
          </button>
          <p className="hidden text-xs uppercase tracking-[0.25em] text-white/80 sm:block" aria-live="polite">
            {SLIDES[index]?.alt[locale]}
          </p>
        </div>
      </div>
    </section>
  );
}

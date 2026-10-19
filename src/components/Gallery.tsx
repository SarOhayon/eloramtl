"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { GALLERY, type PhotoCategory } from "@/data/photos";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { ChevronIcon } from "./icons";

export function Gallery({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [filter, setFilter] = useState<PhotoCategory | "all">("all");
  const [open, setOpen] = useState<number | null>(null);
  const photos = GALLERY.filter((p) => filter === "all" || p.category === filter);

  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, step]);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {(["all", "building", "suites", "amenities"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`rounded-md px-4 py-2 text-sm transition ${
              filter === k ? "bg-brown text-cream" : "bg-cream text-brown ring-1 ring-brown/15 hover:ring-brown/40"
            }`}
          >
            {t.gallery.filters[k]}
          </button>
        ))}
      </div>

      <div className="grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 lg:grid-cols-4">
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative block overflow-hidden rounded-lg ${i % 6 === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            <Image
              src={p.src}
              alt={p.alt[locale]}
              fill
              sizes={i % 6 === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brown-deep/70 to-transparent p-3 text-left text-sm text-cream opacity-0 transition group-hover:opacity-100">
              {p.alt[locale]}
            </span>
          </button>
        ))}
      </div>

      {open !== null && photos[open] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brown-deep/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={photos[open].alt[locale]}
          onClick={() => setOpen(null)}
        >
          <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[open].src}
              alt={photos[open].alt[locale]}
              width={2000}
              height={1333}
              sizes="100vw"
              className="max-h-[80vh] w-full rounded-md object-contain"
            />
            <p className="mt-3 text-center text-sm text-cream/80">
              {photos[open].alt[locale]} · {open + 1}/{photos.length}
            </p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label={t.gallery.prev}
            className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20 sm:left-6">
            <ChevronIcon dir="left" className="size-5" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label={t.gallery.next}
            className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20 sm:right-6">
            <ChevronIcon className="size-5" />
          </button>
          <button type="button" onClick={() => setOpen(null)} aria-label={t.gallery.close}
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}
    </>
  );
}

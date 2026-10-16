"use client";

import Image from "next/image";
import { useState } from "react";
import { PRICE_FROM, formatPrice, showType, type UnitType } from "@/data/building";
import { PHOTOS, type Photo } from "@/data/photos";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { CheckIcon } from "./icons";

type Key = "students" | "pros" | "families";
const KEYS: Key[] = ["students", "pros", "families"];
const PHOTO: Record<Key, Photo> = { students: PHOTOS.workBooth, pros: PHOTOS.living, families: PHOTOS.rooftop };

export function Audiences({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [active, setActive] = useState<Key>("pros");
  const tab = t.audiences.tabs[active];
  const type = tab.type as UnitType;
  const photo = PHOTO[active];

  return (
    <div>
      <div className="mb-8 inline-flex flex-wrap gap-1 rounded-full bg-cream-deep p-1 ring-1 ring-brown/10" role="tablist" aria-label={t.audiences.eyebrow}>
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`aud-tab-${k}`}
            aria-selected={active === k}
            aria-controls="aud-panel"
            onClick={() => setActive(k)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
              active === k ? "bg-brown text-cream shadow" : "text-brown hover:bg-sand/50"
            }`}
          >
            {t.audiences.tabs[k].label}
          </button>
        ))}
      </div>

      <div id="aud-panel" role="tabpanel" aria-labelledby={`aud-tab-${active}`} className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-brown-deep lg:aspect-auto lg:min-h-[440px]">
          <Image key={photo.src} src={photo.src} alt={photo.alt[locale]} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div className="absolute bottom-4 left-4 rounded-2xl bg-cream/95 px-4 py-3 text-brown shadow">
            <p className="text-xs uppercase tracking-[0.2em] text-green">{t.types[type]}</p>
            <p>
              <span className="text-sm text-brown-soft">{t.explorer.from} </span>
              <span className="font-display text-2xl">{formatPrice(PRICE_FROM[type], locale)}</span>
              <span className="text-sm text-brown-soft">{t.explorer.perMonth}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="font-display text-3xl leading-tight text-brown sm:text-4xl">{tab.title}</h3>
          <p className="mt-4 text-lg text-brown/80">{tab.text}</p>
          <ul className="mt-6 divide-y divide-brown/10 border-y border-brown/10">
            {tab.points.map((pt) => (
              <li key={pt} className="flex items-center gap-4 py-3.5 text-brown">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-green-soft/40 text-green-deep">
                  <CheckIcon className="size-3.5" />
                </span>
                {pt}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => showType(type)}
            className="mt-8 inline-flex items-center justify-center self-start rounded-full bg-brown px-7 py-3.5 font-medium text-cream transition hover:bg-brown-deep"
          >
            {t.audiences.see(t.types[type])}
          </button>
        </div>
      </div>
    </div>
  );
}

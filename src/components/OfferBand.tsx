import Image from "next/image";
import { PHOTOS } from "@/data/photos";
import { getDictionary, type Locale } from "@/i18n/dictionaries";

// Gold line icons from the "One month free" banner.
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICONS = [
  // Rooftop terrace with BBQ
  <svg key="roof" viewBox="0 0 48 48" {...s}><path d="M6 18c4-8 32-8 36 0Z" /><path d="M24 10v30M14 40v-8h20v8M10 32h28M16 26l-4 14M32 26l4 14" /></svg>,
  // EV charging
  <svg key="ev" viewBox="0 0 48 48" {...s}><path d="M6 32v-6l4-8h18l5 8h3a3 3 0 0 1 3 3v3Z" /><circle cx="14" cy="33" r="3" /><circle cx="30" cy="33" r="3" /><path d="M38 6v8M42 6v8M36 14h8v3a4 4 0 0 1-8 0Zm4 7v6" /></svg>,
  // Fitness centre
  <svg key="gym" viewBox="0 0 48 48" {...s}><path d="M6 20v8M10 16v16M14 14v20M34 14v20M38 16v16M42 20v8M14 24h20" /></svg>,
  // Co-working space
  <svg key="work" viewBox="0 0 48 48" {...s}><circle cx="18" cy="9" r="4" /><path d="M18 14v12h10l4 12M14 18l-4 10h8M26 30h18M30 22h12l-2 8" /></svg>,
  // 5 appliances and lighting
  <svg key="app" viewBox="0 0 48 48" {...s}><rect x="6" y="6" width="16" height="36" rx="2" /><path d="M6 20h16M10 12v4M10 24v6" /><rect x="26" y="14" width="16" height="28" rx="2" /><circle cx="34" cy="30" r="6" /><path d="M30 18h2" /></svg>,
  // Hot water included
  <svg key="water" viewBox="0 0 48 48" {...s}><path d="M24 6c6 10 12 17 12 24a12 12 0 0 1-24 0c0-7 6-14 12-24Z" /><path d="M19 32a5 5 0 0 0 5 5" /></svg>,
  // REM Canora
  <svg key="rem" viewBox="0 0 48 48" {...s}><rect x="12" y="6" width="24" height="28" rx="5" /><path d="M12 20h24M18 12h12" /><circle cx="18" cy="27" r="1.5" /><circle cx="30" cy="27" r="1.5" /><path d="M16 34l-4 8M32 34l4 8M14 40h20" /></svg>,
];

export function OfferBand({ locale }: { locale: Locale }) {
  const o = getDictionary(locale).offerBand;
  return (
    <section id="offer" className="relative overflow-hidden bg-brown-deep text-cream">
      <Image src={PHOTOS.alcoves.src} alt="" fill sizes="100vw" className="object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-r from-brown-deep via-brown-deep/85 to-brown-deep/40" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="border border-gold/60 px-6 py-12 sm:px-12 lg:px-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="font-display text-4xl uppercase tracking-[0.04em] text-white sm:text-5xl">{o.kicker}</p>
              <p className="text-gold-foil font-display text-7xl font-semibold uppercase leading-[0.9] sm:text-8xl lg:text-9xl">{o.big}</p>
              <p className="mt-4 text-lg uppercase tracking-[0.35em] text-white sm:text-xl">{o.sub}</p>
              <p className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-cream/75">
                <span className="h-px w-10 bg-gold/70" />
                {o.fine}
                <span className="h-px w-10 bg-gold/70" />
              </p>
            </div>
            <div className="lg:justify-self-end">
              <a
                href="#visit"
                className="inline-flex items-center justify-center rounded-sm bg-cream px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-brown transition hover:bg-gold-light"
              >
                {o.cta}
              </a>
            </div>
          </div>

          <ul className="mt-12 grid grid-cols-2 gap-y-8 border-t border-gold/40 pt-10 sm:grid-cols-4 lg:grid-cols-7 lg:divide-x lg:divide-gold/40">
            {o.features.map((label, i) => (
              <li key={label} className="flex flex-col items-center px-3 text-center">
                <span className="size-12 text-gold-light">{ICONS[i]}</span>
                <span className="mt-3 text-[11px] uppercase leading-snug tracking-[0.12em] text-cream/90">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

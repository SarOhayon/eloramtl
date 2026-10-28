import { CloseIcon } from "./icons";

// The promotion card: used by the site's pop-up and the admin's live preview.
export type PromoCardText = { kicker: string; big: string; sub: string; fine: string; cta: string; dates?: string; applies?: string };

export function PromoCard({ text, photo, onCta, onClose, closeLabel = "Close" }: { text: PromoCardText; photo?: string; onCta?: () => void; onClose?: () => void; closeLabel?: string }) {
  return (
    <div className="relative grid overflow-hidden rounded-sm bg-brown-deep text-cream shadow-2xl md:grid-cols-[1fr_1.2fr]">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- photo chosen in the admin
        <img src={photo} alt="" className="h-48 w-full object-cover md:h-full" />
      )}
      <div className={`relative p-8 sm:p-10 ${photo ? "" : "md:col-span-2"}`}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full text-cream/80 transition hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="size-4" />
          </button>
        )}
        <div className="border border-gold/50 px-6 py-8 text-center">
          <p className="font-display text-3xl uppercase tracking-[0.04em] text-white sm:text-4xl">{text.kicker}</p>
          <p className="text-gold-foil font-display text-6xl font-semibold uppercase leading-[0.95] sm:text-7xl">{text.big}</p>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white sm:text-base">{text.sub}</p>
          {text.applies && <p className="mt-4 text-sm text-gold-light">{text.applies}</p>}
          {text.dates && <p className="mt-1 text-sm text-cream/80">{text.dates}</p>}
          {text.fine && <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-cream/60">{text.fine}</p>}
          <button
            type="button"
            onClick={onCta}
            className="mt-7 inline-flex items-center justify-center rounded-sm bg-cream px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-brown transition hover:bg-gold-light"
          >
            {text.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

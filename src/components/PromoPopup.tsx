"use client";

import { useEffect, useState } from "react";
import { openInquiry } from "./inquiry";
import { burstLogos } from "./logoBurst";
import { track } from "./track";
import { PromoCard, type PromoCardText } from "./PromoCard";

// Shows the promotion once per visitor (remembered in the browser), and a side tab to reopen it.
export function PromoPopup({ id, text, tab, photo, showTab, closeLabel }: { id: string; text: PromoCardText; tab: string; photo?: string; showTab: boolean; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  const key = `elora-promo-seen:${id}`;

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(key) === "1";
    } catch {}
    if (seen) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      track("promo");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [key]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      try {
        localStorage.setItem(key, "1");
      } catch {}
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, key]);

  return (
    <>
      {showTab && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 rotate-180 border border-l-0 border-gold/40 bg-cream px-3 py-8 text-sm uppercase tracking-[0.16em] text-brown shadow-lg transition [writing-mode:vertical-rl] hover:border-gold hover:bg-cream-deep hover:text-ink md:block"
        >
          {tab}
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={text.big} onClick={close}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <PromoCard
              text={text}
              photo={photo}
              closeLabel={closeLabel}
              onClose={close}
              onCta={() => {
                close();
                track("claim");
                burstLogos();
                openInquiry({ askOnly: true });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

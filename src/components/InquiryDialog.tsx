"use client";

import { useEffect, useState } from "react";
import { getShowingSlots } from "@/app/actions/showings";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import type { DaySlots } from "@/lib/showingSlots";
import { InquiryForm } from "./ContactForms";
import { ShowingBooking } from "./ShowingBooking";
import { CloseIcon } from "./icons";
import { INQUIRY_EVENT } from "./inquiry";

// The building inquiry form in a pop-up. Opens from openInquiry() and from any link to #visit
// (a data-suite-type attribute on the link pre-selects the suite type). When showings can be
// booked online (turned on in the admin), it opens on the booking calendar instead.
export function InquiryDialog({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [open, setOpen] = useState<null | { type?: string; n: number }>(null);
  const [slots, setSlots] = useState<DaySlots[] | null>(null);
  const [tab, setTab] = useState<"book" | "ask">("book");

  useEffect(() => {
    const show = (type?: string) => {
      setOpen((o) => ({ type, n: (o?.n ?? 0) + 1 }));
      setSlots(null);
      setTab("book");
      getShowingSlots()
        .then(setSlots)
        .catch(() => setSlots([]));
    };
    const onEvent = (e: Event) => show((e as CustomEvent<{ type?: string }>).detail?.type);
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href="#visit"]');
      if (!link) return;
      e.preventDefault();
      show(link.dataset.suiteType);
    };
    window.addEventListener(INQUIRY_EVENT, onEvent);
    document.addEventListener("click", onClick);
    // Links ending in #visit (e.g. the auto-reply's button) open the booking pop-up right away.
    if (window.location.hash === "#visit") show();
    return () => {
      window.removeEventListener(INQUIRY_EVENT, onEvent);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={t.forms.inquiry.title} onClick={() => setOpen(null)}>
      <div className={`relative max-h-[94svh] w-full overflow-auto ${slots?.length && tab === "book" ? "max-w-2xl" : "max-w-xl"} rounded-sm border-t-2 border-gold bg-cream p-6 text-brown shadow-2xl sm:p-8`} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(null)}
          aria-label={t.promo.close}
          className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-cream text-brown ring-1 ring-brown/10 hover:bg-cream-deep"
        >
          <CloseIcon className="size-4" />
        </button>
        {slots === null ? (
          <p className="py-10 text-center text-brown-soft">{t.showing.loading}</p>
        ) : slots.length ? (
          <>
            <div className="mb-6 mr-12 flex gap-6 border-b border-sand" role="tablist">
              {(["book", "ask"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={`-mb-px border-b-2 pb-2.5 text-sm tracking-wide transition ${tab === k ? "border-brown font-medium text-ink" : "border-transparent text-brown-soft hover:text-brown"}`}
                >
                  {k === "book" ? t.showing.tabBook : t.showing.tabAsk}
                </button>
              ))}
            </div>
            {tab === "book" ? (
              <ShowingBooking key={`b${open.n}`} locale={locale} slots={slots} initialType={open.type} />
            ) : (
              <InquiryForm key={`a${open.n}`} locale={locale} initialType={open.type} />
            )}
          </>
        ) : (
          <InquiryForm key={open.n} locale={locale} initialType={open.type} />
        )}
      </div>
    </div>
  );
}

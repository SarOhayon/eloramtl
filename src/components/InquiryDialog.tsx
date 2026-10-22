"use client";

import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { InquiryForm } from "./ContactForms";
import { CloseIcon } from "./icons";
import { INQUIRY_EVENT } from "./inquiry";

// The building inquiry form in a pop-up. Opens from openInquiry() and from any link to #visit
// (a data-suite-type attribute on the link pre-selects the suite type).
export function InquiryDialog({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [open, setOpen] = useState<null | { type?: string; n: number }>(null);

  useEffect(() => {
    const show = (type?: string) => setOpen((o) => ({ type, n: (o?.n ?? 0) + 1 }));
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
      <div className="relative max-h-[94svh] w-full max-w-xl overflow-auto rounded-sm border-t-2 border-gold bg-cream p-6 text-brown shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(null)}
          aria-label={t.promo.close}
          className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-cream text-brown ring-1 ring-brown/10 hover:bg-cream-deep"
        >
          <CloseIcon className="size-4" />
        </button>
        <InquiryForm key={open.n} locale={locale} initialType={open.type} />
      </div>
    </div>
  );
}

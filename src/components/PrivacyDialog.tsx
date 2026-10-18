"use client";

import { useRef } from "react";
import { getDictionary, type Locale } from "@/i18n/dictionaries";

export function PrivacyDialog({ locale }: { locale: Locale }) {
  const p = getDictionary(locale).privacy;
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="underline-offset-4 hover:text-cream hover:underline">
        {p.link}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="privacy-title"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto max-h-[85svh] w-[min(42rem,calc(100%-2rem))] rounded-3xl bg-cream p-0 text-brown shadow-2xl backdrop:bg-brown-deep/70"
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-brown/10 bg-cream px-6 py-4">
          <h2 id="privacy-title" className="font-display text-2xl">{p.link}</h2>
          <button type="button" onClick={() => ref.current?.close()} className="rounded-full px-4 py-2 text-sm ring-1 ring-brown/20 hover:bg-cream-deep">
            {p.close}
          </button>
        </div>
        <div className="space-y-5 px-6 py-6 text-sm leading-relaxed">
          <p className="text-brown-soft">{p.updated}</p>
          <p>{p.intro}</p>
          {p.sections.map((s) => (
            <section key={s.title}>
              <h3 className="font-medium">{s.title}</h3>
              <p className="mt-1 text-brown/85">{s.text}</p>
            </section>
          ))}
        </div>
      </dialog>
    </>
  );
}

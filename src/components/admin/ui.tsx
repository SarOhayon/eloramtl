"use client";

import { useEffect, useState } from "react";
import { IconBadge } from "./AdminIcons";
import type { Bilingual, SiteContent } from "@/data/content";

// Building blocks shared by the admin screens.

export type Update = (fn: (c: SiteContent) => SiteContent) => void;
export type Upload = (file: File) => Promise<string | null>;

export const field = "w-full rounded-md bg-white px-4 py-3 text-base ring-1 ring-brown/20 focus:outline-none focus:ring-2 focus:ring-gold";
export const bigBtn = "inline-flex items-center justify-center gap-2 rounded-md bg-action px-5 py-3 text-base font-medium text-white transition hover:bg-action-deep disabled:opacity-40";
export const softBtn = "inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-base ring-1 ring-brown/20 transition hover:bg-cream-deep disabled:opacity-40";

export function ScreenTitle({ title, help, icon }: { title: string; help: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="flex items-center gap-4 font-display text-4xl text-ink">
        {icon && <IconBadge className="size-12">{icon}</IconBadge>}
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-lg text-brown-soft">{help}</p>
    </div>
  );
}

export function Step({ n, title, help, children }: { n?: number; title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-cream p-6 shadow-sm ring-1 ring-sand">
      <h2 className="flex items-center gap-3 font-display text-2xl text-ink">
        {n !== undefined && <span className="inline-flex size-9 items-center justify-center rounded-full bg-action font-sans text-base text-white">{n}</span>}
        {title}
      </h2>
      {help && <p className="mt-1 text-brown-soft">{help}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-4 text-left">
      <span className={`relative h-9 w-16 shrink-0 rounded-full transition ${on ? "bg-[#3b6b45]" : "bg-sand"}`}>
        <span className={`absolute top-1 size-7 rounded-full bg-white shadow transition ${on ? "left-8" : "left-1"}`} />
      </span>
      <span className="text-lg">{label}</span>
    </button>
  );
}

export function BilingualFields({ label, value, onChange, long = false, placeholder }: { label: string; value: Bilingual; onChange: (v: Bilingual) => void; long?: boolean; placeholder?: Bilingual }) {
  return (
    <div>
      <p className="mb-2 font-medium">{label}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(["fr", "en"] as const).map((lang) => {
          const props = { className: field, value: value[lang], placeholder: placeholder?.[lang], "aria-label": `${label} (${lang === "fr" ? "French" : "English"})` };
          return (
            <label key={lang} className="block">
              <span className="mb-1 block text-sm text-brown-soft">{lang === "fr" ? "French" : "English"}</span>
              {long ? (
                <textarea {...props} rows={3} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
              ) : (
                <input {...props} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// On/off-with-dates status (promotion, banner) as a coloured dot and a short sentence.
const SCHEDULE_STATUS = {
  live: ["bg-[#3b6b45]", "Showing on the website now"],
  scheduled: ["bg-gold", "Scheduled: will start by itself"],
  ended: ["bg-sand", "Ended: its end date has passed"],
  off: ["bg-sand", "Turned off"],
} as const;

export function ScheduleStatus({ state, label: custom }: { state: keyof typeof SCHEDULE_STATUS; label?: string }) {
  const [dot, standard] = SCHEDULE_STATUS[state];
  const label = custom ?? standard;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

// The current time, refreshed every minute (so buttons that depend on the clock appear by themselves).
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60e3);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

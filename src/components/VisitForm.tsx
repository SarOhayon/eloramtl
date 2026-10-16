"use client";

import { useState } from "react";
import { UNIT_TYPES, whatsappLink } from "@/data/building";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { WhatsAppIcon } from "./icons";

const field =
  "w-full rounded-xl border-0 bg-white px-4 py-3 text-brown ring-1 ring-brown/15 placeholder:text-brown-soft/60 focus:outline-none focus:ring-2 focus:ring-green";

export function VisitForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const v = t.visit;
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [when, setWhen] = useState(v.whenOptions[0]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typeLabel = type ? t.types[type as keyof typeof t.types] : v.any;
    window.open(whatsappLink(v.message(name.trim(), typeLabel, moveIn, when)), "_blank", "noopener,noreferrer");
  };

  return (
    <form id="visit" onSubmit={onSubmit} className="rounded-3xl bg-cream p-6 text-brown shadow-xl shadow-black/10 sm:p-8">
      <h3 className="font-display text-3xl">{v.title}</h3>
      <p className="mt-1 text-sm text-brown-soft">{v.lead}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">{v.name}</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{v.type}</span>
          <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{v.any}</option>
            {UNIT_TYPES.map((k) => (
              <option key={k} value={k}>
                {t.types[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{v.moveIn}</span>
          <input type="date" className={field} value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">{v.when}</legend>
          <div className="flex flex-wrap gap-2">
            {v.whenOptions.map((o) => (
              <label
                key={o}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm ring-1 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-green ${
                  when === o ? "bg-green text-cream ring-green" : "bg-white ring-brown/15 hover:ring-brown/40"
                }`}
              >
                <input type="radio" name="when" value={o} checked={when === o} onChange={() => setWhen(o)} className="sr-only" />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 font-medium text-white transition hover:brightness-95"
      >
        <WhatsAppIcon className="size-5" />
        {v.submit}
      </button>
    </form>
  );
}

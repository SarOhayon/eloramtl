"use client";

import { useState } from "react";
import { UNIT_TYPES, whatsappLink } from "@/data/building";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { WhatsAppIcon } from "./icons";

const field =
  "w-full rounded-sm border-0 bg-white px-4 py-3 text-brown ring-1 ring-brown/15 placeholder:text-brown-soft/60 focus:outline-none focus:ring-2 focus:ring-action";

type Kind = "inquiry" | "maintenance";

function Field({ label, required, children, wide }: { label: string; required?: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-action" aria-hidden="true"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function ContactForms({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const f = t.forms;
  const [kind, setKind] = useState<Kind>("inquiry");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const L = f.labels;
    const sep = locale === "fr" ? " : " : ": ";
    const lines =
      kind === "inquiry"
        ? [
            f.inquiry.intro,
            `${L.name}${sep}${get("name")}`,
            `${L.email}${sep}${get("email")}`,
            get("phone") ? `${L.phone}${sep}${get("phone")}` : null,
            `${L.type}${sep}${get("type") ? t.types[get("type") as keyof typeof t.types] : f.inquiry.any}`,
            get("moveIn") ? `${L.moveIn}${sep}${get("moveIn")}` : null,
            "",
            get("comments"),
          ]
        : [
            f.maintenance.intro,
            `${L.name}${sep}${get("name")}`,
            `${L.suite}${sep}${get("suite")}`,
            `${L.email}${sep}${get("email")}`,
            get("phone") ? `${L.phone}${sep}${get("phone")}` : null,
            `${L.access}${sep}${d.get("access") ? L.yes : L.no}`,
            "",
            get("issue"),
          ];
    const text = lines.filter((x) => x !== null).join("\n");
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
  };

  return (
    <div id="visit" className="rounded-lg bg-cream p-6 text-brown shadow-xl shadow-black/10 sm:p-8">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-cream-deep p-1 ring-1 ring-brown/10" role="tablist">
        {(["inquiry", "maintenance"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-sm px-3 py-2.5 text-sm font-medium transition ${kind === k ? "bg-action text-white shadow" : "hover:bg-sand/50"}`}
          >
            {f[k].tab}
          </button>
        ))}
      </div>

      <form key={kind} onSubmit={onSubmit}>
        <h3 className="font-display text-3xl">{f[kind].title}</h3>
        <p className="mt-1 text-sm text-brown-soft">{f.lead}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label={f.fullName} required wide>
            <input name="name" className={field} autoComplete="name" required />
          </Field>
          <Field label={f.email} required>
            <input name="email" type="email" className={field} autoComplete="email" required />
          </Field>
          <Field label={f.phone} required={kind === "inquiry"}>
            <input name="phone" type="tel" className={field} autoComplete="tel" required={kind === "inquiry"} />
          </Field>

          {kind === "inquiry" ? (
            <>
              <Field label={f.inquiry.type}>
                <select name="type" className={field} defaultValue="">
                  <option value="">{f.inquiry.any}</option>
                  {UNIT_TYPES.map((k) => (
                    <option key={k} value={k}>
                      {t.types[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={f.inquiry.moveIn}>
                <input name="moveIn" type="date" className={field} />
              </Field>
              <Field label={f.inquiry.comments} required wide>
                <textarea name="comments" rows={4} className={field} placeholder={f.inquiry.commentsHint} required />
              </Field>
            </>
          ) : (
            <>
              <Field label={f.maintenance.suite} required wide>
                <input name="suite" className={field} inputMode="numeric" required />
              </Field>
              <Field label={f.maintenance.issue} required wide>
                <textarea name="issue" rows={4} className={field} required />
              </Field>
              <label className="flex items-center gap-3 text-sm sm:col-span-2">
                <input name="access" type="checkbox" className="size-4 accent-[#3b2a20]" />
                {f.maintenance.access}
              </label>
            </>
          )}
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-whatsapp px-6 py-3.5 font-medium text-white transition hover:brightness-95"
        >
          <WhatsAppIcon className="size-5" />
          {f.submit}
        </button>
      </form>
    </div>
  );
}

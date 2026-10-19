"use client";

import { useActionState, useState } from "react";
import { submitContact, type ContactState } from "@/app/actions/contact";
import { UNIT_TYPES, whatsappLink } from "@/data/building";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { WhatsAppIcon } from "./icons";
import { MaintenanceAssistant } from "./MaintenanceAssistant";

const field =
  "w-full rounded-sm border-0 bg-white px-4 py-3 text-brown ring-1 ring-brown/15 placeholder:text-brown-soft/60 focus:outline-none focus:ring-2 focus:ring-action";


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

function InquiryForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const f = t.forms;
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitContact, { status: "idle" });
  const v = state.values ?? {};

  if (state.status === "sent") {
    return (
      <div role="status" className="py-6">
        <h3 className="font-display text-3xl">{f.sentTitle}</h3>
        <p className="mt-2 text-brown/85">{f.sentText}</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <h3 className="font-display text-3xl">{f.inquiry.title}</h3>
      <p className="mt-1 text-sm text-brown-soft">{f.lead}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={f.fullName} required wide>
          <input name="name" className={field} autoComplete="name" required defaultValue={v.name} />
        </Field>
        <Field label={f.email} required>
          <input name="email" type="email" className={field} autoComplete="email" required defaultValue={v.email} />
        </Field>
        <Field label={f.phone} required>
          <input name="phone" type="tel" className={field} autoComplete="tel" required defaultValue={v.phone} />
        </Field>

        <Field label={f.inquiry.type}>
          <select name="type" className={field} defaultValue={v.type ?? ""}>
            <option value="">{f.inquiry.any}</option>
            {UNIT_TYPES.map((k) => (
              <option key={k} value={t.types[k]}>
                {t.types[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={f.inquiry.moveIn}>
          <input name="moveIn" type="date" className={field} defaultValue={v.moveIn} />
        </Field>
        <Field label={f.inquiry.comments} required wide>
          <textarea name="comments" rows={4} className={field} placeholder={f.inquiry.commentsHint} required defaultValue={v.comments} />
        </Field>
      </div>

      {(state.status === "invalid" || state.status === "error") && (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {state.status === "invalid" ? f.invalid : f.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-brown-deep transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? f.sending : f.submit}
      </button>
      <a
        href={whatsappLink(f.inquiry.intro)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm text-brown-soft transition hover:text-brown"
      >
        <WhatsAppIcon className="size-4 text-whatsapp" />
        {f.orWhatsapp}
      </a>
    </form>
  );
}

export function ContactForms({ locale }: { locale: Locale }) {
  const f = getDictionary(locale).forms;
  const [kind, setKind] = useState<"inquiry" | "maintenance">("inquiry");

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
      {kind === "inquiry" ? <InquiryForm locale={locale} /> : <MaintenanceAssistant locale={locale} />}
    </div>
  );
}

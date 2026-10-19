"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "@/app/actions/contact";
import { UNIT_TYPES, whatsappLink } from "@/data/building";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { WhatsAppIcon } from "./icons";

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
  const m = getDictionary(locale).maintWhatsapp;
  return (
    <div className="space-y-4">
      <div id="visit" className="rounded-lg bg-cream p-6 text-brown shadow-xl shadow-black/10 sm:p-8">
        <InquiryForm locale={locale} />
      </div>
      {/* Residents report maintenance through the WhatsApp assistant. */}
      <div id="maintenance" className="flex flex-col gap-4 rounded-lg bg-brown-deep p-6 text-cream sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-2xl">{m.title}</p>
          <p className="mt-1 text-sm text-cream/75">{m.text}</p>
        </div>
        <a
          href={whatsappLink(m.message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm bg-whatsapp px-5 py-3 text-sm font-medium text-white transition hover:brightness-95"
        >
          <WhatsAppIcon className="size-4" />
          {m.cta}
        </a>
      </div>
    </div>
  );
}

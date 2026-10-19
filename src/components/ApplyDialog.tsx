"use client";

import { useActionState, useRef } from "react";
import { submitApplication, type ApplyField, type ApplyState } from "@/app/actions/apply";
import { getDictionary, type Locale } from "@/i18n/dictionaries";

const field =
  "w-full rounded-sm border-0 bg-white px-4 py-3 text-brown ring-1 ring-brown/15 placeholder:text-brown-soft/60 focus:outline-none focus:ring-2 focus:ring-gold aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-700/70";

type FieldProps = { name: ApplyField; label: string; type?: string; autoComplete?: string; state: ApplyState; error: string };

function Field({ name, label, type = "text", autoComplete, state, error }: FieldProps) {
  const bad = state.status === "invalid" && !!state.invalid?.includes(name);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-brown">
        {label}
        <span className="text-gold" aria-hidden="true"> *</span>
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        defaultValue={state.values?.[name]}
        aria-invalid={bad}
        aria-describedby={bad ? `apply-${name}-err` : undefined}
        className={field}
      />
      {bad && (
        <span id={`apply-${name}-err`} className="mt-1 block text-xs text-red-800">
          {error}
        </span>
      )}
    </label>
  );
}

export function ApplyDialog({ locale, className }: { locale: Locale; className?: string }) {
  const t = getDictionary(locale);
  const a = t.apply;
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(submitApplication, { status: "idle" });

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={className}>
        {t.nav.cta}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="apply-title"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto max-h-[90svh] w-[min(36rem,calc(100%-2rem))] rounded-sm bg-cream p-0 text-brown shadow-2xl backdrop:bg-brown-deep/70"
      >
        <div className="border-t-2 border-gold px-6 pb-8 pt-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
                <span className="h-px w-8 bg-gold" />
                Elora
              </p>
              <h2 id="apply-title" className="mt-2 font-display text-4xl text-ink">
                {state.status === "sent" ? a.sentTitle : a.title}
              </h2>
            </div>
            <button type="button" onClick={() => ref.current?.close()} className="rounded-sm px-3 py-2 text-sm ring-1 ring-brown/20 hover:bg-cream-deep">
              {a.close}
            </button>
          </div>

          {state.status === "sent" ? (
            <p className="mt-4 text-brown/85" role="status">
              {a.sentText}
            </p>
          ) : (
            <form action={formAction} noValidate className="mt-2">
              <p className="text-sm text-brown-soft">{a.lead}</p>
              <input type="hidden" name="lang" value={locale} />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field name="name" label={a.name} autoComplete="name" state={state} error={a.errors.name} />
                </div>
                <Field name="phone" label={a.phone} type="tel" autoComplete="tel" state={state} error={a.errors.phone} />
                <Field name="email" label={a.email} type="email" autoComplete="email" state={state} error={a.errors.email} />
                <div className="sm:col-span-2">
                  <Field name="moveIn" label={a.moveIn} type="date" state={state} error={a.errors.moveIn} />
                </div>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-brown">{a.comments}</span>
                  <textarea name="comments" rows={3} className={field} placeholder={a.commentsHint} defaultValue={state.values?.comments} />
                </label>
              </div>
              {state.status === "invalid" && (
                <p className="mt-4 text-sm text-red-800" role="alert">
                  {a.invalid}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-brown-deep transition hover:bg-gold-light disabled:opacity-60"
              >
                {pending ? a.sending : a.submit}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

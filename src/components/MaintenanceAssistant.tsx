"use client";

import { useActionState, useState } from "react";
import { submitMaintenance, type MaintenanceState } from "@/app/actions/maintenance";
import { PHONE_MAIN, PHONE_MAIN_DISPLAY } from "@/data/building";
import { CATEGORIES, ROOMS, SINCE, type Category, type Issue } from "@/data/maintenance";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { PhoneIcon } from "./icons";

const field =
  "w-full rounded-sm border-0 bg-white px-4 py-3 text-brown ring-1 ring-brown/15 placeholder:text-brown-soft/60 focus:outline-none focus:ring-2 focus:ring-gold";

function Bot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brown font-display text-sm text-gold-light">E</span>
      <div className="rounded-lg rounded-tl-none bg-cream-deep px-4 py-3 text-sm text-brown">{children}</div>
    </div>
  );
}

function Me({ children, onChange, changeLabel }: { children: React.ReactNode; onChange: () => void; changeLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onChange} className="text-xs text-brown-soft underline-offset-4 hover:underline">
        {changeLabel}
      </button>
      <div className="rounded-lg rounded-tr-none bg-brown px-4 py-2.5 text-sm text-cream">{children}</div>
    </div>
  );
}

function Choices<T>({ items, label, onPick }: { items: T[]; label: (x: T) => string; onPick: (x: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pl-11">
      {items.map((x) => (
        <button
          key={label(x)}
          type="button"
          onClick={() => onPick(x)}
          className="rounded-full bg-white px-4 py-2 text-sm text-brown ring-1 ring-brown/20 transition hover:bg-gold-light/40 hover:ring-gold"
        >
          {label(x)}
        </button>
      ))}
    </div>
  );
}

export function MaintenanceAssistant({ locale }: { locale: Locale }) {
  const m = getDictionary(locale).maint;
  const [safe, setSafe] = useState<boolean | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [state, formAction, pending] = useActionState<MaintenanceState, FormData>(submitMaintenance, { status: "idle" });
  const v = state.values ?? {};

  const restartFrom = (step: "safety" | "category" | "issue") => {
    if (step === "safety") setSafe(null);
    if (step !== "issue") setCategory(null);
    setIssue(null);
  };

  if (state.status === "sent") {
    return (
      <div role="status" className="space-y-4 py-2">
        <Bot>
          <p className="font-medium">{m.sentTitle}</p>
          <p className="mt-1">{m.sentText}</p>
        </Bot>
        <button type="button" onClick={() => window.location.reload()} className="ml-11 text-sm text-brown underline-offset-4 hover:underline">
          {m.restart}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
        <span className="h-px w-8 bg-gold" />
        {m.bot}
      </p>

      <Bot>
        <p>{m.hello}</p>
        <p className="mt-2 font-medium">{m.safety}</p>
      </Bot>
      {safe === null ? (
        <Choices items={[true, false]} label={(x) => (x ? m.no : m.yes)} onPick={(x) => setSafe(x)} />
      ) : (
        <Me onChange={() => restartFrom("safety")} changeLabel={m.change}>
          {safe ? m.no : m.yes}
        </Me>
      )}

      {safe === false && (
        <div className="rounded-lg border border-red-800/30 bg-red-50 p-5 text-sm text-red-900" role="alert">
          <p className="font-display text-2xl">{m.emergencyTitle}</p>
          <p className="mt-1">{m.emergency}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="tel:911" className="inline-flex items-center gap-2 rounded-sm bg-red-800 px-5 py-3 font-medium text-white">
              <PhoneIcon className="size-4" /> 911
            </a>
            <a href={`tel:+${PHONE_MAIN}`} className="inline-flex items-center gap-2 rounded-sm px-5 py-3 font-medium text-red-900 ring-1 ring-red-800/40">
              <PhoneIcon className="size-4" /> {PHONE_MAIN_DISPLAY}
            </a>
          </div>
        </div>
      )}

      {safe && (
        <>
          <Bot>{m.category}</Bot>
          {category ? (
            <Me onChange={() => restartFrom("category")} changeLabel={m.change}>
              {category.label[locale]}
            </Me>
          ) : (
            <Choices items={CATEGORIES} label={(c) => c.label[locale]} onPick={setCategory} />
          )}
        </>
      )}

      {safe && category && (
        <>
          <Bot>{m.issue}</Bot>
          {issue ? (
            <Me onChange={() => restartFrom("issue")} changeLabel={m.change}>
              {issue.label[locale]}
            </Me>
          ) : (
            <Choices items={category.issues} label={(i) => i.label[locale]} onPick={setIssue} />
          )}
        </>
      )}

      {safe && category && issue && (
        <>
          {issue.urgent && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gold-light/40 px-4 py-3 text-sm text-brown ring-1 ring-gold/50">
              <span>{m.urgentNote}</span>
              <a href={`tel:+${PHONE_MAIN}`} className="inline-flex items-center gap-2 font-medium">
                <PhoneIcon className="size-4" /> {PHONE_MAIN_DISPLAY}
              </a>
            </div>
          )}
          <Bot>{m.details}</Bot>
          <form action={formAction} className="grid gap-4 rounded-lg bg-white/60 p-4 ring-1 ring-brown/10 sm:grid-cols-2 sm:p-5">
            <input type="hidden" name="category" value={category.id} />
            <input type="hidden" name="issue" value={issue.id} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.room}</span>
              <select name="room" className={field} defaultValue={v.room ?? ""}>
                <option value="">{m.choose}</option>
                {ROOMS.map((r) => (
                  <option key={r.en} value={r[locale]}>
                    {r[locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.since}</span>
              <select name="since" className={field} defaultValue={v.since ?? ""}>
                <option value="">{m.choose}</option>
                {SINCE.map((r) => (
                  <option key={r.en} value={r[locale]}>
                    {r[locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">{m.description} *</span>
              <textarea name="description" rows={3} required className={field} placeholder={m.descriptionHint} defaultValue={v.description} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.name} *</span>
              <input name="name" required autoComplete="name" className={field} defaultValue={v.name} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.suite} *</span>
              <input name="suite" required inputMode="numeric" className={field} defaultValue={v.suite} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.phone} *</span>
              <input name="phone" type="tel" required autoComplete="tel" className={field} defaultValue={v.phone} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.email} *</span>
              <input name="email" type="email" required autoComplete="email" className={field} defaultValue={v.email} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">{m.bestTime}</span>
              <input name="bestTime" className={field} placeholder={m.bestTimeHint} defaultValue={v.bestTime} />
            </label>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input name="access" type="checkbox" className="size-4 accent-[#3b2a20]" defaultChecked={!!v.access} />
              {m.access}
            </label>
            {(state.status === "invalid" || state.status === "error") && (
              <p className="text-sm text-red-800 sm:col-span-2" role="alert">
                {state.status === "invalid" ? m.invalid : m.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-sm bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-brown-deep transition hover:bg-gold-light disabled:opacity-60 sm:col-span-2"
            >
              {pending ? m.sending : m.submit}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

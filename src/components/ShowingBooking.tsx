"use client";

import { useActionState, useState } from "react";
import { bookShowing, type BookState } from "@/app/actions/showings";
import { UNIT_TYPES } from "@/data/building";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import type { DaySlots } from "@/lib/showingSlots";
import { Field, field } from "./ContactForms";

// Book a showing: pick a day, then a time, then leave contact details.
export function ShowingBooking({ locale, slots, initialType }: { locale: Locale; slots: DaySlots[]; initialType?: string }) {
  const t = getDictionary(locale);
  const f = t.forms;
  const s = t.showing;
  const [state, formAction, pending] = useActionState<BookState, FormData>(bookShowing, { status: "idle" });
  const v = state.values ?? {};
  const [date, setDate] = useState(v.date || slots[0]?.date || "");
  const [time, setTime] = useState("");
  const intl = locale === "fr" ? "fr-CA" : "en-CA";
  const dayFmt = new Intl.DateTimeFormat(intl, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const longFmt = new Intl.DateTimeFormat(intl, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const timeFmt = new Intl.DateTimeFormat(intl, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  const asDate = (d: string, hhmm = "00:00") => new Date(`${d}T${hhmm}:00Z`);
  // A time just taken by someone else is dropped from the list.
  const times = (slots.find((d) => d.date === date)?.times ?? []).filter((x) => !(state.status === "taken" && v.date === date && v.time === x));
  const chosen = times.includes(time) ? time : "";

  if (state.status === "booked" && state.when) {
    const when = `${locale === "fr" ? "le " : "on "}${longFmt.format(asDate(state.when.date))} ${locale === "fr" ? "à" : "at"} ${timeFmt.format(asDate(state.when.date, state.when.time))}`;
    return (
      <div role="status" className="py-6">
        <h3 className="font-display text-3xl">{s.bookedTitle}</h3>
        <p className="mt-2 text-brown/85">{s.bookedText(when)}</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={chosen} />
      <h3 className="font-display text-3xl">{s.title}</h3>
      <p className="mt-1 text-sm text-brown-soft">{s.lead}</p>

      <p className="mb-2 mt-5 text-sm font-medium">{s.day}</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {slots.map((d) => (
          <button
            key={d.date}
            type="button"
            aria-pressed={d.date === date}
            onClick={() => {
              setDate(d.date);
              setTime("");
            }}
            className={`shrink-0 rounded-sm px-3.5 py-2.5 text-sm capitalize ring-1 transition ${d.date === date ? "bg-action text-white ring-action" : "bg-white text-brown ring-brown/15 hover:ring-brown/40"}`}
          >
            {dayFmt.format(asDate(d.date))}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-3 text-sm font-medium">{s.time}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {times.map((x) => (
          <button
            key={x}
            type="button"
            aria-pressed={x === chosen}
            onClick={() => setTime(x)}
            className={`rounded-sm px-2 py-2.5 text-sm ring-1 transition ${x === chosen ? "bg-action text-white ring-action" : "bg-white text-brown ring-brown/15 hover:ring-brown/40"}`}
          >
            {timeFmt.format(asDate(date, x))}
          </button>
        ))}
      </div>

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
          <select name="type" className={field} defaultValue={v.type ?? initialType ?? ""}>
            <option value="">{f.inquiry.any}</option>
            {UNIT_TYPES.map((k) => (
              <option key={k} value={t.types[k]}>
                {t.types[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={f.inquiry.moveIn} required>
          <input name="moveIn" type="date" className={field} required defaultValue={v.moveIn} />
        </Field>
        <Field label={f.inquiry.comments} wide>
          <textarea name="comments" rows={3} className={field} defaultValue={v.comments} />
        </Field>
      </div>

      {(state.status === "invalid" || state.status === "error" || state.status === "taken") && (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {state.status === "taken" ? s.taken : state.status === "invalid" ? f.invalid : f.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !chosen}
        className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-action px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:bg-action-deep disabled:opacity-60"
      >
        {pending ? s.sending : chosen ? s.submit : s.pickTime}
      </button>
    </form>
  );
}

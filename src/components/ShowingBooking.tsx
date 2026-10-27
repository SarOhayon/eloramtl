"use client";

import { useActionState, useState } from "react";
import { bookShowing, type BookState } from "@/app/actions/showings";
import { UNIT_TYPES } from "@/data/building";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import type { DaySlots } from "@/lib/showingSlots";
import { Field, field } from "./ContactForms";
import { ChevronIcon } from "./icons";

const asDate = (d: string, hhmm = "00:00") => new Date(`${d}T${hhmm}:00Z`);
const monthOf = (d: string) => d.slice(0, 7);
const shiftMonth = (ym: string, n: number) => {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};

// Book a showing in two steps: pick a day and time on a small calendar, then leave contact details.
export function ShowingBooking({ locale, slots, initialType }: { locale: Locale; slots: DaySlots[]; initialType?: string }) {
  const t = getDictionary(locale);
  const f = t.forms;
  const s = t.showing;
  const [state, formAction, pending] = useActionState<BookState, FormData>(bookShowing, { status: "idle" });
  const v = state.values ?? {};
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [month, setMonth] = useState(monthOf(slots[0].date));
  const [step, setStep] = useState<"pick" | "details">("pick");

  const intl = locale === "fr" ? "fr-CA" : "en-CA";
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intl, { timeZone: "UTC", ...o });
  const timeFmt = fmt({ hour: "numeric", minute: "2-digit" });
  const byDate = new Map(slots.map((d) => [d.date, d.times]));
  // A time just taken by someone else is dropped, and the visitor is sent back to pick another.
  const timesOf = (d: string) => (byDate.get(d) ?? []).filter((x) => !(state.status === "taken" && v.date === d && v.time === x));
  const chosen = date && timesOf(date).includes(time) ? time : "";
  // After "time just taken", the chosen time is gone, so the calendar shows again.
  const showDetails = step === "details" && Boolean(chosen);

  if (state.status === "booked" && state.when) {
    const when = `${locale === "fr" ? "le " : "on "}${fmt({ weekday: "long", month: "long", day: "numeric" }).format(asDate(state.when.date))} ${locale === "fr" ? "à" : "at"} ${timeFmt.format(asDate(state.when.date, state.when.time))}`;
    return (
      <div role="status" className="py-6 text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gold-light text-2xl text-brown">✓</span>
        <h3 className="font-display text-3xl">{s.bookedTitle}</h3>
        <p className="mx-auto mt-2 max-w-md text-brown/85">{s.bookedText(when)}</p>
      </div>
    );
  }

  // Month grid: blanks before the 1st, then each day; only days with times can be picked.
  const first = asDate(`${month}-01`);
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells = [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  const weekdays = Array.from({ length: 7 }, (_, i) => fmt({ weekday: "narrow" }).format(asDate(`2026-11-0${i + 1}`))); // Nov 1, 2026 is a Sunday
  const firstMonth = monthOf(slots[0].date);
  const lastMonth = monthOf(slots[slots.length - 1].date);
  const times = date ? timesOf(date) : [];
  const groups = [
    { label: s.morning, list: times.filter((x) => x < "12:00") },
    { label: s.afternoon, list: times.filter((x) => x >= "12:00") },
  ].filter((g) => g.list.length);
  const pill = (on: boolean) => `whitespace-nowrap rounded-full px-1.5 py-2 text-[13px] ring-1 transition ${on ? "bg-action text-white ring-action" : "bg-white text-brown ring-brown/15 hover:ring-brown/50"}`;

  return (
    <form action={formAction}>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={chosen} />
      <h3 className="font-display text-3xl">{s.title}</h3>
      <p className="mt-1 text-sm text-brown-soft">{s.lead}</p>

      {state.status === "taken" && (
        <p className="mt-4 rounded-sm bg-gold-light/60 px-4 py-2.5 text-sm text-brown" role="alert">
          {s.taken}
        </p>
      )}

      {/* Step 1: day and time */}
      <div className={showDetails ? "hidden" : "mt-6 grid gap-6 sm:grid-cols-[1fr_1fr]"}>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium capitalize text-ink">{fmt({ month: "long", year: "numeric" }).format(first)}</p>
            <div className="flex gap-1">
              <button type="button" aria-label={s.prevMonth} disabled={month <= firstMonth} onClick={() => setMonth(shiftMonth(month, -1))} className="inline-flex size-8 items-center justify-center rounded-full text-brown transition hover:bg-cream-deep disabled:opacity-25">
                <ChevronIcon dir="left" className="size-4" />
              </button>
              <button type="button" aria-label={s.nextMonth} disabled={month >= lastMonth} onClick={() => setMonth(shiftMonth(month, 1))} className="inline-flex size-8 items-center justify-center rounded-full text-brown transition hover:bg-cream-deep disabled:opacity-25">
                <ChevronIcon dir="right" className="size-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm" role="grid" aria-label={s.pickDay}>
            {weekdays.map((w, i) => (
              <span key={i} className="pb-1 text-xs uppercase text-brown-soft">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`b${i}`} />;
              const open = timesOf(d).length > 0;
              const on = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!open}
                  aria-pressed={on}
                  aria-label={fmt({ weekday: "long", month: "long", day: "numeric" }).format(asDate(d))}
                  onClick={() => {
                    setDate(d);
                    setTime("");
                  }}
                  className={`mx-auto flex size-9 items-center justify-center rounded-full transition ${
                    on ? "bg-action font-medium text-white" : open ? "font-medium text-brown ring-1 ring-brown/20 hover:bg-cream-deep" : "text-brown/25"
                  }`}
                >
                  {Number(d.slice(8))}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:border-l sm:border-sand sm:pl-6">
          <p className="mb-3 font-medium text-ink">{date ? fmt({ weekday: "long", month: "long", day: "numeric" }).format(asDate(date)) : s.times}</p>
          {!date ? (
            <p className="text-sm text-brown-soft">{s.noDay}</p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-brown-soft">{g.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {g.list.map((x) => (
                      <button key={x} type="button" aria-pressed={x === chosen} onClick={() => setTime(x)} className={pill(x === chosen)}>
                        {timeFmt.format(asDate(date, x))}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!chosen}
          onClick={() => setStep("details")}
          className="inline-flex w-full items-center justify-center rounded-sm bg-action px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:bg-action-deep disabled:opacity-40 sm:col-span-2"
        >
          {chosen ? s.next : s.pickTime}
        </button>
      </div>

      {/* Step 2: contact details */}
      <div className={showDetails ? "mt-6" : "hidden"}>
        <div className="flex items-center justify-between gap-3 rounded-sm bg-cream-deep px-4 py-3 ring-1 ring-sand">
          <p className="text-brown">
            <span className="font-medium capitalize">{date && fmt({ weekday: "long", month: "long", day: "numeric" }).format(asDate(date))}</span>
            {chosen && ` · ${timeFmt.format(asDate(date, chosen))}`}
          </p>
          <button type="button" onClick={() => setStep("pick")} className="text-sm font-medium text-brown underline underline-offset-4">
            {s.change}
          </button>
        </div>

        <p className="mb-3 mt-6 font-medium text-ink">{s.details}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f.fullName} required wide>
            <input name="name" className={field} autoComplete="name" required={showDetails} defaultValue={v.name} />
          </Field>
          <Field label={f.email} required>
            <input name="email" type="email" className={field} autoComplete="email" required={showDetails} defaultValue={v.email} />
          </Field>
          <Field label={f.phone} required>
            <input name="phone" type="tel" className={field} autoComplete="tel" required={showDetails} defaultValue={v.phone} />
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
            <input name="moveIn" type="date" className={field} required={showDetails} defaultValue={v.moveIn} />
          </Field>
          <Field label={f.inquiry.comments} wide>
            <textarea name="comments" rows={2} className={field} defaultValue={v.comments} />
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
          className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-action px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:bg-action-deep disabled:opacity-60"
        >
          {pending ? s.sending : s.submit}
        </button>
      </div>
    </form>
  );
}

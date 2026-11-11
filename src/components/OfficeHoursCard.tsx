"use client";

import { useEffect, useState } from "react";
import type { HoursPeriod, OfficeHours } from "@/lib/officeHours";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { PinIcon } from "./icons";

const WEEK = 7 * 24 * 60;
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];
const TZ = "America/Montreal";

const minutesOf = (p: { day: number; hour: number; minute: number }) => p.day * 1440 + p.hour * 60 + p.minute;

function formatTime(hour: number, minute: number, locale: Locale) {
  if (locale === "fr") return `${hour} h${minute ? String(minute).padStart(2, "0") : ""}`;
  const h = hour % 12 || 12;
  return `${h}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${hour < 12 ? "am" : "pm"}`;
}

// Current minute of the week in Montréal (0 = Sunday 00:00).
function nowInMontreal() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minute: day * 1440 + Number(get("hour")) * 60 + Number(get("minute")) };
}

type Status = { open: true; closes: HoursPeriod["open"] } | { open: false; opens?: HoursPeriod["open"]; today: boolean };

function statusAt(periods: HoursPeriod[], now: number, today: number): Status {
  for (const p of periods) {
    if (!p.close) return { open: true, closes: p.open }; // open 24 hours
    const start = minutesOf(p.open);
    let end = minutesOf(p.close);
    if (end <= start) end += WEEK;
    if ((now >= start && now < end) || (now + WEEK >= start && now + WEEK < end)) return { open: true, closes: p.close };
  }
  const next = periods
    .map((p) => p.open)
    .sort((a, b) => ((minutesOf(a) - now + WEEK) % WEEK) - ((minutesOf(b) - now + WEEK) % WEEK))[0];
  return { open: false, opens: next, today: next?.day === today && minutesOf(next) > now };
}

export function OfficeHoursCard({ hours, locale }: { hours: OfficeHours; locale: Locale }) {
  const h = getDictionary(locale).hours;
  const dayName = (d: number) => {
    const name = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + d)));
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Time-dependent, so computed after hydration.
  const [now, setNow] = useState<{ day: number; minute: number } | null>(null);
  useEffect(() => {
    const tick = () => setNow(nowInMontreal());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const status = now && hours.periods.length ? statusAt(hours.periods, now.minute, now.day) : null;

  return (
    <div className="overflow-hidden rounded-sm bg-cream shadow-lg shadow-brown/5 ring-1 ring-brown/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-gold px-6 pb-4 pt-5">
        <h3 className="font-display text-2xl text-ink">{h.title}</h3>
        {status && (
          <p className="inline-flex items-center gap-2 rounded-full bg-cream-deep px-3 py-1 text-xs font-medium text-brown" role="status">
            <span className={`size-2 rounded-full ${status.open ? "bg-[#4f7a52]" : "bg-brown-soft"}`} />
            {status.open
              ? h.openUntil(formatTime(status.closes.hour, status.closes.minute, locale))
              : status.opens
                ? status.today
                  ? h.opensToday(formatTime(status.opens.hour, status.opens.minute, locale))
                  : h.opensOn(locale === "fr" ? dayName(status.opens.day).toLowerCase() : dayName(status.opens.day), formatTime(status.opens.hour, status.opens.minute, locale))
                : h.closed}
          </p>
        )}
      </div>

      <ul className="divide-y divide-brown/10 border-y border-brown/10 text-sm">
        {MONDAY_FIRST.map((d) => {
          const slots = hours.periods.filter((p) => p.open.day === d);
          const isToday = now?.day === d;
          return (
            <li key={d} className={`flex items-center justify-between gap-4 px-6 py-2.5 ${isToday ? "bg-cream-deep font-medium text-ink" : "text-brown"}`}>
              <span className="flex items-center gap-2">
                {dayName(d)}
                {isToday && <span className="text-[10px] uppercase tracking-[0.2em] text-gold">{h.today}</span>}
              </span>
              <span className={slots.length ? "" : "text-brown-soft"}>
                {slots.length
                  ? slots.map((p) => (p.close ? `${formatTime(p.open.hour, p.open.minute, locale)} – ${formatTime(p.close.hour, p.close.minute, locale)}` : h.allDay)).join(", ")
                  : h.closed}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-brown-soft">
        <span>{h.note}</span>
        <a href={hours.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium uppercase tracking-[0.14em] text-brown transition hover:text-gold">
          <PinIcon className="size-4 text-gold" />
          {h.maps}
        </a>
      </div>
    </div>
  );
}

import type { Showings, Weekday } from "@/data/content";

// Works out the showing times visitors can book: the weekly hours set in the admin, minus days
// off, times already booked and anything too soon. All times are Montréal wall-clock time.

export type DaySlots = { date: string; times: string[] }; // YYYY-MM-DD, ["10:00", "10:30", …]
export type Booked = { date: string; time: string };

const TZ = "America/Montreal";
const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

// Montréal wall-clock time of an instant, as if it were UTC (handy for date arithmetic).
export function wallClock(at: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
}

// The real instant of a Montréal date and time (for calendar invites).
export function montrealToUtc(date: string, time: string): Date {
  const guess = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), Number(time.slice(0, 2)), Number(time.slice(3, 5)));
  return new Date(guess - (wallClock(new Date(guess)) - guess));
}

export function freeSlots(s: Showings, booked: Booked[], now = new Date()): DaySlots[] {
  if (!s.enabled) return [];
  const taken = new Set(booked.map((b) => `${b.date} ${b.time}`));
  const blocked = new Set(s.blocked);
  const nowWall = wallClock(now);
  const earliest = nowWall + s.minNoticeHours * 3600e3;
  const today = new Date(nowWall);
  const days: DaySlots[] = [];
  for (let i = 0; i <= s.daysAhead; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
    const date = d.toISOString().slice(0, 10);
    const hours = s.hours[String(d.getUTCDay()) as Weekday];
    if (!hours || blocked.has(date)) continue;
    const times: string[] = [];
    for (let m = toMinutes(hours.from); m + s.slotMinutes <= toMinutes(hours.to); m += s.slotMinutes) {
      const time = toHhmm(m);
      if (d.getTime() + m * 60e3 >= earliest && !taken.has(`${date} ${time}`)) times.push(time);
    }
    if (times.length) days.push({ date, times });
  }
  return days;
}

// A showing's day and time as words, e.g. "Thursday, October 29, 2026" and "10:30 a.m.".
export function showingWords(date: string, time: string, lang: "fr" | "en") {
  const at = montrealToUtc(date, time);
  const intl = lang === "fr" ? "fr-CA" : "en-CA";
  return {
    date: new Intl.DateTimeFormat(intl, { dateStyle: "full", timeZone: TZ }).format(at),
    time: new Intl.DateTimeFormat(intl, { timeStyle: "short", timeZone: TZ }).format(at),
  };
}

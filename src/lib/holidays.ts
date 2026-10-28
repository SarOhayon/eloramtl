import type { Notice } from "@/data/content";

// Québec holidays, to schedule closure banners ahead of time.

type Holiday = { date: string; fr: string; en: string };
const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);

// Easter Sunday (Gregorian calendar).
function easter(y: number) {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(y, month - 1, day);
}
const plusDays = (t: number, n: number) => new Date(t + n * 864e5).toISOString().slice(0, 10);
// The nth given weekday (0 = Sunday) of a month.
function nthWeekday(y: number, m: number, weekday: number, n: number) {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  return iso(y, m, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}
// The Monday before May 25.
function patriots(y: number) {
  const may24 = new Date(Date.UTC(y, 4, 24));
  return iso(y, 5, 24 - ((may24.getUTCDay() + 6) % 7));
}

function holidaysOf(y: number): Holiday[] {
  const e = easter(y);
  return [
    { date: iso(y, 1, 1), fr: "le jour de l'An", en: "New Year's Day" },
    { date: plusDays(e, -2), fr: "le Vendredi saint", en: "Good Friday" },
    { date: plusDays(e, 1), fr: "le lundi de Pâques", en: "Easter Monday" },
    { date: patriots(y), fr: "la Journée nationale des patriotes", en: "National Patriots' Day" },
    { date: iso(y, 6, 24), fr: "la Fête nationale", en: "Québec's Fête nationale" },
    { date: iso(y, 7, 1), fr: "la fête du Canada", en: "Canada Day" },
    { date: nthWeekday(y, 9, 1, 1), fr: "la fête du Travail", en: "Labour Day" },
    { date: nthWeekday(y, 10, 1, 2), fr: "l'Action de grâce", en: "Thanksgiving" },
    { date: iso(y, 12, 25), fr: "Noël", en: "Christmas" },
  ];
}

// Closure banners for the holidays in the next 12 months, shown from 3 days before until the day.
export function holidayBanners(today: string): Notice[] {
  const y = Number(today.slice(0, 4));
  const yearOut = iso(y + 1, Number(today.slice(5, 7)), Number(today.slice(8, 10)));
  const frDay = new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const enDay = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  return [...holidaysOf(y), ...holidaysOf(y + 1)]
    .filter((h) => h.date >= today && h.date < yearOut)
    .map((h) => {
      const day = new Date(`${h.date}T00:00:00Z`);
      const christmas = h.date.endsWith("-12-25");
      return {
        id: `holiday-${h.date}`,
        enabled: true,
        start: plusDays(day.getTime(), -3),
        end: h.date,
        text: {
          fr: `Notre bureau sera fermé le ${frDay.format(day).replace(/ 1 /, " 1er ")} pour ${h.fr}.${christmas ? " Joyeuses fêtes!" : ""}`,
          en: `Our office will be closed on ${enDay.format(day)} for ${h.en}.${christmas ? " Happy holidays!" : ""}`,
        },
      };
    });
}

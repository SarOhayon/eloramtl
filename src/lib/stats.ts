import { todayInMontreal } from "@/data/content";
import { getFile, putFile } from "./storage";

// Simple visitor numbers: a count per day for each event, one file per month (stats/2026-10.json).
// Counts can miss the odd event when two arrive at the same instant; they're a trend, not an audit.

export const EVENTS = ["visit", "promo", "claim", "whatsapp", "call", "inquiry", "application", "showing", "chat"] as const;
export type StatEvent = (typeof EVENTS)[number];
export type DayCounts = Partial<Record<StatEvent, number>>;
type Month = Record<string, DayCounts>; // "2026-10-27" -> counts

const key = (month: string) => `stats/${month}.json`;

async function readMonth(month: string): Promise<Month> {
  try {
    const raw = await getFile(key(month));
    return raw ? (JSON.parse(raw.toString("utf8")) as Month) : {};
  } catch {
    return {};
  }
}

// One write at a time per server, so events arriving together don't overwrite each other here.
let queue: Promise<unknown> = Promise.resolve();

export function countEvent(event: StatEvent) {
  const run = async () => {
    const day = todayInMontreal();
    const month = day.slice(0, 7);
    const counts = await readMonth(month);
    counts[day] = { ...counts[day], [event]: (counts[day]?.[event] ?? 0) + 1 };
    await putFile(key(month), JSON.stringify(counts), "application/json");
  };
  queue = queue.then(run, run).catch((err) => console.error("[stats] could not count", err));
  return queue;
}

// Counts for the last `days` days, oldest first (days with nothing are included as {}).
export async function recentCounts(days: number): Promise<{ date: string; counts: DayCounts }[]> {
  const today = todayInMontreal();
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const months = [...new Set(dates.map((d) => d.slice(0, 7)))];
  const data = Object.assign({}, ...(await Promise.all(months.map(readMonth)))) as Month;
  return dates.map((date) => ({ date, counts: data[date] ?? {} }));
}

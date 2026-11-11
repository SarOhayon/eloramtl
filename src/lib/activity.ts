import { getFile, putFile } from "./storage";

// A log of what happened with each person, for the daily report: what the team did (status changes,
// check-ins, showings booked, notes…) and what came in by itself (new inquiries, bookings).
export type Activity = { at: string; leadId: string; name: string; what: string; by: "you" | "site" };

const KEY = "activity/log.json";
const MAX = 5000;

export async function readActivity(): Promise<Activity[]> {
  try {
    const raw = await getFile(KEY);
    return raw ? (JSON.parse(raw.toString("utf8")) as Activity[]) : [];
  } catch {
    return [];
  }
}

// Adds entries (newest first). Never throws: the log must not stop the real work.
export async function logActivity(...entries: Omit<Activity, "at">[]) {
  if (!entries.length) return;
  try {
    const at = new Date().toISOString();
    await putFile(KEY, JSON.stringify([...entries.map((e) => ({ at, ...e })), ...(await readActivity())].slice(0, MAX)), "application/json");
  } catch (err) {
    console.error("[activity] could not log", err);
  }
}

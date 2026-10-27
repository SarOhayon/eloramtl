import { UNITS } from "@/data/building";
import { sendFollowUp, sendTeamNotice } from "./autoEmail";
import { getContent } from "./content";
import { changeLeads, readLeads, type Lead } from "./leads";
import { wallClock } from "./showingSlots";
import { recentCounts } from "./stats";
import { getFile, putFile } from "./storage";

// Things the site does on a schedule: follow-up emails after showings, and the Monday 8 a.m. summary.
// There's no scheduler on the hosting, so this runs when someone visits the site or opens the admin
// (at most every 10 minutes), and from /api/cron if an outside scheduler calls it.

const STATE = "jobs/state.json";
type State = { lastRun?: number; lastWeekly?: string };
const EVERY = 10 * 60e3;

async function readState(): Promise<State> {
  try {
    const raw = await getFile(STATE);
    return raw ? (JSON.parse(raw.toString("utf8")) as State) : {};
  } catch {
    return {};
  }
}

export async function runDueJobs({ force = false } = {}) {
  const state = await readState();
  if (!force && state.lastRun && Date.now() - state.lastRun < EVERY) return;
  // Claim this run first, so two visits at once don't both send.
  await putFile(STATE, JSON.stringify({ ...state, lastRun: Date.now() }), "application/json");
  const content = await getContent();
  const leads = await readLeads();

  if (content.emails.followUp.enabled) await sendFollowUps(leads);
  if (content.emails.weekly.enabled) {
    const week = weeklyDue(state.lastWeekly);
    if (week) {
      await sendWeekly(leads);
      await putFile(STATE, JSON.stringify({ ...(await readState()), lastWeekly: week }), "application/json");
    }
  }
}

// Follow-ups due now (and not more than a week late), to people marked as having come.
async function sendFollowUps(leads: Lead[]) {
  const now = Date.now();
  const due = leads.filter((l) => l.showing && l.attendance === "came" && l.status !== "closed" && l.followUp && !l.followUp.sentAt && Date.parse(l.followUp.due) <= now && now - Date.parse(l.followUp.due) < 7 * 864e5);
  const sent = new Set<string>();
  for (const l of due) if (await sendFollowUp(l)) sent.add(l.id);
  if (sent.size) {
    const at = new Date().toISOString();
    await changeLeads((l) => (sent.has(l.id) && l.followUp ? { followUp: { ...l.followUp, sentAt: at } } : null));
  }
}

// This week's Monday (YYYY-MM-DD) if the summary is due: from Monday 8 a.m. (or on Tuesday if
// Monday was missed), and not already sent this week.
function weeklyDue(lastWeekly?: string) {
  const wall = new Date(wallClock(new Date()));
  const dow = (wall.getUTCDay() + 6) % 7; // Monday = 0
  if (dow > 1 || (dow === 0 && wall.getUTCHours() < 8)) return null;
  const monday = new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() - dow)).toISOString().slice(0, 10);
  return lastWeekly === monday ? null : monday;
}

const dayName = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const fmtDay = (d: string) => dayName.format(new Date(`${d}T00:00:00Z`));

async function sendWeekly(leads: Lead[]) {
  const content = await getContent();
  const today = new Date(wallClock(new Date())).toISOString().slice(0, 10);
  const shift = (d: string, n: number) => {
    const x = new Date(`${d}T00:00:00Z`);
    x.setUTCDate(x.getUTCDate() + n);
    return x.toISOString().slice(0, 10);
  };
  const weekAgo = shift(today, -7);
  const weekAhead = shift(today, 7);
  const dayOfIso = (iso: string) => new Date(wallClock(new Date(iso))).toISOString().slice(0, 10);

  const newLeads = leads.filter((l) => dayOfIso(l.createdAt) >= weekAgo);
  const booked = leads.filter((l) => l.showing && l.status !== "closed");
  const coming = booked.filter((l) => l.showing!.date >= today && l.showing!.date < weekAhead).sort((a, b) => `${a.showing!.date}${a.showing!.time}`.localeCompare(`${b.showing!.date}${b.showing!.time}`));
  const lastWeek = booked.filter((l) => l.showing!.date >= weekAgo && l.showing!.date < today);
  const came = lastWeek.filter((l) => l.attendance === "came").length;
  const noShow = lastWeek.filter((l) => l.attendance === "no-show").length;
  const counts = await recentCounts(7);
  const total = (k: "visit" | "whatsapp" | "call") => counts.reduce((n, d) => n + (d.counts[k] ?? 0), 0);
  const available = UNITS.filter((u) => content.suites[u.id]?.status === "available").length;
  const soon = UNITS.filter((u) => content.suites[u.id]?.status === "soon").length;
  const kinds = { inquiry: "inquiry", application: "application", showing: "showing" };

  await sendTeamNotice({
    subject: `Elora weekly summary: ${newLeads.length} new, ${coming.length} showing${coming.length === 1 ? "" : "s"} this week`,
    heading: `Your week at Elora (${fmtDay(today)})`,
    rows: [
      ["New inquiries (last 7 days)", String(newLeads.length)],
      ["Showings this week", String(coming.length)],
      ["Last week's showings", `${lastWeek.length} booked · ${came} came · ${noShow} no-show${lastWeek.length - came - noShow ? ` · ${lastWeek.length - came - noShow} not marked` : ""}`],
      ["Suites", `${available} available · ${soon} coming soon`],
      ["Website (last 7 days)", `${total("visit")} visits · ${total("whatsapp")} WhatsApp · ${total("call")} call clicks`],
    ],
    sections: [
      { title: "Showings this week", lines: coming.map((l) => `${fmtDay(l.showing!.date)} at ${l.showing!.time}: ${l.name} (${l.phone})`) },
      { title: "New this week", lines: newLeads.slice(0, 20).map((l) => `${l.name} · ${kinds[l.kind]}${l.type ? ` · ${l.type}` : ""}${l.moveIn ? ` · move-in ${l.moveIn}` : ""}`) },
    ],
  });
}

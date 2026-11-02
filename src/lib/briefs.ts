import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { aiWarnings } from "./aiAlerts";
import { lookUpAiKey } from "./aiKey";
import { readAiUsage, recordAiUsage, type AiFeature } from "./aiUsage";
import { INBOX_EMAIL, UNITS } from "@/data/building";
import { scheduleState, todayInMontreal, type SiteContent } from "@/data/content";
import { dictionaries } from "@/i18n/dictionaries";
import { sendTeamNotice, type NoticeCard } from "./autoEmail";
import { readChatLog } from "./chatLog";
import { getContent } from "./content";
import { needsFollowUp } from "./followUp";
import { changeLead, readLeads, type Lead } from "./leads";
import { montrealToUtc, wallClock } from "./showingSlots";
import { getFile, putFile } from "./storage";
import { compassWord, sideBearing, sunHours, unitSides } from "./sun";

// The AI's help for the leasing team: the 7:30 a.m. morning brief, the cheat sheet emailed when
// someone checks in for a tour, and suggested FAQ answers for questions the chat couldn't answer.
// Each works without the AI too, just with less in it.

const TYPES = dictionaries.en.types;
const aiReady = () => Boolean(process.env.ANTHROPIC_API_KEY);
const short = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : (s ?? ""));
const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`;
};

// One line per suite open for rent, for the AI and the emails.
function suiteLine(content: SiteContent, id: string) {
  const u = UNITS.find((x) => x.id === id);
  if (!u) return `Suite ${id}`;
  const s = content.suites[id] ?? {};
  const price = s.price ? `$${s.price.toLocaleString("en-CA")}/mo` : `from $${content.prices[u.type].toLocaleString("en-CA")}/mo`;
  const when = s.status === "soon" ? "coming soon" : s.status === "leased" ? "leased" : s.availableOn && s.availableOn > todayInMontreal() ? `free ${s.availableOn}` : "free now";
  const sides = unitSides(u, UNITS);
  const faces = sides.length ? `, faces ${sides.map((x) => compassWord(sideBearing(x, content.sun.topFacing), "en")).join(" & ")} (~${sunHours("winter", sides, content.sun.topFacing).hours} h winter sun)` : "";
  return `Suite ${id}: ${TYPES[u.type]}, ${u.sqft} sq ft, floor ${u.floor}, ${price}, ${when}${faces}`;
}
// The same suite as an email card: "Suite 304 · 3 bedrooms", then price, size, floor, availability.
function suiteCard(content: SiteContent, id: string, why?: string): NoticeCard {
  const u = UNITS.find((x) => x.id === id);
  if (!u) return { title: `Suite ${id}`, note: why };
  const s = content.suites[id] ?? {};
  const price = s.price ? `$${s.price.toLocaleString("en-CA")}/mo` : `from $${content.prices[u.type].toLocaleString("en-CA")}/mo`;
  const when = s.status === "soon" ? "coming soon" : s.status === "leased" ? "leased" : s.availableOn && s.availableOn > todayInMontreal() ? `free ${fmtDay(s.availableOn)}` : "free now";
  const sides = unitSides(u, UNITS);
  const sun = sides.length ? `Faces ${sides.map((x) => compassWord(sideBearing(x, content.sun.topFacing), "en")).join(" & ")} · ~${sunHours("winter", sides, content.sun.topFacing).hours} h of winter sun` : "";
  return { title: `Suite ${id} · ${TYPES[u.type]}`, meta: [price, `${u.sqft.toLocaleString("en-CA")} sq ft`, `floor ${u.floor}`, when].join(" · "), note: [why, sun].filter(Boolean).join(" — ") || undefined };
}
const openSuites = (content: SiteContent) => UNITS.filter((u) => ["available", "soon"].includes(content.suites[u.id]?.status ?? "")).map((u) => u.id);
const unitsFor = (l: Lead) => (l.units?.length ? l.units : (l.suggestion?.picks ?? []).map((p) => p.unit));
const personLine = (l: Lead) =>
  [l.type, l.moveIn && `move-in ${l.moveIn}`, l.source, l.phone].filter(Boolean).join(" · ") + (l.comments ? ` — “${short(l.comments.replace(/\s+/g, " "), 160)}”` : "");

const dayFmt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtDay = (d: string) => dayFmt.format(new Date(`${d}T12:00:00Z`));
// "581 668-1119" for North American numbers; anything else as typed.
const fmtPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  const n = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return n.length === 10 ? `${n.slice(0, 3)} ${n.slice(3, 6)}-${n.slice(6)}` : p.replace(/[^\d+()\s.-]/g, "").trim();
};
// What they wrote, without the admin's own placeholder text.
const theirWords = (l: Lead) => {
  const c = (l.comments ?? "").replace(/\s+/g, " ").trim();
  return c && !/^Added by hand in the admin\.?$/i.test(c) ? short(c, 220) : undefined;
};
const details = (l: Lead) => [l.type, l.moveIn && `Move-in ${fmtDay(l.moveIn)}`, l.phone && fmtPhone(l.phone), l.source].filter(Boolean).join(" · ");

async function ask<T extends z.ZodType>(feature: AiFeature, schema: T, system: string, prompt: string, effort: "low" | "medium"): Promise<z.infer<T> | null> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 6000,
    // If the request is ever declined, the API retries it on a fallback model by itself.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    output_config: { effort, format: betaZodOutputFormat(schema) },
    messages: [{ role: "user", content: prompt }],
  });
  await recordAiUsage(feature, response.usage);
  return response.stop_reason === "refusal" ? null : ((response.parsed_output as z.infer<T> | null) ?? null);
}

// ---------------- Morning brief ----------------

const BRIEF_STATE = "jobs/brief.json";
type BriefState = { lastMorning?: string; facts?: string[]; lastFaq?: string };
async function readBriefState(): Promise<BriefState> {
  try {
    const raw = await getFile(BRIEF_STATE);
    return raw ? (JSON.parse(raw.toString("utf8")) as BriefState) : {};
  } catch {
    return {};
  }
}
const saveBriefState = async (patch: BriefState) => putFile(BRIEF_STATE, JSON.stringify({ ...(await readBriefState()), ...patch }), "application/json");

// Today (YYYY-MM-DD) if the brief is due: from 7:30 a.m. until noon, once a day.
export async function morningDue(): Promise<string | null> {
  const wall = new Date(wallClock(new Date()));
  const minutes = wall.getUTCHours() * 60 + wall.getUTCMinutes();
  const today = wall.toISOString().slice(0, 10);
  if (minutes < 7 * 60 + 30 || minutes >= 12 * 60) return null;
  return (await readBriefState()).lastMorning === today ? null : today;
}

const BriefAI = z.object({
  picks: z.array(z.object({ lead: z.string().describe("The lead's id from the list."), units: z.array(z.string()).describe("Up to 3 suite numbers from the list of suites, best first."), why: z.string().describe("Under 15 words: why these fit.") })),
  funFact: z.string().describe("A fun, true, surprising fact of the day in 1-2 sentences, upbeat. Vary the topic (Montréal, architecture, homes and design, nature, food, history, science)."),
});

export async function sendMorningBrief(today: string) {
  await saveBriefState({ lastMorning: today }); // claim it first, so two visits don't both send
  const [content, leads, state] = await Promise.all([getContent(), readLeads(), readBriefState()]);
  const now = Date.now();
  const showings = leads.filter((l) => l.showing?.date === today && l.status !== "closed").sort((a, b) => a.showing!.time.localeCompare(b.showing!.time));
  const fresh = leads.filter((l) => now - Date.parse(l.createdAt) < 24 * 3600e3 && !l.showing).slice(0, 15);
  const follow = leads.filter((l) => needsFollowUp(l, now)).slice(0, 15);
  const open = openSuites(content);

  let ai: z.infer<typeof BriefAI> | null = null;
  if (aiReady()) {
    const needPicks = [...showings.filter((l) => !unitsFor(l).length), ...fresh.filter((l) => !unitsFor(l).length)];
    const prompt = [
      `Today is ${today}.`,
      `Suites open for rent:\n${open.map((id) => `- ${suiteLine(content, id)}`).join("\n") || "- none"}`,
      `People who need suite suggestions:\n${needPicks.map((l) => `- id ${l.id}: ${l.name}, ${personLine(l)}`).join("\n") || "- none"}`,
      `Fun facts already used recently (don't repeat): ${(state.facts ?? []).slice(-20).join(" | ") || "none"}`,
    ].join("\n\n");
    ai = await ask("brief", BriefAI, "You help the leasing agent of Elora MTL, a rental building in Montréal, start the day. Suggest suites only from the list given, weighing budget, move-in date and size. Be brief and practical.", prompt, "low").catch((err) => {
      console.error("[brief] AI failed", err);
      return null;
    });
  }
  // A person as a card: the suites you picked ("Show"), or the AI's ("Suggested", with why).
  const card = (l: Lead, title: string): NoticeCard => {
    const own = unitsFor(l);
    const p = own.length ? null : ai?.picks.find((x) => x.lead === l.id);
    const suggested = (p?.units ?? []).filter((id) => open.includes(id));
    return {
      title,
      meta: details(l) || undefined,
      ...(own.length ? { tagsLabel: "Show", tags: own } : suggested.length ? { tagsLabel: "Suggested", tags: suggested, note: p!.why } : {}),
      quote: theirWords(l),
    };
  };
  const since = (l: Lead) => Math.floor((now - Date.parse(l.statusAt ?? l.createdAt)) / 864e5);

  const date = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${today}T00:00:00Z`));
  const keyInfo = await lookUpAiKey();
  const heads = aiWarnings(content.ai, await readAiUsage(), keyInfo.key ? keyInfo.key.expiresAt : content.ai.keyExpires, now);
  await sendTeamNotice({
    subject: `☀️ Your day at Elora: ${showings.length} showing${showings.length === 1 ? "" : "s"}, ${fresh.length} new lead${fresh.length === 1 ? "" : "s"}`,
    heading: `Good morning! ${date}`,
    rows: [
      ["Showings today", String(showings.length)],
      ["New leads (last 24 h)", String(fresh.length)],
      ["To follow up", String(follow.length)],
      ["Suites open", `${open.length}`],
    ],
    note: ai?.funFact ? `🎉 Fun fact of the day\n${ai.funFact}` : undefined,
    sections: [
      ...(heads.length ? [{ title: "⚠️ Heads-up", lines: heads }] : []),
      { title: "Today's showings", cards: showings.map((l) => card(l, `${clock(l.showing!.time)} · ${l.name}`)), empty: "No showings today." },
      { title: "New leads", cards: fresh.map((l) => card(l, l.name)), empty: "No new leads since yesterday." },
      {
        title: "Time to follow up",
        cards: follow.map((l) => ({ title: l.name, meta: [`${l.status[0].toUpperCase()}${l.status.slice(1)} · ${since(l)} days without an update`, l.phone ? fmtPhone(l.phone) : l.email].filter(Boolean).join(" · ") })),
        empty: "Nobody waiting. 🙌",
      },
    ],
  });
  if (ai?.funFact) await saveBriefState({ facts: [...(state.facts ?? []), ai.funFact].slice(-40) });
}

// ---------------- Pre-tour cheat sheet ----------------

const SheetAI = z.object({
  summary: z.string().describe("2 sentences: who this person is and what they want."),
  facts: z.array(z.object({ label: z.string(), value: z.string() })).describe("Key facts from what they wrote: budget, move-in, household/occupants, pets, parking, work from home, must-haves. Only what is known; 'Not mentioned' is fine."),
  units: z.array(z.object({ unit: z.string(), why: z.string().describe("Under 15 words.") })).describe("The suites to show, best first, from the list given."),
  talkingPoints: z.array(z.string()).describe("2 short talking points for the tour, tailored to this person."),
});

export type CheatSheetResult = { sent: boolean; to?: string; reason?: string };

// Emailed to the leasing inbox the moment someone is checked in ("Came") for their showing, or any
// time from the "Email me the cheat sheet" button (`manual`).
export async function sendCheatSheet(leadId: string, { manual = false } = {}): Promise<CheatSheetResult> {
  const [content, leads] = await Promise.all([getContent(), readLeads()]);
  const l = leads.find((x) => x.id === leadId);
  if (!l?.showing) return { sent: false, reason: "This inquiry has no showing." };
  if (!manual) {
    if (!content.emails.cheatSheet.enabled) return { sent: false, reason: "Cheat sheets are turned off (Automatic emails)." };
    if (l.attendance !== "came" || l.cheatSheetAt) return { sent: false };
    const start = montrealToUtc(l.showing.date, l.showing.time).getTime();
    // Checking someone in long after the tour (catching up) doesn't send one; the button still can.
    if (Math.abs(Date.now() - start) > 3 * 3600e3) return { sent: false, reason: "Not sent automatically: the showing isn’t within 3 hours of now." };
  }

  const chosen = unitsFor(l);
  const candidates = chosen.length ? chosen : openSuites(content);
  let ai: z.infer<typeof SheetAI> | null = null;
  if (aiReady()) {
    const promo = scheduleState(content.promo) === "live" ? `${content.promo.kicker.en} ${content.promo.big.en} ${content.promo.sub.en}` : "none";
    const prompt = [
      `The person:\nName: ${l.name}\nSuite type asked for: ${l.type || "not specified"}\nMove-in: ${l.moveIn || "not specified"}\nSource: ${l.source || "website"}\nTheir message: ${l.comments || "(none)"}\nLeasing agent's note: ${l.note || "(none)"}`,
      `${chosen.length ? "Suites the agent picked to show" : "Suites open for rent (pick up to 3)"}:\n${candidates.map((id) => `- ${suiteLine(content, id)}`).join("\n")}`,
      `Current promotion: ${promo}.`,
    ].join("\n\n");
    ai = await ask("cheatSheet", SheetAI, "You prepare a one-glance cheat sheet for the leasing agent of Elora MTL, a new rental building in Montréal, right before a tour. Use only the facts given; never invent details. Be brief.", prompt, "low").catch((err) => {
      console.error("[cheat sheet] AI failed", err);
      return null;
    });
  }
  const units = ai?.units.length ? ai.units.filter((u) => candidates.includes(u.unit)) : chosen.map((unit) => ({ unit, why: "" }));
  const sent = await sendTeamNotice({
    subject: `Tour now: ${l.name} at ${clock(l.showing.time)}${units.length ? ` · show ${units.map((u) => u.unit).join(", ")}` : ""}`,
    heading: `${l.name} is here for their ${clock(l.showing.time)} tour`,
    rows: [
      ...(ai?.facts.length ? ai.facts.map((f) => [f.label, f.value] as [string, string]) : [["Suite type", l.type || "Not sure"] as [string, string], ["Move-in", l.moveIn ? fmtDay(l.moveIn) : "Not given"] as [string, string]]),
      ...(l.phone ? [["Phone", fmtPhone(l.phone)] as [string, string]] : []),
    ],
    note: ai?.summary ?? theirWords(l),
    sections: [
      { title: "Suites to show", cards: units.map((u) => suiteCard(content, u.unit, u.why || undefined)), empty: "No suites picked: add “Units to show them” on their card." },
      ...(ai?.talkingPoints.length ? [{ title: "Talking points", lines: ai.talkingPoints }] : []),
      ...(l.note ? [{ title: "Your note", lines: [l.note] }] : []),
    ],
  });
  const to = process.env.MAIL_TO || INBOX_EMAIL;
  if (!sent) return { sent: false, reason: `The email to ${to} couldn't be sent. Check the email settings.` };
  await changeLead(l.id, { cheatSheetAt: new Date().toISOString() });
  return { sent: true, to };
}

// ---------------- FAQ helper ----------------

const SUGGESTIONS = "faq/suggestions.json";
export type FaqSuggestion = { id: string; at: string; q: { fr: string; en: string }; a: { fr: string; en: string }; from: { at: string; question: string }[] };

export async function readFaqSuggestions(): Promise<FaqSuggestion[]> {
  try {
    const raw = await getFile(SUGGESTIONS);
    return raw ? (JSON.parse(raw.toString("utf8")) as FaqSuggestion[]) : [];
  } catch {
    return [];
  }
}
export const saveFaqSuggestions = (list: FaqSuggestion[]) => putFile(SUGGESTIONS, JSON.stringify(list), "application/json");

const FaqAI = z.object({
  items: z.array(
    z.object({
      questions: z.array(z.number()).describe("Numbers of the visitor questions this entry answers."),
      qEn: z.string(),
      qFr: z.string(),
      aEn: z.string().describe("1-3 sentences. Only facts from the information given; where something must be checked, write [to confirm: …]."),
      aFr: z.string().describe("Same answer in Québec French."),
    }),
  ),
});

// Drafts FAQ entries for the questions the chat couldn't answer (not already drafted). Returns how many.
export async function suggestFaqAnswers(): Promise<number> {
  if (!aiReady()) return 0;
  const [content, log, existing] = await Promise.all([getContent(), readChatLog(), readFaqSuggestions()]);
  const drafted = new Set(existing.flatMap((s) => s.from.map((f) => f.at)));
  const open = log.filter((e) => !e.answered && !drafted.has(e.at)).slice(0, 40);
  if (!open.length) return 0;
  const faq = content.faq.items.map((f) => `Q: ${f.q.en}\nA: ${f.a.en}`).join("\n\n");
  const prompt = [
    `Visitor questions the chat couldn't answer:\n${open.map((e, i) => `${i + 1}. ${e.question}`).join("\n")}`,
    `What the building's FAQ already says:\n${faq || "(empty)"}`,
    `Suites open for rent:\n${openSuites(content).map((id) => `- ${suiteLine(content, id)}`).join("\n") || "- none"}`,
  ].join("\n\n");
  const out = await ask(
    "faq",
    FaqAI,
    "You help the leasing team of Elora MTL, a new rental building at 2855 chemin Bates in Montréal, grow the FAQ that their website chat answers from. Group similar visitor questions into one entry (skip spam, off-topic or questions the FAQ already answers well). Write a clear question and a short answer in English and Québec French. Never invent policies, prices or facts: where the team must fill something in, write [to confirm: …] so they can edit before approving.",
    prompt,
    "medium",
  );
  if (!out?.items.length) return 0;
  const at = new Date().toISOString();
  const fresh: FaqSuggestion[] = out.items.map((it, i) => ({
    id: `sug-${Date.now()}-${i}`,
    at,
    q: { en: it.qEn, fr: it.qFr },
    a: { en: it.aEn, fr: it.aFr },
    from: it.questions.map((n) => open[n - 1]).filter(Boolean).map((e) => ({ at: e.at, question: e.question })),
  }));
  await saveFaqSuggestions([...fresh, ...existing].slice(0, 40));
  return fresh.length;
}

// Monday: once a week, alongside the weekly summary.
export async function weeklyFaqDue(monday: string) {
  return (await readBriefState()).lastFaq !== monday;
}
export const markWeeklyFaq = (monday: string) => saveBriefState({ lastFaq: monday });

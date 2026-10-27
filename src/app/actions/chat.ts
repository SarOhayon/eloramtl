"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { headers } from "next/headers";
import { z } from "zod";
import { ADDRESS, PHONE_MAIN_DISPLAY, UNITS } from "@/data/building";
import { scheduleState, todayInMontreal } from "@/data/content";
import { dictionaries } from "@/i18n/dictionaries";
import { isAdmin } from "@/lib/adminAuth";
import { readChatLog, removeChat, logChat, type ChatEntry } from "@/lib/chatLog";
import { getContent } from "@/lib/content";
import { getOfficeHours } from "@/lib/officeHours";
import { countEvent, recentCounts } from "@/lib/stats";

// The website's chat assistant: answers from the FAQ written in the admin plus live facts (suites
// available, prices, promotion, hours). Uses Claude; needs ANTHROPIC_API_KEY.

export type ChatTurn = { role: "user" | "assistant"; text: string };
export type ChatAction = "none" | "book" | "contact" | "apply";
export type ChatResult = { ok: true; reply: string; action: ChatAction } | { ok: false; error: "off" | "busy" | "limit" | "failed" };

const Reply = z.object({
  reply: z.string().describe("The answer to show the visitor: short, friendly, in the visitor's language. Plain text, no markdown."),
  action: z
    .enum(["none", "book", "contact", "apply"])
    .describe("A button to show under the answer: book = book a showing, contact = send a question to the leasing team, apply = apply now, none = no button."),
  answered: z.boolean().describe("false if the FAQ and facts didn't contain the answer."),
});

const MAX_TURNS = 12; // visitor messages per conversation
const MAX_CHARS = 600; // per message
const PER_IP = 30; // messages per visitor per hour
const PER_DAY = 600; // messages per day for the whole site (keeps the cost bounded)

// Best effort per-visitor limit (resets when the server restarts).
const recent = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < 3600e3);
  list.push(now);
  recent.set(ip, list);
  if (recent.size > 5000) recent.clear();
  return list.length > PER_IP;
}

export async function askElora(history: ChatTurn[], lang: "fr" | "en"): Promise<ChatResult> {
  const content = await getContent();
  if (!content.faq.enabled || !process.env.ANTHROPIC_API_KEY) return { ok: false, error: "off" };
  lang = lang === "fr" ? "fr" : "en";

  // Only keep a clean, short conversation that starts and ends with the visitor.
  const turns = (Array.isArray(history) ? history : [])
    .filter((t) => (t?.role === "user" || t?.role === "assistant") && typeof t.text === "string" && t.text.trim())
    .slice(-2 * MAX_TURNS)
    .map((t) => ({ role: t.role, text: t.text.trim().slice(0, MAX_CHARS) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  const question = turns.at(-1);
  if (!question || question.role !== "user") return { ok: false, error: "failed" };
  if (turns.filter((t) => t.role === "user").length > MAX_TURNS) return { ok: false, error: "limit" };

  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (tooMany(ip)) return { ok: false, error: "busy" };
  const [today] = await recentCounts(1);
  if ((today?.counts.chat ?? 0) >= PER_DAY) return { ok: false, error: "busy" };

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      // If the request is ever declined, the API retries it on a fallback model by itself.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      system: await systemPrompt(),
      output_config: { effort: "low", format: betaZodOutputFormat(Reply) },
      messages: turns.map((t) => ({ role: t.role, content: t.text })),
    });
    const out = response.parsed_output;
    if (response.stop_reason === "refusal" || !out) return { ok: false, error: "failed" };
    await Promise.all([
      countEvent("chat"),
      logChat({ at: new Date().toISOString(), lang, question: question.text, reply: out.reply, answered: out.answered }),
    ]);
    return { ok: true, reply: out.reply, action: out.action };
  } catch (err) {
    console.error("[chat] failed", err);
    return { ok: false, error: err instanceof Anthropic.RateLimitError ? "busy" : "failed" };
  }
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

// The rules, the FAQ and today's facts. Built from the admin's content, so edits apply right away.
async function systemPrompt() {
  const content = await getContent();
  const types = dictionaries.en.types;
  const faq = content.faq.items
    .filter((f) => (f.q.en || f.q.fr) && (f.a.en || f.a.fr))
    .map((f) => `Q (EN): ${f.q.en}\nQ (FR): ${f.q.fr}\nA (EN): ${f.a.en}\nA (FR): ${f.a.fr}`)
    .join("\n\n");
  const open = UNITS.filter((u) => ["available", "soon"].includes(content.suites[u.id]?.status ?? ""));
  const suites = open
    .map((u) => {
      const s = content.suites[u.id] ?? {};
      const price = s.price ? `$${s.price}/month` : `from $${content.prices[u.type]}/month`;
      const when = s.status === "soon" ? "coming soon" : s.availableOn && s.availableOn > todayInMontreal() ? `free from ${s.availableOn}` : "free now";
      return `- Suite ${u.id}: ${types[u.type]}, ${u.beds} bed / ${u.baths} bath, ${u.sqft} sq ft, floor ${u.floor}, ${price}, ${when}`;
    })
    .join("\n");
  const p = content.promo;
  const promo = scheduleState(p) === "live" ? `${p.kicker.en} ${p.big.en} ${p.sub.en}${p.fine.en ? ` (${p.fine.en})` : ""}${p.end ? `, until ${p.end}` : ""}` : "none right now";
  const hours = (await getOfficeHours()).periods.map((x) => `${DAYS[x.open.day]} ${hhmm(x.open.hour, x.open.minute)}-${x.close ? hhmm(x.close.hour, x.close.minute) : "?"}`).join(", ");

  return `You are the assistant on the website of Elora MTL, a new rental building at ${ADDRESS}. You answer visitors' questions about the building, the suites and the neighbourhood, in a warm, brief, professional way.

Rules:
- Answer only from the FAQ and the facts below. If they don't contain the answer, say you don't have that information and offer to pass the question to the leasing team (action "contact"); set answered to false. Never guess or invent details, prices, policies or availability.
- Never promise anything that isn't written below (discounts, approvals, exceptions, legal or lease terms). For those, offer the leasing team.
- Answer in the language the visitor writes in (French or English). Keep answers to 1-3 short sentences, plain text without markdown.
- When someone shows interest in visiting, suggest booking a showing (action "book"). When they want to rent, "apply". Otherwise "none", unless the leasing team is needed ("contact").
- Stay on topic. If asked about unrelated things, politely bring the conversation back to Elora.

Contact: phone and WhatsApp ${PHONE_MAIN_DISPLAY}. Office hours: ${hours || "by appointment"} (evenings and weekends by appointment).
Today is ${todayInMontreal()}.

Suites available now or soon (other suites are rented):
${suites || "- none listed right now; the leasing team can tell them about upcoming availability"}
Starting prices by type: ${Object.entries(content.prices).map(([k, v]) => `${types[k as keyof typeof types]} from $${v}/month`).join(", ")}.
Current promotion: ${promo}.

FAQ:
${faq}`;
}

// ---- Admin ----

export async function chatStatus(): Promise<{ aiReady: boolean } | null> {
  if (!(await isAdmin())) return null;
  return { aiReady: Boolean(process.env.ANTHROPIC_API_KEY) };
}

export async function listChats(): Promise<ChatEntry[] | null> {
  if (!(await isAdmin())) return null;
  return readChatLog();
}

export async function dismissChat(at: string): Promise<ChatEntry[] | null> {
  if (!(await isAdmin())) return null;
  return removeChat(String(at));
}

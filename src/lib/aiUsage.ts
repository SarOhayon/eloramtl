import { getFile, putFile } from "./storage";

// What the AI features cost, counted by the site itself from each answer's token usage, since
// Anthropic doesn't share the credit balance with an ordinary key. Prices are Claude Opus 5.5's
// ($4 in, $20 out, $0.20 cache reads, $5 cache writes per million tokens), so this is a close
// estimate; the Anthropic Console has the exact figure.

export type AiFeature = "chat" | "suggest" | "leads" | "brief" | "cheatSheet" | "faq" | "test";
type Usage = { input_tokens?: number | null; output_tokens?: number | null; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };
export type AiUsageDay = { date: string; cost: number; calls: number; byFeature: Partial<Record<AiFeature, number>> };

const KEY = "ai/usage.json";
const PER_TOKEN = { input: 4e-6, output: 20e-6, cacheRead: 0.2e-6, cacheWrite: 5e-6 };

export const costOf = (u: Usage) =>
  (u.input_tokens ?? 0) * PER_TOKEN.input +
  (u.output_tokens ?? 0) * PER_TOKEN.output +
  (u.cache_read_input_tokens ?? 0) * PER_TOKEN.cacheRead +
  (u.cache_creation_input_tokens ?? 0) * PER_TOKEN.cacheWrite;

export async function readAiUsage(): Promise<AiUsageDay[]> {
  try {
    const raw = await getFile(KEY);
    return raw ? (JSON.parse(raw.toString("utf8")) as AiUsageDay[]) : [];
  } catch {
    return [];
  }
}

// Adds one AI call to today's total (kept per day, for the last 400 days). Never throws.
export async function recordAiUsage(feature: AiFeature, usage: Usage | null | undefined) {
  if (!usage) return;
  try {
    const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/Montreal" });
    const days = await readAiUsage();
    const cost = costOf(usage);
    const day = days.find((d) => d.date === date) ?? { date, cost: 0, calls: 0, byFeature: {} };
    day.cost += cost;
    day.calls += 1;
    day.byFeature[feature] = (day.byFeature[feature] ?? 0) + cost;
    const rest = days.filter((d) => d.date !== date);
    await putFile(KEY, JSON.stringify([day, ...rest].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 400)), "application/json");
  } catch (err) {
    console.error("[ai usage] could not record", err);
  }
}

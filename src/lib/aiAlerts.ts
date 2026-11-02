import { AI_LOW_CREDIT, KEY_EXPIRY_WARN_DAYS, type AiAccount } from "@/data/content";

// Shared by the admin and the morning brief (safe in the browser): what's left of the AI credit,
// and warnings when it runs low or the key is about to expire.
export type UsageDay = { date: string; cost: number; byFeature: Partial<Record<string, number>> };

export const spentSince = (days: UsageDay[], from: string) => days.filter((d) => d.date >= from).reduce((n, d) => n + d.cost, 0);

export function creditLeft(ai: AiAccount, days: UsageDay[]) {
  if (!ai.credits.length) return null;
  const bought = ai.credits.reduce((n, c) => n + c.amount, 0);
  const from = ai.credits.map((c) => c.date).sort()[0];
  return bought - spentSince(days, from);
}

export const daysUntil = (date: string, now: number) => Math.ceil((Date.parse(`${date}T23:59:59-05:00`) - now) / 864e5);

export function aiWarnings(ai: AiAccount, days: UsageDay[], expires: string | null | undefined, now: number): string[] {
  const out: string[] = [];
  const left = creditLeft(ai, days);
  if (left !== null && left < AI_LOW_CREDIT) out.push(left <= 0 ? "Your AI credit has probably run out: the chat and AI features will stop. Add credit at console.anthropic.com." : `AI credit is low: about $${left.toFixed(2)} left. Add credit at console.anthropic.com.`);
  if (expires) {
    const d = daysUntil(expires.slice(0, 10), now);
    if (d < 0) out.push("The AI key has expired: create a new one at console.anthropic.com and put it in Amplify.");
    else if (d <= KEY_EXPIRY_WARN_DAYS) out.push(`The AI key expires in ${d} day${d === 1 ? "" : "s"} (${expires.slice(0, 10)}). Create a new one before then.`);
  }
  return out;
}

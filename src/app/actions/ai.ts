"use server";

import { isAdmin } from "@/lib/adminAuth";
import { lookUpAiKey, type AiKeyInfo } from "@/lib/aiKey";
import { readAiUsage, type AiUsageDay } from "@/lib/aiUsage";

export type AiAccountInfo = { days: AiUsageDay[]; keySet: boolean; adminKey: boolean; key?: AiKeyInfo; keyError?: string };

// What the AI features spent (counted by the site), and, with the optional admin key, the website
// key's real expiry date and status from Anthropic.
export async function aiAccount(): Promise<AiAccountInfo | null> {
  if (!(await isAdmin())) return null;
  const [days, { key, error }] = await Promise.all([readAiUsage(), lookUpAiKey()]);
  return { days, keySet: Boolean(process.env.ANTHROPIC_API_KEY), adminKey: Boolean(process.env.ANTHROPIC_ADMIN_KEY), key, keyError: error };
}

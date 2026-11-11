import Anthropic from "@anthropic-ai/sdk";

export type AiKeyInfo = { name: string; status: string; expiresAt: string | null; createdAt: string };

// The website key's name, status and expiry date, read from Anthropic with the optional admin key
// (ANTHROPIC_ADMIN_KEY). Anthropic only shows part of each key, e.g. "sk-ant-api03-R2D...igAA".
export async function lookUpAiKey(): Promise<{ key?: AiKeyInfo; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
  if (!adminKey || !apiKey) return {};
  const matches = (hint: string | null) => {
    if (!hint) return false;
    const [start, end] = hint.split(/\.{2,}|…/);
    return Boolean(start && end && apiKey.startsWith(start) && apiKey.endsWith(end));
  };
  try {
    for await (const k of new Anthropic({ apiKey: adminKey }).beta.organization.apiKeys.list({ limit: 100 })) {
      if (matches(k.partial_key_hint)) return { key: { name: k.name, status: k.status, expiresAt: k.expires_at, createdAt: k.created_at } };
    }
    return { error: "The admin key works, but the website's key wasn't found in this organization." };
  } catch (err) {
    console.error("[ai] key lookup", err);
    return { error: err instanceof Anthropic.AuthenticationError ? "The admin key isn't valid." : "Couldn't reach Anthropic to check the key." };
  }
}

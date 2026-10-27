"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { UNITS } from "@/data/building";
import { todayInMontreal, scheduleState } from "@/data/content";
import { dictionaries } from "@/i18n/dictionaries";
import { isAdmin } from "@/lib/adminAuth";
import { getContent } from "@/lib/content";
import { changeLead, readLeads, type Lead } from "@/lib/leads";

// Suggests the best available suites for an inquiry, using Claude. Needs ANTHROPIC_API_KEY.

const Answer = z.object({
  summary: z.string().describe("One sentence: what this person is looking for, from everything they wrote."),
  picks: z
    .array(z.object({ unit: z.string().describe("A suite number from the list, e.g. \"503\"."), reason: z.string().describe("One short sentence on why it fits.") }))
    .describe("Up to 3 suites from the list, best first."),
  ask: z.string().describe("One question the leasing team could ask to narrow it down, or an empty string."),
});

const SYSTEM = `You help the leasing team of Elora MTL, a new rental building at 2855 chemin Bates in Montréal, match people who sent an inquiry with the right apartment.

Pick up to 3 suites from the list of suites currently available, best fit first. Use only suite numbers from that list. Weigh, in this order: budget (monthly rent), when they need to move in compared with when the suite is free, the size or type they asked for (bedrooms, den for working from home, space for a family or roommates), then anything else they mention. A suite on promotion is a plus when it fits. If nothing fits well, still give the closest options and say plainly in the summary what doesn't match.

Write for the leasing agent, in English, short and practical. Don't invent facts about suites beyond what the list says.`;

export type SuggestResult = { ok: true; leads: Lead[] } | { ok: false; error: string };

export async function suggestUnits(leadId: string): Promise<SuggestResult> {
  if (!(await isAdmin())) return { ok: false, error: "Please sign in again." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "The AI isn't set up yet: add ANTHROPIC_API_KEY in Amplify and redeploy." };

  const lead = (await readLeads()).find((l) => l.id === leadId);
  if (!lead) return { ok: false, error: "This inquiry no longer exists." };

  const content = await getContent();
  const promo = scheduleState(content.promo) === "live" ? content.promo : null;
  const types = dictionaries.en.types;
  const open = UNITS.filter((u) => ["available", "soon"].includes(content.suites[u.id]?.status ?? ""));
  if (!open.length) return { ok: false, error: "No suites are marked Available or Coming soon right now." };

  const suiteList = open
    .map((u) => {
      const s = content.suites[u.id] ?? {};
      const price = s.price ? `$${s.price}/month` : `from $${content.prices[u.type]}/month`;
      const when = s.status === "soon" ? "coming soon" : s.availableOn && s.availableOn > todayInMontreal() ? `free from ${s.availableOn}` : "free now";
      const onPromo = promo && (promo.types.includes(u.type) || promo.suites.includes(u.id)) ? `, on promotion (${promo.kicker.en} ${promo.big.en})` : "";
      return `- Suite ${u.id}: ${types[u.type]}, ${u.beds} bed / ${u.baths} bath, ${u.sqft} sq ft, floor ${u.floor}, ${price}, ${when}${onPromo}`;
    })
    .join("\n");

  const person = [
    `Name: ${lead.name}`,
    `Form: ${lead.kind}`,
    `Suite type asked for: ${lead.type || "not specified"}`,
    `Move-in date: ${lead.moveIn || "not specified"}`,
    `Comments: ${lead.comments || "(none)"}`,
    lead.note ? `Leasing team's note: ${lead.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      // If the request is ever declined, the API retries it on a fallback model by itself.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "medium", format: betaZodOutputFormat(Answer) },
      messages: [{ role: "user", content: `Today is ${todayInMontreal()}.\n\nSuites available:\n${suiteList}\n\nThe person:\n${person}` }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return { ok: false, error: "The AI couldn't make a suggestion for this one." };

    const ids = new Set(open.map((u) => u.id));
    const answer = response.parsed_output;
    const leads = await changeLead(lead.id, {
      suggestion: {
        at: new Date().toISOString(),
        summary: answer.summary,
        picks: answer.picks.filter((p) => ids.has(p.unit.replace(/\D/g, ""))).slice(0, 3).map((p) => ({ unit: p.unit.replace(/\D/g, ""), reason: p.reason })),
        ask: answer.ask,
      },
    });
    return leads ? { ok: true, leads } : { ok: false, error: "Couldn't save the suggestion." };
  } catch (err) {
    console.error("[suggest] failed", err);
    if (err instanceof Anthropic.AuthenticationError) return { ok: false, error: "The AI key isn't valid. Check ANTHROPIC_API_KEY in Amplify." };
    if (err instanceof Anthropic.RateLimitError) return { ok: false, error: "The AI is busy. Try again in a minute." };
    return { ok: false, error: "The AI didn't answer. Try again in a moment." };
  }
}

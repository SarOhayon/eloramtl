"use client";

import { useEffect, useState } from "react";
import { aiAccount, type AiAccountInfo } from "@/app/actions/ai";
import { AI_LOW_CREDIT, todayInMontreal, type SiteContent } from "@/data/content";
import { aiWarnings, creditLeft, daysUntil, spentSince } from "@/lib/aiAlerts";
import { AlertIcon, ExternalIcon, PlusIcon, SparkleIcon, TrashIcon } from "./AdminIcons";
import { ScreenTitle, Step, field, softBtn, useNow, type Update } from "./ui";

const FEATURES: Record<string, string> = {
  chat: "Website chat",
  suggest: "Suggest the best suites",
  leads: "Leads from your email",
  brief: "Morning brief",
  cheatSheet: "Cheat sheets",
  faq: "FAQ suggestions",
  test: "Tests",
};
const money = (n: number) => `$${n.toFixed(2)}`;
const longDate = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });
const fmtDate = (d: string) => longDate.format(new Date(`${d.slice(0, 10)}T12:00:00Z`));

// The AI credit: what's left (credit bought minus what the site counted), what each feature costs,
// and when the key expires.
export function AiScreen({ content, update }: { content: SiteContent; update: Update }) {
  const ai = content.ai;
  const [info, setInfo] = useState<AiAccountInfo | null>(null);
  const [buy, setBuy] = useState({ date: todayInMontreal(), amount: "" });
  const now = useNow();
  useEffect(() => {
    aiAccount().then(setInfo);
  }, []);
  const set = (patch: Partial<SiteContent["ai"]>) => update((c) => ({ ...c, ai: { ...c.ai, ...patch } }));

  const days = info?.days ?? [];
  const today = todayInMontreal();
  const left = creditLeft(ai, days);
  const month = spentSince(days, `${today.slice(0, 7)}-01`);
  const monthBy = days.filter((d) => d.date >= `${today.slice(0, 7)}-01`).reduce<Record<string, number>>((acc, d) => {
    for (const [k, v] of Object.entries(d.byFeature)) acc[k] = (acc[k] ?? 0) + (v ?? 0);
    return acc;
  }, {});
  const last30 = spentSince(days, new Date(now - 30 * 864e5).toISOString().slice(0, 10));
  const expires = info?.key ? info.key.expiresAt : ai.keyExpires;
  const warnings = aiWarnings(ai, days, expires, now);

  return (
    <>
      <ScreenTitle
        icon={<SparkleIcon className="size-5" />}
        title="AI credit"
        help="The chat, suite suggestions, lead emails, morning brief, cheat sheets and FAQ suggestions use AI credit bought from Anthropic. The site counts what each use costs, so you can see what’s left. It’s a close estimate; console.anthropic.com shows the exact balance."
      />
      {warnings.map((w) => (
        <p key={w} className="mb-4 flex items-start gap-2 rounded-md bg-[#f4e1df] px-4 py-3 text-red-900">
          <AlertIcon className="mt-0.5 size-5 shrink-0" /> {w}
        </p>
      ))}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={`rounded-lg p-5 ring-1 ${left !== null && left < AI_LOW_CREDIT ? "bg-[#f4e1df] ring-red-200" : "bg-cream ring-sand"}`}>
          <p className="text-sm text-brown-soft">Credit left (estimate)</p>
          <p className="mt-1 font-display text-4xl text-ink">{left === null ? "—" : money(Math.max(0, left))}</p>
          {left === null && <p className="mt-1 text-sm text-brown-soft">Add what you bought below.</p>}
        </div>
        <div className="rounded-lg bg-cream p-5 ring-1 ring-sand">
          <p className="text-sm text-brown-soft">Spent this month</p>
          <p className="mt-1 font-display text-4xl text-ink">{info ? money(month) : "…"}</p>
          <p className="mt-1 text-sm text-brown-soft">Last 30 days: {info ? money(last30) : "…"}</p>
        </div>
        <div className={`rounded-lg p-5 ring-1 ${expires && daysUntil(expires.slice(0, 10), now) <= 14 ? "bg-[#f4e1df] ring-red-200" : "bg-cream ring-sand"}`}>
          <p className="text-sm text-brown-soft">AI key expires</p>
          <p className="mt-1 font-display text-3xl text-ink">{info?.key ? (expires ? fmtDate(expires) : "Never") : expires ? fmtDate(expires) : "—"}</p>
          <p className="mt-1 text-sm text-brown-soft">
            {expires ? `${Math.max(0, daysUntil(expires.slice(0, 10), now))} days left` : info?.key ? "This key doesn’t expire." : "Set the date below."}
            {info?.key && info.key.status !== "active" ? ` · Status: ${info.key.status}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Step n={1} title="Credit you bought" help="Each time you add credit at console.anthropic.com (Billing), add it here with the date. What’s left is your total minus what the site counted since your first purchase.">
          <div className="flex flex-wrap items-end gap-3">
            <label>
              <span className="mb-1 block text-sm text-brown-soft">Date</span>
              <input type="date" className={`${field} w-auto`} value={buy.date} onChange={(e) => setBuy({ ...buy, date: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-sm text-brown-soft">Amount (USD)</span>
              <input type="number" min={1} step="0.01" className={`${field} w-36`} placeholder="10.00" value={buy.amount} onChange={(e) => setBuy({ ...buy, amount: e.target.value })} />
            </label>
            <button
              className={softBtn}
              disabled={!buy.date || !(Number(buy.amount) > 0)}
              onClick={() => {
                set({ credits: [...ai.credits, { date: buy.date, amount: Math.round(Number(buy.amount) * 100) / 100 }].sort((a, b) => a.date.localeCompare(b.date)) });
                setBuy({ date: todayInMontreal(), amount: "" });
              }}
            >
              <PlusIcon className="size-4" /> Add
            </button>
          </div>
          {ai.credits.length > 0 && (
            <ul className="mt-4 divide-y divide-sand rounded-md bg-white ring-1 ring-sand">
              {ai.credits.map((c, i) => (
                <li key={`${c.date}-${i}`} className="flex items-center justify-between px-4 py-2.5">
                  <span>
                    {fmtDate(c.date)} · <span className="font-medium">{money(c.amount)}</span>
                  </span>
                  <button aria-label="Remove" className="text-brown-soft hover:text-red-800" onClick={() => set({ credits: ai.credits.filter((_, j) => j !== i) })}>
                    <TrashIcon className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Step>

        <Step n={2} title="What it was spent on (this month)">
          {!info ? (
            <p className="text-brown-soft">Loading…</p>
          ) : Object.keys(monthBy).length === 0 ? (
            <p className="text-brown-soft">Nothing yet this month.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(monthBy)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <li key={k} className="flex items-center gap-3">
                    <span className="w-56 shrink-0">{FEATURES[k] ?? k}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.max(3, (v / Math.max(month, 0.0001)) * 100)}%` }} />
                    </span>
                    <span className="w-16 text-right tabular-nums">{money(v)}</span>
                  </li>
                ))}
            </ul>
          )}
        </Step>

        <Step
          n={3}
          title="When the AI key expires"
          help="You get a warning here, on the admin home and in the morning brief 14 days before it expires, so the chat never stops by surprise."
        >
          {info?.key ? (
            <p className="text-brown">
              Read from Anthropic: key “{info.key.name}”, {info.key.expiresAt ? `expires ${fmtDate(info.key.expiresAt)}` : "never expires"}.
            </p>
          ) : (
            <>
              <label className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-brown-soft">Expires on</span>
                <input type="date" className={`${field} w-auto`} value={ai.keyExpires ?? ""} onChange={(e) => set({ keyExpires: e.target.value || undefined })} />
                {ai.keyExpires && (
                  <button className={softBtn} onClick={() => set({ keyExpires: undefined })}>
                    It doesn’t expire
                  </button>
                )}
              </label>
              <p className="mt-2 text-sm text-brown-soft">
                Find it in console.anthropic.com → API keys (leave it empty if your key has no expiry date).
                {info?.keyError ? ` ${info.keyError}` : ""} To have it read automatically, add an admin key named ANTHROPIC_ADMIN_KEY in Amplify (console.anthropic.com → Admin keys).
              </p>
            </>
          )}
        </Step>

        <div className="flex flex-wrap gap-3">
          <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer" className={softBtn}>
            <ExternalIcon className="size-4" /> Add credit (Billing)
          </a>
          <a href="https://console.anthropic.com/settings/usage" target="_blank" rel="noopener noreferrer" className={softBtn}>
            <ExternalIcon className="size-4" /> Exact usage
          </a>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className={softBtn}>
            <ExternalIcon className="size-4" /> API keys
          </a>
        </div>
      </div>
    </>
  );
}

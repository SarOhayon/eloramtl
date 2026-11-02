"use client";

import { useEffect, useState } from "react";
import { listLeads, updateLead } from "@/app/actions/leads";
import { UNITS } from "@/data/building";
import type { SiteContent } from "@/data/content";
import { dictionaries } from "@/i18n/dictionaries";
import type { Lead } from "@/lib/leads";
import { CheckIcon, KeyIcon } from "./AdminIcons";
import { ScreenTitle, field, softBtn, type Update } from "./ui";

const TYPES = dictionaries.en.types;
const day = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "America/Montreal" });
const dayOf = (d: string) => new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

// Everyone marked Leased in Inquiries: who they are, which suite they took, and when.
export function TenantsScreen({ content, update }: { content: SiteContent; update: Update }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  useEffect(() => {
    listLeads().then((l) => l && setLeads(l));
  }, []);
  const tenants = (leads ?? []).filter((l) => l.status === "leased").sort((a, b) => (b.statusAt ?? b.createdAt).localeCompare(a.statusAt ?? a.createdAt));
  const change = async (id: string, patch: Parameters<typeof updateLead>[1]) => {
    setLeads((ls) => ls?.map((l) => (l.id === id ? { ...l, ...patch } : l)) ?? ls);
    const next = await updateLead(id, patch);
    if (next) setLeads(next);
  };
  const markLeased = (unit: string) => update((c) => ({ ...c, suites: { ...c.suites, [unit]: { ...c.suites[unit], status: "leased" } } }));

  return (
    <>
      <ScreenTitle
        icon={<KeyIcon className="size-5" />}
        title="Leased tenants"
        help="Everyone you marked Leased in Inquiries moves here. Note which suite they took, and mark that suite as leased on the website in one click."
      />
      {!leads ? (
        <p className="text-brown-soft">Loading…</p>
      ) : tenants.length === 0 ? (
        <p className="rounded-lg bg-cream p-6 text-brown-soft ring-1 ring-sand">No leased tenants yet. When you mark someone Leased in Inquiries, they move here. 🎉</p>
      ) : (
        <ul className="space-y-4">
          {tenants.map((l) => {
            const unit = l.leasedUnit;
            const u = UNITS.find((x) => x.id === unit);
            const live = unit ? content.suites[unit]?.status : undefined;
            const options = [...new Set([...(l.units ?? []), ...UNITS.map((x) => x.id)])];
            return (
              <li key={l.id} className="rounded-lg bg-cream p-5 shadow-sm ring-1 ring-[#3b6b45]/30">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-3xl text-ink">{l.name}</h2>
                  <span className="rounded-full bg-[#e3eee4] px-3 py-1 text-sm font-medium text-[#2f5a38]">🎉 Leased {l.statusAt ? `on ${day.format(new Date(l.statusAt))}` : ""}</span>
                </div>
                <p className="mt-2 text-brown">
                  {[l.phone && <a key="p" href={`tel:${l.phone}`} className="underline">{l.phone}</a>, l.email && <a key="e" href={`mailto:${l.email}`} className="underline">{l.email}</a>]
                    .filter(Boolean)
                    .flatMap((x, i) => (i ? [" · ", x] : [x]))}
                </p>
                <p className="text-sm text-brown-soft">
                  {[l.moveIn && `Move-in ${dayOf(l.moveIn)}`, l.source && `Came from ${l.source}`, l.lang === "fr" ? "French" : "English"].filter(Boolean).join(" · ")}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium">Suite leased</span>
                    <select className={`${field} w-auto py-2`} value={unit ?? ""} onChange={(e) => change(l.id, { leasedUnit: e.target.value })}>
                      <option value="">Choose…</option>
                      {options.map((id) => {
                        const x = UNITS.find((y) => y.id === id)!;
                        return (
                          <option key={id} value={id}>
                            {id} · {TYPES[x.type]}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  {unit && u && live !== "leased" && (
                    <button className={softBtn} onClick={() => markLeased(unit)}>
                      Mark suite {unit} as Leased on the website
                    </button>
                  )}
                  {unit && live === "leased" && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#2f5a38]">
                      <CheckIcon className="size-4" /> Suite {unit} shows as leased on the website
                    </span>
                  )}
                </div>
                {l.note && <p className="mt-3 whitespace-pre-line rounded-md bg-white px-4 py-3 text-brown ring-1 ring-sand">{l.note}</p>}
                <button className="mt-3 text-sm text-brown-soft underline underline-offset-4" onClick={() => change(l.id, { status: "toured" })}>
                  Not leased after all? Move back to Inquiries
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

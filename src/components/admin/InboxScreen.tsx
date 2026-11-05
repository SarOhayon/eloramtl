"use client";

import { useEffect, useState } from "react";
import { addInquiryByHand, checkInboxNow, inboxStatus, listLeads, readPastedLead, scheduleShowing, updateLead } from "@/app/actions/leads";
import { suggestUnits } from "@/app/actions/suggest";
import { UNITS, UNIT_TYPES, formatPrice } from "@/data/building";
import { todayInMontreal, type SiteContent } from "@/data/content";
import { dictionaries } from "@/i18n/dictionaries";
import { FOLLOW_UP_AFTER_DAYS, daysSinceUpdate, needsFollowUp } from "@/lib/followUp";
import type { InboxState } from "@/lib/inboxLeads";
import type { Lead, LeadKind, LeadStatus } from "@/lib/leads";
import { BellIcon, CalendarIcon, InboxIcon, MailIcon, PlusIcon, SparkleIcon, TableIcon } from "./AdminIcons";
import { Attendance } from "./Attendance";
import { ChevronIcon } from "../icons";
import { ScreenTitle, Switch, bigBtn, field, softBtn, useNow, type Update } from "./ui";

const STATUS: { key: LeadStatus; label: string; on: string }[] = [
  { key: "new", label: "New", on: "bg-gold text-white ring-gold" },
  { key: "contacted", label: "Contacted", on: "bg-brown-soft text-white ring-brown-soft" },
  { key: "toured", label: "Toured", on: "bg-action text-white ring-action" },
  { key: "applied", label: "Applied", on: "bg-[#5b6f8c] text-white ring-[#5b6f8c]" },
  { key: "leased", label: "Leased", on: "bg-[#3b6b45] text-white ring-[#3b6b45]" },
  { key: "closed", label: "Closed", on: "bg-sand text-brown ring-sand" },
];
const KIND: Record<LeadKind, string> = { inquiry: "Inquiry", application: "Application", showing: "Showing booked" };

const when = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Montreal" });
const day = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const dayOf = (d: string) => day.format(new Date(`${d}T00:00:00Z`));
// WhatsApp chat link for a phone typed in a form (10-digit numbers are North American).
const waLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `1${digits}` : digits}`;
};

// Everything sent from the website's forms, newest first, with a status for follow-up.
export function InboxScreen({ content, update, onTenants }: { content: SiteContent; update: Update; onTenants: () => void }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [error, setError] = useState(false);
  const [opened, setOpened] = useState<string[]>([]); // closed cards shown again
  const [moved, setMoved] = useState(""); // name of someone just moved to Leased tenants
  const [expanded, setExpanded] = useState<string[]>([]); // cards opened (they start folded)
  const toggle = (id: string) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  useEffect(() => {
    listLeads().then((l) => (l ? setLeads(l) : setError(true)));
  }, []);

  const change = async (id: string, patch: { status?: LeadStatus; note?: string; snooze?: boolean; units?: string[] }) => {
    const { snooze, ...fields } = patch;
    const at = snooze || patch.status ? { statusAt: new Date().toISOString() } : {};
    setLeads((ls) => ls?.map((l) => (l.id === id ? { ...l, ...fields, ...at } : l)) ?? ls);
    const next = await updateLead(id, patch);
    if (next) setLeads(next);
    else setError(true);
  };

  // Leased people live in Leased tenants, not here.
  const open = leads?.filter((l) => l.status !== "leased");
  const shown = open?.filter((l) => filter === "all" || l.status === filter) ?? [];
  const tenants = leads?.filter((l) => l.status === "leased").length ?? 0;
  const dupes = duplicatesOf(leads ?? []);
  const now = useNow();
  const toFollow = (leads ?? []).filter((l) => needsFollowUp(l, now)).sort((a, b) => daysSinceUpdate(b, now) - daysSinceUpdate(a, now));
  const jump = (id: string) => {
    setFilter("all");
    setOpened((o) => (o.includes(id) ? o : [...o, id]));
    setExpanded((e) => (e.includes(id) ? e : [...e, id]));
    window.setTimeout(() => document.getElementById(`lead-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const count = (s: LeadStatus) => leads?.filter((l) => l.status === s).length ?? 0;

  return (
    <>
      <ScreenTitle
        icon={<InboxIcon className="size-5" />}
        title="Inquiries"
        help="Every inquiry, newest first: forms sent from the website, booked showings, lead emails (Rentsync, Apartments.com, Zumper…) and ones you add by hand. Change the status as you follow up, and add a note for yourself."
      />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <EmailLeads content={content} update={update} onLeads={setLeads} />
        <AddInquiry onLeads={setLeads} />
      </div>
      <a href="/admin/inquiries.xlsx" download className="mb-6 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 ring-1 ring-brown/20 transition hover:bg-cream-deep">
        <TableIcon className="size-5" /> Download all to Excel
      </a>
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-red-900">Couldn’t load or save. Check your internet and refresh the page.</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-md px-4 py-2.5 ring-1 ${filter === "all" ? "bg-action text-white ring-action" : "bg-white ring-brown/20"}`}>
          All {open ? `(${open.length})` : ""}
        </button>
        {STATUS.filter((s) => s.key !== "leased").map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)} className={`rounded-md px-4 py-2.5 ring-1 ${filter === s.key ? "bg-action text-white ring-action" : "bg-white ring-brown/20"}`}>
            {s.label} ({count(s.key)})
          </button>
        ))}
        <button onClick={onTenants} className="rounded-md bg-[#e3eee4] px-4 py-2.5 text-[#2f5a38] ring-1 ring-[#3b6b45]/30 hover:ring-[#3b6b45]/60">
          🎉 Leased tenants ({tenants}) →
        </button>
      </div>
      {shown.length > 0 && (
        <div className="mb-3 flex justify-end gap-3 text-sm">
          <button className="font-medium text-brown underline underline-offset-4" onClick={() => setExpanded(shown.map((l) => l.id))}>
            Open all
          </button>
          <button className="font-medium text-brown underline underline-offset-4" onClick={() => setExpanded([])}>
            Fold all
          </button>
        </div>
      )}
      {moved && (
        <p className="mb-4 rounded-md bg-[#e3eee4] px-4 py-3 text-[#2f5a38]" role="status">
          🎉 {moved} moved to <button onClick={onTenants} className="font-medium underline underline-offset-4">Leased tenants</button>.
        </p>
      )}

      {!leads && !error && <p className="text-brown-soft">Loading…</p>}
      {leads && shown.length === 0 && <p className="rounded-lg bg-cream p-6 text-brown-soft ring-1 ring-sand">Nothing here yet.</p>}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_250px]">
        <aside className="rounded-lg bg-cream p-4 shadow-sm ring-1 ring-gold/50 lg:sticky lg:top-28 lg:order-last">
          <p className="flex items-center gap-2 font-display text-xl text-ink">
            <BellIcon className="size-5 text-gold" /> To follow up {toFollow.length > 0 && <span className="rounded-full bg-gold px-2 text-sm text-white">{toFollow.length}</span>}
          </p>
          <p className="mt-1 text-xs text-brown-soft">No status change in {FOLLOW_UP_AFTER_DAYS}+ days.</p>
          {leads && toFollow.length === 0 && <p className="mt-3 text-sm text-brown">All caught up.</p>}
          <ul className="mt-3 space-y-2">
            {toFollow.map((l) => (
              <li key={l.id} className="rounded-md bg-white p-3 ring-1 ring-sand">
                <button onClick={() => jump(l.id)} className="block w-full text-left">
                  <span className="block font-medium text-ink hover:underline">{l.name}</span>
                  <span className="block text-xs text-brown-soft">
                    {STATUS.find((x) => x.key === l.status)?.label} · {daysSinceUpdate(l, now)} days
                  </span>
                </button>
                <button onClick={() => change(l.id, { snooze: true })} className="mt-1.5 text-xs font-medium text-brown underline underline-offset-2">
                  Remind me later
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <ul className="min-w-0 space-y-4">
          {shown.map((l) => (
            <li key={l.id} id={`lead-${l.id}`} className={`relative scroll-mt-28 overflow-hidden rounded-lg bg-cream shadow-sm ring-1 ${l.status === "new" ? "ring-gold" : "ring-sand"}`}>
              {/* Closed: the card is blurred out of the way, one click shows it again. */}
              {l.status === "closed" && !opened.includes(l.id) && (
                <button
                  onClick={() => setOpened((o) => [...o, l.id])}
                  className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-cream/40 backdrop-blur-[3px] transition hover:bg-cream/20"
                >
                  <span className="rounded-full bg-brown px-4 py-1.5 font-medium text-white shadow">Closed · {l.name}</span>
                  <span className="text-sm text-brown underline underline-offset-4">Click to view</span>
                </button>
              )}
              {/* Folded: one line per person; click to open the whole card. */}
              <button onClick={() => toggle(l.id)} aria-expanded={expanded.includes(l.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-2xl text-ink">{l.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS.find((x) => x.key === l.status)?.on ?? ""}`}>{STATUS.find((x) => x.key === l.status)?.label}</span>
                    <span className="rounded-full bg-cream-deep px-2.5 py-0.5 text-xs font-medium text-brown">{KIND[l.kind]}</span>
                    {l.source && <span className="rounded-full bg-gold-light/60 px-2.5 py-0.5 text-xs font-medium text-brown">{l.source}</span>}
                    {dupes[l.id]?.length ? <span className="rounded-full bg-[#f4e1df] px-2.5 py-0.5 text-xs font-medium text-red-900">⚠ Possible duplicate ({dupes[l.id].length + 1})</span> : null}
                    {needsFollowUp(l, now) && <BellIcon className="size-4 text-gold" aria-label="Time to follow up" />}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-brown-soft">
                    {[l.showing && `Showing ${dayOf(l.showing.date)} at ${l.showing.time}`, l.type, l.moveIn && `Move-in ${dayOf(l.moveIn)}`, l.phone || l.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="hidden shrink-0 text-sm text-brown-soft sm:block">{when.format(new Date(l.createdAt))}</span>
                <ChevronIcon dir="down" className={`size-5 shrink-0 text-brown-soft transition-transform ${expanded.includes(l.id) ? "rotate-180" : ""}`} />
              </button>
              {expanded.includes(l.id) && (
              <div className="border-t border-sand px-5 pb-5 pt-4">
              {needsFollowUp(l, now) && (
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-light px-3 py-1 text-sm text-brown">
                  <BellIcon className="size-4" /> No update in {daysSinceUpdate(l, now)} days: time to follow up
                </p>
              )}
              {dupes[l.id]?.length ? (
                <div className="mb-3 rounded-md bg-[#f4e1df] px-4 py-3 text-sm text-red-900">
                  <p className="font-medium">Same email or phone as:</p>
                  <ul className="mt-1 space-y-0.5">
                    {dupes[l.id].map((d) => (
                      <li key={d.id}>
                        {d.name} · {KIND[d.kind]}
                        {d.source ? ` (${d.source})` : ""} · {when.format(new Date(d.createdAt))} · {STATUS.find((x) => x.key === d.status)?.label}{" "}
                        {d.status !== "leased" && (
                          <button className="ml-1 font-medium underline underline-offset-2" onClick={() => jump(d.id)}>
                            Show
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {l.status !== "closed" && (
                    <button className="mt-2 font-medium underline underline-offset-2" onClick={() => change(l.id, { status: "closed", note: [l.note, "Duplicate submission."].filter(Boolean).join("\n") })}>
                      Close this one as a duplicate
                    </button>
                  )}
                </div>
              ) : null}
              <ShowingBox lead={l} onLeads={setLeads} />

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-brown sm:grid-cols-2">
                {l.phone && (
                  <div>
                    <dt className="inline text-brown-soft">Phone: </dt>
                    <dd className="inline">
                      <a href={`tel:${l.phone}`} className="underline">{l.phone}</a>
                      {" · "}
                      <a href={waLink(l.phone)} target="_blank" rel="noopener noreferrer" className="underline">
                        WhatsApp
                      </a>
                    </dd>
                  </div>
                )}
                {l.email && (
                  <div>
                    <dt className="inline text-brown-soft">Email: </dt>
                    <dd className="inline">
                      <a href={`mailto:${l.email}`} className="underline">{l.email}</a>
                    </dd>
                  </div>
                )}
                {l.type && (
                  <div>
                    <dt className="inline text-brown-soft">Suite type: </dt>
                    <dd className="inline">{l.type}</dd>
                  </div>
                )}
                {l.moveIn && (
                  <div>
                    <dt className="inline text-brown-soft">Move-in: </dt>
                    <dd className="inline">{dayOf(l.moveIn)}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline text-brown-soft">Language: </dt>
                  <dd className="inline">{l.lang === "fr" ? "French" : "English"}</dd>
                </div>
              </dl>
              {l.comments && <p className="mt-3 whitespace-pre-line rounded-md bg-white px-4 py-3 text-brown ring-1 ring-sand">{l.comments}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUS.map((s) => (
                  <button key={s.key} onClick={() => {
                      change(l.id, { status: s.key });
                      if (s.key === "leased") setMoved(l.name);
                    }} className={`rounded-md px-4 py-2 text-sm ring-1 ${l.status === s.key ? s.on : "bg-white ring-brown/20 hover:ring-brown/40"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <NoteField value={l.note ?? ""} onSave={(note) => change(l.id, { note })} />
              <UnitsToShow lead={l} content={content} onSave={(units) => change(l.id, { units })} />
              <Suggestions lead={l} content={content} onLeads={setLeads} />
              </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// A note that saves when you click away from it.
function NoteField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <label className="mt-3 block">
      <span className="sr-only">Note</span>
      <textarea
        rows={2}
        className={field}
        placeholder="Your note (e.g. called back, showing on Tuesday)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== value && onSave(text)}
      />
    </label>
  );
}

const TYPES = dictionaries.en.types;

// People who sent more than one submission (same email, or same phone number), by inquiry.
function duplicatesOf(leads: Lead[]): Record<string, Lead[]> {
  const keys = (l: Lead) => [l.email.trim().toLowerCase(), l.phone.replace(/\D/g, "").slice(-10)].filter((k, i) => (i === 0 ? k.includes("@") : k.length === 10));
  const byKey = new Map<string, Lead[]>();
  for (const l of leads) for (const k of keys(l)) byKey.set(k, [...(byKey.get(k) ?? []), l]);
  const out: Record<string, Lead[]> = {};
  for (const l of leads) {
    const others = new Map<string, Lead>();
    for (const k of keys(l)) for (const o of byKey.get(k) ?? []) if (o.id !== l.id) others.set(o.id, o);
    if (others.size) out[l.id] = [...others.values()];
  }
  return out;
}

// Suites picked to show this person, from a drop-down (as many as needed). Only seen here in the admin.
function UnitsToShow({ lead, content, onSave }: { lead: Lead; content: SiteContent; onSave: (units: string[]) => void }) {
  const chosen = lead.units ?? [];
  const label = (id: string) => {
    const u = UNITS.find((x) => x.id === id);
    if (!u) return `Suite ${id}`;
    const info = content.suites[id] ?? {};
    return `${id} · ${TYPES[u.type]} · ${formatPrice(info.price ?? content.prices[u.type], "en")}`;
  };
  // Only suites marked Available in Apartments can be picked.
  const isAvailable = (id: string) => content.suites[id]?.status === "available";
  const options = UNITS.filter((u) => isAvailable(u.id) && !chosen.includes(u.id));
  // The AI's picks that are available and not chosen yet, to add in one click.
  const aiPicks = (lead.suggestion?.picks ?? []).map((p) => p.unit).filter((id) => !chosen.includes(id) && isAvailable(id));

  return (
    <div className="mt-4 rounded-md bg-white p-4 ring-1 ring-sand">
      <p className="font-medium text-brown">Units to show them</p>
      {chosen.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chosen.map((id) => (
            <li key={id} className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep py-1.5 pl-3.5 pr-1.5 text-sm text-brown ring-1 ring-sand">
              {label(id)}
              {!isAvailable(id) && <span className="text-xs text-red-800">no longer available</span>}
              <button
                onClick={() => onSave(chosen.filter((x) => x !== id))}
                aria-label={`Remove suite ${id}`}
                className="inline-flex size-6 items-center justify-center rounded-full text-brown-soft hover:bg-white hover:text-brown"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-brown-soft">None picked yet. Only you see this list.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          className={`${field} max-w-sm`}
          value=""
          onChange={(e) => e.target.value && onSave([...chosen, e.target.value])}
          aria-label="Add a unit to show"
        >
          <option value="">{options.length ? "+ Add an available unit…" : "No other available units"}</option>
          {options.map((u) => (
            <option key={u.id} value={u.id}>
              {label(u.id)}
            </option>
          ))}
        </select>
        {aiPicks.length > 0 && (
          <button className={softBtn} onClick={() => onSave([...chosen, ...aiPicks])}>
            Add the AI’s picks ({aiPicks.join(", ")})
          </button>
        )}
      </div>
    </div>
  );
}
const ago = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Montreal" });

// The AI's pick of available suites for this person, with a button to ask (again).
function Suggestions({ lead, content, onLeads }: { lead: Lead; content: SiteContent; onLeads: (l: Lead[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = lead.suggestion;

  const ask = async () => {
    setBusy(true);
    setError("");
    const res = await suggestUnits(lead.id).catch(() => ({ ok: false as const, error: "The AI didn't answer. Try again in a moment." }));
    if (res.ok) onLeads(res.leads);
    else setError(res.error);
    setBusy(false);
  };

  return (
    <div className="mt-4 rounded-md bg-white p-4 ring-1 ring-gold/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-medium text-brown">
          <SparkleIcon className="size-5 text-gold" /> Suggested suites
        </p>
        <button onClick={ask} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 text-sm font-medium text-white transition hover:bg-action-deep disabled:opacity-60">
          {busy ? "Thinking…" : s ? "Suggest again" : "Suggest the best suites"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-800">{error}</p>}
      {!s && !busy && !error && <p className="mt-2 text-sm text-brown-soft">The AI reads this person’s message, budget and dates and picks the best available suites for them.</p>}
      {s && (
        <div className={busy ? "opacity-50" : ""}>
          <p className="mt-3 text-brown">{s.summary}</p>
          {s.picks.length > 0 && (
            <ol className="mt-3 space-y-2">
              {s.picks.map((p, i) => {
                const u = UNITS.find((x) => x.id === p.unit);
                const info = content.suites[p.unit] ?? {};
                return (
                  <li key={p.unit} className="flex gap-3 rounded-md bg-cream-deep px-3 py-2.5">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-medium text-white">{i + 1}</span>
                    <div>
                      <p className="font-medium text-ink">
                        Suite {p.unit}
                        {u && (
                          <span className="font-normal text-brown-soft">
                            {" "}
                            · {TYPES[u.type]} · {formatPrice(info.price ?? content.prices[u.type], "en")}/mo
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-brown">{p.reason}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {s.ask && (
            <p className="mt-3 text-sm text-brown">
              <span className="font-medium">Good question to ask:</span> {s.ask}
            </p>
          )}
          <p className="mt-2 text-xs text-brown-soft">Suggested {ago.format(new Date(s.at))} · Double-check before you send it to the client.</p>
        </div>
      )}
    </div>
  );
}

// The person's showing (with check-in), or a button to book one for them: any day and time,
// no limits, e.g. after talking with them by phone.
function ShowingBox({ lead, onLeads }: { lead: Lead; onLeads: (l: Lead[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(lead.showing?.date ?? todayInMontreal());
  const [time, setTime] = useState(lead.showing?.time ?? "10:00");
  const [confirmEmail, setConfirmEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    const res = await scheduleShowing(lead.id, date, time, confirmEmail);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onLeads(res.leads);
    setEditing(false);
  };

  if (!editing && !lead.showing)
    return (
      <button onClick={() => setEditing(true)} className={`${softBtn} mt-3`}>
        <CalendarIcon className="size-4" /> Book a showing for them
      </button>
    );

  return (
    <div className="mt-3 space-y-3 rounded-md bg-gold-light/60 px-4 py-3">
      {editing ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Day</span>
            <input type="date" className={`${field} w-44`} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Time</span>
            <input type="time" className={`${field} w-36`} value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[#503d32]" checked={confirmEmail} onChange={(e) => setConfirmEmail(e.target.checked)} />
            Email them the confirmation
          </label>
          <div className="mb-1 flex gap-2">
            <button onClick={save} disabled={busy || !date || !time} className="rounded-md bg-action px-4 py-2.5 text-sm font-medium text-white hover:bg-action-deep disabled:opacity-50">
              {busy ? "Saving…" : lead.showing ? "Save the new time" : "Book the showing"}
            </button>
            <button onClick={() => setEditing(false)} className="rounded-md bg-white px-4 py-2.5 text-sm ring-1 ring-brown/20">
              Cancel
            </button>
          </div>
          {error && <p className="w-full text-sm text-red-800">{error}</p>}
        </div>
      ) : (
        lead.showing && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-brown">
                Showing: {dayOf(lead.showing.date)} at {lead.showing.time}
              </p>
              <button onClick={() => setEditing(true)} className="text-sm font-medium text-brown underline underline-offset-4">
                Change the time
              </button>
            </div>
            <Attendance lead={lead} onLeads={onLeads} />
          </>
        )
      )}
    </div>
  );
}

const timeAgo = (iso: string, now: number) => {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60e3));
  return min < 1 ? "just now" : min < 60 ? `${min} min ago` : min < 1440 ? `${Math.round(min / 60)} h ago` : `${Math.round(min / 1440)} days ago`;
};

// Lead emails from the sarah@eloramtl.com mailbox, added to the inquiries every 10 minutes.
function EmailLeads({ content, update, onLeads }: { content: SiteContent; update: Update; onLeads: (l: Lead[]) => void }) {
  const inbox = content.inbox;
  const [status, setStatus] = useState<{ configured: boolean; aiReady: boolean; state: InboxState } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const now = useNow();
  useEffect(() => {
    inboxStatus().then(setStatus);
  }, []);
  const set = (patch: Partial<SiteContent["inbox"]>) => update((c) => ({ ...c, inbox: { ...c.inbox, ...patch } }));
  const check = async () => {
    setBusy(true);
    setMsg("");
    const res = await checkInboxNow().catch(() => null);
    if (!res) setMsg("The check couldn't run. Refresh the page and try again.");
    else {
      if (res.leads) onLeads(res.leads);
      if (res.state) setStatus((s) => (s ? { ...s, state: res.state! } : s));
      setMsg(res.ok ? (res.added ? `Added ${res.added} new lead${res.added === 1 ? "" : "s"}.` : "No new lead emails.") : (res.error ?? "Something went wrong."));
    }
    setBusy(false);
  };
  const st = status?.state;

  return (
    <section className="rounded-lg bg-cream p-5 shadow-sm ring-1 ring-sand">
      <p className="flex items-center gap-2 font-display text-xl text-ink">
        <MailIcon className="size-5 text-gold" /> Leads from your email
      </p>
      <p className="mt-1 text-sm text-brown-soft">
        Lead emails that reach sarah@eloramtl.com (Rentsync, Apartments.com, Zumper…), in the inbox or a “Leads” folder, are added here every 10 minutes. Your emails stay as they are, and no one gets an automatic reply.
      </p>
      <div className="mt-3">
        <Switch
          on={inbox.enabled}
          onChange={(v) => set({ enabled: v, since: inbox.since ?? new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10) })}
          label={inbox.enabled ? "On" : "Off"}
        />
      </div>
      {inbox.enabled && (
        <>
          <label className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-brown-soft">Add lead emails received since</span>
            <input type="date" className={`${field} w-auto py-2`} value={inbox.since ?? ""} onChange={(e) => set({ since: e.target.value || undefined })} />
          </label>
          {status && !status.configured && <p className="mt-3 rounded-md bg-gold-light/60 px-3 py-2 text-sm text-brown">The mailbox login isn’t set on the server (SMTP_HOST, SMTP_USER, SMTP_PASS in Amplify).</p>}
          {status && !status.aiReady && <p className="mt-3 rounded-md bg-gold-light/60 px-3 py-2 text-sm text-brown">Without the AI key, only the sender’s name and email are filled in, with the whole email as the comment.</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button className={softBtn} onClick={check} disabled={busy}>
              {busy ? "Checking…" : "Check now"}
            </button>
            {st?.lastCheck && (
              <span className="text-sm text-brown-soft">
                Last checked {timeAgo(st.lastCheck, now)}
                {st.imported ? ` · ${st.imported} added so far` : ""}
                {st.foldersRead?.length ? ` · Reads: ${st.foldersRead.map((f) => (f === "INBOX" ? "Inbox" : f.replace(/^INBOX[./]/, ""))).join(", ")}` : ""}
              </span>
            )}
          </div>
          {msg && <p className="mt-2 text-sm text-brown">{msg}</p>}
          {st?.error && !msg && <p className="mt-2 text-sm text-red-800">{st.error}</p>}
        </>
      )}
    </section>
  );
}

const SOURCES = ["Phone call", "Text / WhatsApp", "Walk-in", "Instagram", "Facebook", "Apartments.com", "Zumper", "Rentsync", "Email", "Referral"];

// An inquiry that came another way, typed in or read from a pasted email or message.
function AddInquiry({ onLeads }: { onLeads: (l: Lead[]) => void }) {
  const empty = { name: "", email: "", phone: "", type: "", moveIn: "", source: "Phone call", comments: "", lang: "en" as "fr" | "en" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState<"" | "read" | "save">("");
  const [msg, setMsg] = useState("");
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const read = async () => {
    setBusy("read");
    setMsg("");
    const res = await readPastedLead(paste).catch(() => ({ ok: false as const, error: "The AI didn't answer. Try again in a moment." }));
    if (res.ok) {
      const l = res.lead;
      setForm((f) => ({ ...f, name: l.name, email: l.email, phone: l.phone, type: l.type ?? "", moveIn: l.moveIn ?? "", comments: l.comments ?? "", source: l.source || f.source, lang: l.lang }));
      setMsg("Filled in from the text. Check it, then save.");
    } else setMsg(res.error);
    setBusy("");
  };
  const save = async () => {
    setBusy("save");
    setMsg("");
    const res = await addInquiryByHand(form);
    if (res.ok) {
      onLeads(res.leads);
      setForm(empty);
      setPaste("");
      setOpen(false);
    } else setMsg(res.error);
    setBusy("");
  };

  return (
    <section className="rounded-lg bg-cream p-5 shadow-sm ring-1 ring-sand">
      <p className="flex items-center gap-2 font-display text-xl text-ink">
        <PlusIcon className="size-5 text-gold" /> Add an inquiry
      </p>
      <p className="mt-1 text-sm text-brown-soft">For leads by phone, text, Instagram or anywhere else. Nobody is emailed.</p>
      {!open ? (
        <button className={`${softBtn} mt-3`} onClick={() => setOpen(true)}>
          Add one
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Paste an email or message (optional)</span>
            <textarea rows={3} className={field} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste it here and the AI fills in the fields below…" />
          </label>
          <button className={softBtn} onClick={read} disabled={busy !== "" || !paste.trim()}>
            <SparkleIcon className="size-4 text-gold" /> {busy === "read" ? "Reading…" : "Fill in from the text"}
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Name *" value={form.name} onChange={(e) => set({ name: e.target.value })} />
            <input className={field} placeholder="Phone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            <input className={`${field} sm:col-span-2`} placeholder="Email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            <select className={field} value={form.type} onChange={(e) => set({ type: e.target.value })} aria-label="Suite type">
              <option value="">Suite type: not sure</option>
              {UNIT_TYPES.map((k) => (
                <option key={k} value={TYPES[k]}>
                  {TYPES[k]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <span className="shrink-0 text-brown-soft">Move-in</span>
              <input className={field} type="date" value={form.moveIn} onChange={(e) => set({ moveIn: e.target.value })} />
            </label>
            <select className={field} value={form.source} onChange={(e) => set({ source: e.target.value })} aria-label="Where it came from">
              {[...new Set([form.source, ...SOURCES])].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className={field} value={form.lang} onChange={(e) => set({ lang: e.target.value as "fr" | "en" })} aria-label="Language">
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
            <textarea rows={3} className={`${field} sm:col-span-2`} placeholder="What they’re looking for, budget, notes…" value={form.comments} onChange={(e) => set({ comments: e.target.value })} />
          </div>
          {msg && <p className="text-sm text-brown">{msg}</p>}
          <div className="flex flex-wrap gap-2">
            <button className={bigBtn} onClick={save} disabled={busy !== ""}>
              {busy === "save" ? "Saving…" : "Save the inquiry"}
            </button>
            <button className={softBtn} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

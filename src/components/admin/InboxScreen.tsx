"use client";

import { useEffect, useState } from "react";
import { listLeads, scheduleShowing, updateLead } from "@/app/actions/leads";
import { suggestUnits } from "@/app/actions/suggest";
import { UNITS, formatPrice } from "@/data/building";
import { todayInMontreal, type SiteContent } from "@/data/content";
import { dictionaries } from "@/i18n/dictionaries";
import { FOLLOW_UP_AFTER_DAYS, daysSinceUpdate, needsFollowUp } from "@/lib/followUp";
import type { Lead, LeadKind, LeadStatus } from "@/lib/leads";
import { BellIcon, CalendarIcon, InboxIcon, SparkleIcon, TableIcon } from "./AdminIcons";
import { Attendance } from "./Attendance";
import { ScreenTitle, field, softBtn, useNow } from "./ui";

const STATUS: { key: LeadStatus; label: string; on: string }[] = [
  { key: "new", label: "New", on: "bg-gold text-white ring-gold" },
  { key: "contacted", label: "Contacted", on: "bg-brown-soft text-white ring-brown-soft" },
  { key: "toured", label: "Toured", on: "bg-action text-white ring-action" },
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
export function InboxScreen({ content }: { content: SiteContent }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [error, setError] = useState(false);

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

  const shown = leads?.filter((l) => filter === "all" || l.status === filter) ?? [];
  const now = useNow();
  const toFollow = (leads ?? []).filter((l) => needsFollowUp(l, now)).sort((a, b) => daysSinceUpdate(b, now) - daysSinceUpdate(a, now));
  const jump = (id: string) => {
    setFilter("all");
    window.setTimeout(() => document.getElementById(`lead-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const count = (s: LeadStatus) => leads?.filter((l) => l.status === s).length ?? 0;

  return (
    <>
      <ScreenTitle
        icon={<InboxIcon className="size-5" />}
        title="Inquiries"
        help="Every form sent from the website, newest first: inquiries, applications and booked showings. Change the status as you follow up, and add a note for yourself."
      />
      <a href="/admin/inquiries.xlsx" download className="mb-6 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 ring-1 ring-brown/20 transition hover:bg-cream-deep">
        <TableIcon className="size-5" /> Download all to Excel
      </a>
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-red-900">Couldn’t load or save. Check your internet and refresh the page.</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-md px-4 py-2.5 ring-1 ${filter === "all" ? "bg-action text-white ring-action" : "bg-white ring-brown/20"}`}>
          All {leads ? `(${leads.length})` : ""}
        </button>
        {STATUS.map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)} className={`rounded-md px-4 py-2.5 ring-1 ${filter === s.key ? "bg-action text-white ring-action" : "bg-white ring-brown/20"}`}>
            {s.label} ({count(s.key)})
          </button>
        ))}
      </div>

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
            <li key={l.id} id={`lead-${l.id}`} className={`scroll-mt-28 rounded-lg bg-cream p-5 shadow-sm ring-1 ${l.status === "new" ? "ring-gold" : "ring-sand"}`}>
              {needsFollowUp(l, now) && (
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-light px-3 py-1 text-sm text-brown">
                  <BellIcon className="size-4" /> No update in {daysSinceUpdate(l, now)} days: time to follow up
                </p>
              )}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-3xl text-ink">{l.name}</h2>
                <p className="text-sm text-brown-soft">
                  <span className="mr-2 rounded-full bg-cream-deep px-3 py-1 font-medium text-brown">{KIND[l.kind]}</span>
                  {when.format(new Date(l.createdAt))}
                </p>
              </div>

              <ShowingBox lead={l} onLeads={setLeads} />

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-brown sm:grid-cols-2">
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
                <div>
                  <dt className="inline text-brown-soft">Email: </dt>
                  <dd className="inline">
                    <a href={`mailto:${l.email}`} className="underline">{l.email}</a>
                  </dd>
                </div>
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
                  <button key={s.key} onClick={() => change(l.id, { status: s.key })} className={`rounded-md px-4 py-2 text-sm ring-1 ${l.status === s.key ? s.on : "bg-white ring-brown/20 hover:ring-brown/40"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <NoteField value={l.note ?? ""} onSave={(note) => change(l.id, { note })} />
              <UnitsToShow lead={l} content={content} onSave={(units) => change(l.id, { units })} />
              <Suggestions lead={l} content={content} onLeads={setLeads} />
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

// Suites picked to show this person, from a drop-down (as many as needed). Only seen here in the admin.
function UnitsToShow({ lead, content, onSave }: { lead: Lead; content: SiteContent; onSave: (units: string[]) => void }) {
  const chosen = lead.units ?? [];
  const label = (id: string) => {
    const u = UNITS.find((x) => x.id === id);
    if (!u) return `Suite ${id}`;
    const info = content.suites[id] ?? {};
    return `${id} · ${TYPES[u.type]} · ${formatPrice(info.price ?? content.prices[u.type], "en")}`;
  };
  const group = (status: string | undefined) => UNITS.filter((u) => (content.suites[u.id]?.status ?? "none") === (status ?? "none") && !chosen.includes(u.id));
  const groups = [
    { title: "Available", list: group("available") },
    { title: "Coming soon", list: group("soon") },
    { title: "Leased", list: group("leased") },
    { title: "Not set", list: group(undefined) },
  ].filter((g) => g.list.length);
  // The AI's picks that aren't chosen yet, to add in one click.
  const aiPicks = (lead.suggestion?.picks ?? []).map((p) => p.unit).filter((id) => !chosen.includes(id) && UNITS.some((u) => u.id === id));

  return (
    <div className="mt-4 rounded-md bg-white p-4 ring-1 ring-sand">
      <p className="font-medium text-brown">Units to show them</p>
      {chosen.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chosen.map((id) => (
            <li key={id} className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep py-1.5 pl-3.5 pr-1.5 text-sm text-brown ring-1 ring-sand">
              {label(id)}
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
          <option value="">+ Add a unit…</option>
          {groups.map((g) => (
            <optgroup key={g.title} label={g.title}>
              {g.list.map((u) => (
                <option key={u.id} value={u.id}>
                  {label(u.id)}
                </option>
              ))}
            </optgroup>
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

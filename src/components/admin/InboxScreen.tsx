"use client";

import { useEffect, useState } from "react";
import { listLeads, updateLead } from "@/app/actions/leads";
import type { Lead, LeadKind, LeadStatus } from "@/lib/leads";
import { InboxIcon } from "./AdminIcons";
import { ScreenTitle, field } from "./ui";

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
export function InboxScreen() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [error, setError] = useState(false);

  useEffect(() => {
    listLeads().then((l) => (l ? setLeads(l) : setError(true)));
  }, []);

  const change = async (id: string, patch: { status?: LeadStatus; note?: string }) => {
    setLeads((ls) => ls?.map((l) => (l.id === id ? { ...l, ...patch } : l)) ?? ls);
    const next = await updateLead(id, patch);
    if (next) setLeads(next);
    else setError(true);
  };

  const shown = leads?.filter((l) => filter === "all" || l.status === filter) ?? [];
  const count = (s: LeadStatus) => leads?.filter((l) => l.status === s).length ?? 0;

  return (
    <>
      <ScreenTitle
        icon={<InboxIcon className="size-5" />}
        title="Inquiries"
        help="Every form sent from the website, newest first: inquiries, applications and booked showings. Change the status as you follow up, and add a note for yourself."
      />
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

      <ul className="space-y-4">
        {shown.map((l) => (
          <li key={l.id} className={`rounded-lg bg-cream p-5 shadow-sm ring-1 ${l.status === "new" ? "ring-gold" : "ring-sand"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-3xl text-ink">{l.name}</h2>
              <p className="text-sm text-brown-soft">
                <span className="mr-2 rounded-full bg-cream-deep px-3 py-1 font-medium text-brown">{KIND[l.kind]}</span>
                {when.format(new Date(l.createdAt))}
              </p>
            </div>

            {l.showing && (
              <p className="mt-3 rounded-md bg-gold-light/60 px-4 py-2.5 font-medium text-brown">
                Showing: {dayOf(l.showing.date)} at {l.showing.time}
              </p>
            )}

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
          </li>
        ))}
      </ul>
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

"use client";

import { useEffect, useState } from "react";
import { addShowingByHand, listLeads, updateLead } from "@/app/actions/leads";
import { todayInMontreal, type ShowingHours, type Showings, type SiteContent, type Weekday } from "@/data/content";
import type { Lead } from "@/lib/leads";
import { CalendarIcon, CloseIcon, PlusIcon } from "./AdminIcons";
import { Attendance } from "./Attendance";
import { ScreenTitle, Step, Switch, bigBtn, field, softBtn, useNow, type Update } from "./ui";

const DAYS: { key: Weekday; label: string }[] = [
  { key: "1", label: "Monday" },
  { key: "2", label: "Tuesday" },
  { key: "3", label: "Wednesday" },
  { key: "4", label: "Thursday" },
  { key: "5", label: "Friday" },
  { key: "6", label: "Saturday" },
  { key: "0", label: "Sunday" },
];
const longDay = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const dayOf = (d: string) => longDay.format(new Date(`${d}T00:00:00Z`));

// Online showing bookings: when visitors can book, and the showings coming up.
export function ShowingsScreen({ content, update }: { content: SiteContent; update: Update }) {
  const s = content.showings;
  const set = (patch: Partial<Showings>) => update((c) => ({ ...c, showings: { ...c.showings, ...patch } }));
  const setDay = (day: Weekday, hours: ShowingHours | undefined) => {
    const next = { ...s.hours };
    if (hours) next[day] = hours;
    else delete next[day];
    set({ hours: next });
  };
  const [dayOff, setDayOff] = useState("");

  return (
    <>
      <ScreenTitle
        icon={<CalendarIcon className="size-5" />}
        title="Showings"
        help="Showings can only be booked from the “Book my showing” button in the automatic reply people get after they send an inquiry or apply. Each button is a private link for that person: they pick a day and time from your hours, get a confirmation email with a calendar reminder 30 minutes before, and the booking appears here and in Inquiries."
      />
      <div className="space-y-6">
        <Step n={1} title="Turn online booking on or off" help="When it's off, the automatic reply has no booking button, and links already sent say to call or reply instead.">
          <Switch on={s.enabled} onChange={(v) => set({ enabled: v })} label={s.enabled ? "Booking button in the automatic reply" : "Online booking is OFF"} />
        </Step>

        <Step n={2} title="Your showing hours" help="Tick the days you do showings and set the hours. Each showing takes one time slot.">
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const h = s.hours[key];
              return (
                <div key={key} className="flex flex-wrap items-center gap-3 rounded-md bg-white px-4 py-3 ring-1 ring-sand">
                  <label className="flex w-40 items-center gap-3">
                    <input type="checkbox" className="size-5 accent-[#503d32]" checked={Boolean(h)} onChange={(e) => setDay(key, e.target.checked ? { from: "10:00", to: "17:00" } : undefined)} />
                    <span className="font-medium">{label}</span>
                  </label>
                  {h ? (
                    <div className="flex items-center gap-2">
                      <input type="time" step={900} className={`${field} w-36`} value={h.from} onChange={(e) => e.target.value && setDay(key, { ...h, from: e.target.value })} aria-label={`${label} from`} />
                      <span className="text-brown-soft">to</span>
                      <input type="time" step={900} className={`${field} w-36`} value={h.to} onChange={(e) => e.target.value && setDay(key, { ...h, to: e.target.value })} aria-label={`${label} to`} />
                      {h.from >= h.to && <span className="text-sm text-red-800">The end must be after the start.</span>}
                    </div>
                  ) : (
                    <span className="text-brown-soft">No showings</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block font-medium">Length of a showing</span>
              <select className={field} value={s.slotMinutes} onChange={(e) => set({ slotMinutes: Number(e.target.value) })}>
                {[15, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Book at least</span>
              <select className={field} value={s.minNoticeHours} onChange={(e) => set({ minNoticeHours: Number(e.target.value) })}>
                {[1, 2, 4, 12, 24, 48].map((h) => (
                  <option key={h} value={h}>
                    {h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h > 24 ? "s" : ""}`} ahead
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Show times for the next</span>
              <select className={field} value={s.daysAhead} onChange={(e) => set({ daysAhead: Number(e.target.value) })}>
                {[7, 14, 21, 30, 60].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Step>

        <Step n={3} title="Days off" help="Holidays or days you're away: no showings can be booked on these days.">
          <div className="flex flex-wrap gap-2">
            <input type="date" className={`${field} w-48`} value={dayOff} min={todayInMontreal()} onChange={(e) => setDayOff(e.target.value)} aria-label="Day off" />
            <button
              className={softBtn}
              disabled={!dayOff}
              onClick={() => {
                set({ blocked: [...new Set([...s.blocked, dayOff])].sort() });
                setDayOff("");
              }}
            >
              <PlusIcon className="size-4" /> Add this day off
            </button>
          </div>
          {s.blocked.filter((d) => d >= todayInMontreal()).length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {s.blocked
                .filter((d) => d >= todayInMontreal())
                .map((d) => (
                  <li key={d} className="inline-flex items-center gap-2 rounded-full bg-cream-deep py-1.5 pl-4 pr-1.5 ring-1 ring-sand">
                    {dayOf(d)}
                    <button aria-label={`Remove ${d}`} onClick={() => set({ blocked: s.blocked.filter((x) => x !== d) })} className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white">
                      <CloseIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </Step>

        <Upcoming />
      </div>
    </>
  );
}

// Booked showings: today and coming up (soonest first), and the last two weeks to mark who came.
// Cancelling frees the time for someone else.
function Upcoming() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  useEffect(() => {
    listLeads().then(setLeads);
  }, []);
  const now = useNow();
  const today = todayInMontreal();
  const twoWeeksAgo = new Date(now - 14 * 864e5).toISOString().slice(0, 10);
  const key = (l: Lead) => `${l.showing!.date} ${l.showing!.time}`;
  const booked = (leads ?? []).filter((l) => l.showing && l.status !== "closed");
  const upcoming = booked.filter((l) => l.showing!.date >= today).sort((a, b) => key(a).localeCompare(key(b)));
  const past = booked.filter((l) => l.showing!.date < today && l.showing!.date >= twoWeeksAgo).sort((a, b) => key(b).localeCompare(key(a)));

  const cancel = async (l: Lead) => {
    if (!confirm(`Cancel ${l.name}'s showing? The time becomes free again. (They aren't emailed automatically; let them know.)`)) return;
    const next = await updateLead(l.id, { status: "closed" });
    if (next) setLeads(next);
  };

  const row = (l: Lead, canCancel: boolean) => (
    <li key={l.id} className="space-y-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            {dayOf(l.showing!.date)} at {l.showing!.time}
          </p>
          <p className="text-brown-soft">
            {l.name} · <a href={`tel:${l.phone}`} className="underline">{l.phone}</a>
            {l.type ? ` · ${l.type}` : ""}
          </p>
        </div>
        {canCancel && !l.attendance && (
          <button className={`${softBtn} text-red-800`} onClick={() => cancel(l)}>
            Cancel
          </button>
        )}
      </div>
      <Attendance lead={l} onLeads={setLeads} />
    </li>
  );

  return (
    <>
      <AddByHand onLeads={setLeads} />
      <Step title="Today and coming up" help="Everyone who booked a time. From 15 minutes before a showing, mark whether they came: people who came get the follow-up email.">
        {!leads ? <p className="text-brown-soft">Loading…</p> : upcoming.length === 0 ? <p className="text-brown-soft">No showings booked yet.</p> : <ul className="divide-y divide-sand">{upcoming.map((l) => row(l, true))}</ul>}
      </Step>
      {past.length > 0 && (
        <Step title="Last two weeks">
          <ul className="divide-y divide-sand">{past.map((l) => row(l, false))}</ul>
        </Step>
      )}
    </>
  );
}

// Add a showing booked by phone (or a test): any day and time, even right now.
function AddByHand({ onLeads }: { onLeads: (l: Lead[]) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const now = new Date();
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    phone: "",
    date: todayInMontreal(),
    time: new Intl.DateTimeFormat("en-CA", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Montreal" }).format(now),
    type: "",
    lang: "en" as "fr" | "en",
    confirm: true,
  }));
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Step title="Add a showing by hand" help="For showings booked by phone, or to test the emails. Any day and time, even right now. From 15 minutes before it, you can mark whether they came.">
      {!open ? (
        <button className={softBtn} onClick={() => setOpen(true)}>
          <PlusIcon className="size-4" /> Add a showing
        </button>
      ) : (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMsg("");
            const res = await addShowingByHand(form);
            setBusy(false);
            if (!res.ok) return setMsg(res.error);
            onLeads(res.leads);
            setMsg(`Added${form.confirm ? `, and the confirmation was sent to ${form.email}` : ""}.`);
            set({ name: "", email: "", phone: "" });
          }}
        >
          <label className="block">
            <span className="mb-1 block font-medium">Name</span>
            <input className={field} required value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Email</span>
            <input className={field} type="email" required value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Phone</span>
            <input className={field} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Language of the emails</span>
            <select className={field} value={form.lang} onChange={(e) => set({ lang: e.target.value as "fr" | "en" })}>
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Day</span>
            <input className={field} type="date" required value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Time</span>
            <input className={field} type="time" required value={form.time} onChange={(e) => set({ time: e.target.value })} />
          </label>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" className="size-5 accent-[#503d32]" checked={form.confirm} onChange={(e) => set({ confirm: e.target.checked })} />
            Send them the confirmation email
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button className={bigBtn} disabled={busy}>
              {busy ? "Adding…" : "Add the showing"}
            </button>
            <button type="button" className={softBtn} onClick={() => setOpen(false)}>
              Close
            </button>
            {msg && <span className="text-brown">{msg}</span>}
          </div>
        </form>
      )}
    </Step>
  );
}

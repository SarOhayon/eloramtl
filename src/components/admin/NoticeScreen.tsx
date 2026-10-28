"use client";

import { scheduleState, todayInMontreal, type Notice, type SiteContent } from "@/data/content";
import { holidayBanners } from "@/lib/holidays";
import { CalendarIcon, MegaphoneIcon, PlusIcon, TrashIcon } from "./AdminIcons";
import { BilingualFields, ScheduleStatus, ScreenTitle, Switch, bigBtn, field, softBtn, type Update } from "./ui";

const longDay = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const dayOf = (d: string) => longDay.format(new Date(`${d}T00:00:00Z`));
const bySchedule = (a: Notice, b: Notice) => (a.start ?? "").localeCompare(b.start ?? "");

// Thin message bars at the top of the website, scheduled for holidays and special days.
export function NoticeScreen({ content, update }: { content: SiteContent; update: Update }) {
  const notices = content.notices;
  // The list keeps its order while you edit (a new banner stays on top); it's sorted by date when saved.
  const setAll = (fn: (list: Notice[]) => Notice[]) => update((c) => ({ ...c, notices: fn(c.notices) }));
  const edit = (id: string, patch: Partial<Notice>) => setAll((l) => l.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const add = () =>
    setAll((l) => [{ id: `banner-${Date.now()}`, enabled: true, start: todayInMontreal(), text: { fr: "", en: "" } }, ...l]);
  const missingHolidays = holidayBanners(todayInMontreal()).filter((h) => !notices.some((n) => n.id === h.id));

  return (
    <>
      <ScreenTitle
        icon={<MegaphoneIcon className="size-5" />}
        title="Special-day banners"
        help="Thin messages across the top of the website, for holidays, office closures or special events. Schedule as many as you like, up to a year ahead: each one appears and disappears by itself on its dates."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <button className={bigBtn} onClick={add}>
          <PlusIcon className="size-5" /> Add a banner
        </button>
        {missingHolidays.length > 0 && (
          <button className={softBtn} onClick={() => setAll((l) => [...l, ...missingHolidays].sort(bySchedule))}>
            <CalendarIcon className="size-5" /> Add the Québec holidays for the next 12 months ({missingHolidays.length})
          </button>
        )}
      </div>
      {missingHolidays.length > 0 && (
        <p className="-mt-3 mb-6 text-sm text-brown-soft">
          Holiday banners say the office is closed that day and show from 3 days before. You can change the words or dates, or remove any you don’t need.
        </p>
      )}

      {notices.length === 0 ? (
        <p className="rounded-lg bg-cream p-6 text-brown-soft ring-1 ring-sand">No banners yet. Click “Add a banner” to write one.</p>
      ) : (
        <ul className="space-y-4">
          {notices.map((n) => (
            <li key={n.id} className="rounded-lg bg-cream p-5 shadow-sm ring-1 ring-sand">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-ink">
                    {n.start ? dayOf(n.start) : "From now"}
                    {n.end && n.end !== n.start ? ` – ${dayOf(n.end)}` : ""}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    <ScheduleStatus state={scheduleState(n)} />
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch on={n.enabled} onChange={(v) => edit(n.id, { enabled: v })} label={n.enabled ? "On" : "Off"} />
                  <button
                    aria-label="Delete this banner"
                    title="Delete this banner"
                    onClick={() => confirm("Delete this banner?") && setAll((l) => l.filter((x) => x.id !== n.id))}
                    className="inline-flex size-10 items-center justify-center rounded-full text-brown-soft ring-1 ring-brown/15 transition hover:bg-white hover:text-red-800"
                  >
                    <TrashIcon className="size-[18px]" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(["start", "end"] as const).map((k) => (
                  <label key={k} className="block">
                    <span className="mb-1 block text-sm font-medium">{k === "start" ? "First day" : "Last day (optional)"}</span>
                    <input type="date" className={field} value={n[k] ?? ""} onChange={(e) => edit(n.id, { [k]: e.target.value || undefined })} />
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <BilingualFields label="Message" value={n.text} onChange={(v) => edit(n.id, { text: v })} />
              </div>
              <p className="mt-4 rounded-sm bg-brown px-4 py-2.5 text-center text-sm tracking-wide text-cream">
                <span className="mr-2 text-gold-light">✦</span>
                {n.text.en || <span className="opacity-60">(preview of the message)</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

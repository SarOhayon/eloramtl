"use client";

import { scheduleState, type Notice, type SiteContent } from "@/data/content";
import { MegaphoneIcon } from "./AdminIcons";
import { BilingualFields, ScheduleStatus, ScreenTitle, Step, Switch, field, softBtn, type Update } from "./ui";

// The thin message bar at the top of the website, for holidays and special days.
export function NoticeScreen({ content, update }: { content: SiteContent; update: Update }) {
  const n = content.notice;
  const set = (patch: Partial<Notice>) => update((c) => ({ ...c, notice: { ...c.notice, ...patch } }));

  return (
    <>
      <ScreenTitle
        icon={<MegaphoneIcon className="size-5" />}
        title="Special-day banner"
        help="A thin message across the top of the website, for holidays, office closures or special events. Turn it on, pick the dates, and write the message."
      />
      <div className="space-y-6">
        <Step n={1} title="Turn it on or off">
          <Switch on={n.enabled} onChange={(v) => set({ enabled: v })} label={n.enabled ? "The banner is ON" : "The banner is OFF"} />
          <p className="mt-3 font-medium">
            <ScheduleStatus state={scheduleState(n)} />
          </p>
        </Step>

        <Step n={2} title="When does it show?" help="Leave a date empty if it has no start or no end. It appears and disappears by itself on these dates.">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["start", "end"] as const).map((k) => (
              <label key={k} className="block">
                <span className="mb-1 block font-medium">{k === "start" ? "First day" : "Last day"}</span>
                <div className="flex gap-2">
                  <input type="date" className={field} value={n[k] ?? ""} onChange={(e) => set({ [k]: e.target.value || undefined })} />
                  {n[k] && (
                    <button className={softBtn} onClick={() => set({ [k]: undefined })}>
                      Clear
                    </button>
                  )}
                </div>
              </label>
            ))}
          </div>
        </Step>

        <Step n={3} title="The message" help="Keep it short, one sentence. Write it in French and in English.">
          <BilingualFields label="Message" value={n.text} onChange={(v) => set({ text: v })} />
        </Step>

        <Step title="Preview">
          {(["fr", "en"] as const).map((l) => (
            <p key={l} className="mb-2 rounded-sm bg-brown px-4 py-2.5 text-center text-sm tracking-wide text-cream last:mb-0">
              <span className="mr-2 text-gold-light">✦</span>
              {n.text[l] || <span className="opacity-60">{l === "fr" ? "(message in French)" : "(message in English)"}</span>}
            </p>
          ))}
        </Step>
      </div>
    </>
  );
}

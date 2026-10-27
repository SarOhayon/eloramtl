"use client";

import { useState } from "react";
import { markAttendance } from "@/app/actions/leads";
import type { Lead } from "@/lib/leads";
import { montrealToUtc } from "@/lib/showingSlots";
import { useNow } from "./ui";

const when = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Montreal" });

// "Did they come?" for a booked showing, from 15 minutes before it starts. Marking "Came" schedules
// the follow-up email (Automatic emails); the note says when it goes or went out.
export function Attendance({ lead, onLeads }: { lead: Lead; onLeads: (l: Lead[]) => void }) {
  const [busy, setBusy] = useState(false);
  const now = useNow();
  if (!lead.showing) return null;
  const opensAt = montrealToUtc(lead.showing.date, lead.showing.time).getTime() - 15 * 60e3;
  if (now < opensAt) return <p className="text-sm text-brown-soft">You can mark attendance from 15 minutes before the showing.</p>;

  const mark = async (value: "came" | "no-show" | null) => {
    setBusy(true);
    const next = await markAttendance(lead.id, value);
    if (next) onLeads(next);
    setBusy(false);
  };
  const btn = (on: boolean, tone: string) => `rounded-md px-4 py-2 text-sm ring-1 transition disabled:opacity-50 ${on ? tone : "bg-white ring-brown/20 hover:ring-brown/40"}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-brown">Did they come?</span>
      <button disabled={busy} onClick={() => mark(lead.attendance === "came" ? null : "came")} className={btn(lead.attendance === "came", "bg-[#3b6b45] text-white ring-[#3b6b45]")}>
        {lead.attendance === "came" ? "✓ Came" : "Came"}
      </button>
      <button disabled={busy} onClick={() => mark(lead.attendance === "no-show" ? null : "no-show")} className={btn(lead.attendance === "no-show", "bg-brown text-white ring-brown")}>
        {lead.attendance === "no-show" ? "✓ No-show" : "No-show"}
      </button>
      {lead.followUp && (
        <span className="text-sm text-brown-soft">
          {lead.followUp.sentAt ? `Follow-up sent ${when.format(new Date(lead.followUp.sentAt))}` : `Follow-up email on ${when.format(new Date(lead.followUp.due))}`}
        </span>
      )}
    </div>
  );
}

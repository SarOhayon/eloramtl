"use server";

import { isAdmin } from "@/lib/adminAuth";
import { getContent } from "@/lib/content";
import { runDueJobs } from "@/lib/jobs";
import { changeLead, changeLeads, readLeads, type Lead, type LeadStatus } from "@/lib/leads";
import { montrealToUtc } from "@/lib/showingSlots";

const STATUSES: LeadStatus[] = ["new", "contacted", "toured", "leased", "closed"];

export async function listLeads(): Promise<Lead[] | null> {
  if (!(await isAdmin())) return null;
  // Opening the admin also sends any scheduled emails that are due.
  await runDueJobs().catch((err) => console.error("[jobs] failed", err));
  return readLeads();
}

export async function updateLead(id: string, patch: { status?: LeadStatus; note?: string }): Promise<Lead[] | null> {
  if (!(await isAdmin())) return null;
  const clean: { status?: LeadStatus; note?: string } = {};
  if (patch.status && STATUSES.includes(patch.status)) clean.status = patch.status;
  if (typeof patch.note === "string") clean.note = patch.note.slice(0, 2000);
  try {
    return await changeLead(String(id), clean);
  } catch (err) {
    console.error("[leads] update failed", err);
    return null;
  }
}

// Marks whether someone came to their showing (from 15 minutes before it starts). Coming moves them
// to Toured and schedules the follow-up email; a no-show or an undo cancels a follow-up not yet sent.
export async function markAttendance(id: string, attendance: "came" | "no-show" | null): Promise<Lead[] | null> {
  if (!(await isAdmin())) return null;
  const { emails } = await getContent();
  return changeLeads((l) => {
    if (l.id !== String(id) || !l.showing) return null;
    if (Date.now() < montrealToUtc(l.showing.date, l.showing.time).getTime() - 15 * 60e3) return null;
    const followUp = l.followUp?.sentAt
      ? l.followUp
      : attendance === "came"
        ? { due: followUpDue(l.showing.date, emails.followUp.days) }
        : undefined;
    return {
      attendance: attendance ?? undefined,
      followUp,
      ...(attendance === "came" && (l.status === "new" || l.status === "contacted") ? { status: "toured" as const } : {}),
    };
  });
}

// The follow-up goes out at 10 a.m. (Montréal), a few days after the showing.
function followUpDue(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return montrealToUtc(d.toISOString().slice(0, 10), "10:00").toISOString();
}

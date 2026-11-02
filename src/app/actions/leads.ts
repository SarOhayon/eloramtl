"use server";

import { UNITS } from "@/data/building";
import { isAdmin } from "@/lib/adminAuth";
import { getContent } from "@/lib/content";
import { runDueJobs } from "@/lib/jobs";
import { sendFollowUp, sendShowingEmails } from "@/lib/autoEmail";
import { addLead, changeLead, changeLeads, readLeads, type Lead, type LeadStatus } from "@/lib/leads";
import { sendCheatSheet, type CheatSheetResult } from "@/lib/briefs";
import { extractLead, importInboxLeads, inboxConfigured, readInboxState, type ExtractedLead, type InboxState } from "@/lib/inboxLeads";
import { montrealToUtc } from "@/lib/showingSlots";

const STATUSES: LeadStatus[] = ["new", "contacted", "toured", "leased", "closed"];

export async function listLeads(): Promise<Lead[] | null> {
  if (!(await isAdmin())) return null;
  // Opening the admin also sends any scheduled emails that are due.
  await runDueJobs().catch((err) => console.error("[jobs] failed", err));
  return readLeads();
}

// `snooze` restarts the 4-day follow-up reminder without changing the status.
export async function updateLead(id: string, patch: { status?: LeadStatus; note?: string; snooze?: boolean; units?: string[] }): Promise<Lead[] | null> {
  if (!(await isAdmin())) return null;
  const clean: { status?: LeadStatus; note?: string; statusAt?: string; units?: string[] } = {};
  if (patch.status && STATUSES.includes(patch.status)) clean.status = patch.status;
  if (typeof patch.note === "string") clean.note = patch.note.slice(0, 2000);
  if (patch.snooze) clean.statusAt = new Date().toISOString();
  if (Array.isArray(patch.units)) {
    const ids = new Set(UNITS.map((u) => u.id));
    const units = [...new Set(patch.units.map(String))].filter((u) => ids.has(u)).slice(0, 30);
    clean.units = units.length ? units : undefined;
  }
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

// A showing added by hand (booked by phone, or to test the emails). Any day and time, even right
// now; it can send the usual confirmation email.
export async function addShowingByHand(input: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  type?: string;
  lang: "fr" | "en";
  confirm: boolean;
}): Promise<{ ok: true; leads: Lead[] } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Please sign in again." };
  const name = String(input.name ?? "").trim().slice(0, 200);
  const email = String(input.email ?? "").trim().slice(0, 200);
  const phone = String(input.phone ?? "").trim().slice(0, 60);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Add a name and a valid email." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) return { ok: false, error: "Pick a day and a time." };
  const lead = await addLead({
    kind: "showing",
    name,
    email,
    phone,
    type: String(input.type ?? "").slice(0, 60) || undefined,
    lang: input.lang === "fr" ? "fr" : "en",
    showing: { date: input.date, time: input.time },
    comments: "Added by hand in the admin.",
  });
  if (!lead) return { ok: false, error: "Couldn't save it. Try again." };
  if (input.confirm) await sendShowingEmails(lead, { team: false });
  return { ok: true, leads: await readLeads() };
}

// Sends the follow-up right away instead of waiting for its day (for someone marked "Came").
export async function sendFollowUpNow(id: string): Promise<Lead[] | null> {
  if (!(await isAdmin())) return null;
  const lead = (await readLeads()).find((l) => l.id === String(id));
  if (!lead || lead.attendance !== "came" || !(await sendFollowUp(lead))) return null;
  return changeLead(lead.id, { followUp: { due: lead.followUp?.due ?? new Date().toISOString(), sentAt: new Date().toISOString() } });
}

// Books (or moves) a showing for someone already in Inquiries, e.g. after talking with them.
// No time limits; it then works like a website booking (check-in, follow-up). Moving it clears
// any check-in and follow-up not sent yet.
export async function scheduleShowing(id: string, date: string, time: string, confirm: boolean): Promise<{ ok: true; leads: Lead[] } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Please sign in again." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, error: "Pick a day and a time." };
  const leads = await changeLeads((l) =>
    l.id === String(id)
      ? {
          showing: { date, time },
          attendance: undefined,
          followUp: l.followUp?.sentAt ? l.followUp : undefined,
          ...(l.status === "closed" ? { status: "contacted" as const } : {}),
        }
      : null,
  );
  const lead = leads?.find((l) => l.id === String(id));
  if (!leads || !lead) return { ok: false, error: "This inquiry no longer exists." };
  if (confirm) await sendShowingEmails(lead, { team: false });
  return { ok: true, leads };
}

// Leads from the mailbox: when it last checked, and a button to check right away.
export async function inboxStatus(): Promise<{ configured: boolean; aiReady: boolean; state: InboxState } | null> {
  if (!(await isAdmin())) return null;
  return { configured: inboxConfigured(), aiReady: Boolean(process.env.ANTHROPIC_API_KEY), state: await readInboxState() };
}

export async function checkInboxNow(): Promise<{ ok: boolean; added: number; error?: string; leads?: Lead[]; state?: InboxState } | null> {
  if (!(await isAdmin())) return null;
  const res = await importInboxLeads();
  return { ...res, leads: await readLeads(), state: await readInboxState() };
}

// An inquiry that came another way (phone, text, Instagram, an email): typed in by the team.
// Nobody is emailed.
export async function addInquiryByHand(input: { name: string; email: string; phone: string; type?: string; moveIn?: string; source?: string; comments?: string; lang: "fr" | "en" }): Promise<{ ok: true; leads: Lead[] } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Please sign in again." };
  const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const name = str(input.name, 200);
  const email = str(input.email, 200);
  const phone = str(input.phone, 60);
  if (!name) return { ok: false, error: "Add their name." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "That email doesn't look right." };
  if (!email && !phone) return { ok: false, error: "Add an email or a phone number." };
  const lead = await addLead({
    kind: "inquiry",
    name,
    email,
    phone,
    type: str(input.type, 60) || undefined,
    moveIn: /^\d{4}-\d{2}-\d{2}$/.test(str(input.moveIn, 10)) ? str(input.moveIn, 10) : undefined,
    comments: str(input.comments, 4000) || undefined,
    source: str(input.source, 40) || "Added by hand",
    lang: input.lang === "fr" ? "fr" : "en",
  });
  if (!lead) return { ok: false, error: "Couldn't save it. Try again." };
  return { ok: true, leads: await readLeads() };
}

// Fills the "Add an inquiry" form from a pasted email or message, with the AI.
export async function readPastedLead(text: string): Promise<{ ok: true; lead: ExtractedLead } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Please sign in again." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "The AI isn't set up yet, so fill in the fields yourself." };
  const pasted = String(text ?? "").slice(0, 15000);
  if (pasted.trim().length < 10) return { ok: false, error: "Paste the email or message first." };
  try {
    const lead = await extractLead({ from: "", replyTo: "", subject: "", text: pasted });
    return lead ? { ok: true, lead } : { ok: false, error: "This doesn't look like someone asking to rent." };
  } catch (err) {
    console.error("[leads] read pasted", err);
    return { ok: false, error: "The AI didn't answer. Try again in a moment." };
  }
}

// Emails the pre-tour cheat sheet to the leasing inbox: automatically right after someone is
// checked in ("Came"), or any time with `manual` (the "Email me the cheat sheet" button).
export async function sendCheatSheetNow(id: string, manual = false): Promise<CheatSheetResult> {
  if (!(await isAdmin())) return { sent: false, reason: "Please sign in again." };
  return sendCheatSheet(String(id), { manual }).catch((err) => {
    console.error("[leads] cheat sheet", err);
    return { sent: false, reason: "Something went wrong. Try the button again." };
  });
}

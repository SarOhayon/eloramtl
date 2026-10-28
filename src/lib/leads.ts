import { randomBytes } from "node:crypto";
import { getFile, putFile } from "./storage";

// Every inquiry, application and showing booked on the website, for the admin inbox.
// Kept in one file (leads/index.json); the site gets a handful a day, so a single list is plenty.

export type LeadKind = "inquiry" | "application" | "showing";
export type LeadStatus = "new" | "contacted" | "toured" | "leased" | "closed";
export type Lead = {
  id: string;
  createdAt: string; // ISO
  kind: LeadKind;
  name: string;
  email: string;
  phone: string;
  type?: string; // suite type
  moveIn?: string; // YYYY-MM-DD
  comments?: string;
  lang: "fr" | "en";
  showing?: { date: string; time: string }; // YYYY-MM-DD, HH:MM (Montréal)
  status: LeadStatus;
  statusAt?: string; // ISO: when the status last changed (or a reminder was snoozed)
  note?: string; // the team's own note
  suggestion?: Suggestion; // AI suggestion of suites, kept until asked again
  attendance?: "came" | "no-show"; // for showings, marked by the team
  followUp?: { due: string; sentAt?: string }; // ISO times of the follow-up email after a showing
  bookToken?: string; // secret in their personal booking link (sent in the auto-reply)
  units?: string[]; // suites the team picked to show them (admin only, never emailed)
};
export type Suggestion = { at: string; summary: string; picks: { unit: string; reason: string }[]; ask: string };

const KEY = "leads/index.json";
const MAX = 2000;

export async function readLeads(): Promise<Lead[]> {
  try {
    const raw = await getFile(KEY);
    return raw ? (JSON.parse(raw.toString("utf8")) as Lead[]) : [];
  } catch (err) {
    console.error("[leads] could not read", err);
    return [];
  }
}

// The lead a personal booking link belongs to.
export async function findByToken(token: string): Promise<Lead | null> {
  if (!/^[\w-]{16}$/.test(token)) return null;
  return (await readLeads()).find((l) => l.bookToken === token) ?? null;
}

const write = (leads: Lead[]) => putFile(KEY, JSON.stringify(leads.slice(0, MAX)), "application/json");

// Adds a lead (newest first). Returns false if it couldn't be stored.
export async function addLead(lead: Omit<Lead, "id" | "createdAt" | "status">): Promise<Lead | null> {
  const full: Lead = { bookToken: randomBytes(12).toString("base64url"), ...lead, id: `${Date.now()}-${randomBytes(3).toString("hex")}`, createdAt: new Date().toISOString(), status: "new" };
  try {
    await write([full, ...(await readLeads())]);
    return full;
  } catch (err) {
    console.error("[leads] could not save", err);
    return null;
  }
}

type Patch = Partial<Pick<Lead, "status" | "statusAt" | "note" | "suggestion" | "attendance" | "followUp" | "showing" | "units">>;

// Changes one lead; a field set to undefined is removed.
export async function changeLead(id: string, patch: Patch): Promise<Lead[] | null> {
  return changeLeads((l) => (l.id === id ? patch : null));
}

// Changes every lead the function returns a patch for (one read and one write).
export async function changeLeads(fn: (l: Lead) => Patch | null): Promise<Lead[] | null> {
  const leads = await readLeads();
  let changed = false;
  for (let i = 0; i < leads.length; i++) {
    const patch = fn(leads[i]);
    if (!patch) continue;
    const next: Lead = { ...leads[i], ...patch };
    if (patch.status && patch.status !== leads[i].status) next.statusAt = new Date().toISOString();
    for (const k of Object.keys(patch) as (keyof Patch)[]) if (patch[k] === undefined) delete next[k];
    leads[i] = next;
    changed = true;
  }
  if (!changed) return null;
  await write(leads);
  return leads;
}


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
  note?: string; // the team's own note
};

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

const write = (leads: Lead[]) => putFile(KEY, JSON.stringify(leads.slice(0, MAX)), "application/json");

// Adds a lead (newest first). Returns false if it couldn't be stored.
export async function addLead(lead: Omit<Lead, "id" | "createdAt" | "status">): Promise<Lead | null> {
  const full: Lead = { ...lead, id: `${Date.now()}-${randomBytes(3).toString("hex")}`, createdAt: new Date().toISOString(), status: "new" };
  try {
    await write([full, ...(await readLeads())]);
    return full;
  } catch (err) {
    console.error("[leads] could not save", err);
    return null;
  }
}

export async function changeLead(id: string, patch: Partial<Pick<Lead, "status" | "note">>): Promise<Lead[] | null> {
  const leads = await readLeads();
  const i = leads.findIndex((l) => l.id === id);
  if (i < 0) return null;
  leads[i] = { ...leads[i], ...patch };
  await write(leads);
  return leads;
}

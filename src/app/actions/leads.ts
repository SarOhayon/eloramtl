"use server";

import { isAdmin } from "@/lib/adminAuth";
import { changeLead, readLeads, type Lead, type LeadStatus } from "@/lib/leads";

const STATUSES: LeadStatus[] = ["new", "contacted", "toured", "leased", "closed"];

export async function listLeads(): Promise<Lead[] | null> {
  if (!(await isAdmin())) return null;
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

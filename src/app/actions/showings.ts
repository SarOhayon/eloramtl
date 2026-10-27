"use server";

import { sendShowingEmails } from "@/lib/autoEmail";
import { getContent } from "@/lib/content";
import { addLead, readLeads } from "@/lib/leads";
import { freeSlots, type DaySlots } from "@/lib/showingSlots";
import { countEvent } from "@/lib/stats";

// Showing times visitors can book from the inquiry pop-up (empty when booking is turned off).
export async function getShowingSlots(): Promise<DaySlots[]> {
  const { showings } = await getContent();
  if (!showings.enabled) return [];
  return freeSlots(showings, await bookedShowings());
}

async function bookedShowings() {
  return (await readLeads()).filter((l) => l.showing && l.status !== "closed").map((l) => l.showing!);
}

export type BookState = { status: "idle" | "booked" | "invalid" | "taken" | "error"; values?: Record<string, string>; when?: { date: string; time: string } };

export async function bookShowing(_prev: BookState, formData: FormData): Promise<BookState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 2000);
  const v: Record<string, string> = {};
  for (const k of ["date", "time", "name", "email", "phone", "type", "moveIn", "comments", "lang"]) v[k] = get(k);
  const lang = v.lang === "fr" ? "fr" : "en";

  if (!v.name || v.phone.replace(/\D/g, "").length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) || !/^\d{4}-\d{2}-\d{2}$/.test(v.moveIn)) {
    return { status: "invalid", values: v };
  }
  // Check the time is still free right before booking it.
  const { showings } = await getContent();
  const open = freeSlots(showings, await bookedShowings()).some((d) => d.date === v.date && d.times.includes(v.time));
  if (!open) return { status: "taken", values: v };

  const lead = await addLead({
    kind: "showing",
    name: v.name,
    email: v.email,
    phone: v.phone,
    type: v.type || undefined,
    moveIn: v.moveIn,
    comments: v.comments || undefined,
    lang,
    showing: { date: v.date, time: v.time },
  });
  if (!lead) return { status: "error", values: v };
  await countEvent("showing");

  await sendShowingEmails(lead, { team: true });
  return { status: "booked", when: { date: v.date, time: v.time } };
}

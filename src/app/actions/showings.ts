"use server";

import { sendShowingEmails } from "@/lib/autoEmail";
import { getContent } from "@/lib/content";
import { changeLead, findByToken, readLeads } from "@/lib/leads";
import { freeSlots } from "@/lib/showingSlots";
import { countEvent } from "@/lib/stats";

export type BookState = { status: "idle" | "booked" | "invalid" | "taken" | "closed" | "error"; when?: { date: string; time: string } };

// Books (or moves) a showing from someone's personal link in the inquiry auto-reply. This is the
// only way visitors can book: the link's token identifies who they are.
export async function bookByLink(_prev: BookState, formData: FormData): Promise<BookState> {
  const token = String(formData.get("token") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const lead = await findByToken(token);
  if (!lead || lead.status === "closed") return { status: "invalid" };
  const { showings } = await getContent();
  if (!showings.enabled) return { status: "closed" };

  // Check the time is still free right before booking it (their own current booking doesn't count).
  const booked = (await readLeads()).filter((l) => l.showing && l.status !== "closed" && l.id !== lead.id).map((l) => l.showing!);
  if (!freeSlots(showings, booked).some((d) => d.date === date && d.times.includes(time))) return { status: "taken", when: { date, time } };

  const showing = { date, time };
  const saved = await changeLead(lead.id, { showing, attendance: undefined, followUp: undefined });
  if (!saved) return { status: "error" };
  await countEvent("showing");
  await sendShowingEmails({ ...lead, showing }, { team: true });
  return { status: "booked", when: showing };
}

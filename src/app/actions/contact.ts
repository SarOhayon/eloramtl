"use server";

import { autoReply, sendTeamNotice } from "@/lib/autoEmail";
import { addLead } from "@/lib/leads";
import { countEvent } from "@/lib/stats";

export type ContactState = { status: "idle" | "sent" | "invalid" | "error"; values?: Record<string, string> };

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 4000);
  const v: Record<string, string> = {};
  for (const k of ["name", "email", "phone", "type", "moveIn", "comments"]) v[k] = get(k);
  const lang = get("lang") === "fr" ? "fr" : "en";

  if (!v.name || !v.phone || !/^\d{4}-\d{2}-\d{2}$/.test(v.moveIn) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return { status: "invalid", values: v };

  // Saved for the admin inbox and emailed; either one is enough to count as received.
  const [saved, sent] = await Promise.all([
    addLead({ kind: "inquiry", name: v.name, email: v.email, phone: v.phone, type: v.type || undefined, moveIn: v.moveIn, comments: v.comments || undefined, lang }),
    sendTeamNotice({
      subject: `Elora inquiry: ${v.name}`,
      heading: `New inquiry from ${v.name}`,
      rows: [
        ["Phone", v.phone],
        ["Email", v.email],
        ["Suite type", v.type || "Not sure yet"],
        ["Move-in date", v.moveIn],
        ["Language", lang === "fr" ? "French" : "English"],
      ],
      note: v.comments || undefined,
      replyTo: v.email,
    }),
  ]);
  if (!saved && !sent) return { status: "error", values: v };
  await Promise.all([countEvent("inquiry"), autoReply(saved || { name: v.name, email: v.email, lang })]);
  return { status: "sent" };
}


"use server";

import { autoReply, sendTeamNotice } from "@/lib/autoEmail";
import { addLead } from "@/lib/leads";
import { countEvent } from "@/lib/stats";

export type ApplyField = "name" | "phone" | "email" | "moveIn";
// `values` echoes what was typed, so the form can refill itself after a failed check.
export type ApplyState = { status: "idle" | "sent" | "invalid" | "error"; invalid?: ApplyField[]; values?: Record<string, string> };

type Application = { name: string; phone: string; email: string; moveIn: string; comments: string; lang: string };

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 2000);
  const app: Application = {
    name: get("name"),
    phone: get("phone"),
    email: get("email"),
    moveIn: get("moveIn"),
    comments: get("comments"),
    lang: get("lang") === "fr" ? "fr" : "en",
  };

  const invalid: ApplyField[] = [];
  if (!app.name) invalid.push("name");
  if (app.phone.replace(/\D/g, "").length < 10) invalid.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) invalid.push("email");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(app.moveIn)) invalid.push("moveIn");
  if (invalid.length) return { status: "invalid", invalid, values: app };

  // Saved for the admin inbox and emailed; either one is enough to count as received.
  const [saved, sent] = await Promise.all([
    addLead({ kind: "application", name: app.name, email: app.email, phone: app.phone, moveIn: app.moveIn, comments: app.comments || undefined, lang: app.lang === "fr" ? "fr" : "en" }),
    sendTeamNotice({
      subject: `Elora application: ${app.name} (move-in ${app.moveIn})`,
      heading: `New application from ${app.name}`,
      rows: [
        ["Phone", app.phone],
        ["Email", app.email],
        ["Move-in date", app.moveIn],
        ["Language", app.lang === "fr" ? "French" : "English"],
      ],
      note: app.comments || undefined,
      replyTo: app.email,
    }),
  ]);
  if (!saved && !sent) return { status: "error", values: app };
  await Promise.all([countEvent("application"), autoReply(app.name, app.email, app.lang === "fr" ? "fr" : "en")]);
  return { status: "sent" };
}


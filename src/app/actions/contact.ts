"use server";

import { sendMail } from "@/lib/mail";

export type ContactState = { status: "idle" | "sent" | "invalid" | "error"; values?: Record<string, string> };

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 4000);
  const v: Record<string, string> = {};
  for (const k of ["name", "email", "phone", "type", "moveIn", "comments"]) v[k] = get(k);

  if (!v.name || !v.phone || !v.comments || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return { status: "invalid", values: v };

  const lines = [
    `Name: ${v.name}`,
    `Email: ${v.email}`,
    `Phone: ${v.phone}`,
    `Suite type: ${v.type || "Not sure yet"}`,
    v.moveIn ? `Move-in date: ${v.moveIn}` : null,
    "",
    v.comments,
  ];
  const sent = await sendMail({ subject: `Elora inquiry: ${v.name}`, text: lines.filter((l) => l !== null).join("\n"), replyTo: v.email });
  return sent ? { status: "sent" } : { status: "error", values: v };
}

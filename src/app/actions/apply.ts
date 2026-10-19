"use server";

import { APPLY_TO_EMAIL } from "@/data/building";

export type ApplyField = "name" | "phone" | "email" | "moveIn";
// `values` echoes what was typed, so the form can refill itself after a failed check.
export type ApplyState = { status: "idle" | "sent" | "invalid"; invalid?: ApplyField[]; values?: Record<string, string> };

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

  await deliver(app);
  return { status: "sent" };
}

async function deliver(app: Application) {
  const subject = `Elora application: ${app.name} (move-in ${app.moveIn})`;
  const text = [
    `Name: ${app.name}`,
    `Phone: ${app.phone}`,
    `Email: ${app.email}`,
    `Move-in date: ${app.moveIn}`,
    `Language: ${app.lang.toUpperCase()}`,
    "",
    app.comments || "(no comments)",
  ].join("\n");

  // Email delivery is not connected yet. To turn it on, send { to: APPLY_TO_EMAIL,
  // replyTo: app.email, subject, text } with an email service (Web3Forms, Formspree
  // or Resend) right here. Until then the application is only logged on the server.
  console.info(`[apply] for ${APPLY_TO_EMAIL}: ${subject}\n${text}`);
}

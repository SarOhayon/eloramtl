"use server";

import { findIssue, ROOMS, SINCE } from "@/data/maintenance";
import { sendMail } from "@/lib/mail";

export type MaintenanceState = { status: "idle" | "sent" | "invalid" | "error"; values?: Record<string, string> };

export async function submitMaintenance(_prev: MaintenanceState, formData: FormData): Promise<MaintenanceState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 4000);
  const v: Record<string, string> = {};
  for (const k of ["category", "issue", "room", "since", "description", "name", "suite", "phone", "email", "access", "bestTime"]) v[k] = get(k);

  const found = findIssue(v.category, v.issue);
  const valid = found && v.description && v.name && v.suite && v.phone && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
  if (!valid) return { status: "invalid", values: v };

  const { category, issue } = found;
  const en = (list: { fr: string; en: string }[], value: string) => list.find((x) => x.fr === value || x.en === value)?.en ?? value;
  const text = [
    `Urgent: ${issue.urgent ? "YES" : "no"}`,
    `Category: ${category.label.en}`,
    `Issue: ${issue.label.en}`,
    v.room ? `Room: ${en(ROOMS, v.room)}` : null,
    v.since ? `Started: ${en(SINCE, v.since)}` : null,
    "",
    `Suite: ${v.suite}`,
    `Name: ${v.name}`,
    `Phone: ${v.phone}`,
    `Email: ${v.email}`,
    `May enter when absent: ${v.access ? "Yes" : "No"}`,
    v.bestTime ? `Best time: ${v.bestTime}` : null,
    "",
    "Description:",
    v.description,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const sent = await sendMail({
    to: category.sendTo,
    replyTo: v.email,
    subject: `${issue.urgent ? "[URGENT] " : ""}Maintenance · Suite ${v.suite} · ${category.label.en}: ${issue.label.en}`,
    text,
  });
  return sent ? { status: "sent" } : { status: "error", values: v };
}

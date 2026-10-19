"use server";

import { sendMail } from "@/lib/mail";

export type ContactKind = "inquiry" | "maintenance";
export type ContactState = { status: "idle" | "sent" | "invalid" | "error"; values?: Record<string, string> };

const REQUIRED: Record<ContactKind, string[]> = {
  inquiry: ["name", "email", "phone", "comments"],
  maintenance: ["name", "email", "suite", "issue"],
};

export async function submitContact(kind: ContactKind, _prev: ContactState, formData: FormData): Promise<ContactState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 4000);
  const v: Record<string, string> = {};
  for (const k of ["name", "email", "phone", "type", "moveIn", "comments", "suite", "issue", "access"]) v[k] = get(k);

  const missing = REQUIRED[kind].some((k) => !v[k]) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
  if (missing) return { status: "invalid", values: v };

  const line = (label: string, value: string) => (value ? `${label}: ${value}` : null);
  const mail =
    kind === "inquiry"
      ? {
          subject: `Elora inquiry: ${v.name}`,
          lines: [line("Name", v.name), line("Email", v.email), line("Phone", v.phone), line("Suite type", v.type || "Not sure yet"), line("Move-in date", v.moveIn), "", v.comments],
        }
      : {
          subject: `Elora maintenance: suite ${v.suite} (${v.name})`,
          lines: [line("Name", v.name), line("Suite", v.suite), line("Email", v.email), line("Phone", v.phone), line("May enter when absent", v.access ? "Yes" : "No"), "", v.issue],
        };

  const sent = await sendMail({ subject: mail.subject, text: mail.lines.filter((l) => l !== null).join("\n"), replyTo: v.email });
  return sent ? { status: "sent" } : { status: "error", values: v };
}

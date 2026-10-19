import { createHmac, timingSafeEqual } from "node:crypto";
import { getFile, putFile, storageAvailable } from "./storage";

export type RequestRecord = {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "declined";
  decidedAt?: string;
  lang: "fr" | "en";
  urgent: boolean;
  trade: string;
  where: { room: string; item: string; problem: string }; // English labels
  name: string;
  suite: string;
  phone: string;
  email: string;
  access: boolean;
  note: string;
  photo?: { key: string; type: string; filename: string };
};

const secret = process.env.APPROVAL_SECRET || (process.env.NODE_ENV !== "production" ? "local-dev-only" : "");

// Approve/Decline links need stored requests and a signing secret.
export const approvalsEnabled = storageAvailable && Boolean(secret);

export const sign = (id: string) => createHmac("sha256", secret).update(id).digest("base64url");
export const verify = (id: string, sig: string) => {
  const a = Buffer.from(sign(id));
  const b = Buffer.from(sig);
  return Boolean(secret) && /^[\w-]+$/.test(id) && a.length === b.length && timingSafeEqual(a, b);
};

const recordKey = (id: string) => `requests/${id}/request.json`;
export const saveRecord = (r: RequestRecord) => putFile(recordKey(r.id), JSON.stringify(r, null, 2), "application/json");
export async function loadRecord(id: string): Promise<RequestRecord | null> {
  const raw = await getFile(recordKey(id));
  return raw ? (JSON.parse(raw.toString("utf8")) as RequestRecord) : null;
}

export const title = (r: RequestRecord) => `Suite ${r.suite} · ${r.where.room} › ${r.where.item}: ${r.where.problem}`;

export const detailLines = (r: RequestRecord) =>
  [
    ["Request", r.id],
    ["Urgent", r.urgent ? "YES" : "no"],
    ["Where", `${r.where.room} › ${r.where.item}`],
    ["Problem", r.where.problem],
    ["Suite", r.suite],
    ["Resident", r.name],
    ["Phone", r.phone],
    ["Email", r.email],
    ["May enter when absent", r.access ? "Yes" : "No"],
    ["Note", r.note || "None"],
    ["Submitted", new Date(r.createdAt).toLocaleString("en-CA", { timeZone: "America/Montreal" })],
  ] as const;

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function detailsHtml(r: RequestRecord) {
  return `<table style="border-collapse:collapse;font:14px/1.5 Arial,sans-serif;color:#241912">${detailLines(r)
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#8a7461">${k}</td><td style="padding:4px 0">${esc(v)}</td></tr>`)
    .join("")}</table>`;
}

export const button = (href: string, label: string, bg: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin-right:12px;padding:12px 22px;background:${bg};color:#fff;text-decoration:none;border-radius:3px;font:600 14px Arial,sans-serif">${label}</a>`;

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { APPROVER_EMAIL, TRADES, type Item, type Problem, type Room } from "@/data/maintenance";
import { sendMail } from "./mail";
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
  source: "whatsapp" | "web";
  name: string;
  suite: string;
  phone: string; // WhatsApp number for WhatsApp requests
  email?: string;
  note?: string;
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
    ["Phone", r.source === "whatsapp" ? `${r.phone} (WhatsApp)` : r.phone],
    ...(r.email ? [["Email", r.email] as const] : []),
    ...(r.note ? [["Note", r.note] as const] : []),
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

type NewRequest = {
  room: Room;
  item: Item;
  problem: Problem;
  lang: "fr" | "en";
  source: RequestRecord["source"];
  name: string;
  suite: string;
  phone: string;
  email?: string;
  note?: string;
  photo: { bytes: Buffer; type: string };
};

// Stores a new request with its photo and emails the approver with Approve / Decline links.
// `baseUrl` is the site's public address, used to build those links.
export async function createRequest(input: NewRequest, baseUrl: string): Promise<boolean> {
  const { room, item, problem, photo } = input;
  const id = `${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex")}`;
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const record: RequestRecord = {
    id,
    createdAt: new Date().toISOString(),
    status: "pending",
    lang: input.lang,
    urgent: Boolean(problem.urgent),
    trade: item.trade,
    where: { room: room.label.en, item: item.label.en, problem: problem.label.en },
    source: input.source,
    name: input.name,
    suite: input.suite,
    phone: input.phone,
    email: input.email,
    note: input.note,
    photo: { key: `requests/${id}/photo.${ext}`, type: photo.type, filename: `suite-${input.suite.replace(/\W/g, "")}-${item.id}.${ext}` },
  };

  try {
    let actions = "";
    if (approvalsEnabled) {
      await putFile(record.photo!.key, photo.bytes, photo.type);
      await saveRecord(record);
      const link = (d: string) => `${baseUrl}/api/maintenance?id=${id}&sig=${sign(id)}&do=${d}`;
      actions = `<p style="margin:24px 0">${button(link("approve"), `Approve → ${TRADES[item.trade].label.en}`, "#3b6b45")}${button(link("decline"), "Decline", "#8a3b3b")}</p>`;
    }
    const trade = TRADES[item.trade].label.en;
    return await sendMail({
      to: APPROVER_EMAIL,
      replyTo: record.email,
      subject: `${record.urgent ? "[URGENT] " : ""}Approval needed · ${title(record)}`,
      text: [
        `New maintenance request via ${record.source === "whatsapp" ? "WhatsApp" : "the website"}. If approved it goes to: ${trade} (${TRADES[item.trade].email}).`,
        "",
        ...detailLines(record).map(([k, v]) => `${k}: ${v}`),
        "",
        approvalsEnabled ? "Use the Approve / Decline buttons in this email." : "Approval buttons are off until storage is set up (see README).",
      ].join("\n"),
      html: `<div style="font:14px/1.5 Arial,sans-serif;color:#241912"><p>New maintenance request${record.urgent ? ' <b style="color:#8a3b3b">(URGENT)</b>' : ""} via ${record.source === "whatsapp" ? "WhatsApp" : "the website"}. If approved it goes to <b>${trade}</b>.</p>${detailsHtml(record)}${actions}<p style="color:#8a7461">Photo attached.</p></div>`,
      attachments: [{ filename: record.photo!.filename, content: photo.bytes, contentType: photo.type }],
    });
  } catch (err) {
    console.error("[maintenance] Could not save or send request", err);
    return false;
  }
}

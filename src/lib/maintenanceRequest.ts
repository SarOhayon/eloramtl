import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { APPROVER_EMAIL, APPROVER_WHATSAPP, TRADES, type Item, type Problem, type Room, type Trade } from "@/data/maintenance";
import { sendMail } from "./mail";
import { getFile, putFile, storageAvailable } from "./storage";
import { sendButtons, sendMedia, sendTemplate, sendText, uploadMedia } from "./whatsapp";

export type RequestRecord = {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "declined";
  decidedAt?: string;
  lang: "fr" | "en";
  urgent: boolean;
  trade: Trade;
  where: { room: string; item: string; problem: string }; // English labels
  source: "whatsapp" | "web";
  name: string;
  suite: string;
  phone: string; // WhatsApp number for WhatsApp requests
  email?: string;
  access?: boolean;
  bestTime?: string;
  note?: string;
  media?: { key: string; type: string; filename: string; kind: "photo" | "video" };
};

const secret = process.env.APPROVAL_SECRET || (process.env.NODE_ENV !== "production" ? "local-dev-only" : "");

// Approvals need stored requests and a secret to sign the email links.
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
  if (!/^[\w-]+$/.test(id)) return null;
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
    ...(r.access !== undefined ? [["May enter when absent", r.access ? "Yes" : "No"] as const] : []),
    ...(r.bestTime ? [["Best time", r.bestTime] as const] : []),
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

const attachmentFor = async (r: RequestRecord) => {
  const bytes = r.media ? await getFile(r.media.key) : null;
  return bytes && r.media ? [{ filename: r.media.filename, content: bytes, contentType: r.media.type }] : undefined;
};

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
  access?: boolean;
  bestTime?: string;
  note?: string;
  media: { bytes: Buffer; type: string; kind: "photo" | "video" };
};

// Stores a new request and sends it to the approver: on WhatsApp (media + Approve / Decline
// buttons) when APPROVER_WHATSAPP is set, and always by email as a record.
export async function createRequest(input: NewRequest, baseUrl: string): Promise<boolean> {
  const { room, item, problem, media } = input;
  const id = `${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex")}`;
  const ext = media.type.split("/")[1]?.replace("jpeg", "jpg").replace("quicktime", "mov") || "jpg";
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
    access: input.access,
    bestTime: input.bestTime,
    note: input.note,
    media: { key: `requests/${id}/media.${ext}`, type: media.type, filename: `suite-${input.suite.replace(/\W/g, "")}-${item.id}.${ext}`, kind: media.kind },
  };

  try {
    if (approvalsEnabled) {
      await putFile(record.media!.key, media.bytes, media.type);
      await saveRecord(record);
    }
    const trade = TRADES[item.trade].label.en;
    let actions = "";
    if (approvalsEnabled) {
      const link = (d: string) => `${baseUrl}/api/maintenance?id=${id}&sig=${sign(id)}&do=${d}`;
      actions = `<p style="margin:24px 0">${button(link("approve"), `Approve → ${trade}`, "#3b6b45")}${button(link("decline"), "Decline", "#8a3b3b")}</p>`;
    }
    const emailed = await sendMail({
      to: APPROVER_EMAIL,
      replyTo: record.email,
      subject: `${record.urgent ? "[URGENT] " : ""}Approval needed · ${title(record)}`,
      text: [
        `New maintenance request via ${record.source === "whatsapp" ? "WhatsApp" : "the website"}. If approved it goes to: ${trade} (${TRADES[item.trade].email}).`,
        "",
        ...detailLines(record).map(([k, v]) => `${k}: ${v}`),
      ].join("\n"),
      html: `<div style="font:14px/1.5 Arial,sans-serif;color:#241912"><p>New maintenance request${record.urgent ? ' <b style="color:#8a3b3b">(URGENT)</b>' : ""} via ${record.source === "whatsapp" ? "WhatsApp" : "the website"}. If approved it goes to <b>${trade}</b>.</p>${detailsHtml(record)}${actions}<p style="color:#8a7461">${record.media!.kind === "video" ? "Video" : "Photo"} attached.</p></div>`,
      attachments: [{ filename: record.media!.filename, content: media.bytes, contentType: media.type }],
    });
    const messaged = approvalsEnabled && APPROVER_WHATSAPP ? await askApproverOnWhatsApp(record, media.bytes) : false;
    return emailed || messaged;
  } catch (err) {
    console.error("[maintenance] Could not save or send request", err);
    return false;
  }
}

// WhatsApp summary for the approver, with Approve / Decline buttons.
const approverSummary = (r: RequestRecord) =>
  [
    `${r.urgent ? "⚠️ URGENT · " : ""}🔧 New maintenance request`,
    `Suite ${r.suite} · ${r.name}`,
    `${r.where.room} › ${r.where.item}: ${r.where.problem}`,
    `Entry if absent: ${r.access ? "Yes" : "No"} · Best time: ${r.bestTime ?? "-"}`,
    `If yes → ${TRADES[r.trade].label.en} (${TRADES[r.trade].email})`,
    "",
    "Do you approve?",
  ].join("\n");

async function askApproverOnWhatsApp(r: RequestRecord, bytes: Buffer) {
  const mediaId = await uploadMedia(bytes, r.media!.type);
  const template = process.env.WHATSAPP_APPROVAL_TEMPLATE;
  if (template) {
    // Template with a media header, one body variable and two quick-reply buttons.
    return sendTemplate(APPROVER_WHATSAPP, template, process.env.WHATSAPP_APPROVAL_TEMPLATE_LANG || "en", [
      ...(mediaId ? [{ type: "header", parameters: [r.media!.kind === "video" ? { type: "video", video: { id: mediaId } } : { type: "image", image: { id: mediaId } }] }] : []),
      { type: "body", parameters: [{ type: "text", text: approverSummary(r).replace(/\n/g, " · ") }] },
      { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `approve:${r.id}` }] },
      { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: `decline:${r.id}` }] },
    ]);
  }
  if (mediaId) await sendMedia(APPROVER_WHATSAPP, r.media!.kind, mediaId, `Suite ${r.suite} · ${r.where.item}`);
  return sendButtons(APPROVER_WHATSAPP, approverSummary(r), [
    { id: `approve:${r.id}`, title: "✅ Yes" },
    { id: `decline:${r.id}`, title: "❌ No" },
  ]);
}

const RESIDENT = {
  fr: (trade: string) => `Bonne nouvelle : votre demande d'entretien est approuvée. Notre ${trade.toLowerCase()} communiquera avec vous pour planifier la visite.`,
  en: (trade: string) => `Good news: your maintenance request is approved. Our ${trade.toLowerCase()} will contact you to schedule the visit.`,
};

export type Decision = { ok: boolean; status: RequestRecord["status"]; already?: boolean; trade: { label: string; email: string } };

// Approve: email the work order (with the photo or video) to the trade's contractor and tell
// the resident on WhatsApp. Decline: just record it. Used by the email links and WhatsApp buttons.
export async function decide(record: RequestRecord, action: "approve" | "decline"): Promise<Decision> {
  const trade = TRADES[record.trade];
  const info = { label: trade.label.en, email: trade.email };
  if (record.status !== "pending") return { ok: true, status: record.status, already: true, trade: info };

  if (action === "decline") {
    await saveRecord({ ...record, status: "declined", decidedAt: new Date().toISOString() });
    return { ok: true, status: "declined", trade: info };
  }

  const attachments = await attachmentFor(record);
  const sent = await sendMail({
    to: trade.email,
    replyTo: record.email,
    subject: `${record.urgent ? "[URGENT] " : ""}Work order · ${title(record)}`,
    text: ["Approved maintenance request for Elora, 2855 chemin Bates, Montréal.", "", ...detailLines(record).map(([k, v]) => `${k}: ${v}`)].join("\n"),
    html: `<div style="font:14px/1.5 Arial,sans-serif;color:#241912"><p>Approved maintenance request for <b>Elora, 2855 chemin Bates, Montréal</b>. Please contact the resident to schedule.</p>${detailsHtml(record)}${attachments ? `<p style="color:#8a7461">${record.media?.kind === "video" ? "Video" : "Photo"} attached.</p>` : ""}</div>`,
    attachments,
  });
  if (!sent) return { ok: false, status: "pending", trade: info };

  await saveRecord({ ...record, status: "approved", decidedAt: new Date().toISOString() });
  // Reaches the resident if they wrote in the last 24 hours (WhatsApp's reply window).
  if (record.source === "whatsapp") await sendText(record.phone.replace(/\D/g, ""), RESIDENT[record.lang](trade.label[record.lang])).catch(() => false);
  return { ok: true, status: "approved", trade: info };
}

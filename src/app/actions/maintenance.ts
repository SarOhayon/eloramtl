"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { APPROVER_EMAIL, findProblem, TRADES } from "@/data/maintenance";
import { sendMail } from "@/lib/mail";
import { approvalsEnabled, button, detailLines, detailsHtml, saveRecord, sign, title, type RequestRecord } from "@/lib/maintenanceRequest";
import { putFile } from "@/lib/storage";

export type MaintenanceState = { status: "idle" | "sent" | "invalid" | "error" };

const MAX_PHOTO = 8 * 1024 * 1024;

export async function submitMaintenance(_prev: MaintenanceState, formData: FormData): Promise<MaintenanceState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 2000);
  const found = findProblem(get("room"), get("item"), get("problem"));
  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0 && photo.size <= MAX_PHOTO && photo.type.startsWith("image/");
  const email = get("email");
  if (!found || !hasPhoto || !get("name") || !get("suite") || !get("phone") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "invalid" };
  }

  const { room, item, problem } = found;
  const id = `${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex")}`;
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const photoBytes = Buffer.from(await photo.arrayBuffer());
  const record: RequestRecord = {
    id,
    createdAt: new Date().toISOString(),
    status: "pending",
    lang: get("lang") === "fr" ? "fr" : "en",
    urgent: Boolean(problem.urgent),
    trade: item.trade,
    where: { room: room.label.en, item: item.label.en, problem: problem.label.en },
    name: get("name"),
    suite: get("suite"),
    phone: get("phone"),
    email,
    access: Boolean(formData.get("access")),
    note: get("note"),
    photo: { key: `requests/${id}/photo.${ext}`, type: photo.type, filename: `suite-${get("suite")}-${item.id}.${ext}` },
  };

  try {
    let actions = "";
    if (approvalsEnabled) {
      await putFile(record.photo!.key, photoBytes, photo.type);
      await saveRecord(record);
      const h = await headers();
      const base = process.env.SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
      const link = (d: string) => `${base}/api/maintenance?id=${id}&sig=${sign(id)}&do=${d}`;
      actions = `<p style="margin:24px 0">${button(link("approve"), `Approve → ${TRADES[item.trade].label.en}`, "#3b6b45")}${button(link("decline"), "Decline", "#8a3b3b")}</p>`;
    }

    const trade = TRADES[item.trade].label.en;
    const sent = await sendMail({
      to: APPROVER_EMAIL,
      replyTo: email,
      subject: `${record.urgent ? "[URGENT] " : ""}Approval needed · ${title(record)}`,
      text: [
        `New maintenance request. If approved it goes to: ${trade} (${TRADES[item.trade].email}).`,
        "",
        ...detailLines(record).map(([k, v]) => `${k}: ${v}`),
        "",
        approvalsEnabled ? "Use the Approve / Decline buttons in this email." : "Approval buttons are off until storage is set up (see README).",
      ].join("\n"),
      html: `<div style="font:14px/1.5 Arial,sans-serif;color:#241912"><p>New maintenance request${record.urgent ? " <b style=\"color:#8a3b3b\">(URGENT)</b>" : ""}. If approved it goes to <b>${trade}</b>.</p>${detailsHtml(record)}${actions}<p style="color:#8a7461">Photo attached.</p></div>`,
      attachments: [{ filename: record.photo!.filename, content: photoBytes, contentType: photo.type }],
    });
    return sent ? { status: "sent" } : { status: "error" };
  } catch (err) {
    console.error("[maintenance] Could not save or send request", err);
    return { status: "error" };
  }
}

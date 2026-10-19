import { TRADES, type Trade } from "@/data/maintenance";
import { sendMail } from "@/lib/mail";
import { detailLines, detailsHtml, esc, loadRecord, saveRecord, title as plainTitle, verify, type RequestRecord } from "@/lib/maintenanceRequest";
import { getFile } from "@/lib/storage";
import { notifyApproved } from "@/lib/whatsappBot";

// The approver's Approve / Decline links. GET shows a confirmation page (so email link
// scanners can't trigger anything); the button on it POSTs to perform the action.

// Titles contain what residents typed, so they are escaped for HTML.
const title = (r: RequestRecord) => esc(plainTitle(r));

const page = (heading: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elora · ${heading}</title></head>
<body style="margin:0;background:#fbf8f3;font:16px/1.5 Arial,sans-serif;color:#241912">
<main style="max-width:560px;margin:48px auto;padding:32px 24px;background:#fff;border-top:3px solid #b48a4a;box-shadow:0 10px 30px rgba(36,25,18,.08)">
<p style="margin:0;letter-spacing:.3em;font-size:12px;color:#b48a4a">ELORA · MAINTENANCE</p>
<h1 style="font:500 30px Georgia,serif;margin:8px 0 16px">${heading}</h1>${body}</main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );

async function getRequest(url: URL) {
  const id = url.searchParams.get("id") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  const action = url.searchParams.get("do");
  if (!verify(id, sig) || (action !== "approve" && action !== "decline")) return null;
  const record = await loadRecord(id);
  return record ? { record, action, id, sig } : null;
}

const done = (status: string) => `<p>This request was already <b>${status}</b>. Nothing else to do.</p>`;

export async function GET(request: Request) {
  const found = await getRequest(new URL(request.url));
  if (!found) return page("Link not valid", "<p>This link is invalid or the request no longer exists.</p>", 404);
  const { record, action, id, sig } = found;
  if (record.status !== "pending") return page(title(record), done(record.status));

  const trade = TRADES[record.trade as Trade];
  const approve = action === "approve";
  return page(
    title(record),
    `${detailsHtml(record)}
<form method="post" action="/api/maintenance?id=${id}&sig=${sig}&do=${action}" style="margin-top:28px">
<button type="submit" style="padding:14px 26px;border:0;border-radius:3px;cursor:pointer;color:#fff;font:600 15px Arial,sans-serif;background:${approve ? "#3b6b45" : "#8a3b3b"}">
${approve ? `Confirm: send to ${trade.label.en}` : "Confirm: decline request"}</button></form>
${approve ? `<p style="color:#8a7461;font-size:14px">It will be emailed to ${trade.email} with the photo.</p>` : ""}`,
  );
}

export async function POST(request: Request) {
  const found = await getRequest(new URL(request.url));
  if (!found) return page("Link not valid", "<p>This link is invalid or the request no longer exists.</p>", 404);
  const { record, action } = found;
  if (record.status !== "pending") return page(title(record), done(record.status));

  if (action === "decline") {
    await saveRecord({ ...record, status: "declined", decidedAt: new Date().toISOString() });
    return page("Request declined", `<p>${title(record)} was declined. The contractor was not contacted.</p>`);
  }

  const trade = TRADES[record.trade as Trade];
  const photo = record.photo ? await getFile(record.photo.key) : null;
  const sent = await sendMail({
    to: trade.email,
    replyTo: record.email,
    subject: `${record.urgent ? "[URGENT] " : ""}Work order · ${plainTitle(record)}`,
    text: ["Approved maintenance request for Elora, 2855 chemin Bates, Montréal.", "", ...detailLines(record).map(([k, v]) => `${k}: ${v}`)].join("\n"),
    html: `<div style="font:14px/1.5 Arial,sans-serif;color:#241912"><p>Approved maintenance request for <b>Elora, 2855 chemin Bates, Montréal</b>. Please contact the resident to schedule.</p>${detailsHtml(record)}${photo ? '<p style="color:#8a7461">Photo attached.</p>' : ""}</div>`,
    attachments: photo && record.photo ? [{ filename: record.photo.filename, content: photo, contentType: record.photo.type }] : undefined,
  });
  if (!sent) return page("Not sent", "<p>The email to the contractor could not be sent. Please try again in a moment.</p>", 502);

  await saveRecord({ ...record, status: "approved", decidedAt: new Date().toISOString() });
  if (record.source === "whatsapp") await notifyApproved(record.phone, record.lang, record.trade as Trade);
  return page("Approved ✓", `<p>Sent to <b>${trade.label.en}</b> (${trade.email}) with the photo.</p>`);
}

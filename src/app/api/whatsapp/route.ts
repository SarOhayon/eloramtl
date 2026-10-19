import { handleMessage } from "@/lib/whatsappBot";
import { parseWebhook, validSignature } from "@/lib/whatsapp";
import { getFile, putFile } from "@/lib/storage";

// WhatsApp Business Platform webhook (set this URL in Meta: https://<site>/api/whatsapp).

// Meta's one-time verification when the webhook is registered.
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.has("check")) return Response.json(await healthCheck());
  const ok = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN && Boolean(process.env.WHATSAPP_VERIFY_TOKEN);
  return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    console.warn("[whatsapp] rejected webhook: signature doesn't match WHATSAPP_APP_SECRET");
    return new Response("Invalid signature", { status: 401 });
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const baseUrl = process.env.SITE_URL || `${request.headers.get("x-forwarded-proto") ?? "https"}://${host}`;
  try {
    const messages = parseWebhook(JSON.parse(raw));
    console.info(`[whatsapp] webhook with ${messages.length} message(s)`);
    for (const message of messages) await handleMessage(message, baseUrl);
  } catch (err) {
    console.error("[whatsapp] webhook error", err);
  }
  // Always acknowledge, otherwise Meta keeps retrying the same message.
  return new Response("ok");
}

// /api/whatsapp?check : which settings the live site sees (true/false only, never values)
// and whether storage works. Helps diagnose a silent bot.
async function healthCheck() {
  const has = (k: string) => Boolean(process.env[k]);
  let storage = "ok";
  try {
    await putFile("health/check.txt", new Date().toISOString(), "text/plain");
    if (!(await getFile("health/check.txt"))) storage = "write ok, read failed";
  } catch (err) {
    storage = `failed: ${(err as Error).name}`;
  }
  let token = "missing";
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    const res = await fetch(`https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }).catch(() => null);
    token = !res ? "unreachable" : res.ok ? "ok" : `rejected by Meta (${res.status})`;
  }
  return {
    WHATSAPP_TOKEN: has("WHATSAPP_TOKEN"),
    whatsapp_token_check: token,
    WHATSAPP_PHONE_NUMBER_ID: has("WHATSAPP_PHONE_NUMBER_ID"),
    WHATSAPP_APP_SECRET: has("WHATSAPP_APP_SECRET"),
    WHATSAPP_VERIFY_TOKEN: has("WHATSAPP_VERIFY_TOKEN"),
    APPROVER_WHATSAPP: has("APPROVER_WHATSAPP"),
    APPROVAL_SECRET: has("APPROVAL_SECRET"),
    ELORA_S3_BUCKET: has("ELORA_S3_BUCKET"),
    ELORA_S3_REGION: process.env.ELORA_S3_REGION ?? null,
    ELORA_S3_ACCESS_KEY_ID: has("ELORA_S3_ACCESS_KEY_ID"),
    ELORA_S3_SECRET_ACCESS_KEY: has("ELORA_S3_SECRET_ACCESS_KEY"),
    storage,
    SMTP_HOST: has("SMTP_HOST"),
  };
}

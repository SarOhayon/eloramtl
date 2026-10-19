import { handleMessage } from "@/lib/whatsappBot";
import { parseWebhook, validSignature } from "@/lib/whatsapp";

// WhatsApp Business Platform webhook (set this URL in Meta: https://<site>/api/whatsapp).

// Meta's one-time verification when the webhook is registered.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ok = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN && Boolean(process.env.WHATSAPP_VERIFY_TOKEN);
  return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) return new Response("Invalid signature", { status: 401 });

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const baseUrl = process.env.SITE_URL || `${request.headers.get("x-forwarded-proto") ?? "https"}://${host}`;
  try {
    for (const message of parseWebhook(JSON.parse(raw))) await handleMessage(message, baseUrl);
  } catch (err) {
    console.error("[whatsapp] webhook error", err);
  }
  // Always acknowledge, otherwise Meta keeps retrying the same message.
  return new Response("ok");
}

import { createHmac, timingSafeEqual } from "node:crypto";

// Minimal WhatsApp Business Platform (Cloud API) client.
// Needs WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID; WHATSAPP_APP_SECRET verifies incoming webhooks.

const { WHATSAPP_TOKEN: token, WHATSAPP_PHONE_NUMBER_ID: phoneId, WHATSAPP_APP_SECRET: appSecret } = process.env;
const version = process.env.WHATSAPP_API_VERSION || "v23.0";
const graph = process.env.WHATSAPP_GRAPH_URL || "https://graph.facebook.com"; // overridable for testing

export type Option = { id: string; title: string };
export type Incoming = { id: string; from: string; name?: string; text?: string; choice?: string; media?: { id: string; mime: string; kind: "photo" | "video" } };

// Meta signs every webhook with the app secret (X-Hub-Signature-256).
export function validSignature(rawBody: string, header: string | null) {
  if (!appSecret) return process.env.NODE_ENV !== "production";
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

type WebhookBody = {
  entry?: {
    changes?: {
      value?: {
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: {
          id: string;
          from: string;
          type: string;
          text?: { body: string };
          interactive?: { list_reply?: { id: string }; button_reply?: { id: string } };
          image?: { id: string; mime_type: string };
          video?: { id: string; mime_type: string };
        }[];
      };
    }[];
  }[];
};

export function parseWebhook(body: WebhookBody): Incoming[] {
  const out: Incoming[] = [];
  for (const entry of body.entry ?? [])
    for (const change of entry.changes ?? []) {
      const value = change.value;
      for (const m of value?.messages ?? []) {
        out.push({
          id: m.id,
          from: m.from,
          name: value?.contacts?.find((c) => c.wa_id === m.from)?.profile?.name,
          text: m.text?.body,
          choice: m.interactive?.list_reply?.id ?? m.interactive?.button_reply?.id,
          media: m.image
            ? { id: m.image.id, mime: m.image.mime_type, kind: "photo" }
            : m.video
              ? { id: m.video.id, mime: m.video.mime_type, kind: "video" }
              : undefined,
        });
      }
    }
  return out;
}

async function send(to: string, payload: object) {
  if (!token || !phoneId) {
    console.info(`[whatsapp] not configured; would send to ${to}:`, JSON.stringify(payload));
    return false;
  }
  const res = await fetch(`${graph}/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...payload }),
  });
  if (!res.ok) console.error("[whatsapp] send failed", res.status, await res.text());
  return res.ok;
}

// WhatsApp limits: button titles 20 chars, list row titles 24, descriptions 72.
const fit = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

export const sendText = (to: string, body: string) => send(to, { type: "text", text: { body } });

export const sendButtons = (to: string, body: string, options: Option[]) =>
  send(to, {
    type: "interactive",
    interactive: { type: "button", body: { text: body }, action: { buttons: options.slice(0, 3).map((o) => ({ type: "reply", reply: { id: o.id, title: fit(o.title, 20) } })) } },
  });

export const sendList = (to: string, body: string, button: string, options: Option[]) =>
  send(to, {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: fit(button, 20),
        sections: [{ title: fit(button, 24), rows: options.slice(0, 10).map((o) => ({ id: o.id, title: fit(o.title, 24), ...(o.title.length > 24 ? { description: fit(o.title, 72) } : {}) })) }],
      },
    },
  });

// Like the example in WhatsApp: up to 3 options appear as tappable buttons under the
// message; longer menus use WhatsApp's list (one button that opens the options).
export const sendChoices = (to: string, body: string, listButton: string, options: Option[]) =>
  options.length <= 3 ? sendButtons(to, body, options) : sendList(to, body, listButton, options);

export async function uploadMedia(bytes: Buffer, type: string): Promise<string | null> {
  if (!token || !phoneId) return null;
  const form = new FormData();
  form.set("messaging_product", "whatsapp");
  form.set("type", type);
  form.set("file", new Blob([new Uint8Array(bytes)], { type }), type.startsWith("video") ? "video.mp4" : "photo.jpg");
  const res = await fetch(`${graph}/${version}/${phoneId}/media`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  if (!res.ok) {
    console.error("[whatsapp] media upload failed", res.status, await res.text());
    return null;
  }
  return ((await res.json()) as { id: string }).id;
}

export const sendMedia = (to: string, kind: "photo" | "video", mediaId: string, caption: string) =>
  send(to, kind === "video" ? { type: "video", video: { id: mediaId, caption } } : { type: "image", image: { id: mediaId, caption } });

// Pre-approved template (needed to message someone outside WhatsApp's 24-hour window).
export const sendTemplate = (to: string, name: string, language: string, components: object[]) =>
  send(to, { type: "template", template: { name, language: { code: language }, components } });

export async function downloadMedia(mediaId: string): Promise<{ bytes: Buffer; type: string } | null> {
  if (!token) return null;
  try {
    const meta = await fetch(`${graph}/${version}/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!meta.ok) return null;
    const { url, mime_type } = (await meta.json()) as { url: string; mime_type: string };
    const file = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!file.ok) return null;
    return { bytes: Buffer.from(await file.arrayBuffer()), type: mime_type };
  } catch (err) {
    console.error("[whatsapp] media download failed", err);
    return null;
  }
}

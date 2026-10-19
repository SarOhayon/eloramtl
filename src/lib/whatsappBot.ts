import { PHONE_MAIN_DISPLAY } from "@/data/building";
import { ROOMS, TRADES, type Trade } from "@/data/maintenance";
import { createRequest } from "./maintenanceRequest";
import { getFile, putFile } from "./storage";
import { downloadMedia, sendButtons, sendList, sendText, type Incoming } from "./whatsapp";

// The WhatsApp maintenance conversation:
// language → room → item → problem → photo → suite number → thank you (then approval by email).

type Lang = "fr" | "en";
type Step = "lang" | "room" | "item" | "problem" | "photo" | "suite" | "done";
type Session = { step: Step; lang: Lang; room?: string; item?: string; problem?: string; photo?: { key: string; type: string }; lastId?: string; updatedAt: number };

const T = {
  fr: {
    choose: "Choisir",
    where: "Bonjour! Où se trouve votre problème aujourd'hui?",
    what: (room: string) => `Qu'est-ce qui doit être réparé (${room.toLowerCase()})?`,
    problem: (item: string) => `Que se passe-t-il avec : ${item.toLowerCase()}?`,
    urgent: `⚠️ Problème urgent : si possible, fermez l'eau ou l'appareil et appelez-nous aussi au ${PHONE_MAIN_DISPLAY}.`,
    photo: "Veuillez envoyer une photo du problème 📷",
    needPhoto: "Il nous faut une photo pour continuer. Touchez 📎 ou 📷 pour l'envoyer.",
    suite: "Merci! Quel est votre numéro de logement?",
    thanks: "Merci! Nous enverrons quelqu'un sous peu.",
    failed: `Désolé, un problème est survenu. Appelez-nous au ${PHONE_MAIN_DISPLAY}.`,
    pick: "Veuillez choisir une option dans la liste.",
    approved: (trade: string) => `Bonne nouvelle : votre demande d'entretien est approuvée. Notre ${trade.toLowerCase()} communiquera avec vous pour planifier la visite.`,
  },
  en: {
    choose: "Choose",
    where: "Hi! Where is your issue today?",
    what: (room: string) => `What needs fixing in the ${room.toLowerCase()}?`,
    problem: (item: string) => `What's happening with the ${item.toLowerCase()}?`,
    urgent: `⚠️ Urgent issue: if you can, shut off the water or appliance and also call us at ${PHONE_MAIN_DISPLAY}.`,
    photo: "Please send a photo of the problem 📷",
    needPhoto: "We need a photo to continue. Tap 📎 or 📷 to send one.",
    suite: "Thanks! What is your suite number?",
    thanks: "Thank you! We will have someone over shortly.",
    failed: `Sorry, something went wrong. Please call us at ${PHONE_MAIN_DISPLAY}.`,
    pick: "Please choose an option from the list.",
    approved: (trade: string) => `Good news: your maintenance request is approved. Our ${trade.toLowerCase()} will contact you to schedule the visit.`,
  },
};

const RESTART = new Set(["menu", "start", "hi", "hello", "bonjour", "salut", "allo", "allô", "maintenance", "entretien", "cancel", "annuler", "restart", "recommencer"]);
const EXPIRES = 24 * 60 * 60 * 1000;

const sessionKey = (from: string) => `whatsapp/sessions/${from.replace(/\D/g, "")}.json`;
async function load(from: string): Promise<Session | null> {
  const raw = await getFile(sessionKey(from));
  if (!raw) return null;
  const s = JSON.parse(raw.toString("utf8")) as Session;
  return s.step === "done" || Date.now() - s.updatedAt > EXPIRES ? null : s;
}
const save = (from: string, s: Session) => putFile(sessionKey(from), JSON.stringify({ ...s, updatedAt: Date.now() }), "application/json");

const room = (s: Session) => ROOMS.find((r) => r.id === s.room);
const item = (s: Session) => room(s)?.items.find((i) => i.id === s.item);
const problem = (s: Session) => item(s)?.problems.find((p) => p.id === s.problem);

// Ask the question for the session's current step.
async function ask(to: string, s: Session) {
  const t = T[s.lang];
  switch (s.step) {
    case "lang":
      return sendButtons(to, "Bonjour! Hi! 👋\nFrançais ou English?", [
        { id: "lang:fr", title: "Français" },
        { id: "lang:en", title: "English" },
      ]);
    case "room":
      return sendList(to, t.where, t.choose, ROOMS.map((r) => ({ id: `room:${r.id}`, title: r.label[s.lang] })));
    case "item":
      return sendList(to, t.what(room(s)!.label[s.lang]), t.choose, room(s)!.items.map((i) => ({ id: `item:${i.id}`, title: i.label[s.lang] })));
    case "problem":
      return sendList(to, t.problem(item(s)!.label[s.lang]), t.choose, item(s)!.problems.map((p) => ({ id: `problem:${p.id}`, title: p.label[s.lang] })));
    case "photo":
      return sendText(to, t.photo);
    case "suite":
      return sendText(to, t.suite);
  }
}

export async function handleMessage(msg: Incoming, baseUrl: string) {
  const to = msg.from;
  const existing = await load(to);
  if (existing?.lastId === msg.id) return; // WhatsApp may deliver a message twice

  const word = msg.text?.trim().toLowerCase() ?? "";
  if (!existing || RESTART.has(word)) {
    const s: Session = { step: "lang", lang: "fr", lastId: msg.id, updatedAt: Date.now() };
    await save(to, s);
    return ask(to, s);
  }

  const s: Session = { ...existing, lastId: msg.id };
  const t = T[s.lang];
  const [kind, value] = (msg.choice ?? "").split(":");

  if (s.step === "lang" && kind === "lang" && (value === "fr" || value === "en")) {
    s.lang = value;
    s.step = "room";
  } else if (s.step === "room" && kind === "room" && ROOMS.some((r) => r.id === value)) {
    s.room = value;
    s.step = "item";
  } else if (s.step === "item" && kind === "item" && room(s)?.items.some((i) => i.id === value)) {
    s.item = value;
    s.step = "problem";
  } else if (s.step === "problem" && kind === "problem" && item(s)?.problems.some((p) => p.id === value)) {
    s.problem = value;
    s.step = "photo";
    if (problem(s)?.urgent) await sendText(to, t.urgent);
  } else if (s.step === "photo") {
    const media = msg.image ? await downloadMedia(msg.image.id) : null;
    if (!media) {
      await save(to, s);
      return sendText(to, msg.image ? t.failed : t.needPhoto);
    }
    const key = `whatsapp/photos/${to.replace(/\D/g, "")}-${msg.id.replace(/\W/g, "").slice(-12)}`;
    await putFile(key, media.bytes, media.type);
    s.photo = { key, type: media.type };
    s.step = "suite";
  } else if (s.step === "suite" && word) {
    const r = room(s);
    const i = item(s);
    const p = problem(s);
    const bytes = s.photo ? await getFile(s.photo.key) : null;
    const ok =
      r && i && p && bytes && s.photo
        ? await createRequest(
            { room: r, item: i, problem: p, lang: s.lang, source: "whatsapp", name: msg.name || "WhatsApp resident", suite: msg.text!.trim().slice(0, 20), phone: `+${to}`, photo: { bytes, type: s.photo.type } },
            baseUrl,
          )
        : false;
    await save(to, { ...s, step: ok ? "done" : s.step });
    return sendText(to, ok ? t.thanks : t.failed);
  } else {
    // Unexpected reply: remind and ask the same question again.
    await save(to, s);
    if (s.step !== "suite") await sendText(to, t.pick);
    return ask(to, s);
  }

  await save(to, s);
  return ask(to, s);
}

// Lets the resident know once the request is approved (works within WhatsApp's 24-hour reply window).
export const notifyApproved = (phone: string, lang: Lang, trade: Trade) =>
  sendText(phone.replace(/\D/g, ""), T[lang].approved(TRADES[trade].label[lang])).catch(() => false);

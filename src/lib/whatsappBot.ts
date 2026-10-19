import { PHONE_MAIN_DISPLAY } from "@/data/building";
import { APPROVER_WHATSAPP, ROOMS } from "@/data/maintenance";
import { createRequest, decide, loadRecord } from "./maintenanceRequest";
import { getFile, putFile } from "./storage";
import { downloadMedia, sendButtons, sendChoices, sendText, type Incoming } from "./whatsapp";

// The WhatsApp maintenance conversation, started by texting "maintenance":
// language → suite → name → room → item → problem → photo/video → entry permission → best time.
// The approver's Approve / Decline taps are handled here too.

type Lang = "fr" | "en";
type Step = "lang" | "suite" | "name" | "room" | "item" | "problem" | "media" | "access" | "time" | "done";
type Session = {
  step: Step;
  lang: Lang;
  suite?: string;
  name?: string;
  room?: string;
  item?: string;
  problem?: string;
  media?: { key: string; type: string; kind: "photo" | "video" };
  access?: boolean;
  lastId?: string;
  updatedAt: number;
};

const TIMES = {
  fr: { morning: "Matin (8 h – 12 h)", afternoon: "Après-midi (12 h – 17 h)", evening: "Soir (17 h – 20 h)", any: "N'importe quand" },
  en: { morning: "Morning (8 am – 12 pm)", afternoon: "Afternoon (12 – 5 pm)", evening: "Evening (5 – 8 pm)", any: "Anytime" },
};

const T = {
  fr: {
    choose: "Choisir",
    suite: "Bonjour! Je vais vous aider avec votre demande d'entretien.\n\nQuel est votre numéro de logement?",
    name: "Merci! Quel est votre nom?",
    where: (name: string) => `Merci ${name}! Où se trouve le problème?`,
    what: (room: string) => `Qu'est-ce qui doit être réparé (${room.toLowerCase()})?`,
    problem: (item: string) => `Que se passe-t-il avec : ${item.toLowerCase()}?`,
    urgent: `⚠️ Problème urgent : si possible, fermez l'eau ou l'appareil et appelez-nous aussi au ${PHONE_MAIN_DISPLAY}.`,
    media: "Veuillez envoyer une photo ou une courte vidéo du problème 📷",
    needMedia: "Il nous faut une photo ou une vidéo pour continuer. Touchez 📎 ou 📷 pour l'envoyer.",
    access: "Pouvons-nous entrer si vous n'êtes pas là?",
    yes: "Oui",
    no: "Non",
    time: "Quel est le meilleur moment pour passer?",
    thanks: "Merci! Nous enverrons quelqu'un sous peu.",
    failed: `Désolé, un problème est survenu. Appelez-nous au ${PHONE_MAIN_DISPLAY}.`,
    pick: "Veuillez toucher une des options.",
  },
  en: {
    choose: "Choose",
    suite: "Hi! I'll help you with your maintenance request.\n\nWhat is your suite number?",
    name: "Thanks! What is your name?",
    where: (name: string) => `Thanks ${name}! Where is the issue?`,
    what: (room: string) => `What needs fixing in the ${room.toLowerCase()}?`,
    problem: (item: string) => `What's happening with the ${item.toLowerCase()}?`,
    urgent: `⚠️ Urgent issue: if you can, shut off the water or appliance and also call us at ${PHONE_MAIN_DISPLAY}.`,
    media: "Please send a photo or a short video of the problem 📷",
    needMedia: "We need a photo or video to continue. Tap 📎 or 📷 to send one.",
    access: "May we enter if you're not home?",
    yes: "Yes",
    no: "No",
    time: "What's the best time to come by?",
    thanks: "Thank you! We will have someone over shortly.",
    failed: `Sorry, something went wrong. Please call us at ${PHONE_MAIN_DISPLAY}.`,
    pick: "Please tap one of the options.",
  },
};

// Texting any of these starts (or restarts) a maintenance request.
const START = new Set(["maintenance", "entretien", "menu", "start", "hi", "hello", "bonjour", "salut", "allo", "allô", "cancel", "annuler", "restart", "recommencer"]);
const EXPIRES = 24 * 60 * 60 * 1000;

const digits = (n: string) => n.replace(/\D/g, "");
const sessionKey = (from: string) => `whatsapp/sessions/${digits(from)}.json`;
async function load(from: string): Promise<Session | null> {
  const raw = await getFile(sessionKey(from));
  if (!raw) return null;
  const s = JSON.parse(raw.toString("utf8")) as Session;
  return Date.now() - s.updatedAt > EXPIRES ? null : s;
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
    case "suite":
      return sendText(to, t.suite);
    case "name":
      return sendText(to, t.name);
    case "room":
      return sendChoices(to, t.where(s.name ?? ""), t.choose, ROOMS.map((r) => ({ id: `room:${r.id}`, title: r.label[s.lang] })));
    case "item":
      return sendChoices(to, t.what(room(s)!.label[s.lang]), t.choose, room(s)!.items.map((i) => ({ id: `item:${i.id}`, title: i.label[s.lang] })));
    case "problem":
      return sendChoices(to, t.problem(item(s)!.label[s.lang]), t.choose, item(s)!.problems.map((p) => ({ id: `problem:${p.id}`, title: p.label[s.lang] })));
    case "media":
      return sendText(to, t.media);
    case "access":
      return sendButtons(to, t.access, [
        { id: "access:yes", title: t.yes },
        { id: "access:no", title: t.no },
      ]);
    case "time":
      return sendChoices(to, t.time, t.choose, Object.entries(TIMES[s.lang]).map(([id, title]) => ({ id: `time:${id}`, title })));
  }
}

// The approver taps ✅ Approve / ❌ Decline on a request.
async function handleApproval(msg: Incoming, action: "approve" | "decline", id: string) {
  const record = await loadRecord(id);
  if (!record) return sendText(msg.from, "This request no longer exists.");
  const result = await decide(record, action);
  const where = `Suite ${record.suite} · ${record.where.item}: ${record.where.problem}`;
  if (result.already) return sendText(msg.from, `Already ${result.status}: ${where}.`);
  if (!result.ok) return sendText(msg.from, `⚠️ Could not email ${result.trade.label}. Please try again.`);
  return sendText(msg.from, result.status === "approved" ? `✅ Approved and sent to ${result.trade.label} (${result.trade.email}).\n${where}` : `❌ Not approved: ${where}. Nothing was sent.`);
}

export async function handleMessage(msg: Incoming, baseUrl: string) {
  const to = msg.from;
  const [kind, value] = (msg.choice ?? "").split(":");

  if ((kind === "approve" || kind === "decline") && APPROVER_WHATSAPP && digits(to) === digits(APPROVER_WHATSAPP)) {
    return handleApproval(msg, kind, value);
  }

  const existing = await load(to);
  if (existing?.lastId === msg.id) return; // WhatsApp may deliver a message twice

  const text = msg.text?.trim() ?? "";
  const word = text.toLowerCase();
  if (START.has(word) || !existing || existing.step === "done") {
    // Outside a request, only a start word (e.g. "maintenance") begins one.
    if (!START.has(word)) return;
    const s: Session = { step: "lang", lang: "fr", lastId: msg.id, updatedAt: Date.now() };
    await save(to, s);
    return ask(to, s);
  }

  const s: Session = { ...existing, lastId: msg.id };
  const t = T[s.lang];
  let advanced = true;

  if (s.step === "lang" && kind === "lang" && (value === "fr" || value === "en")) {
    s.lang = value;
    s.step = "suite";
  } else if (s.step === "suite" && text) {
    s.suite = text.slice(0, 20);
    s.step = "name";
  } else if (s.step === "name" && text) {
    s.name = text.slice(0, 80);
    s.step = "room";
  } else if (s.step === "room" && kind === "room" && ROOMS.some((r) => r.id === value)) {
    s.room = value;
    s.step = "item";
  } else if (s.step === "item" && kind === "item" && room(s)?.items.some((i) => i.id === value)) {
    s.item = value;
    s.step = "problem";
  } else if (s.step === "problem" && kind === "problem" && item(s)?.problems.some((p) => p.id === value)) {
    s.problem = value;
    s.step = "media";
    if (problem(s)?.urgent) await sendText(to, t.urgent);
  } else if (s.step === "media" && msg.media) {
    const media = await downloadMedia(msg.media.id);
    if (!media) {
      await save(to, s);
      return sendText(to, t.failed);
    }
    const key = `whatsapp/media/${digits(to)}-${msg.id.replace(/\W/g, "").slice(-12)}`;
    await putFile(key, media.bytes, media.type);
    s.media = { key, type: media.type, kind: msg.media.kind };
    s.step = "access";
  } else if (s.step === "access" && kind === "access") {
    s.access = value === "yes";
    s.step = "time";
  } else if (s.step === "time" && kind === "time" && value in TIMES.en) {
    const r = room(s);
    const i = item(s);
    const p = problem(s);
    const bytes = s.media ? await getFile(s.media.key) : null;
    const ok =
      r && i && p && bytes && s.media
        ? await createRequest(
            {
              room: r,
              item: i,
              problem: p,
              lang: s.lang,
              source: "whatsapp",
              name: s.name || msg.name || "WhatsApp resident",
              suite: s.suite ?? "?",
              phone: `+${digits(to)}`,
              access: s.access,
              bestTime: TIMES.en[value as keyof typeof TIMES.en],
              media: { bytes, type: s.media.type, kind: s.media.kind },
            },
            baseUrl,
          )
        : false;
    await save(to, { ...s, step: ok ? "done" : s.step });
    return sendText(to, ok ? t.thanks : t.failed);
  } else {
    advanced = false;
  }

  await save(to, s);
  if (!advanced) {
    // Unexpected reply: give a hint and ask the same question again.
    if (s.step === "media") return sendText(to, t.needMedia);
    if (s.step !== "suite" && s.step !== "name") await sendText(to, t.pick);
  }
  return ask(to, s);
}

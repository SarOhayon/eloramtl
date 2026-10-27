// Everything the admin can change: photos, prices, suite availability, floor plans,
// section text and the offer. Saved in storage (content/site.json); anything not set
// falls back to the defaults below.

import { PRICE_FROM, type UnitType } from "./building";
import { dictionaries } from "@/i18n/dictionaries";
import { GALLERY, PHOTOS, type Photo } from "./photos";
import { AUTO_REPLY_HTML, CONFIRMATION_HTML, FOLLOW_UP_HTML } from "./emailDesigns";

export type SuiteStatus = "available" | "leased" | "soon";
export type SuiteInfo = { status?: SuiteStatus; price?: number; availableOn?: string; plan?: string };
export type AmenitySlot = "rooftop" | "gym" | "terrace" | "lounge" | "parking" | "living";
export type Bilingual = { fr: string; en: string };
export type LibraryItem = { src: string; name: string; type: string; uploadedAt: string };

// The one promotion: shown as a pop-up (once per visitor) and a side tab, between its dates.
export type Promo = {
  enabled: boolean;
  start?: string; // YYYY-MM-DD, Montréal time
  end?: string;
  kicker: Bilingual; // "One month"
  big: Bilingual; // "FREE"
  sub: Bilingual; // "On select units"
  fine: Bilingual; // "Certain conditions apply"
  cta: Bilingual; // button
  tab: Bilingual; // side tab
  photo?: string;
  types: UnitType[]; // apartment types it applies to
  suites: string[]; // specific suites it applies to
  showTab: boolean;
  showBand: boolean; // the large brown section
};

// Thin message bars at the top of the website, for holidays and special days. Each one has its
// own dates, so they can be scheduled up to a year ahead.
export type Notice = { id: string; enabled: boolean; start?: string; end?: string; text: Bilingual };

// Showing times visitors can book from the inquiry pop-up.
export type Weekday = "0" | "1" | "2" | "3" | "4" | "5" | "6"; // Sunday = "0"
export type ShowingHours = { from: string; to: string }; // "HH:MM", Montréal time
export type Showings = {
  enabled: boolean;
  slotMinutes: number;
  hours: Partial<Record<Weekday, ShowingHours>>; // a missing day = no showings
  blocked: string[]; // YYYY-MM-DD days with no showings (holidays, days off)
  minNoticeHours: number; // how soon a visitor can book
  daysAhead: number; // how far ahead
  email: EmailTemplate; // the confirmation visitors get after booking
};

// An email the site sends by itself. `html` is the designed version (empty = plain text only);
// `body` is the plain-text version. Words in braces are filled in (see EMAIL_BLANKS).
export type EmailTemplate = { subject: Bilingual; body: Bilingual; html: Bilingual };
export type AutoEmails = {
  autoReply: EmailTemplate & { enabled: boolean }; // to people who send an inquiry or apply
  followUp: EmailTemplate & { enabled: boolean; days: number }; // a few days after they came to a showing
  weekly: { enabled: boolean }; // Monday 8 a.m. summary to the leasing inbox
};

export type SiteContent = {
  photos: { hero: Photo[]; gallery: Photo[]; about: Photo; amenities: Record<AmenitySlot, Photo> };
  prices: Record<UnitType, number>;
  suites: Record<string, SuiteInfo>;
  floorPlans: Record<string, string>; // floor number -> file
  text: Record<string, Bilingual>; // dictionary path -> text, e.g. "hero.title"
  promo: Promo;
  notices: Notice[];
  showings: Showings;
  emails: AutoEmails;
  library: LibraryItem[]; // files uploaded through the admin
};

export const DEFAULT_CONTENT: SiteContent = {
  photos: {
    hero: [PHOTOS.lobby, PHOTOS.rooftop, PHOTOS.living, PHOTOS.gym, PHOTOS.facade],
    gallery: GALLERY,
    about: PHOTOS.alcoves,
    amenities: { rooftop: PHOTOS.rooftop, gym: PHOTOS.gym, terrace: PHOTOS.terrace, lounge: PHOTOS.workBooth, parking: PHOTOS.ev, living: PHOTOS.living },
  },
  prices: { ...PRICE_FROM },
  // Available apartments and 2026/2027 prices (price list of October 2026).
  suites: {
    "507": { status: "available", price: 1660 },
    "314": { status: "available", price: 1700 },
    "414": { status: "available", price: 1720 },
    "514": { status: "available", price: 1740 },
    "211": { status: "available", price: 1915 },
    "503": { status: "available", price: 2300 },
    "306": { status: "available", price: 2395 },
    "506": { status: "available", price: 2425 },
    "113": { status: "available", price: 2480, availableOn: "2026-11-01" },
    "304": { status: "available", price: 2720 },
    "504": { status: "available", price: 2760 },
    "215": { status: "available", price: 2850 },
    "315": { status: "available", price: 2870 },
    "415": { status: "available", price: 2890 },
    "112": { status: "available", price: 2900, availableOn: "2026-11-01" },
  },
  floorPlans: {},
  text: {},
  promo: {
    enabled: true,
    kicker: { fr: dictionaries.fr.offerBand.kicker, en: dictionaries.en.offerBand.kicker },
    big: { fr: dictionaries.fr.offerBand.big, en: dictionaries.en.offerBand.big },
    sub: { fr: dictionaries.fr.offerBand.sub, en: dictionaries.en.offerBand.sub },
    fine: { fr: dictionaries.fr.offerBand.fine, en: dictionaries.en.offerBand.fine },
    cta: { fr: dictionaries.fr.offerBand.cta, en: dictionaries.en.offerBand.cta },
    tab: { fr: dictionaries.fr.offer, en: dictionaries.en.offer },
    types: [],
    suites: [],
    showTab: true,
    showBand: false,
  },
  notices: [],
  showings: {
    enabled: false,
    slotMinutes: 30,
    hours: { "1": { from: "10:00", to: "17:00" }, "2": { from: "10:00", to: "17:00" }, "3": { from: "10:00", to: "17:00" }, "4": { from: "10:00", to: "17:00" }, "5": { from: "10:00", to: "17:00" } },
    blocked: [],
    minNoticeHours: 12,
    daysAhead: 21,
    email: {
      subject: { fr: "Votre visite à Elora : {date} à {time}", en: "Your Elora showing: {date} at {time}" },
      body: {
        fr: "Bonjour {name},\n\nVotre visite est confirmée pour le {date} à {time}, au {address}.\n\nL'invitation jointe l'ajoute à votre calendrier, avec un rappel 30 minutes avant.\nPour changer l'heure, répondez à ce courriel ou appelez-nous au {phone}.\n\nÀ bientôt!\nL'équipe Elora",
        en: "Hi {name},\n\nYour showing is confirmed for {date} at {time}, at {address}.\n\nThe attached invite adds it to your calendar, with a reminder 30 minutes before.\nTo change the time, reply to this email or call us at {phone}.\n\nSee you soon!\nThe Elora team",
      },
      html: CONFIRMATION_HTML,
    },
  },
  emails: {
    autoReply: {
      enabled: true,
      subject: { fr: "Merci de votre intérêt pour Elora MTL", en: "Thank you for your interest in Elora MTL" },
      body: {
        fr: "Bonjour {name},\n\nMerci de votre intérêt pour Elora MTL! Nous avons bien reçu votre message et un membre de notre équipe de location vous répondra d'ici 24 heures.\n{#promotion}\nOffre en cours : {promotion}\n{/promotion}\nD'ici là, vous pouvez réserver une visite privée en ligne ({website}#visit) ou nous écrire sur WhatsApp au {phone}.\n\nAu plaisir,\nL'équipe Elora",
        en: "Hi {name},\n\nThank you for your interest in Elora MTL! We received your message and a member of our leasing team will get back to you within 24 hours.\n{#promotion}\nCurrent offer: {promotion}\n{/promotion}\nIn the meantime, you can book a private showing online ({website}#visit) or message us on WhatsApp at {phone}.\n\nTalk soon,\nThe Elora team",
      },
      html: AUTO_REPLY_HTML,
    },
    followUp: {
      enabled: true,
      days: 2,
      subject: { fr: "Merci de votre visite à Elora MTL", en: "Thank you for visiting Elora MTL" },
      body: {
        fr: "Bonjour {name},\n\nMerci d'être venu visiter Elora le {date}. Nous espérons que les lieux vous ont plu!\n\nAvez-vous trouvé le logement qui vous convient? Si vous êtes prêt, vous pouvez déposer votre demande en ligne : {website}#apply\n{#promotion}\nOffre en cours : {promotion}\n{/promotion}\nDes questions, ou envie de revoir un logement? Répondez à ce courriel ou appelez-nous au {phone}.\n\nAu plaisir,\nL'équipe Elora",
        en: "Hi {name},\n\nThank you for coming to see Elora on {date}. We hope you enjoyed the visit!\n\nDid you find the right home for you? When you're ready, you can apply online: {website}#apply\n{#promotion}\nCurrent offer: {promotion}\n{/promotion}\nAny questions, or want to see a suite again? Just reply to this email or call us at {phone}.\n\nTalk soon,\nThe Elora team",
      },
      html: FOLLOW_UP_HTML,
    },
    weekly: { enabled: true },
  },
  library: [],
};

export const AMENITY_SLOTS: { key: AmenitySlot; label: string }[] = [
  { key: "rooftop", label: "Rooftop terrace (large tile)" },
  { key: "gym", label: "Fitness room" },
  { key: "terrace", label: "Ground-floor terrace" },
  { key: "lounge", label: "Lounge / work space" },
  { key: "parking", label: "Parking / EV" },
  { key: "living", label: "Suites section photo" },
];

// Text the admin can edit, grouped by section. `path` points into the dictionary.
export const EDITABLE_TEXT: { section: string; fields: { path: string; label: string; long?: boolean }[] }[] = [
  {
    section: "Top of page",
    fields: [
      { path: "hero.eyebrow", label: "Small label" },
      { path: "hero.title", label: "Headline" },
      { path: "hero.lead", label: "Intro", long: true },
      { path: "hero.primary", label: "Main button" },
      { path: "hero.secondary", label: "Second button" },
    ],
  },
  {
    section: "Residences (floor plans)",
    fields: [
      { path: "explorer.eyebrow", label: "Small label" },
      { path: "explorer.title", label: "Title" },
      { path: "explorer.lead", label: "Intro", long: true },
    ],
  },
  {
    section: "Amenities",
    fields: [
      { path: "amenities.eyebrow", label: "Small label" },
      { path: "amenities.title", label: "Title" },
      { path: "amenities.items.rooftop.title", label: "Rooftop: title" },
      { path: "amenities.items.rooftop.text", label: "Rooftop: text" },
      { path: "amenities.items.gym.title", label: "Gym: title" },
      { path: "amenities.items.gym.text", label: "Gym: text" },
      { path: "amenities.items.terrace.title", label: "Terrace: title" },
      { path: "amenities.items.terrace.text", label: "Terrace: text" },
      { path: "amenities.items.lounge.title", label: "Lounge: title" },
      { path: "amenities.items.lounge.text", label: "Lounge: text" },
      { path: "amenities.items.parking.title", label: "Parking: title" },
      { path: "amenities.items.parking.text", label: "Parking: text" },
    ],
  },
  {
    section: "Welcome",
    fields: [
      { path: "about.eyebrow", label: "Small label" },
      { path: "about.title", label: "Title" },
      { path: "about.text.0", label: "Paragraph 1", long: true },
      { path: "about.text.1", label: "Paragraph 2", long: true },
      { path: "about.text.2", label: "Paragraph 3", long: true },
    ],
  },
  {
    section: "Gallery",
    fields: [
      { path: "gallery.eyebrow", label: "Small label" },
      { path: "gallery.title", label: "Title" },
    ],
  },
  {
    section: "Neighbourhood",
    fields: [
      { path: "neighbourhood.eyebrow", label: "Small label" },
      { path: "neighbourhood.title", label: "Title" },
      { path: "neighbourhood.intro", label: "Intro", long: true },
    ],
  },
  {
    section: "Contact",
    fields: [
      { path: "contact.eyebrow", label: "Small label" },
      { path: "contact.title", label: "Title" },
      { path: "contact.lead", label: "Intro", long: true },
    ],
  },
];

export const EDITABLE_PATHS = new Set(EDITABLE_TEXT.flatMap((s) => s.fields.map((f) => f.path)));

// Reads a string at a dot path ("about.text.0") from a dictionary.
export function readPath(obj: unknown, path: string): string {
  const v = path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
  return typeof v === "string" ? v : "";
}

// Deep copy that keeps functions (the dictionary has a few, e.g. explorer.beds).
const clone = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(clone) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v;

// Returns a copy of the dictionary with the admin's text applied.
export function applyText<T>(dict: T, text: SiteContent["text"], locale: "fr" | "en"): T {
  const copy = clone(dict) as Record<string, unknown>;
  for (const [path, value] of Object.entries(text)) {
    const v = value?.[locale]?.trim();
    if (!v || !EDITABLE_PATHS.has(path)) continue;
    const keys = path.split(".");
    const last = keys.pop()!;
    const parent = keys.reduce<Record<string, unknown> | undefined>((o, k) => o?.[k] as Record<string, unknown> | undefined, copy);
    if (parent && typeof parent[last] === "string") parent[last] = v;
  }
  return copy as T;
}

// Files uploaded through the admin are served from /api/media/...
export const isUploaded = (src: string) => src.startsWith("/api/media/");

// Today's date in Montréal as YYYY-MM-DD.
export const todayInMontreal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal" }).format(new Date());

// Fills {name}-style blanks in an email template; unknown ones are left as they are.
// {#key}…{/key} parts are kept only when that value isn't empty (e.g. no promotion running).
export const fillTemplate = (text: string, values: Record<string, string>) =>
  text
    .replace(/\{#(\w+)\}([\s\S]*?)\{\/\1\}/g, (_all, key: string, inner: string) => (values[key]?.trim() ? inner : ""))
    .replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all);

// Words that can be used in the automatic emails, for the admin's help list and previews.
export const EMAIL_BLANKS: Record<string, string> = {
  "{name}": "the person's name",
  "{date}": "the day of the showing",
  "{time}": "the time of the showing",
  "{promotion}": "the current promotion (empty when none is running)",
  "{address}": "the building's address",
  "{phone}": "your phone number",
  "{website}": "the website's address",
};
export const siteUrl = (lang: "fr" | "en") => `${(process.env.SITE_URL || "https://www.eloramtl.com").replace(/\/$/, "")}/${lang}`;
// The same, for HTML: the filled-in values are escaped so a name can't change the email's design.
const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const fillHtmlTemplate = (html: string, values: Record<string, string>) =>
  fillTemplate(html, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, escapeHtml(v)])));

// Whether something with an on/off switch and optional dates (the promotion, the banner) is showing.
export type ScheduleState = "off" | "live" | "scheduled" | "ended";
export function scheduleState(p: { enabled: boolean; start?: string; end?: string }, today = todayInMontreal()): ScheduleState {
  if (!p.enabled) return "off";
  if (p.start && today < p.start) return "scheduled";
  if (p.end && today > p.end) return "ended";
  return "live";
}

// Whether the promotion applies to a given suite.
export const promoApplies = (p: Promo, suite: { id: string; type: UnitType }) => p.types.includes(suite.type) || p.suites.includes(suite.id);

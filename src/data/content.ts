// Everything the admin can change: photos, prices, suite availability, floor plans,
// section text and the offer. Saved in storage (content/site.json); anything not set
// falls back to the defaults below.

import { PRICE_FROM, type UnitType } from "./building";
import { GALLERY, PHOTOS, type Photo } from "./photos";

export type SuiteStatus = "available" | "leased" | "soon";
export type SuiteInfo = { status?: SuiteStatus; price?: number; availableOn?: string; plan?: string };
export type AmenitySlot = "rooftop" | "gym" | "terrace" | "lounge" | "parking" | "living";
export type Bilingual = { fr: string; en: string };
export type LibraryItem = { src: string; name: string; type: string; uploadedAt: string };

export type SiteContent = {
  photos: { hero: Photo[]; gallery: Photo[]; amenities: Record<AmenitySlot, Photo> };
  prices: Record<UnitType, number>;
  suites: Record<string, SuiteInfo>;
  floorPlans: Record<string, string>; // floor number -> file
  text: Record<string, Bilingual>; // dictionary path -> text, e.g. "hero.title"
  offer: { enabled: boolean };
  library: LibraryItem[]; // files uploaded through the admin
};

export const DEFAULT_CONTENT: SiteContent = {
  photos: {
    hero: [PHOTOS.lobby, PHOTOS.rooftop, PHOTOS.living, PHOTOS.gym, PHOTOS.facade],
    gallery: GALLERY,
    amenities: { rooftop: PHOTOS.rooftop, gym: PHOTOS.gym, terrace: PHOTOS.terrace, lounge: PHOTOS.workBooth, parking: PHOTOS.ev, living: PHOTOS.living },
  },
  prices: { ...PRICE_FROM },
  suites: {
    "112": { status: "available", availableOn: "2026-11-01" },
    "113": { status: "available", availableOn: "2026-11-01" },
  },
  floorPlans: {},
  text: {},
  offer: { enabled: true },
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
    section: "One month free offer",
    fields: [
      { path: "offerBand.kicker", label: "Line 1 (One month)" },
      { path: "offerBand.big", label: "Big word (Free)" },
      { path: "offerBand.sub", label: "Line 3 (On select units)" },
      { path: "offerBand.fine", label: "Fine print" },
      { path: "offerBand.cta", label: "Button" },
      { path: "offer", label: "Side tab" },
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

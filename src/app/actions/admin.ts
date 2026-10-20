"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { UNITS, UNIT_TYPES } from "@/data/building";
import { DEFAULT_CONTENT, EDITABLE_PATHS, type AmenitySlot, type Bilingual, type Promo, type SiteContent, type SuiteStatus } from "@/data/content";
import type { Photo, PhotoCategory } from "@/data/photos";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/adminAuth";
import { getContent, saveContent } from "@/lib/content";
import { putFile } from "@/lib/storage";

export type LoginState = { error?: boolean };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!checkPassword(String(formData.get("password") ?? ""))) return { error: true };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in");
}

// --- Validation: only accept what the site knows how to show. ---
const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
const validSrc = (v: unknown) => typeof v === "string" && (/^\/photos\/[\w.-]+$/.test(v) || /^\/api\/media\/[\w.-]+$/.test(v));
const CATEGORIES: PhotoCategory[] = ["building", "suites", "amenities"];

function photo(v: unknown): Photo | null {
  const p = v as Partial<Photo> | null;
  if (!p || !validSrc(p.src)) return null;
  return {
    src: p.src!,
    category: CATEGORIES.includes(p.category as PhotoCategory) ? (p.category as PhotoCategory) : "building",
    alt: { fr: str(p.alt?.fr, 200), en: str(p.alt?.en, 200) },
  };
}
const photos = (v: unknown) => (Array.isArray(v) ? v.map(photo).filter((p): p is Photo => p !== null).slice(0, 80) : []);

function clean(input: SiteContent): SiteContent {
  const amenities = { ...DEFAULT_CONTENT.photos.amenities };
  for (const key of Object.keys(amenities) as AmenitySlot[]) amenities[key] = photo(input.photos?.amenities?.[key]) ?? amenities[key];

  const prices = { ...DEFAULT_CONTENT.prices };
  for (const k of UNIT_TYPES) {
    const n = Number(input.prices?.[k]);
    if (Number.isFinite(n) && n > 0 && n < 100000) prices[k] = Math.round(n);
  }

  const ids = new Set(UNITS.map((u) => u.id));
  const suites: SiteContent["suites"] = {};
  for (const [id, s] of Object.entries(input.suites ?? {})) {
    if (!ids.has(id) || !s) continue;
    const status = (["available", "leased", "soon"] as SuiteStatus[]).find((x) => x === s.status);
    const price = Number(s.price);
    suites[id] = {
      ...(status ? { status } : {}),
      ...(Number.isFinite(price) && price > 0 && price < 100000 ? { price: Math.round(price) } : {}),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(String(s.availableOn)) ? { availableOn: String(s.availableOn) } : {}),
      ...(validSrc(s.plan) ? { plan: s.plan } : {}),
    };
  }

  const floorPlans: SiteContent["floorPlans"] = {};
  for (const [floor, src] of Object.entries(input.floorPlans ?? {})) if (/^[1-7]$/.test(floor) && validSrc(src)) floorPlans[floor] = src;

  const text: SiteContent["text"] = {};
  for (const [path, v] of Object.entries(input.text ?? {})) {
    if (EDITABLE_PATHS.has(path) && (str(v?.fr) || str(v?.en))) text[path] = { fr: str(v?.fr), en: str(v?.en) };
  }

  const library = Array.isArray(input.library)
    ? input.library.filter((f) => validSrc(f?.src)).map((f) => ({ src: f.src, name: str(f.name, 120), type: str(f.type, 60), uploadedAt: str(f.uploadedAt, 40) }))
    : [];

  return {
    photos: { hero: photos(input.photos?.hero), gallery: photos(input.photos?.gallery), amenities },
    prices,
    suites,
    floorPlans,
    text,
    promo: cleanPromo(input.promo, ids),
    library,
  };
}

const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

function cleanPromo(p: Partial<Promo> | undefined, suiteIds: Set<string>): Promo {
  const d = DEFAULT_CONTENT.promo;
  const bi = (v: Partial<Bilingual> | undefined, fallback: Bilingual): Bilingual => ({ fr: str(v?.fr, 300) || fallback.fr, en: str(v?.en, 300) || fallback.en });
  const start = date(p?.start);
  const end = date(p?.end);
  return {
    enabled: p?.enabled !== false,
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    kicker: bi(p?.kicker, d.kicker),
    big: bi(p?.big, d.big),
    sub: bi(p?.sub, d.sub),
    fine: { fr: str(p?.fine?.fr, 300), en: str(p?.fine?.en, 300) },
    cta: bi(p?.cta, d.cta),
    tab: bi(p?.tab, d.tab),
    ...(validSrc(p?.photo) ? { photo: p!.photo } : {}),
    types: UNIT_TYPES.filter((t) => p?.types?.includes(t)),
    suites: [...new Set((p?.suites ?? []).map(String).filter((id) => suiteIds.has(id)))],
    showTab: p?.showTab !== false,
    showBand: p?.showBand === true,
  };
}

export async function saveSiteContent(content: SiteContent): Promise<{ ok: boolean; content?: SiteContent }> {
  await requireAdmin();
  try {
    const cleaned = clean(content);
    if (!cleaned.photos.hero.length) cleaned.photos.hero = DEFAULT_CONTENT.photos.hero;
    await saveContent(cleaned);
    return { ok: true, content: cleaned };
  } catch (err) {
    console.error("[admin] save failed", err);
    return { ok: false };
  }
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
const MAX_UPLOAD = 15 * 1024 * 1024;

// Stores an uploaded image or PDF and records it in the library.
export async function uploadFile(formData: FormData): Promise<{ ok: boolean; src?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || !EXT[file.type]) return { ok: false, error: "Only JPG, PNG, WebP or PDF files." };
  if (file.size > MAX_UPLOAD) return { ok: false, error: "File is larger than 15 MB." };
  const name = `${Date.now()}-${randomBytes(3).toString("hex")}.${EXT[file.type]}`;
  try {
    await putFile(`media/${name}`, Buffer.from(await file.arrayBuffer()), file.type);
    const src = `/api/media/${name}`;
    const current = await getContent();
    await saveContent({ ...current, library: [{ src, name: file.name.slice(0, 120), type: file.type, uploadedAt: new Date().toISOString() }, ...current.library] });
    return { ok: true, src };
  } catch (err) {
    console.error("[admin] upload failed", err);
    return { ok: false, error: "Upload failed. Check the storage settings." };
  }
}

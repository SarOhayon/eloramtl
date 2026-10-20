import { connection } from "next/server";
import { DEFAULT_CONTENT, type SiteContent } from "@/data/content";
import { getFile, putFile } from "./storage";

const KEY = "content/site.json";

// Short in-memory copy so a busy page doesn't read storage on every request.
let memo: { at: number; value: SiteContent } | null = null;
const MEMO_MS = 3000;

function merge(saved: Partial<SiteContent>): SiteContent {
  const d = DEFAULT_CONTENT;
  return {
    photos: {
      hero: saved.photos?.hero?.length ? saved.photos.hero : d.photos.hero,
      gallery: saved.photos?.gallery ?? d.photos.gallery,
      amenities: { ...d.photos.amenities, ...saved.photos?.amenities },
    },
    prices: { ...d.prices, ...saved.prices },
    suites: saved.suites ?? d.suites,
    floorPlans: saved.floorPlans ?? d.floorPlans,
    text: saved.text ?? d.text,
    offer: { ...d.offer, ...saved.offer },
    library: saved.library ?? d.library,
  };
}

// The site's current content. Read per request so admin changes show up right away.
export async function getContent(): Promise<SiteContent> {
  await connection();
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  let value = DEFAULT_CONTENT;
  try {
    const raw = await getFile(KEY);
    if (raw) value = merge(JSON.parse(raw.toString("utf8")) as Partial<SiteContent>);
  } catch (err) {
    console.error("[content] could not read, using defaults", err);
  }
  memo = { at: Date.now(), value };
  return value;
}

export async function saveContent(content: SiteContent) {
  await putFile(KEY, JSON.stringify(content, null, 2), "application/json");
  memo = { at: Date.now(), value: content };
}

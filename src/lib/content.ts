import { connection } from "next/server";
import { DEFAULT_CONTENT, type SiteContent } from "@/data/content";
import { getFile, putFile } from "./storage";

const KEY = "content/site.json";

// Short in-memory copy so a busy page doesn't read storage on every request.
let memo: { at: number; value: SiteContent } | null = null;
const MEMO_MS = 3000;

type Saved = Partial<SiteContent> & { offer?: { enabled?: boolean }; notice?: Omit<SiteContent["notices"][number], "id"> };

function merge(saved: Saved): SiteContent {
  const d = DEFAULT_CONTENT;
  return {
    photos: {
      hero: saved.photos?.hero?.length ? saved.photos.hero : d.photos.hero,
      gallery: saved.photos?.gallery ?? d.photos.gallery,
      about: saved.photos?.about ?? d.photos.about,
      amenities: { ...d.photos.amenities, ...saved.photos?.amenities },
    },
    prices: { ...d.prices, ...saved.prices },
    // Saved settings win; the built-in list fills in apartments not yet touched in the admin.
    suites: { ...d.suites, ...saved.suites },
    floorPlans: saved.floorPlans ?? d.floorPlans,
    text: saved.text ?? d.text,
    promo: mergePromo(saved),
    // Earlier saves had a single banner.
    notices: saved.notices ?? (saved.notice ? [{ ...saved.notice, id: "banner-1" }] : d.notices),
    showings: { ...d.showings, ...saved.showings },
    library: saved.library ?? d.library,
  };
}

// Older saves had an on/off offer and its wording in the text overrides.
function mergePromo(saved: Saved): SiteContent["promo"] {
  const d = DEFAULT_CONTENT.promo;
  if (saved.promo) return { ...d, ...saved.promo };
  const t = saved.text ?? {};
  const pick = (path: string, fallback: SiteContent["promo"]["kicker"]) => ({ fr: t[path]?.fr || fallback.fr, en: t[path]?.en || fallback.en });
  return {
    ...d,
    enabled: saved.offer?.enabled ?? d.enabled,
    showBand: saved.offer ? true : d.showBand,
    kicker: pick("offerBand.kicker", d.kicker),
    big: pick("offerBand.big", d.big),
    sub: pick("offerBand.sub", d.sub),
    fine: pick("offerBand.fine", d.fine),
    cta: pick("offerBand.cta", d.cta),
    tab: pick("offer", d.tab),
  };
}

// The site's current content. Read per request so admin changes show up right away.
export async function getContent(): Promise<SiteContent> {
  await connection();
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  let value = DEFAULT_CONTENT;
  try {
    const raw = await getFile(KEY);
    if (raw) value = merge(JSON.parse(raw.toString("utf8")) as Saved);
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

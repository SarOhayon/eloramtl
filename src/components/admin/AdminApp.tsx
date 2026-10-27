"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logout, saveSiteContent, uploadFile } from "@/app/actions/admin";
import { FLOORS, UNITS, UNIT_TYPES, formatPrice, type UnitType } from "@/data/building";
import { AMENITY_SLOTS, EDITABLE_TEXT, promoState, readPath, type Bilingual, type Promo, type SiteContent, type SuiteStatus } from "@/data/content";
import { GALLERY, PHOTOS, type Photo, type PhotoCategory } from "@/data/photos";
import { dictionaries } from "@/i18n/dictionaries";
import { PromoCard } from "../PromoCard";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  CloseIcon,
  ExternalIcon,
  IconBadge,
  ImageIcon,
  PlusIcon,
  PriceIcon,
  TagIcon,
  TextIcon,
  UploadIcon,
} from "./AdminIcons";
import { Wordmark } from "../Wordmark";

// A deliberately simple admin: a home screen with big buttons, one task per screen,
// plain-English help and automatic saving.

type Screen = "home" | "promo" | "apartments" | "photos" | "prices" | "text";
type Update = (fn: (c: SiteContent) => SiteContent) => void;
type Upload = (file: File) => Promise<string | null>;

const TYPE_LABELS = dictionaries.en.types;
const field = "w-full rounded-md bg-white px-4 py-3 text-base ring-1 ring-brown/20 focus:outline-none focus:ring-2 focus:ring-gold";
const bigBtn = "inline-flex items-center justify-center gap-2 rounded-md bg-action px-5 py-3 text-base font-medium text-white transition hover:bg-action-deep disabled:opacity-40";
const softBtn = "inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-base ring-1 ring-brown/20 transition hover:bg-cream-deep disabled:opacity-40";
const isPdf = (src: string) => src.endsWith(".pdf");
const move = <T,>(list: T[], from: number, to: number) => {
  const next = list.slice();
  const [x] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, x);
  return next;
};

// Photos are shrunk in the browser before upload (max 2400px, JPEG).
async function prepare(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function AdminApp({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState(initial);
  const [screen, setScreen] = useState<Screen>("home");
  const [saveState, setSaveState] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const [notice, setNotice] = useState<{ kind: "ok" | "error" | "busy"; text: string } | null>(null);
  const version = useRef(0);

  const update: Update = useCallback((fn) => {
    setContent((c) => fn(c));
    version.current += 1;
    setSaveState("pending");
  }, []);

  // Automatic saving, one second after the last change.
  useEffect(() => {
    if (saveState !== "pending") return;
    const v = version.current;
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const res = await saveSiteContent(content).catch(() => ({ ok: false }));
      if (version.current !== v) return setSaveState("pending"); // more changes came in meanwhile
      setSaveState(res.ok ? "saved" : "error");
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [saveState, content]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  useEffect(() => window.scrollTo({ top: 0 }), [screen]);

  const upload: Upload = async (file) => {
    setNotice({ kind: "busy", text: `Uploading ${file.name}…` });
    const fd = new FormData();
    fd.set("file", await prepare(file));
    const res = await uploadFile(fd).catch(() => ({ ok: false, src: undefined, error: undefined }));
    if (!res.ok || !res.src) {
      setNotice({ kind: "error", text: res.error ?? "The upload didn't work. Please try again." });
      return null;
    }
    update((c) => ({ ...c, library: [{ src: res.src!, name: file.name, type: file.type, uploadedAt: new Date().toISOString() }, ...c.library.filter((f) => f.src !== res.src)] }));
    setNotice({ kind: "ok", text: `“${file.name}” was uploaded.` });
    return res.src;
  };

  return (
    <div className="min-h-svh pb-24 text-base">
      <header className="sticky top-0 z-30 border-b border-sand bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => setScreen("home")} className="flex items-center gap-3" aria-label="Home">
            <Wordmark className="h-10 w-auto" />
            <span className="text-xs uppercase tracking-[0.25em] text-gold">Admin</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <SaveBadge state={saveState} />
            <a href="/en" target="_blank" className={softBtn}>
              View my website <ExternalIcon className="size-4" />
            </a>
            <button onClick={() => logout()} className={softBtn}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className={`sticky top-[73px] z-20 px-4 py-3 text-center text-base ${notice.kind === "error" ? "bg-red-50 text-red-900" : notice.kind === "busy" ? "bg-cream-deep text-brown" : "bg-[#eaf3ec] text-[#2f5a38]"}`} role="status">
          {notice.text}
          <button className="ml-4 underline" onClick={() => setNotice(null)}>
            OK
          </button>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">
        {screen === "home" ? (
          <Home content={content} go={setScreen} />
        ) : (
          <>
            <button onClick={() => setScreen("home")} className={`${softBtn} mb-6`}>
              <ArrowLeftIcon className="size-4" /> Back to home
            </button>
            {screen === "promo" && <PromoScreen content={content} update={update} upload={upload} />}
            {screen === "apartments" && <ApartmentsScreen content={content} update={update} upload={upload} />}
            {screen === "photos" && <PhotosScreen content={content} update={update} upload={upload} />}
            {screen === "prices" && <PricesScreen content={content} update={update} />}
            {screen === "text" && <TextScreen content={content} update={update} />}
          </>
        )}
      </main>
    </div>
  );
}

function SaveBadge({ state }: { state: "saved" | "pending" | "saving" | "error" }) {
  const map = {
    saved: ["bg-[#eaf3ec] text-[#2f5a38]", "All changes saved"],
    pending: ["bg-cream-deep text-brown-soft", "Saving soon…"],
    saving: ["bg-cream-deep text-brown-soft", "Saving…"],
    error: ["bg-red-50 text-red-900", "Not saved. Check your internet."],
  } as const;
  const [cls, label] = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${cls}`}>
      {state === "saved" && <CheckIcon className="size-4" />}
      {state === "error" && <AlertIcon className="size-4" />}
      {label}
    </span>
  );
}

// ---------------- Home ----------------

const PROMO_STATUS = {
  live: ["bg-[#3b6b45]", "Showing on the website now"],
  scheduled: ["bg-gold", "Scheduled: will start by itself"],
  ended: ["bg-sand", "Ended: its end date has passed"],
  off: ["bg-sand", "Turned off"],
} as const;

function PromoStatus({ state }: { state: keyof typeof PROMO_STATUS }) {
  const [dot, label] = PROMO_STATUS[state];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function Home({ content, go }: { content: SiteContent; go: (s: Screen) => void }) {
  const available = Object.values(content.suites).filter((s) => s.status === "available").length;
  const tiles: { screen: Screen; icon: React.ReactNode; title: string; text: string; note?: React.ReactNode }[] = [
    { screen: "promo", icon: <TagIcon className="size-6" />, title: "Promotion", text: "Create or change your special offer.", note: <PromoStatus state={promoState(content.promo)} /> },
    { screen: "apartments", icon: <BuildingIcon className="size-6" />, title: "Apartments", text: "Mark apartments available or rented, set prices, dates and plans.", note: `${available} marked available` },
    { screen: "photos", icon: <ImageIcon className="size-6" />, title: "Photos", text: "Add, remove or reorder the photos on the website." },
    { screen: "prices", icon: <PriceIcon className="size-6" />, title: "Starting prices", text: "The “From $…” price for each type of apartment." },
    { screen: "text", icon: <TextIcon className="size-6" />, title: "Website text", text: "Change the titles and paragraphs, in French and English." },
  ];
  return (
    <>
      <h1 className="font-display text-4xl text-ink">Welcome</h1>
      <p className="mt-2 text-lg text-brown-soft">What would you like to do? Click a box to start. Everything saves by itself.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <button
            key={t.screen}
            onClick={() => go(t.screen)}
            className="flex items-start gap-4 rounded-lg bg-cream p-6 text-left shadow-sm ring-1 ring-sand transition hover:-translate-y-0.5 hover:shadow-md hover:ring-gold"
          >
            <IconBadge>{t.icon}</IconBadge>
            <span>
              <span className="block font-display text-3xl text-ink">{t.title}</span>
              <span className="mt-1 block text-brown-soft">{t.text}</span>
              {t.note && <span className="mt-3 block text-sm font-medium text-brown">{t.note}</span>}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------- Shared pieces ----------------

function ScreenTitle({ title, help, icon }: { title: string; help: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="flex items-center gap-4 font-display text-4xl text-ink">
        {icon && <IconBadge className="size-12">{icon}</IconBadge>}
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-lg text-brown-soft">{help}</p>
    </div>
  );
}

function Step({ n, title, help, children }: { n?: number; title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-cream p-6 shadow-sm ring-1 ring-sand">
      <h2 className="flex items-center gap-3 font-display text-2xl text-ink">
        {n !== undefined && <span className="inline-flex size-9 items-center justify-center rounded-full bg-action font-sans text-base text-white">{n}</span>}
        {title}
      </h2>
      {help && <p className="mt-1 text-brown-soft">{help}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-4 text-left">
      <span className={`relative h-9 w-16 shrink-0 rounded-full transition ${on ? "bg-[#3b6b45]" : "bg-sand"}`}>
        <span className={`absolute top-1 size-7 rounded-full bg-white shadow transition ${on ? "left-8" : "left-1"}`} />
      </span>
      <span className="text-lg">{label}</span>
    </button>
  );
}

function UploadButton({ label, accept, onFile, className = bigBtn }: { label: string; accept: string; onFile: (f: File) => void; className?: string }) {
  return (
    <label className={`${className} cursor-pointer`}>
      <UploadIcon className="size-5" />
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

function BilingualFields({ label, value, onChange, long = false, placeholder }: { label: string; value: Bilingual; onChange: (v: Bilingual) => void; long?: boolean; placeholder?: Bilingual }) {
  return (
    <div>
      <p className="mb-2 font-medium">{label}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(["fr", "en"] as const).map((lang) => {
          const props = { className: field, value: value[lang], placeholder: placeholder?.[lang], "aria-label": `${label} (${lang === "fr" ? "French" : "English"})` };
          return (
            <label key={lang} className="block">
              <span className="mb-1 block text-sm text-brown-soft">{lang === "fr" ? "French" : "English"}</span>
              {long ? (
                <textarea {...props} rows={3} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
              ) : (
                <input {...props} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// All the photos available: uploaded ones first, then the original ones.
function usePhotoLibrary(content: SiteContent) {
  return useMemo(() => {
    const uploaded = content.library.filter((f) => !isPdf(f.src)).map((f) => ({ src: f.src, name: f.name, uploaded: true }));
    const builtIn = Object.values(PHOTOS).map((p) => ({ src: p.src, name: p.alt.en, uploaded: false }));
    return [...uploaded, ...builtIn.filter((b, i, all) => all.findIndex((x) => x.src === b.src) === i)];
  }, [content.library]);
}

// A window to pick a photo, with a big "upload" button at the top.
function PhotoPicker({ title, content, upload, onPick, onClose }: { title: string; content: SiteContent; upload: Upload; onPick: (src: string) => void; onClose: () => void }) {
  const library = usePhotoLibrary(content);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90svh] w-full max-w-4xl overflow-auto rounded-lg bg-cream p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl text-ink">{title}</h3>
          <button className={softBtn} onClick={onClose}>
            <CloseIcon className="size-4" /> Close
          </button>
        </div>
        <UploadButton
          label="Upload a new photo from my computer"
          accept="image/jpeg,image/png,image/webp"
          onFile={async (f) => {
            const src = await upload(f);
            if (src) {
              onPick(src);
              onClose();
            }
          }}
        />
        <p className="mb-3 mt-6 text-brown-soft">…or click one of your photos:</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {library.map((img) => (
            <button
              key={img.src}
              onClick={() => {
                onPick(img.src);
                onClose();
              }}
              className="overflow-hidden rounded-md ring-1 ring-sand transition hover:ring-4 hover:ring-gold"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Promotion ----------------

function PromoScreen({ content, update, upload }: { content: SiteContent; update: Update; upload: Upload }) {
  const p = content.promo;
  const [previewLang, setPreviewLang] = useState<"fr" | "en">("en");
  const [picking, setPicking] = useState(false);
  const set = (patch: Partial<Promo>) => update((c) => ({ ...c, promo: { ...c.promo, ...patch } }));
  const state = promoState(p);
  const t = dictionaries[previewLang];
  const dateFmt = new Intl.DateTimeFormat(previewLang === "fr" ? "fr-CA" : "en-CA", { dateStyle: "long", timeZone: "UTC" });
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <>
      <ScreenTitle icon={<TagIcon className="size-5" />} title="Promotion" help="Your special offer appears as a pop-up the first time someone visits, and as a tab on the left side of the website. Fill in the steps below; the preview shows exactly what visitors will see." />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Step n={1} title="Turn it on or off">
            <Switch on={p.enabled} onChange={(v) => set({ enabled: v })} label={p.enabled ? "The promotion is ON" : "The promotion is OFF"} />
            <p className="mt-3 font-medium">
              <PromoStatus state={state} />
            </p>
          </Step>

          <Step n={2} title="When does it run?" help="Leave a date empty if it has no start or no end. It turns on and off by itself on these dates.">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["start", "end"] as const).map((k) => (
                <label key={k} className="block">
                  <span className="mb-1 block font-medium">{k === "start" ? "Starts on" : "Ends on"}</span>
                  <div className="flex gap-2">
                    <input type="date" className={field} value={p[k] ?? ""} onChange={(e) => set({ [k]: e.target.value || undefined })} />
                    {p[k] && (
                      <button className={softBtn} onClick={() => set({ [k]: undefined })}>
                        Clear
                      </button>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </Step>

          <Step n={3} title="What does it say?" help="Write it in French and in English.">
            <div className="space-y-5">
              <BilingualFields label="First line (e.g. “One month”)" value={p.kicker} onChange={(v) => set({ kicker: v })} />
              <BilingualFields label="Big gold word (e.g. “FREE”)" value={p.big} onChange={(v) => set({ big: v })} />
              <BilingualFields label="Line under it (e.g. “On select units”)" value={p.sub} onChange={(v) => set({ sub: v })} />
              <BilingualFields label="Small print (optional)" value={p.fine} onChange={(v) => set({ fine: v })} />
              <BilingualFields label="Button text" value={p.cta} onChange={(v) => set({ cta: v })} />
              <BilingualFields label="Side tab text" value={p.tab} onChange={(v) => set({ tab: v })} />
            </div>
          </Step>

          <Step n={4} title="Photo (optional)" help="A photo shown next to the offer.">
            <div className="flex flex-wrap items-center gap-4">
              {p.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo} alt="" className="h-28 w-40 rounded-md object-cover ring-1 ring-sand" />
              )}
              <button className={bigBtn} onClick={() => setPicking(true)}>
                {p.photo ? "Change the photo" : "Choose a photo"}
              </button>
              {p.photo && (
                <button className={softBtn} onClick={() => set({ photo: undefined })}>
                  Remove the photo
                </button>
              )}
            </div>
          </Step>

          <Step n={5} title="Which apartments does it apply to?" help="Tick the types, and/or click specific apartments. They get a “Promo” badge on the floor plan. Leave everything empty if it applies to the whole building.">
            <p className="mb-2 font-medium">Types of apartments</p>
            <div className="flex flex-wrap gap-3">
              {UNIT_TYPES.map((k) => (
                <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 ring-1 ${p.types.includes(k) ? "bg-gold-light ring-gold" : "bg-white ring-brown/20"}`}>
                  <input type="checkbox" className="size-5 accent-[#503d32]" checked={p.types.includes(k)} onChange={() => set({ types: toggle(p.types, k) })} />
                  {TYPE_LABELS[k]}
                </label>
              ))}
            </div>
            <p className="mb-2 mt-6 font-medium">Specific apartments {p.suites.length > 0 && <span className="text-brown-soft">({p.suites.join(", ")})</span>}</p>
            <div className="space-y-2">
              {FLOORS.slice().reverse().map((f) => (
                <div key={f} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-16 text-sm text-brown-soft">Floor {f}</span>
                  {UNITS.filter((u) => u.floor === f).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => set({ suites: toggle(p.suites, u.id) })}
                      className={`min-w-12 rounded-md px-2 py-1.5 text-sm ring-1 ${p.suites.includes(u.id) ? "bg-gold text-white ring-gold" : "bg-white ring-brown/15 hover:ring-brown/40"}`}
                    >
                      {u.id}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </Step>

          <Step n={6} title="Where should it show?" help="The pop-up always shows once to each visitor while the promotion runs.">
            <div className="space-y-4">
              <Switch on={p.showTab} onChange={(v) => set({ showTab: v })} label="Tab on the left side of the website" />
              <Switch on={p.showBand} onChange={(v) => set({ showBand: v })} label="Large brown section under the top photos" />
            </div>
          </Step>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-2xl text-ink">Preview</p>
            <div className="flex overflow-hidden rounded-md ring-1 ring-brown/20">
              {(["fr", "en"] as const).map((l) => (
                <button key={l} onClick={() => setPreviewLang(l)} className={`px-4 py-2 text-sm ${previewLang === l ? "bg-action text-white" : "bg-white"}`}>
                  {l === "fr" ? "French" : "English"}
                </button>
              ))}
            </div>
          </div>
          <div className="origin-top scale-[0.9]">
            <PromoCard
              photo={p.photo}
              text={{
                kicker: p.kicker[previewLang],
                big: p.big[previewLang],
                sub: p.sub[previewLang],
                fine: p.fine[previewLang],
                cta: p.cta[previewLang],
                dates: p.end ? t.promo.until(dateFmt.format(new Date(p.end))) : undefined,
                applies: p.types.length || p.suites.length ? t.promo.applies([...p.types.map((k) => t.types[k]), ...p.suites.map((id) => `${t.explorer.unit} ${id}`)].join(" · ")) : undefined,
              }}
            />
          </div>
        </aside>
      </div>

      {picking && <PhotoPicker title="Choose the promotion photo" content={content} upload={upload} onPick={(src) => set({ photo: src })} onClose={() => setPicking(false)} />}
    </>
  );
}

// ---------------- Apartments ----------------

const STATUS: { key: SuiteStatus; label: string; on: string }[] = [
  { key: "available", label: "Available", on: "bg-[#3b6b45] text-white ring-[#3b6b45]" },
  { key: "soon", label: "Coming soon", on: "bg-gold text-white ring-gold" },
  { key: "leased", label: "Rented", on: "bg-brown text-white ring-brown" },
];

function ApartmentsScreen({ content, update, upload }: { content: SiteContent; update: Update; upload: Upload }) {
  const [floor, setFloor] = useState(1);
  const setSuite = (id: string, patch: Record<string, unknown>) =>
    update((c) => {
      const next = { ...c.suites[id], ...patch } as Record<string, unknown>;
      for (const k of Object.keys(next)) if (next[k] === "" || next[k] === undefined) delete next[k];
      return { ...c, suites: { ...c.suites, [id]: next } };
    });
  const floorPlan = content.floorPlans[String(floor)];

  return (
    <>
      <ScreenTitle icon={<BuildingIcon className="size-5" />} title="Apartments" help="Choose a floor, then update each apartment. Only apartments marked Available or Coming soon can be opened on the website; the others appear greyed out. Leave the price empty to use the starting price." />
      <p className="mb-2 font-medium">Choose a floor:</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {FLOORS.slice().reverse().map((f) => (
          <button key={f} onClick={() => setFloor(f)} className={`rounded-md px-5 py-3 text-base ring-1 ${f === floor ? "bg-action text-white ring-action" : "bg-white ring-brown/20 hover:ring-brown/40"}`}>
            Floor {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {UNITS.filter((u) => u.floor === floor).map((u) => {
          const s = content.suites[u.id] ?? {};
          return (
            <section key={u.id} className="rounded-lg bg-cream p-5 shadow-sm ring-1 ring-sand">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="font-display text-3xl text-ink">Apartment {u.id}</h2>
                <p className="text-brown-soft">
                  {TYPE_LABELS[u.type]} · {u.sqft} sq ft
                </p>
              </div>
              <div className="mt-4 grid gap-5 md:grid-cols-[1.3fr_1fr_1fr]">
                <div>
                  <p className="mb-2 text-sm font-medium">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS.map((st) => (
                      <button
                        key={st.key}
                        onClick={() => setSuite(u.id, { status: s.status === st.key ? undefined : st.key })}
                        className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 ring-1 ${s.status === st.key ? st.on : "bg-white ring-brown/20 hover:ring-brown/40"}`}
                      >
                        {s.status === st.key && <CheckIcon className="size-4" />}
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Price per month</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-brown-soft">$</span>
                    <input
                      className={field}
                      type="number"
                      min={0}
                      placeholder={`${content.prices[u.type]} (starting price)`}
                      value={s.price ?? ""}
                      onChange={(e) => setSuite(u.id, { price: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Available from (move-in date)</span>
                  <input className={field} type="date" value={s.availableOn ?? ""} onChange={(e) => setSuite(u.id, { availableOn: e.target.value || undefined })} />
                  <span className="mt-1.5 block text-sm text-brown-soft">
                    {!s.availableOn
                      ? "Leave empty if it's free now."
                      : s.status === "available" || s.status === "soon"
                        ? "The website shows “Available on …” until that day."
                        : "Choose Available or Coming soon so visitors can see this date."}
                  </span>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Apartment plan:</span>
                {s.plan ? (
                  <>
                    <a href={s.plan} target="_blank" rel="noopener noreferrer" className="underline">
                      See the plan
                    </a>
                    <button className={softBtn} onClick={() => setSuite(u.id, { plan: undefined })}>
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="text-brown-soft">none yet</span>
                )}
                <UploadButton
                  className={softBtn}
                  label={s.plan ? "Replace the plan" : "Add a plan (photo or PDF)"}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onFile={async (f) => {
                    const src = await upload(f);
                    if (src) setSuite(u.id, { plan: src });
                  }}
                />
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6">
        <Step title={`Plan of the whole floor ${floor}`} help="Optional. Visitors see a “View the floor plan” link.">
          <div className="flex flex-wrap items-center gap-3">
            {floorPlan ? (
              <a href={floorPlan} target="_blank" rel="noopener noreferrer" className="underline">
                See the current floor plan
              </a>
            ) : (
              <span className="text-brown-soft">No floor plan yet.</span>
            )}
            <UploadButton
              label={floorPlan ? "Replace the floor plan" : "Add the floor plan (photo or PDF)"}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onFile={async (f) => {
                const src = await upload(f);
                if (src) update((c) => ({ ...c, floorPlans: { ...c.floorPlans, [String(floor)]: src } }));
              }}
            />
            {floorPlan && (
              <button
                className={softBtn}
                onClick={() =>
                  update((c) => {
                    const fp = { ...c.floorPlans };
                    delete fp[String(floor)];
                    return { ...c, floorPlans: fp };
                  })
                }
              >
                Remove
              </button>
            )}
          </div>
        </Step>
      </div>
    </>
  );
}

// ---------------- Photos ----------------

function PhotosScreen({ content, update, upload }: { content: SiteContent; update: Update; upload: Upload }) {
  const [picking, setPicking] = useState<null | { title: string; onPick: (src: string) => void }>(null);
  const library = usePhotoLibrary(content);
  const known = (src: string): Photo =>
    [...content.photos.gallery, ...content.photos.hero, ...GALLERY].find((p) => p.src === src) ?? { src, category: "building", alt: { fr: "", en: "" } };
  const setList = (key: "hero" | "gallery", fn: (list: Photo[]) => Photo[]) => update((c) => ({ ...c, photos: { ...c.photos, [key]: fn(c.photos[key]) } }));

  return (
    <>
      <ScreenTitle icon={<ImageIcon className="size-5" />} title="Photos" help="Use the buttons under each photo to move it or remove it. To add one, click “Add a photo”: you can upload a new one or pick an existing one." />
      <div className="space-y-6">
        <PhotoRow
          title="Big photos at the top of the page"
          help="They change automatically every few seconds. Photo #1 shows first."
          photos={content.photos.hero}
          min={1}
          onChange={(fn) => setList("hero", fn)}
          onAdd={() => setPicking({ title: "Add a photo to the top of the page", onPick: (src) => setList("hero", (l) => [...l, known(src)]) })}
        />
        <PhotoRow
          title="Gallery"
          help="The photo gallery further down the page."
          photos={content.photos.gallery}
          categories
          onChange={(fn) => setList("gallery", fn)}
          onAdd={() => setPicking({ title: "Add a photo to the gallery", onPick: (src) => setList("gallery", (l) => [...l, known(src)]) })}
        />
        <Step title="“Welcome to Elora” photo" help="The photo beside the welcome text. Click “Change” to replace it.">
          <figure className="max-w-sm overflow-hidden rounded-md bg-white ring-1 ring-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.photos.about.src} alt="" className="aspect-[4/5] w-full object-cover" />
            <figcaption className="p-3">
              <button
                className={softBtn}
                onClick={() =>
                  setPicking({ title: "Photo for: Welcome to Elora", onPick: (src) => update((c) => ({ ...c, photos: { ...c.photos, about: known(src) } })) })
                }
              >
                Change
              </button>
            </figcaption>
          </figure>
        </Step>
        <Step title="Amenity photos" help="The photo shown for each amenity. Click “Change” to replace it.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {AMENITY_SLOTS.map((slot) => (
              <figure key={slot.key} className="overflow-hidden rounded-md bg-white ring-1 ring-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.photos.amenities[slot.key].src} alt="" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="space-y-2 p-3">
                  <p className="font-medium">{slot.label}</p>
                  <button
                    className={softBtn}
                    onClick={() =>
                      setPicking({
                        title: `Photo for: ${slot.label}`,
                        onPick: (src) => update((c) => ({ ...c, photos: { ...c.photos, amenities: { ...c.photos.amenities, [slot.key]: known(src) } } })),
                      })
                    }
                  >
                    Change
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </Step>
        <Step title="All my photos" help="Every photo you can use. Photos you uploaded can be deleted here.">
          <UploadButton label="Upload a new photo" accept="image/jpeg,image/png,image/webp" onFile={(f) => void upload(f)} />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {library.map((img) => (
              <figure key={img.src} className="overflow-hidden rounded-md bg-white ring-1 ring-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                {img.uploaded && (
                  <figcaption className="p-2">
                    <button
                      className={`${softBtn} w-full text-red-800`}
                      onClick={() => {
                        if (!confirm("Delete this photo from the website?")) return;
                        update((c) => ({
                          ...c,
                          library: c.library.filter((f) => f.src !== img.src),
                          photos: { ...c.photos, hero: c.photos.hero.filter((p) => p.src !== img.src), gallery: c.photos.gallery.filter((p) => p.src !== img.src) },
                        }));
                      }}
                    >
                      Delete
                    </button>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </Step>
      </div>
      {picking && <PhotoPicker title={picking.title} content={content} upload={upload} onPick={picking.onPick} onClose={() => setPicking(null)} />}
    </>
  );
}

function PhotoRow({
  title,
  help,
  photos,
  onChange,
  onAdd,
  min = 0,
  categories = false,
}: {
  title: string;
  help: string;
  photos: Photo[];
  onChange: (fn: (list: Photo[]) => Photo[]) => void;
  onAdd: () => void;
  min?: number;
  categories?: boolean;
}) {
  const edit = (i: number, patch: Partial<Photo>) => onChange((l) => l.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <Step title={title} help={help}>
      <button className={bigBtn} onClick={onAdd}>
        <PlusIcon className="size-5" /> Add a photo
      </button>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <li key={`${p.src}-${i}`} className="overflow-hidden rounded-md bg-white ring-1 ring-sand">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt="" className="aspect-[4/3] w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">#{i + 1}</span>
            </div>
            <div className="space-y-2 p-3">
              <div className="grid grid-cols-3 gap-2">
                <button className={softBtn} disabled={i === 0} onClick={() => onChange((l) => move(l, i, i - 1))}>
                  <ArrowLeftIcon className="size-4" /> Move
                </button>
                <button className={softBtn} disabled={i === photos.length - 1} onClick={() => onChange((l) => move(l, i, i + 1))}>
                  Move <ArrowRightIcon className="size-4" />
                </button>
                <button className={`${softBtn} text-red-800`} disabled={photos.length <= min} onClick={() => confirm("Remove this photo from here?") && onChange((l) => l.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
              <input className={field} placeholder="Description in French" value={p.alt.fr} onChange={(e) => edit(i, { alt: { ...p.alt, fr: e.target.value } })} />
              <input className={field} placeholder="Description in English" value={p.alt.en} onChange={(e) => edit(i, { alt: { ...p.alt, en: e.target.value } })} />
              {categories && (
                <select className={field} value={p.category} onChange={(e) => edit(i, { category: e.target.value as PhotoCategory })}>
                  <option value="building">Category: Exterior</option>
                  <option value="suites">Category: Inside the apartments</option>
                  <option value="amenities">Category: Common areas</option>
                </select>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Step>
  );
}

// ---------------- Prices ----------------

function PricesScreen({ content, update }: { content: SiteContent; update: Update }) {
  return (
    <>
      <ScreenTitle icon={<PriceIcon className="size-5" />} title="Starting prices" help="The lowest monthly price for each type of apartment. The website shows “From $…/month”." />
      <div className="grid gap-4 sm:grid-cols-2">
        {UNIT_TYPES.map((k: UnitType) => (
          <label key={k} className="block rounded-lg bg-cream p-5 shadow-sm ring-1 ring-sand">
            <span className="block font-display text-2xl text-ink">{TYPE_LABELS[k]}</span>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xl text-brown-soft">$</span>
              <input className={`${field} text-xl`} type="number" min={0} value={content.prices[k]} onChange={(e) => update((c) => ({ ...c, prices: { ...c.prices, [k]: Number(e.target.value) } }))} />
              <span className="text-brown-soft">/month</span>
            </div>
            <span className="mt-2 block text-sm text-brown-soft">Shows as: From {formatPrice(content.prices[k] || 0, "en")}/mo</span>
          </label>
        ))}
      </div>
    </>
  );
}

// ---------------- Text ----------------

function TextScreen({ content, update }: { content: SiteContent; update: Update }) {
  const [open, setOpen] = useState<string | null>(EDITABLE_TEXT[0].section);
  const set = (path: string, v: Bilingual) => update((c) => ({ ...c, text: { ...c.text, [path]: v } }));
  return (
    <>
      <ScreenTitle icon={<TextIcon className="size-5" />} title="Website text" help="Click a part of the website to open it. The grey text is what shows now; type in a box to replace it. Empty a box to go back to the original." />
      <div className="space-y-3">
        {EDITABLE_TEXT.map((section) => {
          const isOpen = open === section.section;
          return (
            <section key={section.section} className="rounded-lg bg-cream shadow-sm ring-1 ring-sand">
              <button onClick={() => setOpen(isOpen ? null : section.section)} className="flex w-full items-center justify-between p-5 text-left" aria-expanded={isOpen}>
                <span className="font-display text-2xl text-ink">{section.section}</span>
                <span className="text-2xl text-brown-soft">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="space-y-6 border-t border-sand p-5">
                  {section.fields.map((f) => (
                    <BilingualFields
                      key={f.path}
                      label={f.label}
                      long={f.long}
                      value={{ fr: content.text[f.path]?.fr ?? "", en: content.text[f.path]?.en ?? "" }}
                      placeholder={{ fr: readPath(dictionaries.fr, f.path), en: readPath(dictionaries.en, f.path) }}
                      onChange={(v) => set(f.path, v)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

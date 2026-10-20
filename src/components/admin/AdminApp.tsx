"use client";

import { useMemo, useState, useTransition } from "react";
import { logout, saveSiteContent, uploadFile } from "@/app/actions/admin";
import { FLOORS, UNITS, UNIT_TYPES } from "@/data/building";
import { AMENITY_SLOTS, EDITABLE_TEXT, readPath, type SiteContent, type SuiteStatus } from "@/data/content";
import { GALLERY, PHOTOS, type Photo, type PhotoCategory } from "@/data/photos";
import { dictionaries } from "@/i18n/dictionaries";
import { Wordmark } from "../Wordmark";

type Tab = "photos" | "suites" | "prices" | "text" | "offer";
const TABS: { key: Tab; label: string }[] = [
  { key: "photos", label: "Photos" },
  { key: "suites", label: "Suites & plans" },
  { key: "prices", label: "Prices" },
  { key: "text", label: "Text" },
  { key: "offer", label: "Offer" },
];
const TYPE_LABELS = dictionaries.en.types;
const input = "w-full rounded-sm bg-white px-3 py-2 text-sm ring-1 ring-brown/15 focus:outline-none focus:ring-2 focus:ring-gold";
const btn = "rounded-sm px-3 py-1.5 text-xs ring-1 ring-brown/20 transition hover:bg-cream-deep disabled:opacity-40";

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

const isPdf = (src: string) => src.endsWith(".pdf");
const move = <T,>(list: T[], from: number, to: number) => {
  const next = list.slice();
  const [x] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, x);
  return next;
};

export function AdminApp({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState(initial);
  const [tab, setTab] = useState<Tab>("photos");
  const [status, setStatus] = useState<{ kind: "ok" | "error" | "busy"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();

  const update = (fn: (c: SiteContent) => SiteContent) => {
    setContent((c) => fn(c));
    setDirty(true);
  };

  const save = () =>
    startSave(async () => {
      const res = await saveSiteContent(content);
      if (res.ok && res.content) {
        setContent(res.content);
        setDirty(false);
        setStatus({ kind: "ok", text: "Saved. The website is updated." });
      } else setStatus({ kind: "error", text: "Could not save. Try again." });
    });

  // Uploads a file and returns its address (also added to the library).
  const upload = async (file: File): Promise<string | null> => {
    setStatus({ kind: "busy", text: `Uploading ${file.name}…` });
    const fd = new FormData();
    fd.set("file", await prepare(file));
    const res = await uploadFile(fd);
    if (!res.ok || !res.src) {
      setStatus({ kind: "error", text: res.error ?? "Upload failed." });
      return null;
    }
    setContent((c) => ({ ...c, library: [{ src: res.src!, name: file.name, type: file.type, uploadedAt: new Date().toISOString() }, ...c.library.filter((f) => f.src !== res.src)] }));
    setStatus({ kind: "ok", text: `${file.name} uploaded.` });
    return res.src;
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-sand bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Wordmark className="h-9 w-auto" />
            <span className="text-xs uppercase tracking-[0.25em] text-gold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span className={`text-sm ${status.kind === "error" ? "text-red-800" : status.kind === "busy" ? "text-brown-soft" : "text-[#3b6b45]"}`} role="status">
                {status.text}
              </span>
            )}
            <a href="/en" target="_blank" className={btn}>
              View site ↗
            </a>
            <button onClick={save} disabled={!dirty || saving} className="rounded-sm bg-action px-5 py-2 text-sm text-white transition hover:bg-action-deep disabled:opacity-40">
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
            <button onClick={() => logout()} className={btn}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-2.5 text-sm transition ${tab === t.key ? "border-gold font-medium text-ink" : "border-transparent text-brown-soft hover:text-brown"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {tab === "photos" && <PhotosTab content={content} update={update} upload={upload} />}
        {tab === "suites" && <SuitesTab content={content} update={update} upload={upload} />}
        {tab === "prices" && <PricesTab content={content} update={update} />}
        {tab === "text" && <TextTab content={content} update={update} />}
        {tab === "offer" && <OfferTab content={content} update={update} />}
        {dirty && <p className="text-sm text-brown-soft">You have unsaved changes. Click “Save changes” at the top to publish them.</p>}
      </main>
    </div>
  );
}

type TabProps = { content: SiteContent; update: (fn: (c: SiteContent) => SiteContent) => void };
type UploadProps = TabProps & { upload: (file: File) => Promise<string | null> };

function Card({ title, hint, children, actions }: { title: string; hint?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-sm bg-cream p-5 shadow-sm ring-1 ring-sand sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-brown-soft">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function UploadButton({ label, accept, onFile }: { label: string; accept: string; onFile: (f: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-action px-4 py-2 text-sm text-white transition hover:bg-action-deep">
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

// ---------------- Photos ----------------

function PhotosTab({ content, update, upload }: UploadProps) {
  const [picking, setPicking] = useState<null | { title: string; onPick: (src: string) => void }>(null);

  // Every image available: built-in photos plus everything uploaded.
  const library = useMemo(() => {
    const uploaded = content.library.filter((f) => !isPdf(f.src)).map((f) => ({ src: f.src, name: f.name }));
    const builtIn = Object.values(PHOTOS).map((p) => ({ src: p.src, name: p.alt.en }));
    return [...uploaded, ...builtIn.filter((b, i, all) => all.findIndex((x) => x.src === b.src) === i)];
  }, [content.library]);

  const known = (src: string): Photo =>
    [...content.photos.gallery, ...content.photos.hero, ...GALLERY].find((p) => p.src === src) ?? { src, category: "building", alt: { fr: "", en: "" } };

  const usedIn = (src: string) =>
    [
      content.photos.hero.some((p) => p.src === src) && "Slider",
      content.photos.gallery.some((p) => p.src === src) && "Gallery",
      Object.values(content.photos.amenities).some((p) => p.src === src) && "Amenities",
    ].filter(Boolean);

  const setList = (key: "hero" | "gallery", fn: (list: Photo[]) => Photo[]) =>
    update((c) => ({ ...c, photos: { ...c.photos, [key]: fn(c.photos[key]) } }));

  return (
    <>
      <Card
        title="Image library"
        hint="Every image on the site. Upload new ones here, then add them to the slider, gallery or an amenity."
        actions={
          <UploadButton
            label="Upload image"
            accept="image/jpeg,image/png,image/webp"
            onFile={async (f) => {
              await upload(f);
            }}
          />
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {library.map((img) => (
            <figure key={img.src} className="overflow-hidden rounded-sm ring-1 ring-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <figcaption className="space-y-1.5 p-2 text-[11px]">
                <p className="truncate text-brown-soft" title={img.name}>
                  {img.name || "Photo"}
                </p>
                <p className="text-gold">{usedIn(img.src).join(" · ") || "Not used"}</p>
                <div className="flex flex-wrap gap-1">
                  {img.src.startsWith("/api/media/") && (
                    <button
                      className={`${btn} text-red-800`}
                      onClick={() => {
                        if (!confirm("Delete this photo from the site?")) return;
                        update((c) => ({
                          ...c,
                          library: c.library.filter((f) => f.src !== img.src),
                          photos: {
                            ...c.photos,
                            hero: c.photos.hero.filter((p) => p.src !== img.src),
                            gallery: c.photos.gallery.filter((p) => p.src !== img.src),
                          },
                        }));
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button className={btn} disabled={content.photos.hero.some((p) => p.src === img.src)} onClick={() => setList("hero", (l) => [...l, known(img.src)])}>
                    + Slider
                  </button>
                  <button className={btn} disabled={content.photos.gallery.some((p) => p.src === img.src)} onClick={() => setList("gallery", (l) => [...l, known(img.src)])}>
                    + Gallery
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Card>

      <PhotoList title="Top slider" hint="Drag to reorder. The first photo shows first." photos={content.photos.hero} onChange={(fn) => setList("hero", fn)} min={1} />
      <PhotoList title="Gallery" hint="Drag to reorder. Every 6th photo is shown large." photos={content.photos.gallery} onChange={(fn) => setList("gallery", fn)} categories />

      <Card title="Amenities photos" hint="The photo for each amenity tile and the suites section.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {AMENITY_SLOTS.map((slot) => {
            const p = content.photos.amenities[slot.key];
            return (
              <figure key={slot.key} className="overflow-hidden rounded-sm ring-1 ring-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="space-y-1.5 p-2 text-xs">
                  <p className="font-medium">{slot.label}</p>
                  <button
                    className={btn}
                    onClick={() =>
                      setPicking({
                        title: slot.label,
                        onPick: (src) => update((c) => ({ ...c, photos: { ...c.photos, amenities: { ...c.photos.amenities, [slot.key]: known(src) } } })),
                      })
                    }
                  >
                    Change
                  </button>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Card>

      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-deep/60 p-4" onClick={() => setPicking(null)}>
          <div className="max-h-[85svh] w-full max-w-4xl overflow-auto rounded-sm bg-cream p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl">Choose a photo: {picking.title}</h3>
              <button className={btn} onClick={() => setPicking(null)}>
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {library.map((img) => (
                <button
                  key={img.src}
                  onClick={() => {
                    picking.onPick(img.src);
                    setPicking(null);
                  }}
                  className="overflow-hidden rounded-sm ring-1 ring-sand hover:ring-2 hover:ring-gold"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PhotoList({
  title,
  hint,
  photos,
  onChange,
  min = 0,
  categories = false,
}: {
  title: string;
  hint: string;
  photos: Photo[];
  onChange: (fn: (list: Photo[]) => Photo[]) => void;
  min?: number;
  categories?: boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const edit = (i: number, patch: Partial<Photo>) => onChange((l) => l.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <Card title={title} hint={hint}>
      {photos.length === 0 && <p className="text-sm text-brown-soft">No photos yet. Add some from the library above.</p>}
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <li
            key={`${p.src}-${i}`}
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragging !== null && dragging !== i) onChange((l) => move(l, dragging, i));
              setDragging(null);
            }}
            className={`flex gap-3 rounded-sm bg-white p-2 ring-1 ring-sand ${dragging === i ? "opacity-50" : ""} cursor-grab`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" className="h-20 w-28 shrink-0 rounded-sm object-cover" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="mr-auto text-xs font-medium text-brown-soft">#{i + 1}</span>
                <button className={btn} disabled={i === 0} onClick={() => onChange((l) => move(l, i, i - 1))} aria-label="Move earlier">
                  ←
                </button>
                <button className={btn} disabled={i === photos.length - 1} onClick={() => onChange((l) => move(l, i, i + 1))} aria-label="Move later">
                  →
                </button>
                <button className={`${btn} text-red-800`} disabled={photos.length <= min} onClick={() => onChange((l) => l.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
              <input className={input} placeholder="Caption (FR)" value={p.alt.fr} onChange={(e) => edit(i, { alt: { ...p.alt, fr: e.target.value } })} />
              <input className={input} placeholder="Caption (EN)" value={p.alt.en} onChange={(e) => edit(i, { alt: { ...p.alt, en: e.target.value } })} />
              {categories && (
                <select className={input} value={p.category} onChange={(e) => edit(i, { category: e.target.value as PhotoCategory })}>
                  <option value="building">Exterior</option>
                  <option value="suites">Interior: suites</option>
                  <option value="amenities">Interior: common areas</option>
                </select>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ---------------- Suites & plans ----------------

function SuitesTab({ content, update, upload }: UploadProps) {
  const [floor, setFloor] = useState(1);
  const suites = UNITS.filter((u) => u.floor === floor);
  const setSuite = (id: string, patch: Record<string, unknown>) =>
    update((c) => {
      const next = { ...c.suites[id], ...patch } as Record<string, unknown>;
      for (const k of Object.keys(next)) if (next[k] === "" || next[k] === undefined) delete next[k];
      return { ...c, suites: { ...c.suites, [id]: next } };
    });
  const floorPlan = content.floorPlans[String(floor)];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {FLOORS.slice().reverse().map((f) => (
          <button key={f} onClick={() => setFloor(f)} className={`rounded-sm px-4 py-2 text-sm ${f === floor ? "bg-action text-white" : "bg-cream ring-1 ring-sand"}`}>
            Floor {f}
          </button>
        ))}
      </div>

      <Card
        title={`Floor ${floor} plan`}
        hint="Image or PDF of the whole floor. Visitors see a “View the floor plan” link."
        actions={
          <div className="flex gap-2">
            {floorPlan && (
              <button className={`${btn} text-red-800`} onClick={() => update((c) => { const fp = { ...c.floorPlans }; delete fp[String(floor)]; return { ...c, floorPlans: fp }; })}>
                Remove
              </button>
            )}
            <UploadButton
              label={floorPlan ? "Replace plan" : "Upload plan"}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onFile={async (f) => {
                const src = await upload(f);
                if (src) update((c) => ({ ...c, floorPlans: { ...c.floorPlans, [String(floor)]: src } }));
              }}
            />
          </div>
        }
      >
        {floorPlan ? (
          isPdf(floorPlan) ? (
            <a href={floorPlan} target="_blank" rel="noopener noreferrer" className="text-sm underline">
              Open PDF
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={floorPlan} alt="" className="max-h-72 rounded-sm ring-1 ring-sand" />
          )
        ) : (
          <p className="text-sm text-brown-soft">No plan uploaded for this floor.</p>
        )}
      </Card>

      <Card title={`Suites on floor ${floor}`} hint="Status, price and date show on the floor plan explorer. Leave price empty to show the “From” price.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-brown-soft">
              <tr>
                <th className="py-2">Suite</th>
                <th>Type</th>
                <th>Status</th>
                <th>Price / month</th>
                <th>Available on</th>
                <th>Suite plan</th>
              </tr>
            </thead>
            <tbody>
              {suites.map((u) => {
                const s = content.suites[u.id] ?? {};
                return (
                  <tr key={u.id} className="border-t border-sand align-middle">
                    <td className="py-2 font-medium">{u.id}</td>
                    <td className="text-brown-soft">
                      {TYPE_LABELS[u.type]} · {u.sqft} sq ft
                    </td>
                    <td className="pr-2">
                      <select className={input} value={s.status ?? ""} onChange={(e) => setSuite(u.id, { status: (e.target.value || undefined) as SuiteStatus | undefined })}>
                        <option value="">Not set</option>
                        <option value="available">Available</option>
                        <option value="soon">Coming soon</option>
                        <option value="leased">Leased</option>
                      </select>
                    </td>
                    <td className="pr-2">
                      <input
                        className={`${input} w-28`}
                        type="number"
                        min={0}
                        placeholder={String(content.prices[u.type])}
                        value={s.price ?? ""}
                        onChange={(e) => setSuite(u.id, { price: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </td>
                    <td className="pr-2">
                      <input className={`${input} w-40`} type="date" value={s.availableOn ?? ""} onChange={(e) => setSuite(u.id, { availableOn: e.target.value || undefined })} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {s.plan && (
                          <>
                            <a href={s.plan} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                              View
                            </a>
                            <button className={`${btn} text-red-800`} onClick={() => setSuite(u.id, { plan: undefined })}>
                              ✕
                            </button>
                          </>
                        )}
                        <label className={`${btn} cursor-pointer`}>
                          {s.plan ? "Replace" : "Upload"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="sr-only"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (!f) return;
                              const src = await upload(f);
                              if (src) setSuite(u.id, { plan: src });
                            }}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ---------------- Prices ----------------

function PricesTab({ content, update }: TabProps) {
  return (
    <Card title="Starting prices" hint="The “From $…/month” price for each suite type, shown on the site (and the studio price at the top).">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {UNIT_TYPES.map((k) => (
          <label key={k} className="block">
            <span className="mb-1.5 block text-sm font-medium">{TYPE_LABELS[k]}</span>
            <div className="flex items-center gap-2">
              <span className="text-brown-soft">$</span>
              <input
                className={input}
                type="number"
                min={0}
                value={content.prices[k]}
                onChange={(e) => update((c) => ({ ...c, prices: { ...c.prices, [k]: Number(e.target.value) } }))}
              />
            </div>
          </label>
        ))}
      </div>
    </Card>
  );
}

// ---------------- Text ----------------

function TextTab({ content, update }: TabProps) {
  const set = (path: string, lang: "fr" | "en", value: string) =>
    update((c) => ({ ...c, text: { ...c.text, [path]: { fr: c.text[path]?.fr ?? "", en: c.text[path]?.en ?? "", [lang]: value } } }));

  return (
    <>
      <p className="text-sm text-brown-soft">Leave a box empty to keep the original text (shown in grey).</p>
      {EDITABLE_TEXT.map((section) => (
        <Card key={section.section} title={section.section}>
          <div className="space-y-4">
            {section.fields.map((f) => (
              <div key={f.path}>
                <p className="mb-1.5 text-sm font-medium">{f.label}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(["fr", "en"] as const).map((lang) => {
                    const props = {
                      className: input,
                      placeholder: readPath(dictionaries[lang], f.path),
                      value: content.text[f.path]?.[lang] ?? "",
                      "aria-label": `${f.label} (${lang.toUpperCase()})`,
                    };
                    return (
                      <label key={lang} className="block">
                        <span className="mb-1 block text-[11px] uppercase tracking-wider text-brown-soft">{lang === "fr" ? "Français" : "English"}</span>
                        {f.long ? (
                          <textarea {...props} rows={3} onChange={(e) => set(f.path, lang, e.target.value)} />
                        ) : (
                          <input {...props} onChange={(e) => set(f.path, lang, e.target.value)} />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}

// ---------------- Offer ----------------

function OfferTab({ content, update }: TabProps) {
  const on = content.offer.enabled;
  return (
    <Card title="One month free offer" hint="Shows the brown offer section and the “Limited-time offer” side tab. Edit its wording in the Text tab.">
      <label className="flex items-center gap-3">
        <button
          role="switch"
          aria-checked={on}
          onClick={() => update((c) => ({ ...c, offer: { enabled: !c.offer.enabled } }))}
          className={`relative h-7 w-12 rounded-full transition ${on ? "bg-action" : "bg-sand"}`}
        >
          <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${on ? "left-6" : "left-1"}`} />
        </button>
        <span className="text-sm font-medium">{on ? "Offer is shown on the site" : "Offer is hidden"}</span>
      </label>
    </Card>
  );
}

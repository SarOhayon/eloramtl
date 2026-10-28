"use client";

import { useState } from "react";
import { FLOORS, UNITS } from "@/data/building";
import type { SiteContent } from "@/data/content";
import { SIDES, compassWord, sideBearing, sunHours, unitSides, type Side } from "@/lib/sun";
import { SunIcon } from "../icons";
import { TrashIcon, UploadIcon } from "./AdminIcons";
import { ScreenTitle, Step, Switch, field, softBtn, type Update, type Upload } from "./ui";

const POINTS = [0, 45, 90, 135, 180, 225, 270, 315];
const SIDE_NAMES: Record<Side, string> = { top: "Top of the plan", right: "Right side", bottom: "Bottom of the plan", left: "Left side" };
const word = (b: number) => compassWord(b, "en").replace(/^./, (c) => c.toUpperCase());

// Sunlight and view settings for the floor plan on the website.
export function SunScreen({ content, update, upload }: { content: SiteContent; update: Update; upload: Upload }) {
  const sun = content.sun;
  const [floor, setFloor] = useState(2);
  const set = (patch: Partial<SiteContent["sun"]>) => update((c) => ({ ...c, sun: { ...c.sun, ...patch } }));
  const setView = (key: string, src?: string) =>
    update((c) => {
      const views = { ...c.sun.views };
      if (src) views[key] = src;
      else delete views[key];
      return { ...c, sun: { ...c.sun, views } };
    });
  const suitesOn = (side: Side) =>
    UNITS.filter((u) => u.floor === floor && unitSides(u, UNITS).includes(side))
      .map((u) => u.id)
      .join(", ");

  return (
    <>
      <ScreenTitle
        icon={<SunIcon className="size-5" />}
        title="Sunlight & views"
        help="Visitors can turn on “Sunlight & view” on the floor plan: suites in the sun light up as they move the time of day, and each suite shows which way it faces and how many hours of direct sun it gets in winter and summer."
      />

      <Step n={1} title="Show it on the website">
        <Switch on={sun.enabled} onChange={(v) => set({ enabled: v })} label={sun.enabled ? "On: the button shows on the floor plan" : "Off: hidden on the website"} />
      </Step>

      <Step
        n={2}
        title="Which way does the building face?"
        help="Everything depends on this. We estimated it from chemin Bates, so please check it once: stand at a window of apartment 216 (top of the floor plan), open the Compass app on your phone, and pick the direction you are looking."
      >
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="mb-2 text-sm font-medium">The top of the floor plan looks toward:</p>
            <div className="flex flex-wrap gap-2">
              {POINTS.map((b) => (
                <button
                  key={b}
                  onClick={() => Math.round(sun.topFacing / 45) % 8 !== b / 45 && set({ topFacing: b })}
                  className={`rounded-md px-4 py-2.5 ring-1 ${Math.round(sun.topFacing / 45) % 8 === b / 45 ? "bg-action text-white ring-action" : "bg-white ring-brown/20 hover:ring-brown/40"}`}
                >
                  {word(b)}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-3">
              <span className="text-sm text-brown-soft">Exact degrees (0 = north, 90 = east):</span>
              <input
                className={`${field} w-28`}
                type="number"
                min={0}
                max={359}
                value={sun.topFacing}
                onChange={(e) => set({ topFacing: ((Math.round(Number(e.target.value)) % 360) + 360) % 360 })}
              />
            </label>
          </div>
          <Preview topFacing={sun.topFacing} />
        </div>
      </Step>

      <Step n={3} title="View photos (optional)" help="A photo taken from a window on each side. Visitors see it in the suite's details. A floor without its own photo uses the closest floor that has one, so a few photos are enough.">
        <div className="mb-4 flex flex-wrap gap-2">
          {FLOORS.slice().reverse().map((f) => (
            <button key={f} onClick={() => setFloor(f)} className={`rounded-md px-4 py-2.5 ring-1 ${f === floor ? "bg-action text-white ring-action" : "bg-white ring-brown/20 hover:ring-brown/40"}`}>
              Floor {f}
              {SIDES.some((s) => sun.views[`${s}:${f}`]) && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-gold align-middle" />}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SIDES.map((side) => {
            const key = `${side}:${floor}`;
            const src = sun.views[key];
            const winter = sunHours("winter", [side], sun.topFacing).hours;
            return (
              <div key={side} className="rounded-lg bg-white p-4 ring-1 ring-sand">
                <p className="font-medium">
                  {SIDE_NAMES[side]} · looks {compassWord(sideBearing(side, sun.topFacing), "en")}
                </p>
                <p className="text-sm text-brown-soft">
                  Suites {suitesOn(side) || "none"} · about {winter} h of sun in winter
                </p>
                {src ? (
                  <div className="relative mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- uploaded photo */}
                    <img src={src} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
                    <button
                      onClick={() => setView(key)}
                      aria-label="Remove this photo"
                      className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`${softBtn} mt-3 w-full cursor-pointer`}>
                    <UploadIcon className="size-5" />
                    Add the view from floor {floor}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        const uploaded = await upload(f);
                        if (uploaded) setView(key, uploaded);
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Step>
    </>
  );
}

// The floor outline with the direction each side looks.
function Preview({ topFacing }: { topFacing: number }) {
  const label = (side: Side) => compassWord(sideBearing(side, topFacing), "en").replace(/^./, (c) => c.toUpperCase());
  return (
    <svg viewBox="-100 -40 400 220" className="w-full max-w-xs" aria-hidden>
      <rect x={0} y={0} width={200} height={140} fill="#f0ece6" stroke="#3a2c24" strokeWidth={3} />
      <text x={100} y={75} textAnchor="middle" fontSize={13} fill="#7a6a5e">Floor plan</text>
      <text x={100} y={-14} textAnchor="middle" fontSize={14} fill="#503d32" fontWeight={600}>{label("top")}</text>
      <text x={100} y={164} textAnchor="middle" fontSize={14} fill="#503d32" fontWeight={600}>{label("bottom")}</text>
      <text x={-10} y={75} textAnchor="end" fontSize={14} fill="#503d32" fontWeight={600}>{label("left")}</text>
      <text x={210} y={75} fontSize={14} fill="#503d32" fontWeight={600}>{label("right")}</text>
    </svg>
  );
}

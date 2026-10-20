"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  BUILDING_PHOTO,
  FLOOR_OUTLINES,
  FLOORS,
  PHONE_MAIN,
  UNITS,
  UNIT_TYPES,
  layoutFor,
  formatPrice,
  whatsappLink,
  type Unit,
  type UnitType,
} from "@/data/building";
import type { SiteContent, SuiteStatus } from "@/data/content";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { UnitPlan } from "./UnitPlan";
import { ChevronIcon, PhoneIcon, WhatsAppIcon } from "./icons";

const pts = (p: [number, number][]) => p.map((xy) => xy.join(",")).join(" ");
const centroid = (p: [number, number][]) => {
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

type Props = {
  locale: Locale;
  prices: SiteContent["prices"];
  suites: SiteContent["suites"];
  floorPlans: SiteContent["floorPlans"];
  promo?: { types: UnitType[]; suites: string[] }; // set while the promotion is live
};
type Suite = Unit & { status?: SuiteStatus; price?: number; plan?: string };

export function Explorer({ locale, prices, suites, floorPlans, promo }: Props) {
  const t = getDictionary(locale);
  // Suite details set in the admin (status, price, date, plan) on top of the building data.
  const units = useMemo<Suite[]>(
    () => UNITS.map((u) => ({ ...u, ...suites[u.id], availableOn: suites[u.id]?.availableOn ?? u.availableOn })),
    [suites],
  );
  const [floor, setFloor] = useState(1);
  const [hoverFloor, setHoverFloor] = useState<number | null>(null);
  const [filter, setFilter] = useState<UnitType | "all">("all");
  const [selectedId, setSelectedId] = useState<string>("112");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!showDetails) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowDetails(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showDetails]);

  // Clicking an apartment selects it and opens its details.
  const openSuite = (id: string) => {
    setSelectedId(id);
    setShowDetails(true);
  };

  const onPromo = (u: { id: string; type: UnitType }) => Boolean(promo && (promo.types.includes(u.type) || promo.suites.includes(u.id)));
  const matches = (u: Suite) => filter === "all" || u.type === filter;
  const floorUnits = useMemo(() => units.filter((u) => u.floor === floor), [units, floor]);
  const matchCount = (f: number) => units.filter((u) => u.floor === f && matches(u)).length;
  const selected = units.find((u) => u.id === selectedId && u.floor === floor) ?? null;

  const goFloor = (f: number) => {
    setFloor(f);
    const first = units.find((u) => u.floor === f && matches(u));
    setSelectedId(first?.id ?? "");
  };
  const changeFilter = (next: UnitType | "all") => {
    setFilter(next);
    const ok = (u: Suite) => next === "all" || u.type === next;
    const current = units.find((u) => u.id === selectedId);
    if (!current || !ok(current) || current.floor !== floor) {
      setSelectedId(units.find((u) => u.floor === floor && ok(u))?.id ?? "");
    }
  };

  const floorLabel = (f: number) => (f === 1 ? t.explorer.ground : `${t.explorer.floor} ${f}`);
  const shownFloor = hoverFloor ?? floor;
  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "long", timeZone: "UTC" });

  // Apartment details, used by the side panel and the pop-up.
  const details = (u: Suite) => (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-action">{t.types[u.type]}</p>
      <h3 className="mt-1 font-display text-4xl text-brown">
        {t.explorer.unit} {u.id}
      </h3>
      <ul className="mt-3 space-y-1 text-brown/90">
        <li>
          {t.explorer.beds(u.beds)} {u.type === "1br-den" ? t.explorer.den : ""}
        </li>
        <li>{t.explorer.baths(u.baths)}</li>
        <li>
          {u.sqft.toLocaleString(locale === "fr" ? "fr-CA" : "en-CA")} {t.explorer.sqft}
        </li>
      </ul>
      <p className="mt-3 text-brown">
        {!u.price && <span className="text-sm text-brown-soft">{t.explorer.from} </span>}
        <span className="font-display text-2xl">{formatPrice(u.price ?? prices[u.type], locale)}</span>
        <span className="text-sm text-brown-soft">{t.explorer.perMonth}</span>
      </p>
      {onPromo(u) && u.status !== "leased" && (
        <p className="mt-3 mr-2 inline-block rounded-sm bg-gold px-3 py-1 text-sm font-medium text-white">{t.promo.badge}</p>
      )}
      {u.status === "leased" && (
        <p className="mt-3 inline-block rounded-sm bg-sand px-3 py-1 text-sm text-brown">{t.explorer.leased}</p>
      )}
      {u.status === "soon" && (
        <p className="mt-3 inline-block rounded-sm bg-gold-light px-3 py-1 text-sm text-brown">{t.explorer.soon}</p>
      )}
      {u.status !== "leased" && u.status !== "soon" && u.availableOn && (
        <p className="mt-3 inline-block rounded-sm bg-action-light/40 px-3 py-1 text-sm text-action-deep">
          {t.explorer.availableOn} {dateFmt.format(new Date(u.availableOn))}
        </p>
      )}
    </>
  );
  const contactButtons = (u: Suite) => (
    <div className="flex flex-col gap-2">
      <a
        href={whatsappLink(t.explorer.askAbout(u.id))}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-sm bg-whatsapp px-5 py-3 text-sm font-medium text-white transition hover:brightness-95"
      >
        <WhatsAppIcon className="size-4" />
        {t.explorer.whatsapp}
      </a>
      <a
        href={`tel:+${PHONE_MAIN}`}
        className="inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-medium text-brown ring-1 ring-brown/25 transition hover:bg-cream-deep"
      >
        <PhoneIcon className="size-4" />
        {t.explorer.call}
      </a>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Suite types with starting prices; doubles as the filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label={t.explorer.filterLabel}>
        {(["all", ...UNIT_TYPES] as const).map((k) => {
          const active = filter === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => changeFilter(k)}
              className={`flex flex-col items-start rounded-lg px-4 py-3.5 text-left transition ${
                active ? "bg-action text-white shadow-lg shadow-action/25" : "bg-cream text-brown ring-1 ring-brown/10 hover:ring-brown/30"
              }`}
            >
              <span className="text-sm font-medium">{k === "all" ? t.explorer.all : t.types[k]}</span>
              {k === "all" ? (
                <span className={`mt-1 text-xs ${active ? "text-cream/75" : "text-brown-soft"}`}>{UNIT_TYPES.length} types</span>
              ) : (
                <span className={`mt-1 text-xs ${active ? "text-cream/75" : "text-brown-soft"}`}>
                  {t.explorer.from}{" "}
                  <span className={`font-display text-lg ${active ? "text-cream" : "text-brown"}`}>{formatPrice(prices[k], locale)}</span>
                  {t.explorer.perMonth}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Building + floor plate in one card */}
      <div className="overflow-hidden rounded-lg bg-cream shadow-xl shadow-brown/10 ring-1 ring-brown/10">
        <div className="flex items-center justify-between gap-3 bg-action px-5 py-4 text-white">
          <button
            type="button"
            onClick={() => goFloor(Math.max(1, floor - 1))}
            disabled={floor === 1}
            aria-label={t.explorer.prevFloor}
            className="inline-flex size-9 items-center justify-center rounded-full ring-1 ring-cream/30 transition hover:bg-cream/10 disabled:opacity-30"
          >
            <ChevronIcon dir="down" className="size-4" />
          </button>
          <div className="text-center">
            <p className="font-display text-2xl leading-tight">{floorLabel(floor)}</p>
            <p className="text-xs tracking-wide text-cream/75">{t.explorer.unitsOnFloor(matchCount(floor))}</p>
          </div>
          <button
            type="button"
            onClick={() => goFloor(Math.min(7, floor + 1))}
            disabled={floor === 7}
            aria-label={t.explorer.nextFloor}
            className="inline-flex size-9 items-center justify-center rounded-full ring-1 ring-cream/30 transition hover:bg-cream/10 disabled:opacity-30"
          >
            <ChevronIcon dir="up" className="size-4" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          {/* Building */}
          <div className="flex min-w-0 flex-col justify-center gap-4 border-brown/10 p-4 sm:p-5 lg:border-r">
            <div className="relative overflow-hidden rounded-md bg-brown-deep">
              <Image
                src={BUILDING_PHOTO.src}
                width={BUILDING_PHOTO.width}
                height={BUILDING_PHOTO.height}
                alt=""
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="h-auto w-full"
                priority={false}
              />
              <svg
                viewBox={`0 0 ${BUILDING_PHOTO.width} ${BUILDING_PHOTO.height}`}
                className="absolute inset-0 h-full w-full"
                onMouseLeave={() => setHoverFloor(null)}
              >
                <rect width="100%" height="100%" fill="#3a2c24" opacity={0.18} pointerEvents="none" />
                {FLOORS.map((f) => {
                  const active = f === floor;
                  const hover = f === hoverFloor;
                  return (
                    <polygon
                      key={f}
                      points={pts(FLOOR_OUTLINES[f])}
                      role="button"
                      tabIndex={-1}
                      aria-label={floorLabel(f)}
                      onMouseEnter={() => setHoverFloor(f)}
                      onClick={() => goFloor(f)}
                      className="cursor-pointer transition-all duration-200"
                      fill={active ? "#e9d6ae" : hover ? "#faf8f5" : "transparent"}
                      fillOpacity={active ? 0.62 : hover ? 0.38 : 0}
                      stroke={active || hover ? "#faf8f5" : "transparent"}
                      strokeWidth={active ? 5 : 3}
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute left-3 top-3 rounded-sm bg-cream/95 px-3 py-1.5 text-xs font-medium text-brown shadow">
                {floorLabel(shownFloor)} · {t.explorer.unitsOnFloor(matchCount(shownFloor))}
              </div>
            </div>

            {/* Floor picker */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label={t.explorer.floor}>
              {FLOORS.slice().reverse().map((f) => {
                const n = matchCount(f);
                const active = f === floor;
                return (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => goFloor(f)}
                    onMouseEnter={() => setHoverFloor(f)}
                    onMouseLeave={() => setHoverFloor(null)}
                    className={`flex min-w-11 flex-1 flex-col items-center rounded-md border px-2 py-2 transition ${
                      active
                        ? "border-brown bg-brown text-cream"
                        : "border-brown/15 bg-cream text-brown hover:border-brown/40"
                    } ${n === 0 ? "opacity-50" : ""}`}
                  >
                    <span className="font-display text-lg leading-none">{f}</span>
                    <span className="mt-1 text-[10px] tracking-wide opacity-80">
                      {n} {locale === "fr" ? "log." : "suites"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floor plate + suite */}
          <div className="flex min-w-0 flex-col">
            <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <svg viewBox="0 0 617 340" className="h-auto w-full" aria-label={floorLabel(floor)}>
              <polygon points={pts(layoutFor(floor).outline)} fill="#f0ece6" stroke="#3a2c24" strokeWidth={4} />
              {layoutFor(floor).cores.map((c, i) => (
                <g key={i}>
                  <polygon points={pts(c)} fill="#e6d9c3" />
                  <text x={centroid(c)[0]} y={centroid(c)[1] + 4} textAnchor="middle" fontSize={11} className="fill-brown-soft">
                    {t.explorer.amenity.core}
                  </text>
                </g>
              ))}
              {layoutFor(floor).amenities.map((a) => (
                  <g key={a.key}>
                    <polygon points={pts(a.shape)} fill="#f3ede4" stroke="#3b2a20" strokeWidth={1.5} />
                    <text x={centroid(a.shape)[0]} y={centroid(a.shape)[1] + 4} textAnchor="middle" fontSize={11} className="fill-action-deep">
                      {t.explorer.amenity[a.key]}
                    </text>
                  </g>
                ))}
              {floorUnits.map((u) => {
                const isSel = u.id === selectedId;
                const ok = matches(u);
                const [cx, cy] = u.label ?? centroid(u.shape);
                return (
                  <g
                    key={u.id}
                    role="button"
                    tabIndex={ok ? 0 : -1}
                    aria-label={`${t.explorer.unit} ${u.id}, ${t.types[u.type]}`}
                    aria-pressed={isSel}
                    onClick={() => ok && openSuite(u.id)}
                    onKeyDown={(e) => {
                      if (ok && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        openSuite(u.id);
                      }
                    }}
                    className={`${ok ? "cursor-pointer" : "cursor-not-allowed"} outline-none [&:focus-visible>polygon]:stroke-action [&:focus-visible>polygon]:stroke-[4]`}
                  >
                    <polygon
                      points={pts(u.shape)}
                      fill={isSel ? "#503d32" : !ok ? "#faf8f5" : u.status === "leased" ? "#e8e2da" : "#efe2c8"}
                      stroke="#3b2a20"
                      strokeWidth={1.5}
                      className="transition-colors duration-150 hover:fill-[#e9d6ae]"
                      opacity={ok ? 1 : 0.55}
                    />
                    <text
                      x={cx}
                      y={cy + 5}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight={500}
                      pointerEvents="none"
                      className={isSel ? "fill-cream" : "fill-brown"}
                    >
                      {u.id}
                    </text>
                    {onPromo(u) && u.status !== "leased" && <circle cx={cx + 22} cy={cy - 8} r={4.5} fill="#a8875a" stroke="#fff" strokeWidth={1.5} pointerEvents="none" />}
                  </g>
                );
              })}
            </svg>
            {matchCount(floor) === 0 && <p className="py-2 text-center text-sm text-brown-soft">{t.explorer.noMatch}</p>}
            {floorPlans[String(floor)] && (
              <p className="pt-2 text-center text-sm">
                <a href={floorPlans[String(floor)]} target="_blank" rel="noopener noreferrer" className="font-medium text-brown underline underline-offset-4">
                  {t.explorer.viewFloorPlan}
                </a>
              </p>
            )}
            </div>

            <div className="mt-auto border-t border-brown/10 p-5">
              {selected ? (
                <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>{details(selected)}</div>
                  <div className="flex flex-col gap-2 sm:w-56">
                    <button
                      type="button"
                      onClick={() => setShowDetails(true)}
                      className="inline-flex w-full items-center justify-center rounded-sm bg-action px-5 py-3 text-sm font-medium uppercase tracking-[0.12em] text-white transition hover:bg-action-deep"
                    >
                      {selected.plan ? t.explorer.detailsAndPlan : t.explorer.details}
                    </button>
                    {contactButtons(selected)}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-display text-xl text-brown">{t.explorer.pickUnit}</p>
                  <p className="text-sm text-brown-soft">{t.explorer.pickUnitHint}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetails && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${t.explorer.unit} ${selected.id}`} onClick={() => setShowDetails(false)}>
          <div className="relative grid max-h-[94svh] w-full max-w-6xl overflow-auto rounded-sm bg-cream shadow-2xl md:grid-cols-[340px_1fr]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              aria-label={t.promo.close}
              className="absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-cream text-2xl text-brown shadow ring-1 ring-brown/10 hover:bg-cream-deep"
            >
              ×
            </button>
            <div className="border-b border-sand p-6 md:border-b-0 md:border-r">
              {details(selected)}
              <a
                href="#visit"
                onClick={() => setShowDetails(false)}
                className="mt-5 inline-flex w-full items-center justify-center rounded-sm bg-action px-5 py-3 text-sm font-medium uppercase tracking-[0.12em] text-white transition hover:bg-action-deep"
              >
                {t.explorer.bookVisit}
              </a>
              <div className="mt-2">{contactButtons(selected)}</div>
            </div>
            <div className="flex min-h-[50svh] flex-col bg-white p-3 sm:p-4">
              {selected.plan?.endsWith(".pdf") ? (
                <iframe src={`${selected.plan}#view=FitH`} title={`${t.explorer.unit} ${selected.id}`} className="min-h-[70svh] w-full flex-1 rounded-sm ring-1 ring-sand" />
              ) : selected.plan ? (
                // eslint-disable-next-line @next/next/no-img-element -- plan uploaded in the admin
                <img src={selected.plan} alt={`${t.explorer.unit} ${selected.id}`} className="mx-auto h-auto max-h-[80svh] w-auto" />
              ) : (
                <div className="mx-auto w-full max-w-xl py-6">
                  <UnitPlan type={selected.type} t={t} />
                </div>
              )}
              <p className="mt-3 text-center text-sm text-brown-soft">
                {selected.plan ? (
                  <a href={selected.plan} target="_blank" rel="noopener noreferrer" className="font-medium text-brown underline underline-offset-4">
                    {t.explorer.openPlan}
                  </a>
                ) : (
                  t.explorer.planNote
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

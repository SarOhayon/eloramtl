"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BUILDING_LATLNG } from "@/data/building";
import { BUS_STOPS, PLACES, type PlaceCategory } from "@/data/places";
import { getDictionary, type Locale } from "@/i18n/dictionaries";

const COLORS: Record<PlaceCategory, string> = {
  transit: "#3b2a20",
  school: "#8a6a3e",
  shopping: "#b0704f",
  park: "#7d8c6a",
  health: "#9a5a5a",
};
const CATS = Object.keys(COLORS) as PlaceCategory[];
const BUS = "#0a7fb5"; // STM blue

// Mapbox when a token is configured (NEXT_PUBLIC_MAPBOX_TOKEN), otherwise CARTO's free basemap.
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox/light-v11";
const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function tileLayer(L: typeof import("leaflet")) {
  if (MAPBOX_TOKEN) {
    return L.tileLayer(`https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`, {
      attribution: `&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ${OSM} <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>`,
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 20,
    });
  }
  return L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: `${OSM} &copy; <a href="https://carto.com/">CARTO</a>`,
    subdomains: "abcd",
    maxZoom: 19,
  });
}

export function NeighbourhoodMap({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [active, setActive] = useState<Set<PlaceCategory>>(new Set(CATS));
  const [showBus, setShowBus] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView(BUILDING_LATLNG, 14);
      tileLayer(L).addTo(m);
      L.marker(BUILDING_LATLNG, {
        icon: L.divIcon({
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: `<div style="position:relative;width:36px;height:36px"><div style="width:36px;height:36px;border-radius:50%;background:#3b2a20;color:#faf8f5;display:flex;align-items:center;justify-content:center;font:600 16px/1 Georgia,serif;box-shadow:0 0 0 6px rgba(74,54,40,.25)">E</div><span style="position:absolute;left:44px;top:7px;background:#3b2a20;color:#faf8f5;padding:3px 9px;border-radius:999px;font:500 12px/1.4 system-ui,sans-serif;white-space:nowrap">Elora</span></div>`,
        }),
        zIndexOffset: 1000,
        keyboard: false,
      }).addTo(m);
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    import("leaflet").then((L) => {
      const g = layer.current;
      if (!g) return;
      g.clearLayers();
      for (const p of PLACES.filter((x) => active.has(x.category))) {
        L.circleMarker(p.latlng, { radius: 8, color: "#fff", weight: 2, fillColor: COLORS[p.category], fillOpacity: 1 })
          .bindTooltip(`${p.name}${p.walk ? ` · ${p.walk[locale]}` : ""}`, { direction: "top", offset: [0, -6] })
          .addTo(g);
      }
      if (!showBus) return;
      for (const s of BUS_STOPS) {
        const lines = s.routes.map((r) => `<b>${r.n}</b> ${r.name} · ${t.neighbourhood.bus.dir[r.dir]}${r.night ? ` (${t.neighbourhood.bus.night})` : ""}`).join("<br>");
        L.marker(s.latlng, {
          icon: L.divIcon({
            className: "",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            html: `<div style="width:18px;height:18px;border-radius:5px;background:${BUS};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);color:#fff;font:700 10px/14px system-ui,sans-serif;text-align:center">B</div>`,
          }),
          keyboard: false,
        })
          .bindTooltip(`${t.neighbourhood.bus.stop} <b>${s.code}</b> · ${s.name}<br>${lines}<br>${t.neighbourhood.bus.walk(s.walkMin)}`, { direction: "top", offset: [0, -8] })
          .addTo(g);
      }
    });
  }, [active, showBus, ready, locale, t]);

  const toggle = (c: PlaceCategory) =>
    setActive((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  return (
    <div className="overflow-hidden rounded-lg bg-cream shadow-xl shadow-brown/10 ring-1 ring-brown/10">
      <div className="flex flex-wrap gap-2 p-4">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={active.has(c)}
            onClick={() => toggle(c)}
            className={`inline-flex items-center gap-2 rounded-sm px-3.5 py-1.5 text-sm ring-1 transition ${
              active.has(c) ? "bg-cream-deep text-brown ring-brown/20" : "text-brown/50 ring-brown/10"
            }`}
          >
            <span className="size-2.5 rounded-full" style={{ background: COLORS[c], opacity: active.has(c) ? 1 : 0.35 }} />
            {t.neighbourhood.categories[c]}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={showBus}
          onClick={() => setShowBus((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-sm px-3.5 py-1.5 text-sm ring-1 transition ${
            showBus ? "bg-cream-deep text-brown ring-brown/20" : "text-brown/50 ring-brown/10"
          }`}
        >
          <span className="size-2.5 rounded-[3px]" style={{ background: BUS, opacity: showBus ? 1 : 0.35 }} />
          {t.neighbourhood.bus.label}
        </button>
      </div>
      <div ref={el} className="h-[380px] w-full sm:h-[460px]" aria-label={t.nav.neighbourhood} />
      {showBus && (
        <div className="border-t border-brown/10 p-4 sm:p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-brown-soft">{t.neighbourhood.bus.title}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BUS_STOPS.map((s) => (
              <li key={s.code} className="rounded-md bg-white p-3.5 ring-1 ring-brown/10">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-brown">
                    {t.neighbourhood.bus.stop} <span className="font-semibold tabular-nums">{s.code}</span>
                  </span>
                  <span className="text-xs text-brown-soft">{t.neighbourhood.bus.walk(s.walkMin)}</span>
                </p>
                <p className="mt-0.5 text-xs text-brown-soft">{s.name}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {s.routes.map((r) => (
                    <li key={r.n + r.dir} className="flex items-center gap-2 text-sm text-brown">
                      <span className="inline-flex min-w-9 justify-center rounded-sm px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: r.night ? "#3b2a20" : BUS }}>
                        {r.n}
                      </span>
                      <span>
                        {r.name} · {t.neighbourhood.bus.dir[r.dir]}
                        {r.night && <span className="text-brown-soft"> ({t.neighbourhood.bus.night})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

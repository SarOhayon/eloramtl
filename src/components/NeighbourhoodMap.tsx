"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BUILDING_LATLNG } from "@/data/building";
import { PLACES, type PlaceCategory } from "@/data/places";
import { getDictionary, type Locale } from "@/i18n/dictionaries";

const COLORS: Record<PlaceCategory, string> = {
  transit: "#503d32",
  school: "#8a6a3e",
  shopping: "#b0704f",
  park: "#7d8c6a",
  health: "#9a5a5a",
};
const CATS = Object.keys(COLORS) as PlaceCategory[];

export function NeighbourhoodMap({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [active, setActive] = useState<Set<PlaceCategory>>(new Set(CATS));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView(BUILDING_LATLNG, 14);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(m);
      L.marker(BUILDING_LATLNG, {
        icon: L.divIcon({
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: `<div style="position:relative;width:36px;height:36px"><div style="width:36px;height:36px;border-radius:50%;background:#503d32;color:#faf8f5;display:flex;align-items:center;justify-content:center;font:600 16px/1 Georgia,serif;box-shadow:0 0 0 6px rgba(74,54,40,.25)">E</div><span style="position:absolute;left:44px;top:7px;background:#503d32;color:#faf8f5;padding:3px 9px;border-radius:999px;font:500 12px/1.4 system-ui,sans-serif;white-space:nowrap">Elora</span></div>`,
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
    });
  }, [active, ready, locale]);

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
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm ring-1 transition ${
              active.has(c) ? "bg-cream-deep text-brown ring-brown/20" : "text-brown/50 ring-brown/10"
            }`}
          >
            <span className="size-2.5 rounded-full" style={{ background: COLORS[c], opacity: active.has(c) ? 1 : 0.35 }} />
            {t.neighbourhood.categories[c]}
          </button>
        ))}
      </div>
      <div ref={el} className="h-[420px] w-full sm:h-[520px]" aria-label={t.nav.neighbourhood} />
      <ul className="grid gap-x-6 gap-y-2 p-5 text-sm sm:grid-cols-2">
        {PLACES.filter((p) => active.has(p.category)).map((p) => (
          <li key={p.name} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[p.category] }} />
            <button
              type="button"
              className="text-left text-brown hover:underline"
              onClick={() => map.current?.flyTo(p.latlng, 16, { duration: 0.6 })}
            >
              {p.name}
            </button>
            {p.walk && <span className="text-brown-soft">· {p.walk[locale]}</span>}
          </li>
        ))}
      </ul>
      <p className="px-5 pb-4 text-xs text-brown-soft">{t.neighbourhood.mapNote}</p>
    </div>
  );
}

// Where the sun is over the building, and which sides of it get direct sun.
// Pure maths (no neighbouring buildings or trees), safe to use in the browser.

import { BUILDING_LATLNG, layoutFor, type Unit } from "@/data/building";

export type Season = "winter" | "equinox" | "summer";
export type Side = "top" | "right" | "bottom" | "left"; // edges of the floor-plan drawing
export const SIDES: Side[] = ["top", "right", "bottom", "left"];
export const SEASONS: Season[] = ["winter", "equinox", "summer"];

// Day of the year and clock offset (daylight saving) for each season.
const SEASON_DAY: Record<Season, { day: number; dst: number }> = {
  winter: { day: 355, dst: 0 }, // Dec 21
  equinox: { day: 79, dst: 1 }, // Mar 20 (and late September)
  summer: { day: 172, dst: 1 }, // Jun 21
};

const rad = Math.PI / 180;
const [LAT, LNG] = BUILDING_LATLNG;

// Sun height (degrees above the horizon) and direction (degrees from north, clockwise)
// at a Montréal clock time, in hours (e.g. 13.5 = 1:30 p.m.).
export function sunAt(season: Season, clock: number): { alt: number; az: number } {
  const { day, dst } = SEASON_DAY[season];
  const decl = 23.44 * Math.sin((2 * Math.PI * (284 + day)) / 365) * rad;
  const b = (2 * Math.PI * (day - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
  const solar = clock - dst + (LNG + 75) / 15 + eot / 60;
  const h = 15 * (solar - 12) * rad;
  const lat = LAT * rad;
  const alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(h));
  const az = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat));
  return { alt: alt / rad, az: (az / rad + 180 + 360) % 360 };
}

// Compass direction each side of the drawing looks toward, given the direction of its top edge.
export const sideBearing = (side: Side, topFacing: number) => (topFacing + SIDES.indexOf(side) * 90) % 360;

const angleGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const lit = (season: Season, clock: number, bearing: number) => {
  const { alt, az } = sunAt(season, clock);
  return alt > 3 && angleGap(az, bearing) < 85;
};

export const isLit = (season: Season, clock: number, sides: Side[], topFacing: number) =>
  sides.some((s) => lit(season, clock, sideBearing(s, topFacing)));

const STEP = 1 / 6; // 10 minutes
// Direct-sun hours and the stretches of the day (clock hours) when any of the sides is lit.
export function sunHours(season: Season, sides: Side[], topFacing: number) {
  const spans: [number, number][] = [];
  let total = 0;
  for (let c = 4; c <= 21; c += STEP) {
    if (!isLit(season, c, sides, topFacing)) continue;
    total += STEP;
    const last = spans[spans.length - 1];
    if (last && Math.abs(last[1] - c) < STEP / 2) last[1] = c + STEP;
    else spans.push([c, c + STEP]);
  }
  return { hours: Math.round(total * 2) / 2, spans };
}

// Sunrise and sunset for the season, in clock hours.
export function daylight(season: Season): [number, number] {
  let rise = 12;
  let set = 12;
  for (let c = 3; c <= 22; c += 1 / 60) {
    if (sunAt(season, c).alt > 0) {
      if (rise === 12) rise = c;
      set = c;
    }
  }
  return [rise, set];
}

type P = [number, number];
const inside = ([x, y]: P, poly: P[]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
const DIRS: Record<Side, P> = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };

// Sides a suite has windows on: walls with nothing (another suite, a core or an amenity)
// between them and the edge of the building.
export function unitSides(unit: Unit, others: Unit[]): Side[] {
  const layout = layoutFor(unit.floor);
  const blockers = [...others.filter((o) => o.floor === unit.floor && o.id !== unit.id).map((o) => o.shape), ...layout.cores, ...layout.amenities.map((a) => a.shape)];
  const xs = layout.outline.map((p) => p[0]);
  const ys = layout.outline.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const found = new Set<Side>();
  const poly = unit.shape;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 20 || (a[0] !== b[0] && a[1] !== b[1])) continue;
    const mid: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (const side of SIDES) {
      const [dx, dy] = DIRS[side];
      // The wall must run across this direction, with the suite behind it.
      if ((dx !== 0) !== (a[0] === b[0]) || !inside([mid[0] - dx * 2, mid[1] - dy * 2], poly)) continue;
      let p: P = [mid[0] + dx * 2, mid[1] + dy * 2];
      let clear = true;
      while (p[0] > minX - 1 && p[0] < maxX + 1 && p[1] > minY - 1 && p[1] < maxY + 1) {
        if (blockers.some((q) => inside(p, q))) {
          clear = false;
          break;
        }
        p = [p[0] + dx * 3, p[1] + dy * 3];
      }
      if (clear) found.add(side);
    }
  }
  return SIDES.filter((s) => found.has(s));
}

// "7:40" style clock label.
export const clockLabel = (c: number, locale: "fr" | "en") => {
  const m = Math.round(c * 60);
  const h = Math.floor(m / 60) % 24;
  const mm = String(m % 60).padStart(2, "0");
  if (locale === "fr") return `${h} h ${mm}`;
  return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? "a.m." : "p.m."}`;
};

const POINTS = { en: ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"], fr: ["nord", "nord-est", "est", "sud-est", "sud", "sud-ouest", "ouest", "nord-ouest"] };
export const compassWord = (bearing: number, locale: "fr" | "en") => POINTS[locale][Math.round(bearing / 45) % 8];

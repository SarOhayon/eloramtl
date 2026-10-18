// Building and suite data for the explorer.
//
// Floor 1 follows the plan on the current eloramtl.com site. Suites 112 and 113
// carry their published details. Everything marked `sample: true` is a
// placeholder until the real suite list and floor plates are supplied.

export type UnitType = "studio" | "1br" | "1br-den" | "2br" | "3br";

export type Unit = {
  id: string; // suite number, e.g. "112"
  floor: number;
  type: UnitType;
  beds: number;
  baths: number;
  sqft: number;
  availableOn?: string; // ISO date
  sample?: boolean;
  shape: [number, number][]; // polygon in floor-plate coordinates (640 x 340)
  label?: [number, number];
};

export const PHONE_WHATSAPP = "15144651212";
export const PHONE_MAIN = "15143411212";
export const PHONE_WHATSAPP_DISPLAY = "514 465-1212";
export const PHONE_MAIN_DISPLAY = "514 341-1212";
export const ADDRESS = "2855 chemin Bates, Montréal (QC) H3S 0A6";
export const BUILDING_LATLNG: [number, number] = [45.5121, -73.6318];

export const whatsappLink = (text: string) =>
  `https://wa.me/${PHONE_WHATSAPP}?text=${encodeURIComponent(text)}`;

// Floor outlines on /photos/elora-6.jpg (2000 x 1333).
export const BUILDING_PHOTO = { src: "/photos/elora-6.jpg", width: 2000, height: 1333 };
export const FLOOR_OUTLINES: Record<number, [number, number][]> = {
  1: [[80, 842], [1865, 967], [1865, 1107], [80, 982]],
  2: [[80, 756], [1865, 818], [1865, 967], [80, 842]],
  3: [[80, 670], [1865, 670], [1865, 818], [80, 756]],
  4: [[80, 584], [1865, 522], [1865, 670], [80, 670]],
  5: [[80, 498], [1865, 373], [1865, 522], [80, 584]],
  6: [[80, 396], [340, 375], [1800, 241], [1865, 300], [1865, 373], [80, 498]],
  7: [[400, 290], [1800, 205], [1800, 241], [400, 367]],
};
export const FLOORS = [7, 6, 5, 4, 3, 2, 1];

// Floor plate, traced from the floor 1 plan. Coordinates in a 640 x 340 box.
export const PLATE_OUTLINE: [number, number][] = [
  [5, 20], [612, 20], [612, 320], [5, 320],
];

type Slot = { suffix: string; shape: [number, number][]; label?: [number, number] };

const rect = (x1: number, y1: number, x2: number, y2: number): [number, number][] => [
  [x1, y1], [x2, y1], [x2, y2], [x1, y2],
];

// Slots shared by every floor.
const COMMON_SLOTS: Slot[] = [
  { suffix: "03", shape: [[385, 20], [525, 20], [525, 100], [480, 100], [480, 70], [385, 70]], label: [455, 48] },
  { suffix: "04", shape: [[527, 20], [612, 20], [612, 145], [540, 145], [540, 100], [527, 100]], label: [574, 82] },
  { suffix: "05", shape: rect(480, 145, 612, 205) },
  { suffix: "06", shape: [[505, 205], [612, 205], [612, 320], [505, 320]] },
  { suffix: "07", shape: rect(420, 205, 505, 320) },
  { suffix: "08", shape: rect(365, 205, 420, 320) },
  { suffix: "09", shape: rect(308, 205, 365, 320) },
  { suffix: "10", shape: rect(157, 205, 232, 320) },
  { suffix: "11", shape: [[82, 185], [157, 185], [157, 205], [157, 320], [82, 320]] },
  { suffix: "12", shape: [[5, 20], [80, 20], [80, 135], [120, 135], [120, 185], [5, 185]], label: [42, 102] },
  { suffix: "13", shape: [[82, 20], [232, 20], [232, 85], [140, 85], [140, 135], [82, 135]], label: [150, 55] },
];

// On floor 1 these slots hold the gym and services; upstairs they are suites.
const UPPER_SLOTS: Slot[] = [
  { suffix: "01", shape: rect(5, 185, 80, 320) },
  { suffix: "02", shape: rect(308, 75, 380, 185) },
];

export const FLOOR1_AMENITIES = [
  { key: "gym" as const, shape: rect(308, 75, 380, 185) },
  { key: "services" as const, shape: rect(5, 185, 80, 320) },
];

export const CORES: [number, number][][] = [rect(142, 90, 232, 185), rect(390, 105, 478, 185)];

// Sample mix used until real data arrives.
const SAMPLE_TYPES: Record<string, { type: UnitType; beds: number; baths: number; sqft: number }> = {
  "01": { type: "1br", beds: 1, baths: 1, sqft: 610 },
  "02": { type: "studio", beds: 0, baths: 1, sqft: 455 },
  "03": { type: "2br", beds: 2, baths: 2, sqft: 940 },
  "04": { type: "2br", beds: 2, baths: 2, sqft: 905 },
  "05": { type: "1br-den", beds: 1, baths: 1, sqft: 720 },
  "06": { type: "2br", beds: 2, baths: 2, sqft: 960 },
  "07": { type: "1br-den", beds: 1, baths: 1, sqft: 745 },
  "08": { type: "studio", beds: 0, baths: 1, sqft: 470 },
  "09": { type: "studio", beds: 0, baths: 1, sqft: 470 },
  "10": { type: "1br", beds: 1, baths: 1, sqft: 640 },
  "11": { type: "1br", beds: 1, baths: 1, sqft: 655 },
  "12": { type: "3br", beds: 3, baths: 2, sqft: 1152 },
  "13": { type: "2br", beds: 2, baths: 2, sqft: 987 },
};

function buildUnits(): Unit[] {
  const units: Unit[] = [];
  for (const floor of FLOORS.slice().reverse()) {
    const slots = floor === 1 ? COMMON_SLOTS : [...UPPER_SLOTS, ...COMMON_SLOTS];
    for (const slot of slots) {
      const id = `${floor}${slot.suffix}`;
      units.push({ id, floor, shape: slot.shape, label: slot.label, sample: true, ...SAMPLE_TYPES[slot.suffix] });
    }
  }
  // Published on eloramtl.com.
  for (const real of [
    { id: "112", type: "3br" as const, beds: 3, baths: 2, sqft: 1152, availableOn: "2026-11-01" },
    { id: "113", type: "2br" as const, beds: 2, baths: 2, sqft: 987, availableOn: "2026-11-01" },
  ]) {
    const u = units.find((x) => x.id === real.id)!;
    Object.assign(u, real, { sample: false });
  }
  return units.sort((a, b) => a.floor - b.floor || a.id.localeCompare(b.id));
}

export const UNITS = buildUnits();
export const UNIT_TYPES: UnitType[] = ["studio", "1br", "1br-den", "2br", "3br"];

// "Starting at" monthly rents, as published on eloramtl.com.
export const PRICE_FROM: Record<UnitType, number> = {
  studio: 1470,
  "1br": 1650,
  "1br-den": 1900,
  "2br": 2135,
  "3br": 2695,
};

export const formatPrice = (amount: number, locale: "fr" | "en") =>
  new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);

export const TOURS_3D = [
  "https://3drenderingservices.ca/eloramtl-c1/",
  "https://3drenderingservices.ca/eloramtl-c2/",
];

// Lets other sections (audience cards, price cards) drive the explorer filter.
export const SHOW_TYPE_EVENT = "elora:show-type";
export const showType = (type: UnitType) => {
  window.dispatchEvent(new CustomEvent<UnitType>(SHOW_TYPE_EVENT, { detail: type }));
  document.getElementById("suites")?.scrollIntoView({ behavior: "smooth" });
};

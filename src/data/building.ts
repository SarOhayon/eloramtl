// Building and suite data for the explorer.
//
// Floor 1 and floors 2 to 5 follow the building's floor plans. Suites 112 and 113
// carry their published details. Everything marked `sample: true` is a
// placeholder until the real suite list is supplied.

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

type Slot = { suffix: string; shape: [number, number][]; label?: [number, number] };
type Spec = { type: UnitType; beds: number; baths: number; sqft: number };
export type FloorLayout = { outline: [number, number][]; cores: [number, number][][]; amenities: { key: "gym" | "services"; shape: [number, number][] }[] };

const rect = (x1: number, y1: number, x2: number, y2: number): [number, number][] => [
  [x1, y1], [x2, y1], [x2, y2], [x1, y2],
];

// Floor 1, traced from the floor 1 plan (suites 103 to 113, gym and services).
// Coordinates are in a 617 x 340 box.
const FLOOR1_SLOTS: Slot[] = [
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
const FLOOR1: FloorLayout = {
  outline: rect(5, 20, 612, 320),
  cores: [rect(142, 90, 232, 185), rect(390, 105, 478, 185)],
  amenities: [
    { key: "gym", shape: rect(308, 75, 380, 185) },
    { key: "services", shape: rect(5, 185, 80, 320) },
  ],
};

// Floors 2 and up, traced from the floor 2 plan (suites x01 to x16).
const UPPER_SLOTS: Slot[] = [
  { suffix: "01", shape: [[232, 71], [308, 71], [308, 175], [232, 175]] },
  { suffix: "02", shape: [[308, 71], [411, 71], [411, 175], [308, 175]] },
  { suffix: "03", shape: [[385, 20], [496, 20], [496, 58], [479, 58], [479, 115], [385, 115]] },
  { suffix: "04", shape: [[496, 20], [612, 20], [612, 105], [544, 105], [544, 133], [496, 133], [496, 58]], label: [560, 65] },
  { suffix: "05", shape: [[544, 105], [612, 105], [612, 207], [573, 207], [573, 182], [479, 182], [479, 133], [544, 133]], label: [554, 158] },
  { suffix: "06", shape: [[515, 182], [573, 182], [573, 207], [612, 207], [612, 320], [537, 320], [537, 232], [515, 232]], label: [576, 263] },
  { suffix: "07", shape: [[463, 218], [515, 218], [515, 232], [537, 232], [537, 320], [463, 320]], label: [502, 272] },
  { suffix: "08", shape: [[404, 195], [463, 195], [463, 320], [404, 320]] },
  { suffix: "09", shape: [[348, 195], [404, 195], [404, 320], [348, 320]] },
  { suffix: "10", shape: [[271, 195], [348, 195], [348, 320], [271, 320]] },
  { suffix: "11", shape: [[197, 195], [271, 195], [271, 309], [197, 309]] },
  { suffix: "12", shape: [[132, 195], [197, 195], [197, 309], [82, 309], [82, 244], [102, 244], [102, 220], [122, 220], [122, 204], [132, 204]], label: [151, 257] },
  { suffix: "13", shape: [[5, 207], [54, 207], [54, 175], [128, 175], [128, 195], [122, 204], [122, 220], [102, 220], [102, 244], [82, 244], [82, 309], [5, 309]], label: [34, 263] },
  { suffix: "14", shape: [[5, 133], [139, 133], [139, 175], [54, 175], [54, 207], [5, 207]], label: [67, 158] },
  { suffix: "15", shape: [[5, 20], [122, 20], [122, 133], [5, 133]] },
  { suffix: "16", shape: [[122, 20], [232, 20], [232, 115], [122, 115]] },
];
const UPPER_CORES: [number, number][][] = [[[158, 114], [229, 114], [229, 175], [158, 175]], [[411, 114], [463, 114], [463, 182], [411, 182]]];
const UPPER_OUTLINE: [number, number][] = [[5, 20], [612, 20], [612, 320], [5, 320]];
const UPPER: FloorLayout = { outline: UPPER_OUTLINE, cores: UPPER_CORES, amenities: [] };

// Floors 2 to 5 share the floor 2 plan. Floors 6 and 7 reuse it until their plans arrive.
export const layoutFor = (floor: number): FloorLayout => (floor === 1 ? FLOOR1 : UPPER);

// Sample suite mix used until the real suite list arrives.
const s = (type: UnitType, sqft: number): Spec => ({ type, sqft, beds: { studio: 0, "1br": 1, "1br-den": 1, "2br": 2, "3br": 3 }[type], baths: type === "2br" || type === "3br" ? 2 : 1 });
const FLOOR1_SAMPLES: Record<string, Spec> = {
  "03": s("2br", 940), "04": s("2br", 905), "05": s("1br-den", 720), "06": s("2br", 960), "07": s("1br-den", 745), "08": s("studio", 470),
  "09": s("studio", 470), "10": s("1br", 640), "11": s("1br", 655), "12": s("3br", 1152), "13": s("2br", 987),
};
const UPPER_SAMPLES: Record<string, Spec> = {
  "01": s("1br", 620), "02": s("1br-den", 760), "03": s("2br", 900), "04": s("2br", 940), "05": s("1br-den", 780), "06": s("2br", 960),
  "07": s("1br-den", 740), "08": s("studio", 480), "09": s("studio", 470), "10": s("1br", 650), "11": s("1br", 640), "12": s("2br", 920),
  "13": s("2br", 950), "14": s("1br-den", 750), "15": s("3br", 1150), "16": s("2br", 880),
};

function buildUnits(): Unit[] {
  const units: Unit[] = [];
  for (const floor of FLOORS.slice().reverse()) {
    const [slots, samples] = floor === 1 ? [FLOOR1_SLOTS, FLOOR1_SAMPLES] : [UPPER_SLOTS, UPPER_SAMPLES];
    for (const slot of slots) {
      const id = `${floor}${slot.suffix}`;
      units.push({ id, floor, shape: slot.shape, label: slot.label, sample: true, ...samples[slot.suffix] });
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

// Inbox that receives every website form (Apply now, inquiries, maintenance). See src/lib/mail.ts.
export const INBOX_EMAIL = "sarah@eloramtl.com";
export const INSTAGRAM_URL = "https://www.instagram.com/eloramtl/";

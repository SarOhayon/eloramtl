// Nearby points of interest. Coordinates are approximate and should be checked
// before launch.

export type PlaceCategory = "transit" | "school" | "shopping" | "park" | "health";

export type Place = {
  name: string;
  category: PlaceCategory;
  latlng: [number, number];
  walk?: { fr: string; en: string };
};

export const PLACES: Place[] = [
  { name: "REM Canora", category: "transit", latlng: [45.51389, -73.63444], walk: { fr: "7 min à pied", en: "7 min walk" } },
  { name: "Métro Acadie", category: "transit", latlng: [45.5234, -73.6242] },
  { name: "Métro Outremont", category: "transit", latlng: [45.5203, -73.6149] },
  { name: "REM Mont-Royal", category: "transit", latlng: [45.5196, -73.6492] },
  { name: "Université de Montréal", category: "school", latlng: [45.5048, -73.6132] },
  { name: "HEC Montréal", category: "school", latlng: [45.5034, -73.6207] },
  { name: "Polytechnique Montréal", category: "school", latlng: [45.5045, -73.6128] },
  { name: "Avenue Bernard", category: "shopping", latlng: [45.5246, -73.6075] },
  { name: "Avenue Van Horne", category: "shopping", latlng: [45.5177, -73.6170] },
  { name: "Centre Rockland", category: "shopping", latlng: [45.5260, -73.6436] },
  { name: "Marché Jean-Talon", category: "shopping", latlng: [45.5363, -73.6147] },
  { name: "Parc Pratt", category: "park", latlng: [45.5157, -73.6102] },
  { name: "Parc du Mont-Royal", category: "park", latlng: [45.5048, -73.5874] },
  { name: "CHU Sainte-Justine", category: "health", latlng: [45.5028, -73.6247] },
  { name: "Hôpital général juif", category: "health", latlng: [45.4972, -73.6297] },
];

// Nearest STM bus stops (stop numbers, positions and routes from the STM's GTFS data, 2026).
export type BusDirection = "both" | "north" | "south" | "east" | "west";
export type BusStop = {
  code: string; // the number posted on the stop, used for STM text/phone times
  name: string;
  latlng: [number, number];
  walkMin: number;
  routes: { n: string; name: string; dir: BusDirection; night?: boolean }[];
};

export const BUS_STOPS: BusStop[] = [
  { code: "62453", name: "Bates / Wilderton", latlng: [45.512796, -73.631878], walkMin: 1, routes: [{ n: "155", name: "Wilderton", dir: "both" }] },
  { code: "50952", name: "Wilderton / Bates", latlng: [45.513267, -73.63103], walkMin: 2, routes: [{ n: "160", name: "Barclay", dir: "east" }] },
  { code: "62554", name: "Bates / Wilderton", latlng: [45.513629, -73.63113], walkMin: 2, routes: [{ n: "160", name: "Barclay", dir: "west" }] },
  {
    code: "50922",
    name: "Jean-Talon / de Dunkirk",
    latlng: [45.512989, -73.63306],
    walkMin: 2,
    routes: [
      { n: "92", name: "Jean-Talon Ouest", dir: "west" },
      { n: "372", name: "Jean-Talon", dir: "west", night: true },
    ],
  },
  {
    code: "50104",
    name: "Station Canora (Jean-Talon / Wilderton)",
    latlng: [45.513581, -73.632259],
    walkMin: 2,
    routes: [
      { n: "92", name: "Jean-Talon Ouest", dir: "east" },
      { n: "372", name: "Jean-Talon", dir: "east", night: true },
    ],
  },
];

// The maintenance assistant's question tree and where each kind of request is emailed.
// Edit labels, add issues, or set `sendTo` on a category to route it to another inbox
// (e.g. "plumbing@eloramtl.com"). Categories without `sendTo` go to INBOX_EMAIL.

export type Bi = { fr: string; en: string };
export type Issue = { id: string; label: Bi; urgent?: boolean };
export type Category = { id: string; label: Bi; sendTo?: string; issues: Issue[] };

const other: Issue = { id: "other", label: { fr: "Autre problème", en: "Something else" } };

export const CATEGORIES: Category[] = [
  {
    id: "plumbing",
    label: { fr: "Plomberie", en: "Plumbing" },
    issues: [
      { id: "leak", label: { fr: "Fuite d'eau ou dégât d'eau", en: "Water leak or flooding" }, urgent: true },
      { id: "clog", label: { fr: "Évier, bain ou toilette bouché", en: "Clogged sink, tub or toilet" } },
      { id: "hot-water", label: { fr: "Pas d'eau chaude", en: "No hot water" }, urgent: true },
      { id: "toilet", label: { fr: "Toilette qui coule sans arrêt", en: "Toilet keeps running" } },
      { id: "pressure", label: { fr: "Faible pression d'eau", en: "Low water pressure" } },
      other,
    ],
  },
  {
    id: "electrical",
    label: { fr: "Électricité", en: "Electrical" },
    issues: [
      { id: "no-power", label: { fr: "Plus de courant dans le logement", en: "No power in the unit" }, urgent: true },
      { id: "breaker", label: { fr: "Le disjoncteur saute", en: "Breaker keeps tripping" } },
      { id: "outlet", label: { fr: "Prise ou interrupteur défectueux", en: "Outlet or switch not working" } },
      { id: "lighting", label: { fr: "Luminaire défectueux", en: "Light fixture not working" } },
      other,
    ],
  },
  {
    id: "hvac",
    label: { fr: "Chauffage et climatisation", en: "Heating & A/C" },
    issues: [
      { id: "no-heat", label: { fr: "Pas de chauffage", en: "No heat" }, urgent: true },
      { id: "no-cooling", label: { fr: "La climatisation ne refroidit pas", en: "A/C not cooling" } },
      { id: "water", label: { fr: "L'appareil mural coule", en: "Wall unit is dripping water" } },
      { id: "remote", label: { fr: "Télécommande ou thermostat", en: "Remote or thermostat" } },
      { id: "noise", label: { fr: "Bruit inhabituel", en: "Unusual noise" } },
      other,
    ],
  },
  {
    id: "appliances",
    label: { fr: "Électroménagers", en: "Appliances" },
    issues: [
      { id: "fridge", label: { fr: "Réfrigérateur ou congélateur", en: "Fridge or freezer" } },
      { id: "stove", label: { fr: "Cuisinière ou four", en: "Stove or oven" } },
      { id: "dishwasher", label: { fr: "Lave-vaisselle", en: "Dishwasher" } },
      { id: "laundry", label: { fr: "Laveuse ou sécheuse", en: "Washer or dryer" } },
      { id: "hood", label: { fr: "Hotte ou micro-ondes", en: "Range hood or microwave" } },
      other,
    ],
  },
  {
    id: "access",
    label: { fr: "Portes, serrures et clés", en: "Doors, locks & keys" },
    issues: [
      { id: "locked-out", label: { fr: "Je suis barré dehors", en: "I'm locked out" }, urgent: true },
      { id: "fob", label: { fr: "Clé ou puce d'accès défectueuse", en: "Key or fob not working" } },
      { id: "door", label: { fr: "Porte qui ferme mal", en: "Door doesn't close properly" } },
      { id: "intercom", label: { fr: "Interphone", en: "Intercom / buzzer" } },
      other,
    ],
  },
  {
    id: "windows",
    label: { fr: "Fenêtres et balcon", en: "Windows & balcony" },
    issues: [
      { id: "broken", label: { fr: "Vitre brisée", en: "Broken glass" }, urgent: true },
      { id: "stuck", label: { fr: "Fenêtre qui n'ouvre ou ne ferme pas", en: "Window won't open or close" } },
      { id: "patio", label: { fr: "Porte-patio du balcon", en: "Balcony patio door" } },
      { id: "blinds", label: { fr: "Stores", en: "Blinds" } },
      other,
    ],
  },
  {
    id: "pests",
    label: { fr: "Insectes ou rongeurs", en: "Pests" },
    issues: [
      { id: "insects", label: { fr: "Insectes", en: "Insects" } },
      { id: "rodents", label: { fr: "Souris ou rongeurs", en: "Mice or rodents" } },
      other,
    ],
  },
  {
    id: "building",
    label: { fr: "Aires communes", en: "Common areas" },
    issues: [
      { id: "elevator", label: { fr: "Ascenseur", en: "Elevator" }, urgent: true },
      { id: "garage", label: { fr: "Porte du garage ou stationnement", en: "Garage door or parking" } },
      { id: "amenities", label: { fr: "Gym, terrasse ou salon", en: "Gym, terrace or lounge" } },
      { id: "hallway", label: { fr: "Corridor, éclairage ou propreté", en: "Hallway, lighting or cleanliness" } },
      { id: "noise", label: { fr: "Plainte de bruit", en: "Noise complaint" } },
      other,
    ],
  },
  { id: "other", label: { fr: "Autre", en: "Something else" }, issues: [{ id: "other", label: { fr: "Décrire le problème", en: "Describe the problem" } }] },
];

export const ROOMS: Bi[] = [
  { fr: "Cuisine", en: "Kitchen" },
  { fr: "Salle de bain", en: "Bathroom" },
  { fr: "Chambre", en: "Bedroom" },
  { fr: "Salon", en: "Living room" },
  { fr: "Balcon", en: "Balcony" },
  { fr: "Tout le logement", en: "Whole unit" },
  { fr: "Aire commune", en: "Common area" },
];

export const SINCE: Bi[] = [
  { fr: "Aujourd'hui", en: "Today" },
  { fr: "Depuis quelques jours", en: "A few days" },
  { fr: "Depuis plus d'une semaine", en: "Over a week" },
];

export const findIssue = (categoryId: string, issueId: string) => {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const issue = category?.issues.find((i) => i.id === issueId);
  return category && issue ? { category, issue } : null;
};

// The maintenance form's question tree, the approver, and which contractor gets each trade.
// Edit freely: add rooms, items or problems, mark problems `urgent`, or change emails.
// Every item belongs to a trade; approved requests go to that trade's email.

import { INBOX_EMAIL } from "./building";

export type Bi = { fr: string; en: string };
export type Trade = "plumbing" | "appliances" | "electrical" | "hvac" | "carpentry" | "general";
export type Problem = { id: string; label: Bi; urgent?: boolean };
export type Item = { id: string; label: Bi; trade: Trade; problems: Problem[] };
export type Room = { id: string; label: Bi; items: Item[] };

// Receives every request with Approve / Decline buttons.
export const APPROVER_EMAIL = INBOX_EMAIL; // TODO: your boss's email

// Approved requests are forwarded here. Replace with each contractor's email.
export const TRADES: Record<Trade, { label: Bi; email: string }> = {
  plumbing: { label: { fr: "Plombier", en: "Plumber" }, email: INBOX_EMAIL },
  appliances: { label: { fr: "Technicien en électroménagers", en: "Appliance technician" }, email: INBOX_EMAIL },
  electrical: { label: { fr: "Électricien", en: "Electrician" }, email: INBOX_EMAIL },
  hvac: { label: { fr: "Technicien chauffage et climatisation", en: "Heating & A/C technician" }, email: INBOX_EMAIL },
  carpentry: { label: { fr: "Menuisier", en: "Carpenter / handyman" }, email: INBOX_EMAIL },
  general: { label: { fr: "Entretien général", en: "General maintenance" }, email: INBOX_EMAIL },
};

const p = (id: string, fr: string, en: string, urgent?: boolean): Problem => ({ id, label: { fr, en }, urgent });
const other = p("other", "Autre", "Something else");

const sink: Item = {
  id: "sink",
  label: { fr: "Évier", en: "Sink" },
  trade: "plumbing",
  problems: [p("dripping", "Robinet qui goutte", "Dripping"), p("running", "L'eau ne s'arrête pas", "Running / won't stop"), p("burst", "Tuyau éclaté", "Burst pipe", true), p("clogged", "Bouché", "Clogged"), other],
};
const electrical: Item = {
  id: "electrical",
  label: { fr: "Électricité", en: "Electrical" },
  trade: "electrical",
  problems: [p("outlet", "Prise qui ne fonctionne pas", "Outlet not working"), p("light", "Lumière qui ne fonctionne pas", "Light not working"), p("breaker", "Le disjoncteur saute", "Breaker keeps tripping"), p("no-power", "Plus de courant", "No power", true), other],
};
const climate: Item = {
  id: "climate",
  label: { fr: "Chauffage / climatisation", en: "Heating / A/C" },
  trade: "hvac",
  problems: [p("no-heat", "Pas de chauffage", "No heat", true), p("no-cooling", "Ne refroidit pas", "Not cooling"), p("leaking", "L'appareil coule", "Leaking water"), p("noise", "Bruit inhabituel", "Strange noise"), p("remote", "Télécommande", "Remote not working"), other],
};
const windows: Item = {
  id: "windows",
  label: { fr: "Fenêtre / porte-patio", en: "Window / patio door" },
  trade: "carpentry",
  problems: [p("stuck", "N'ouvre ou ne ferme pas", "Won't open or close"), p("broken", "Vitre brisée", "Broken glass", true), p("draft", "Courant d'air", "Draft"), p("blinds", "Stores", "Blinds"), other],
};

export const ROOMS: Room[] = [
  {
    id: "kitchen",
    label: { fr: "Cuisine", en: "Kitchen" },
    items: [
      sink,
      { id: "dishwasher", label: { fr: "Lave-vaisselle", en: "Dishwasher" }, trade: "appliances", problems: [p("not-draining", "Ne se vide pas", "Not draining"), p("leaking", "Fuit", "Leaking"), p("wont-start", "Ne démarre pas", "Won't start"), p("not-cleaning", "Lave mal", "Not cleaning well"), other] },
      { id: "fridge", label: { fr: "Réfrigérateur", en: "Fridge" }, trade: "appliances", problems: [p("not-cooling", "Ne refroidit pas", "Not cooling", true), p("leaking", "Fuit", "Leaking"), p("noise", "Bruyant", "Noisy"), p("door", "Porte ou joint", "Door or seal"), other] },
      { id: "freezer", label: { fr: "Congélateur", en: "Freezer" }, trade: "appliances", problems: [p("not-freezing", "Ne congèle pas", "Not freezing", true), p("ice", "Accumulation de glace", "Ice build-up"), p("noise", "Bruyant", "Noisy"), other] },
      { id: "cabinet", label: { fr: "Armoire", en: "Cabinet" }, trade: "carpentry", problems: [p("door", "Porte ou charnière brisée", "Door or hinge broken"), p("drawer", "Tiroir coincé", "Drawer stuck"), p("damage", "Dommage", "Damage"), other] },
      electrical,
    ],
  },
  {
    id: "living",
    label: { fr: "Salon", en: "Living room" },
    items: [
      climate,
      windows,
      { id: "floor", label: { fr: "Plancher", en: "Floor" }, trade: "carpentry", problems: [p("damaged", "Endommagé", "Damaged"), p("loose", "Lame qui bouge", "Loose board"), other] },
      electrical,
    ],
  },
  {
    id: "bathroom",
    label: { fr: "Salle de bain", en: "Bathroom" },
    items: [
      sink,
      { id: "toilet", label: { fr: "Toilette", en: "Toilet" }, trade: "plumbing", problems: [p("running", "Coule sans arrêt", "Keeps running"), p("clogged", "Bouchée", "Clogged"), p("leaking", "Fuit au plancher", "Leaking on the floor", true), p("flush", "Chasse d'eau", "Flush not working"), other] },
      { id: "shower", label: { fr: "Douche / bain", en: "Shower / tub" }, trade: "plumbing", problems: [p("no-hot-water", "Pas d'eau chaude", "No hot water", true), p("clogged", "Drain bouché", "Clogged drain"), p("leaking", "Fuit", "Leaking"), p("pressure", "Faible pression", "Low pressure"), other] },
      { id: "fan", label: { fr: "Ventilateur", en: "Exhaust fan" }, trade: "electrical", problems: [p("not-working", "Ne fonctionne pas", "Not working"), p("noise", "Bruyant", "Noisy"), other] },
      { id: "vanity", label: { fr: "Vanité / miroir", en: "Vanity / mirror" }, trade: "carpentry", problems: [p("door", "Porte ou tiroir", "Door or drawer"), p("damage", "Dommage", "Damage"), other] },
      electrical,
    ],
  },
  {
    id: "bedroom",
    label: { fr: "Chambre", en: "Bedroom" },
    items: [
      climate,
      windows,
      { id: "closet", label: { fr: "Garde-robe", en: "Closet" }, trade: "carpentry", problems: [p("door", "Porte qui coince ou tombe", "Door stuck or off track"), p("shelf", "Tablette brisée", "Shelf broken"), other] },
      electrical,
    ],
  },
];

export const findProblem = (roomId: string, itemId: string, problemId: string) => {
  const room = ROOMS.find((r) => r.id === roomId);
  const item = room?.items.find((i) => i.id === itemId);
  const problem = item?.problems.find((x) => x.id === problemId);
  return room && item && problem ? { room, item, problem } : null;
};

export type PhotoCategory = "building" | "suites" | "amenities";

export type Photo = {
  src: string;
  category: PhotoCategory;
  alt: { fr: string; en: string };
};

const p = (n: string, category: PhotoCategory, fr: string, en: string): Photo => ({
  src: `/photos/elora-${n}.jpg`,
  category,
  alt: { fr, en },
});

export const PHOTOS = {
  facade: p("6", "building", "Façade d'Elora sur le chemin Bates", "Elora's façade on chemin Bates"),
  facadeSide: p("7", "building", "Vue de l'immeuble Elora", "View of the Elora building"),
  entrance: p("1", "building", "Entrée principale au 2855 chemin Bates", "Main entrance at 2855 chemin Bates"),
  aerial: p("28", "building", "Vue aérienne d'Elora et du quartier", "Aerial view of Elora and the neighbourhood"),
  lobby: p("2", "amenities", "Hall d'entrée avec alcôves en bois", "Lobby with wood alcoves"),
  alcoves: p("8", "amenities", "Alcôves du salon", "Lounge alcoves"),
  workBooth: p("001", "amenities", "Cabine de travail vitrée", "Glass work booth"),
  gym: p("002", "amenities", "Salle d'entraînement", "Fitness room"),
  gym2: p("003", "amenities", "Poids libres au gym", "Free weights in the gym"),
  rooftop: p("004", "amenities", "Terrasse sur le toit", "Rooftop terrace"),
  parking: p("005", "amenities", "Stationnement intérieur", "Indoor parking"),
  terrace: p("006", "amenities", "Terrasse du rez-de-chaussée", "Ground-floor terrace"),
  ev: p("27", "amenities", "Bornes de recharge pour véhicules électriques", "EV chargers"),
  elevators: p("29", "amenities", "Ascenseurs", "Elevators"),
  living: p("5", "suites", "Séjour lumineux avec balcon", "Bright living room with balcony"),
  kitchen: p("3", "suites", "Cuisine avec îlot en quartz", "Kitchen with quartz island"),
  kitchen2: p("22", "suites", "Cuisine et îlot", "Kitchen and island"),
  kitchen3: p("15", "suites", "Cuisine avec électros en inox", "Kitchen with stainless appliances"),
  kitchen4: p("9", "suites", "Cuisine et comptoir-lunch", "Kitchen with breakfast bar"),
  bedroom: p("16", "suites", "Chambre principale", "Primary bedroom"),
  bedroom2: p("11", "suites", "Chambre meublée", "Furnished bedroom"),
  bath: p("4", "suites", "Salle de bain avec douche vitrée", "Bathroom with glass shower"),
  bath2: p("12", "suites", "Salle de bain avec baignoire", "Bathroom with tub"),
  open: p("14", "suites", "Aire ouverte", "Open-concept living"),
  open2: p("17", "suites", "Aire ouverte vers la cuisine", "Open living towards the kitchen"),
  hall: p("21", "suites", "Corridor vers le balcon", "Hallway to the balcony"),
  laundry: p("24", "suites", "Laveuse et sécheuse dans le logement", "In-suite washer and dryer"),
};

export const GALLERY: Photo[] = [
  PHOTOS.facade, PHOTOS.living, PHOTOS.rooftop, PHOTOS.kitchen, PHOTOS.lobby, PHOTOS.bedroom,
  PHOTOS.gym, PHOTOS.entrance, PHOTOS.open, PHOTOS.terrace, PHOTOS.bath, PHOTOS.aerial,
  PHOTOS.kitchen2, PHOTOS.alcoves, PHOTOS.bedroom2, PHOTOS.workBooth, PHOTOS.laundry,
  PHOTOS.facadeSide, PHOTOS.kitchen3, PHOTOS.gym2, PHOTOS.open2, PHOTOS.bath2, PHOTOS.ev,
  PHOTOS.kitchen4, PHOTOS.hall, PHOTOS.elevators, PHOTOS.parking,
];

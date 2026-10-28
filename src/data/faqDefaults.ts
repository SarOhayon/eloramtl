import type { FaqItem } from "./content";

// A first FAQ for the chat, written from what the website already says. The admin edits it
// (Chat assistant → Questions and answers). Prices, availability, the promotion and office hours
// are added to the chat automatically, so they don't need to be written here.

const qa = (id: string, en: [string, string], fr: [string, string]): FaqItem => ({ id, q: { en: en[0], fr: fr[0] }, a: { en: en[1], fr: fr[1] } });

export const DEFAULT_FAQ: FaqItem[] = [
  qa(
    "pets",
    ["Are pets allowed?", "Yes, Elora is pet friendly: dogs and cats are welcome."],
    ["Les animaux sont-ils acceptés?", "Oui, Elora accueille les animaux : chiens et chats sont les bienvenus."],
  ),
  qa(
    "included",
    ["What's included in the rent?", "Every suite comes with 5 appliances (including an in-suite washer and dryer), lighting and hot water."],
    ["Qu'est-ce qui est inclus dans le loyer?", "Chaque logement comprend 5 électroménagers (dont une laveuse et une sécheuse), l'éclairage et l'eau chaude."],
  ),
  qa(
    "suites",
    ["What are the suites like?", "Bright suites with large triple-glazed windows and a private balcony, a kitchen with a quartz island and stainless appliances, a wall-mounted heat pump for A/C and heat, light wood-look floors and a glass shower. Studios to 3 bedrooms."],
    ["Comment sont les logements?", "Des logements lumineux avec grandes fenêtres à triple vitrage et balcon privé, cuisine avec îlot en quartz et électros en inox, thermopompe murale (climatisation et chauffage), planchers clairs et douche vitrée. Du studio au 3 chambres."],
  ),
  qa(
    "amenities",
    ["What amenities does the building have?", "Rooftop terraces with BBQs, a ground-floor landscaped terrace, a fitness room, a lounge with a glass work booth and Wi-Fi, indoor heated parking with EV chargers, storage lockers, a bicycle room, elevators, video surveillance and wheelchair access."],
    ["Quelles sont les commodités de l'immeuble?", "Terrasses sur le toit avec BBQ, terrasse aménagée au rez-de-chaussée, salle d'entraînement, salon avec cabine de travail vitrée et Wi-Fi, stationnement intérieur chauffé avec bornes de recharge, casiers de rangement, local à vélos, ascenseurs, caméras de surveillance et accès pour personnes à mobilité réduite."],
  ),
  qa(
    "parking",
    ["Is there parking?", "Yes, there's indoor heated parking with electric vehicle chargers. Ask the team for availability and price."],
    ["Y a-t-il du stationnement?", "Oui, un stationnement intérieur chauffé avec bornes de recharge pour véhicules électriques. Demandez à l'équipe pour la disponibilité et le prix."],
  ),
  qa(
    "location",
    ["Where is Elora and how do I get around?", "2855 chemin Bates, between Outremont, Town of Mount Royal and Glenmount. Canora REM station is a 7-minute walk (downtown in about 7 minutes by REM), the Acadie and Outremont metros are about 5 minutes away, and YUL airport is under 15 minutes. Buses 155, 160 and 92 stop right nearby."],
    ["Où est Elora et comment s'y déplacer?", "2855 chemin Bates, entre Outremont, Ville Mont-Royal et Glenmount. La station REM Canora est à 7 minutes à pied (le centre-ville en environ 7 minutes en REM), les métros Acadie et Outremont à environ 5 minutes et l'aéroport YUL à moins de 15 minutes. Les autobus 155, 160 et 92 s'arrêtent tout près."],
  ),
  qa(
    "nearby",
    ["What's nearby?", "Université de Montréal, HEC and Polytechnique, the shops of avenue Bernard and Van Horne, Rockland Centre, Jean-Talon Market, parks like Parc Pratt and Mount Royal, and the Sainte-Justine and Jewish General hospitals."],
    ["Qu'y a-t-il à proximité?", "L'Université de Montréal, HEC et Polytechnique, les boutiques des avenues Bernard et Van Horne, le Centre Rockland, le Marché Jean-Talon, des parcs comme le parc Pratt et le mont Royal, et les hôpitaux Sainte-Justine et Général juif."],
  ),
  qa(
    "visit",
    ["Can I visit?", "Of course! Send us the inquiry form: you'll get an email right away with a button to book your private showing at a time that suits you."],
    ["Puis-je visiter?", "Bien sûr! Envoyez-nous le formulaire de demande : vous recevrez aussitôt un courriel avec un bouton pour réserver votre visite privée au moment qui vous convient."],
  ),
  qa(
    "apply",
    ["How do I apply?", "Click “Apply now” on the website and fill in the short form; the leasing team will contact you with the next steps."],
    ["Comment faire une demande?", "Cliquez sur « Postuler » sur le site et remplissez le court formulaire; l'équipe de location vous contactera pour la suite."],
  ),
  qa(
    "new",
    ["Is the building new?", "Yes, Elora is a new building (2025), designed to be highly energy-efficient and quiet."],
    ["L'immeuble est-il neuf?", "Oui, Elora est un immeuble neuf (2025), conçu pour être très éconergétique et tranquille."],
  ),
];

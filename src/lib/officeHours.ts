import { cacheLife } from "next/cache";

// Same shape as Google Places' regularOpeningHours.periods (day: 0 = Sunday).
export type HoursPoint = { day: number; hour: number; minute: number };
export type HoursPeriod = { open: HoursPoint; close?: HoursPoint };
export type OfficeHours = { periods: HoursPeriod[]; mapsUrl: string; fromGoogle: boolean };

// Used until the Google Business Profile is connected: Monday to Friday, 8 am to 5 pm.
const SITE_PERIODS: HoursPeriod[] = [1, 2, 3, 4, 5].map((day) => ({
  open: { day, hour: 8, minute: 0 },
  close: { day, hour: 17, minute: 0 },
}));

const MAPS_SEARCH_URL =
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Elora, 2855 chemin Bates, Montréal, QC H3S 0A6");

type GooglePoint = { day?: number; hour?: number; minute?: number };
const point = (p: GooglePoint): HoursPoint => ({ day: p.day ?? 0, hour: p.hour ?? 0, minute: p.minute ?? 0 });

// Office hours from the Google Business Profile (Places API), refreshed hourly.
// Needs GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID; otherwise falls back to SITE_PERIODS.
export async function getOfficeHours(): Promise<OfficeHours> {
  "use cache";
  cacheLife("hours");

  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (key && placeId) {
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "regularOpeningHours.periods,googleMapsUri" },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          regularOpeningHours?: { periods?: { open: GooglePoint; close?: GooglePoint }[] };
          googleMapsUri?: string;
        };
        const periods = data.regularOpeningHours?.periods;
        if (periods?.length) {
          return {
            periods: periods.map((p) => ({ open: point(p.open), close: p.close && point(p.close) })),
            mapsUrl: data.googleMapsUri ?? MAPS_SEARCH_URL,
            fromGoogle: true,
          };
        }
      } else {
        console.warn(`[hours] Google Places returned ${res.status}; using the site's hours.`);
      }
    } catch (err) {
      console.warn("[hours] Could not reach Google Places; using the site's hours.", err);
    }
  }
  return { periods: SITE_PERIODS, mapsUrl: MAPS_SEARCH_URL, fromGoogle: false };
}

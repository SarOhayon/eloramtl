# Elora MTL

Rental website for Elora, 2855 chemin Bates, Montréal. Next.js (App Router), Tailwind CSS, Leaflet.

French is the default language (`/fr`); English lives at `/en`. All copy is in `src/i18n/dictionaries.ts`.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Where things live

| What | File |
| --- | --- |
| Text (FR and EN) | `src/i18n/dictionaries.ts` |
| Suites, prices, 3D tour links, floor outlines, phone numbers | `src/data/building.ts` |
| Map points | `src/data/places.ts` |
| Photos and captions | `src/data/photos.ts`, `public/photos/` |
| Logo (official, from eloramtl.com) | `src/components/Wordmark.tsx` |

## Map

The neighbourhood map uses Mapbox when `NEXT_PUBLIC_MAPBOX_TOKEN` is set, and CARTO's free OpenStreetMap tiles otherwise. To connect Mapbox:

1. Create a free account at mapbox.com and copy your **Default public token** (`pk.…`).
2. Copy `.env.example` to `.env.local` and paste the token after `NEXT_PUBLIC_MAPBOX_TOKEN=`.
3. On Vercel, add the same variable under Settings > Environment Variables, then redeploy.
4. In your Mapbox account, restrict the token to your domains (eloramtl.com, your Vercel URL, localhost).

## Office hours (Google)

The contact section shows office hours with a live "Open now / Closed" badge in Montréal time. The hours come from the Google Business Profile when `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` are set (refreshed hourly, see `src/lib/officeHours.ts`); otherwise they fall back to Monday to Friday, 8 am to 5 pm.

1. In Google Cloud Console, enable **Places API (New)** and create an API key (restrict it to that API).
2. Find the Place ID of the Elora listing with Google's Place ID Finder.
3. Add both variables to `.env.local` and to Vercel > Settings > Environment Variables.

## Apply now form

The header's "Apply now" button opens a form (name, phone, email and move-in date required; comments optional). It is handled by the server action in `src/app/actions/apply.ts`, which validates the fields and composes the email for `APPLY_TO_EMAIL` (`src/data/building.ts`, currently sarah@eloramtl.com).

**Email sending is not connected yet**: applications are only logged on the server. To turn it on, call an email service (Web3Forms, Formspree or Resend) in `deliver()` in that file.

## Still placeholder

- Suite list: only suites 112 and 113 are real. Every other suite in `building.ts` is marked `sample: true`.
- Floor plates for floors 2 to 7 reuse the floor 1 layout.
- Suite plans are illustrative drawings until the rendered plans arrive.
- Map coordinates are approximate.

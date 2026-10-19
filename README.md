# Elora MTL

Rental website for Elora, 2855 chemin Bates, Montréal. Next.js (App Router), Tailwind CSS, Leaflet.

French is the default language (`/fr`); English lives at `/en`. All copy is in `src/i18n/dictionaries.ts`.

## Hosting (AWS Amplify)

`amplify.yml` holds the build settings. In the AWS console: Amplify > Create new app > GitHub > `SarOhayon/eloramtl` > branch `main` (or the default branch). Under Environment variables add `NEXT_PUBLIC_MAPBOX_TOKEN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and optionally `MAIL_TO`). The build copies them into `.env.production` so the server-side forms can read them.

Custom domain: Amplify > Hosting > Custom domains. Keep the domain and email at GreenGeeks: only add the CNAME records Amplify gives you, and leave the MX (email) records alone.

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

## Website forms (email)

Apply now, Building inquiry and Maintenance request are emailed to `INBOX_EMAIL` (`src/data/building.ts`, sarah@eloramtl.com) through the company mailbox at GreenGeeks, using SMTP (`src/lib/mail.ts`). Reply-To is set to the person who filled in the form.

Set `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER` and `SMTP_PASS` in `.env.local` and in Vercel. The values are in GreenGeeks cPanel > Email Accounts > Connect Devices. Without them, forms work locally (emails are printed in the terminal) and show an error on the live site.

## Maintenance requests (with approval)

The "Maintenance request" tab is a step-by-step form: room → item → problem → photo → contact details. Then:

1. The resident sees "Thank you! We will have someone over shortly."
2. The approver (`APPROVER_EMAIL`) gets an email with the details, the photo and **Approve** / **Decline** buttons.
3. Approve (after a confirmation click) emails the work order and photo to the contractor for that trade (`TRADES` in `src/data/maintenance.ts`, e.g. plumbing → plumber).

Edit rooms, items, problems, urgency, the approver and contractor emails in `src/data/maintenance.ts`.

On the live site this needs a private S3 bucket and `APPROVAL_SECRET` (see `.env.example`); locally it stores requests in a temp folder. Without them, the approver still gets the request and photo, just without the buttons.

## Still placeholder

- Suite list: only suites 112 and 113 are real. Every other suite in `building.ts` is marked `sample: true`.
- Floor plates for floors 2 to 7 reuse the floor 1 layout.
- Suite plans are illustrative drawings until the rendered plans arrive.
- Map coordinates are approximate.

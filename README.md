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

## Maintenance requests (WhatsApp, with approval)

Residents text **"maintenance"** (or "entretien") to the WhatsApp number. Other messages are ignored by the bot, so leasing chats stay with you. The bot (`src/lib/whatsappBot.ts`) asks, with tap buttons and lists: language → suite number → name → room → item → problem → photo or video → may we enter if you're not home → best time, then replies "Thank you! We will have someone over shortly."

The approver then gets a summary on WhatsApp (photo + details + "Do you approve?" with **✅ Yes / ❌ No**), and an email copy with the same choices as links:

- **Yes:** the work order and photo/video are emailed to the contractor for that trade (`TRADES`), the resident is told it's approved, and the approver gets a confirmation.
- **No:** nothing is sent; the request is marked declined.

Edit rooms, items, problems, urgency, the approver and contractor emails in `src/data/maintenance.ts`. The approver's WhatsApp number is `APPROVER_WHATSAPP` (digits with country code, e.g. 15145551234).

WhatsApp only lets a business message someone freely within 24 hours of their last message. For approvals outside that window, create a template in Meta (media header, one body variable, two quick-reply buttons "Yes" / "No") and set `WHATSAPP_APPROVAL_TEMPLATE` (and `WHATSAPP_APPROVAL_TEMPLATE_LANG`).

### Setup
- **Meta WhatsApp Business Platform:** create an app at developers.facebook.com and add WhatsApp. For testing, use Meta's free test number and add your phone as a recipient; a number used for the bot can't stay on the regular WhatsApp app. Set the webhook URL to `https://<your site>/api/whatsapp`, the verify token to `WHATSAPP_VERIFY_TOKEN`, and subscribe to `messages`. Add `WHATSAPP_TOKEN` (a permanent system-user token), `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_APP_SECRET`.
- **Storage:** a private S3 bucket (`ELORA_S3_*`) for conversations, photos and pending requests, plus `APPROVAL_SECRET` for the approval links. Locally a temp folder is used.
- The site's WhatsApp buttons use `PHONE_WHATSAPP` in `src/data/building.ts`; it should be the same number as the bot.

## Admin

`/admin` (reached from the small "·" after the copyright in the footer) lets you manage, without a redeploy:
a home screen with big buttons leads to:

- **Inquiries**: every inquiry, application and booked showing, with a follow-up status and a note, and a "Suggest the best suites" button: Claude reads the person's message, budget and dates and picks up to 3 available suites with a reason each (`src/app/actions/suggest.ts`, needs `ANTHROPIC_API_KEY`).
- **Showings**: online booking on/off, weekly showing hours, slot length, days off, upcoming showings (cancel frees the time). Visitors book from the inquiry pop-up and get a confirmation email with a calendar invite that reminds them 30 minutes before.
- **Apartments**: status, price, available date and plan per suite, plan per floor, and an "All apartments" table for quick edits.
- **Promotion**: wording FR/EN, photo, start/end dates, apartments it applies to, side tab and brown section switches, live preview; shown to visitors as a once-per-visitor pop-up.
- **Special-day banners**: thin messages at the top of the site, each with its own on/off and first/last day, scheduled up to a year ahead; one click adds closure banners for the Québec holidays of the next 12 months (`src/lib/holidays.ts`).
- **Photos** (drag to reorder), **Starting prices**, **Website text**, and **Visitors** (daily counts of visits, promotion views, WhatsApp/call clicks, forms and bookings).

Changes save automatically.

Content is saved to `content/site.json` in the S3 bucket, uploads under `media/`, inquiries in `leads/index.json` and visitor counts in `stats/<month>.json`; the site reads them on every visit. Sign-in uses `ADMIN_PASSWORD` (temporary single password; "admin" when testing locally). Code: `src/app/admin`, `src/components/admin`, `src/app/actions/admin.ts`, `src/data/content.ts`.

## Still placeholder

- Suite list: only suites 112 and 113 are real. Every other suite in `building.ts` is marked `sample: true`.
- Floors 6 and 7 reuse the floor 2 layout until their plans are supplied.
- Suite plans are illustrative drawings until the rendered plans arrive.
- Map coordinates are approximate.

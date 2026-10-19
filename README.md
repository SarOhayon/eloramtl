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

## Still placeholder

- Suite list: only suites 112 and 113 are real. Every other suite in `building.ts` is marked `sample: true`.
- Floor plates for floors 2 to 7 reuse the floor 1 layout.
- Suite plans are illustrative drawings until the rendered plans arrive.
- Map coordinates are approximate.

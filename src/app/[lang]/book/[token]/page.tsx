import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShowingBooking } from "@/components/ShowingBooking";
import { Wordmark } from "@/components/Wordmark";
import { PHONE_MAIN, PHONE_MAIN_DISPLAY } from "@/data/building";
import { getDictionary, hasLocale } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import { findByToken, readLeads, type Lead } from "@/lib/leads";
import { freeSlots, montrealToUtc, showingWords } from "@/lib/showingSlots";

// The personal booking page behind the "Book my showing" button in the inquiry auto-reply.
// It is the only place showings can be booked; the token in the address says who is booking.

export const metadata: Metadata = { title: "Elora MTL", robots: { index: false, follow: false } };

const upcoming = (l: Lead) => Boolean(l.showing && montrealToUtc(l.showing.date, l.showing.time).getTime() > Date.now());

export default function BookPage({ params }: PageProps<"/[lang]/book/[token]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-cream-deep" />}>
      <Booking params={params} />
    </Suspense>
  );
}

async function Booking({ params }: { params: PageProps<"/[lang]/book/[token]">["params"] }) {
  const { lang, token } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const s = t.showing;
  const [content, lead] = await Promise.all([getContent(), findByToken(token)]);
  const valid = lead && lead.status !== "closed";

  let message: string | null = null;
  let slots: Awaited<ReturnType<typeof freeSlots>> = [];
  if (!valid) message = s.badLink;
  else if (!content.showings.enabled) message = s.closed;
  else {
    const booked = (await readLeads()).filter((l) => l.showing && l.status !== "closed" && l.id !== lead.id).map((l) => l.showing!);
    slots = freeSlots(content.showings, booked);
    if (!slots.length) message = s.noTimes;
  }
  const current = valid && upcoming(lead) ? showingWords(lead.showing!.date, lead.showing!.time, lang) : null;

  return (
    <main className="min-h-svh bg-cream-deep px-4 py-10 text-brown sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link href={`/${lang}`} aria-label="Elora" className="inline-block">
          <Wordmark className="h-12 w-auto" />
        </Link>
        <div className="mt-8 rounded-sm border-t-2 border-gold bg-cream p-6 shadow-xl shadow-brown/5 sm:p-8">
          <h1 className="font-display text-4xl text-ink">{s.title}</h1>
          {valid && <p className="mt-3 text-brown/85">{s.hello(lead.name.split(" ")[0])}</p>}
          {current && (
            <p className="mt-2 rounded-sm bg-gold-light/50 px-4 py-2.5 text-sm text-brown">{s.current(`${lang === "fr" ? "le" : "on"} ${current.date} ${lang === "fr" ? "à" : "at"} ${current.time}`)}</p>
          )}
          {message ? (
            <p className="mt-4 text-brown/85">{message}</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-brown-soft">{s.lead}</p>
              <ShowingBooking locale={lang} slots={slots} token={token} />
            </>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-brown-soft">
          <a href={`tel:+${PHONE_MAIN}`} className="underline underline-offset-4">
            {PHONE_MAIN_DISPLAY}
          </a>
        </p>
      </div>
    </main>
  );
}

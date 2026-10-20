import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Explorer } from "@/components/Explorer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { HeroSlider } from "@/components/HeroSlider";
import { NeighbourhoodMap } from "@/components/NeighbourhoodMap";
import { OfficeHoursCard } from "@/components/OfficeHoursCard";
import { OfferBand } from "@/components/OfferBand";
import { ContactForms } from "@/components/ContactForms";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { Wordmark } from "@/components/Wordmark";
import { CheckIcon, InstagramIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import {
  ADDRESS,
  INSTAGRAM_URL,
  PHONE_MAIN,
  PHONE_MAIN_DISPLAY,
  PHONE_WHATSAPP_DISPLAY,
  formatPrice,
  whatsappLink,
} from "@/data/building";
import { applyText, isUploaded } from "@/data/content";
import type { Photo } from "@/data/photos";
import { getDictionary, hasLocale, type Locale } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import { getOfficeHours } from "@/lib/officeHours";

function SectionHeading({ eyebrow, title, lead, light = false }: { eyebrow: string; title: string; lead?: string; light?: boolean }) {
  return (
    <div className="mb-10 max-w-2xl lg:mb-14">
      <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold"><span className="h-px w-8 bg-gold" />{eyebrow}</p>
      <h2 className={`mt-3 font-display text-4xl leading-[1.1] sm:text-5xl ${light ? "text-cream" : "text-ink"}`}>{title}</h2>
      {lead && <p className={`mt-4 text-lg ${light ? "text-cream/80" : "text-brown/80"}`}>{lead}</p>}
    </div>
  );
}

function PhotoCard({ photo, locale, title, text, className = "" }: { photo: Photo; locale: Locale; title: string; text: string; className?: string }) {
  return (
    <figure className={`group relative overflow-hidden rounded-lg bg-brown-deep ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt[locale]}
        fill
        unoptimized={isUploaded(photo.src)}
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover transition duration-700 group-hover:scale-[1.04]"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 pt-16 text-cream">
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-1 max-w-md text-sm text-cream/85">{text}</p>
      </figcaption>
    </figure>
  );
}

function IconCard({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="flex flex-col justify-between rounded-lg bg-cream-deep p-6 ring-1 ring-brown/10">
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <div className="mt-8">
        <p className="font-display text-2xl text-brown">{title}</p>
        <p className="mt-1 text-sm text-brown/80">{text}</p>
      </div>
    </div>
  );
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <Header locale={lang} />
      {/* Content comes from the admin, read on each visit. */}
      <Suspense fallback={<div className="min-h-svh bg-cream" />}>
        <Body locale={lang} />
      </Suspense>
    </>
  );
}

async function Body({ locale }: { locale: Locale }) {
  const [content, hours] = await Promise.all([getContent(), getOfficeHours()]);
  const t = applyText(getDictionary(locale), content.text, locale);
  const a = t.amenities.items;
  const amen = content.photos.amenities;
  // The first fact is the studio's starting price, kept in sync with the admin prices.
  const facts = t.hero.facts.map((f, i) => (i === 0 ? { ...f, value: formatPrice(content.prices.studio, locale) } : f));

  return (
    <>
      <main>
        {/* Hero: full-screen photo slider */}
        <div className="pt-16 lg:pt-20">
          <HeroSlider locale={locale} slides={content.photos.hero} text={{ eyebrow: t.hero.eyebrow, title: t.hero.title, lead: t.hero.lead, primary: t.hero.primary, secondary: t.hero.secondary }} />
        </div>
        <section className="bg-cream py-8 lg:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-brown/10 ring-1 ring-brown/10 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="bg-cream px-5 py-4">
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="font-display text-4xl text-gold">{f.value}</dd>
                  <dd className="text-sm text-brown/75">{f.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {content.offer.enabled && <OfferBand locale={locale} o={t.offerBand} />}

        {/* Suites explorer */}
        <section id="suites" className="bg-cream-deep py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.explorer.eyebrow} title={t.explorer.title} lead={t.explorer.lead} />
            <Explorer locale={locale} prices={content.prices} suites={content.suites} floorPlans={content.floorPlans} />
          </div>
        </section>

        {/* Amenities */}
        <section id="amenities" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.amenities.eyebrow} title={t.amenities.title} />
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brown-soft">{t.amenities.building}</h3>
            <div className="grid auto-rows-[260px] gap-4 sm:grid-cols-2 lg:auto-rows-[300px] lg:grid-cols-4">
              <PhotoCard photo={amen.rooftop} locale={locale} title={a.rooftop.title} text={a.rooftop.text} className="sm:col-span-2 lg:row-span-2" />
              <PhotoCard photo={amen.gym} locale={locale} title={a.gym.title} text={a.gym.text} className="lg:col-span-2" />
              <PhotoCard photo={amen.terrace} locale={locale} title={a.terrace.title} text={a.terrace.text} />
              <PhotoCard photo={amen.lounge} locale={locale} title={a.lounge.title} text={a.lounge.text} />
              <PhotoCard photo={amen.parking} locale={locale} title={a.parking.title} text={a.parking.text} className="lg:col-span-2" />
              <IconCard icon="📦" title={a.storage.title} text={a.storage.text} />
              <IconCard icon="🐾" title={a.pets.title} text={a.pets.text} />
            </div>
            <p className="mt-4 text-sm text-brown/75">
              <span className="font-medium text-brown">{a.more.title}</span> {a.more.text}
            </p>

            <div className="mt-16 grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image src={amen.living.src} alt={amen.living.alt[locale]} fill unoptimized={isUploaded(amen.living.src)} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-brown-soft">{t.amenities.suites}</h3>
                <ul className="mt-6 divide-y divide-brown/10 border-y border-brown/10">
                  {t.amenities.suiteItems.map((item) => (
                    <li key={item} className="flex items-center gap-4 py-4 text-lg text-brown">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-action-light/40 text-action-deep">
                        <CheckIcon className="size-4" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="bg-cream-deep py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} />
            <div className="-mt-4 space-y-5 text-lg text-brown/85">
              {t.about.text.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
            <a href="#visit" className="mt-10 inline-flex items-center justify-center rounded-sm bg-action px-7 py-3.5 font-medium text-white transition hover:bg-action-deep">
              {t.hero.secondary}
            </a>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="bg-cream-deep py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.title} />
            <Gallery locale={locale} photos={content.photos.gallery} />
          </div>
        </section>

        {/* Neighbourhood */}
        <section id="neighbourhood" className="py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-14 lg:px-8">
            <div>
              <SectionHeading eyebrow={t.neighbourhood.eyebrow} title={t.neighbourhood.title} lead={t.neighbourhood.intro} />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-gold/40 pt-8">
                {t.commute.items.map((c) => (
                  <div key={c.label}>
                    <dt className="sr-only">{c.label}</dt>
                    <dd className="font-display text-4xl text-gold">{c.value}</dd>
                    <dd className="mt-1 text-sm text-brown/75">{c.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <NeighbourhoodMap locale={locale} />
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="bg-cream-deep py-20 text-brown lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <SectionHeading eyebrow={t.contact.eyebrow} title={t.contact.title} lead={t.contact.lead} />
              <p className="flex items-center gap-2 text-brown/80">
                <PinIcon className="size-5" /> {ADDRESS}
              </p>
              <div className="mt-6">
                <OfficeHoursCard hours={hours} locale={locale} />
              </div>
              <div className="mt-8 flex flex-col gap-4">
                <a
                  href={whatsappLink(t.contact.whatsappText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 rounded-lg bg-cream p-6 text-brown ring-1 ring-brown/10 transition hover:ring-action/40"
                >
                  <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                    <WhatsAppIcon className="size-7" />
                  </span>
                  <span>
                    <span className="block text-sm uppercase tracking-[0.2em] text-action">{t.contact.whatsapp}</span>
                    <span className="block font-display text-3xl">{PHONE_WHATSAPP_DISPLAY}</span>
                  </span>
                </a>
                <a
                  href={`tel:+${PHONE_MAIN}`}
                  className="flex items-center gap-5 rounded-lg bg-cream p-6 ring-1 ring-brown/10 transition hover:ring-action/40"
                >
                  <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-action text-white">
                    <PhoneIcon className="size-6" />
                  </span>
                  <span>
                    <span className="block text-sm uppercase tracking-[0.2em] text-action">{t.contact.call}</span>
                    <span className="block font-display text-3xl">{PHONE_MAIN_DISPLAY}</span>
                  </span>
                </a>
              </div>
            </div>
            <div className="lg:pt-6">
              <ContactForms locale={locale} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand bg-cream-deep py-10 text-brown-soft">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <Wordmark className="h-9 w-auto text-brown" />
          <div className="flex flex-col gap-2">
            <p>{ADDRESS}</p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brown transition hover:text-gold">
              <InstagramIcon className="size-4" />
              @eloramtl
            </a>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <PrivacyDialog locale={locale} />
            <p>
              © 2026 Elora MTL. {t.footer.rights}{" "}
              {/* Discreet entrance to the admin. */}
              <Link href="/admin" prefetch={false} rel="nofollow" className="text-brown-soft/40 transition hover:text-brown-soft">
                ·
              </Link>
            </p>
          </div>
        </div>
      </footer>

      {/* Limited-time offer tab, as on eloramtl.com */}
      {content.offer.enabled && (
      <a
        href="#offer"
        className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 rotate-180 border border-l-0 border-gold/40 bg-cream px-3 py-8 text-sm uppercase tracking-[0.16em] text-brown shadow-lg transition [writing-mode:vertical-rl] hover:border-gold hover:bg-cream-deep hover:text-ink md:block"
      >
        {t.offer}
      </a>
      )}

      {/* Floating WhatsApp on small screens */}
      <a
        href={whatsappLink(t.contact.whatsappText)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.contact.whatsapp}
        className="fixed bottom-4 right-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/20 sm:hidden"
      >
        <WhatsAppIcon className="size-7" />
      </a>
    </>
  );
}

import Image from "next/image";
import { notFound } from "next/navigation";
import { Audiences } from "@/components/Audiences";
import { Explorer } from "@/components/Explorer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { NeighbourhoodMap } from "@/components/NeighbourhoodMap";
import { ContactForms } from "@/components/ContactForms";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { Wordmark } from "@/components/Wordmark";
import { CheckIcon, ChevronIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import {
  ADDRESS,
  PHONE_MAIN,
  PHONE_MAIN_DISPLAY,
  PHONE_WHATSAPP_DISPLAY,
  TOURS_3D,
  whatsappLink,
} from "@/data/building";
import { PHOTOS, type Photo } from "@/data/photos";
import { getDictionary, hasLocale, type Locale } from "@/i18n/dictionaries";

function SectionHeading({ eyebrow, title, lead, light = false }: { eyebrow: string; title: string; lead?: string; light?: boolean }) {
  return (
    <div className="mb-10 max-w-2xl lg:mb-14">
      <p className={`text-xs font-medium uppercase tracking-[0.25em] ${light ? "text-green-soft" : "text-green"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-4xl leading-[1.05] sm:text-5xl ${light ? "text-cream" : "text-brown"}`}>{title}</h2>
      {lead && <p className={`mt-4 text-lg ${light ? "text-cream/80" : "text-brown/80"}`}>{lead}</p>}
    </div>
  );
}

function PhotoCard({ photo, locale, title, text, className = "" }: { photo: Photo; locale: Locale; title: string; text: string; className?: string }) {
  return (
    <figure className={`group relative overflow-hidden rounded-3xl bg-brown-deep ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt[locale]}
        fill
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover transition duration-700 group-hover:scale-[1.04]"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brown-deep/85 via-brown-deep/40 to-transparent p-6 pt-16 text-cream">
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-1 max-w-md text-sm text-cream/85">{text}</p>
      </figcaption>
    </figure>
  );
}

function IconCard({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-cream-deep p-6 ring-1 ring-brown/10">
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
  const locale = lang;
  const t = getDictionary(locale);
  const a = t.amenities.items;

  return (
    <>
      <Header locale={locale} />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-brown-deep text-cream">
          <Image src={PHOTOS.facade.src} alt={PHOTOS.facade.alt[locale]} fill priority sizes="100vw" className="object-cover object-[50%_40%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-brown-deep/60 via-brown-deep/30 to-brown-deep/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-brown-deep/80 via-brown-deep/35 to-transparent" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-32 sm:px-6 lg:px-8 lg:pb-16">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-green-soft">{t.hero.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">{t.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg text-cream/85 sm:text-xl">{t.hero.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#suites" className="inline-flex items-center justify-center rounded-full bg-cream px-7 py-3.5 font-medium text-brown transition hover:bg-white">
                {t.hero.primary}
              </a>
              <a
                href="#visit"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-medium text-cream ring-1 ring-cream/50 transition hover:bg-cream/10"
              >
                {t.hero.secondary}
              </a>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-cream/15 sm:grid-cols-4">
              {t.hero.facts.map((f) => (
                <div key={f.label} className="bg-brown-deep/50 px-5 py-4 backdrop-blur-sm">
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="font-display text-3xl">{f.value}</dd>
                  <dd className="text-sm text-cream/75">{f.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Who it's for */}
        <section id="for-you" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.audiences.eyebrow} title={t.audiences.title} lead={t.audiences.lead} />
            <Audiences locale={locale} />
          </div>
        </section>

        {/* Suites explorer */}
        <section id="suites" className="bg-cream-deep py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.explorer.eyebrow} title={t.explorer.title} lead={t.explorer.lead} />
            <Explorer locale={locale} />
          </div>
        </section>

        {/* Amenities */}
        <section id="amenities" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.amenities.eyebrow} title={t.amenities.title} />
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brown-soft">{t.amenities.building}</h3>
            <div className="grid auto-rows-[260px] gap-4 sm:grid-cols-2 lg:auto-rows-[300px] lg:grid-cols-4">
              <PhotoCard photo={PHOTOS.rooftop} locale={locale} title={a.rooftop.title} text={a.rooftop.text} className="sm:col-span-2 lg:row-span-2" />
              <PhotoCard photo={PHOTOS.gym} locale={locale} title={a.gym.title} text={a.gym.text} className="lg:col-span-2" />
              <PhotoCard photo={PHOTOS.terrace} locale={locale} title={a.terrace.title} text={a.terrace.text} />
              <PhotoCard photo={PHOTOS.workBooth} locale={locale} title={a.lounge.title} text={a.lounge.text} />
              <PhotoCard photo={PHOTOS.ev} locale={locale} title={a.parking.title} text={a.parking.text} className="lg:col-span-2" />
              <IconCard icon="📦" title={a.storage.title} text={a.storage.text} />
              <IconCard icon="🐾" title={a.pets.title} text={a.pets.text} />
            </div>
            <p className="mt-4 text-sm text-brown/75">
              <span className="font-medium text-brown">{a.more.title}</span> {a.more.text}
            </p>

            <div className="mt-16 grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <Image src={PHOTOS.living.src} alt={PHOTOS.living.alt[locale]} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-brown-soft">{t.amenities.suites}</h3>
                <ul className="mt-6 divide-y divide-brown/10 border-y border-brown/10">
                  {t.amenities.suiteItems.map((item) => (
                    <li key={item} className="flex items-center gap-4 py-4 text-lg text-brown">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-green-soft/40 text-green-deep">
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
        <section id="about" className="relative overflow-hidden bg-brown-deep py-20 text-cream lg:py-28">
          <Image src={PHOTOS.terrace.src} alt="" fill sizes="100vw" className="object-cover opacity-25" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} light />
            <div className="-mt-4 space-y-5 text-lg text-cream/85">
              {t.about.text.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
            <a href="#visit" className="mt-10 inline-flex items-center justify-center rounded-full bg-cream px-7 py-3.5 font-medium text-brown transition hover:bg-white">
              {t.hero.secondary}
            </a>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="bg-cream-deep py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.title} />
            <Gallery locale={locale} />
            <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-brown p-6 text-cream sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="font-display text-3xl">{t.tours.title}</p>
                <p className="mt-1 text-cream/80">{t.tours.text}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {TOURS_3D.map((href, i) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-cream px-5 py-3 text-sm font-medium text-brown transition hover:bg-white"
                  >
                    {t.tours.model(i + 1)}
                    <ChevronIcon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Neighbourhood */}
        <section id="neighbourhood" className="py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.5fr] lg:gap-14 lg:px-8">
            <div>
              <SectionHeading eyebrow={t.neighbourhood.eyebrow} title={t.neighbourhood.title} />
              <div className="-mt-4 space-y-4 text-lg text-brown/85">
                {t.neighbourhood.text.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <h3 className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-brown-soft">{t.neighbourhood.poiTitle}</h3>
              <ul className="mt-3 divide-y divide-brown/10 border-y border-brown/10">
                {t.neighbourhood.pois.map((poi) => (
                  <li key={poi} className="flex gap-3 py-3 text-brown">
                    <PinIcon className="mt-0.5 size-5 shrink-0 text-green" />
                    {poi}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-brown/80">{t.neighbourhood.closing}</p>
              <div className="relative mt-8 aspect-[3/2] overflow-hidden rounded-3xl">
                <Image src={PHOTOS.aerial.src} alt={PHOTOS.aerial.alt[locale]} fill sizes="(min-width: 1024px) 35vw, 100vw" className="object-cover" />
              </div>
            </div>
            <NeighbourhoodMap locale={locale} />
          </div>
          <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brown-soft">{t.commute.title}</h3>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {t.commute.items.map((c) => (
                <div key={c.label} className="rounded-2xl bg-cream-deep px-5 py-4 ring-1 ring-brown/10">
                  <dt className="sr-only">{c.label}</dt>
                  <dd className="font-display text-3xl text-brown">{c.value}</dd>
                  <dd className="mt-1 text-sm text-brown/75">{c.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="relative overflow-hidden bg-green-deep py-20 text-cream lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <SectionHeading eyebrow={t.contact.eyebrow} title={t.contact.title} lead={t.contact.lead} light />
              <p className="flex items-center gap-2 text-cream/80">
                <PinIcon className="size-5" /> {ADDRESS}
              </p>
              <div className="mt-6">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-green-soft">{t.contact.hoursTitle}</p>
                <ul className="mt-2 space-y-1 text-cream/75">
                  {t.contact.hours.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 flex flex-col gap-4">
                <a
                  href={whatsappLink(t.contact.whatsappText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 rounded-3xl bg-cream p-6 text-brown transition hover:bg-white"
                >
                  <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                    <WhatsAppIcon className="size-7" />
                  </span>
                  <span>
                    <span className="block text-sm uppercase tracking-[0.2em] text-green">{t.contact.whatsapp}</span>
                    <span className="block font-display text-3xl">{PHONE_WHATSAPP_DISPLAY}</span>
                  </span>
                </a>
                <a
                  href={`tel:+${PHONE_MAIN}`}
                  className="flex items-center gap-5 rounded-3xl p-6 ring-1 ring-cream/30 transition hover:bg-cream/5"
                >
                  <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-cream/10">
                    <PhoneIcon className="size-6" />
                  </span>
                  <span>
                    <span className="block text-sm uppercase tracking-[0.2em] text-green-soft">{t.contact.call}</span>
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

      <footer className="bg-brown-deep py-10 text-cream/70">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <Wordmark className="h-5 w-auto text-cream" />
          <p>{ADDRESS}</p>
          <div className="flex flex-col gap-2 sm:items-end">
            <PrivacyDialog locale={locale} />
            <p>
              © 2026 Elora MTL. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>

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

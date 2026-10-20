"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { INSTAGRAM_URL, whatsappLink } from "@/data/building";
import { ApplyDialog } from "./ApplyDialog";
import { InstagramIcon, WhatsAppIcon } from "./icons";
import { Wordmark } from "./Wordmark";

export function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#suites", label: t.nav.suites },
    { href: "#amenities", label: t.nav.amenities },
    { href: "#gallery", label: t.nav.gallery },
    { href: "#neighbourhood", label: t.nav.neighbourhood },
    { href: "#contact", label: t.nav.contact },
  ];
  const other = locale === "fr" ? "en" : "fr";
  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid ? "bg-cream/95 text-brown shadow-[0_1px_0_rgba(80,61,50,0.12)] backdrop-blur" : "bg-cream text-brown"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href={`/${locale}`} className="shrink-0" aria-label="Elora">
          <Wordmark className="h-6 w-auto lg:h-7" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm uppercase tracking-[0.06em] lg:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="opacity-90 transition hover:opacity-100 hover:underline hover:underline-offset-8">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/${other}`}
            hrefLang={other}
            aria-label={t.nav.switchLabel}
            className="rounded-sm px-3 py-2 text-sm font-medium tracking-wider transition hover:bg-black/5"
          >
            {t.nav.switchTo}
          </Link>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.nav.instagram}
            className="hidden size-10 items-center justify-center rounded-sm transition hover:text-gold xl:inline-flex"
          >
            <InstagramIcon className="size-5" />
          </a>
          <a
            href={whatsappLink(t.contact.whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-sm px-4 py-3 text-sm uppercase tracking-[0.06em] ring-1 ring-brown/25 transition hover:ring-gold md:inline-flex"
          >
            <WhatsAppIcon className="size-4 text-whatsapp" />
            {t.nav.whatsapp}
          </a>
          <ApplyDialog
            locale={locale}
            className="inline-flex items-center rounded-sm bg-action px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-white transition hover:bg-action-deep sm:px-6 sm:py-3 sm:text-sm"
          />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-brown/10 bg-cream px-4 pb-6 pt-2 lg:hidden" aria-label="Mobile">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-brown/10 py-4 font-display text-2xl text-brown"
            >
              {l.label}
            </a>
          ))}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-brown"
          >
            <InstagramIcon className="size-5 text-gold" />
            @eloramtl
          </a>
        </nav>
      )}
    </header>
  );
}

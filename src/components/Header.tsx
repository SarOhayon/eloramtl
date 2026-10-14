"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { whatsappLink } from "@/data/building";
import { Wordmark } from "./Wordmark";
import { WhatsAppIcon } from "./icons";

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
        solid ? "bg-cream/95 text-brown shadow-[0_1px_0_rgba(74,54,40,0.12)] backdrop-blur" : "bg-transparent text-cream"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href={`/${locale}`} className="shrink-0" aria-label="Elora">
          <Wordmark className="h-6 w-auto lg:h-7" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm tracking-wide lg:flex" aria-label="Main">
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
            className="rounded-full px-3 py-2 text-sm font-medium tracking-wider transition hover:bg-black/5"
          >
            {t.nav.switchTo}
          </Link>
          <a
            href={whatsappLink(t.contact.whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-brown px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-brown-deep sm:inline-flex"
          >
            <WhatsAppIcon className="size-4" />
            {t.nav.cta}
          </a>
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
        </nav>
      )}
    </header>
  );
}

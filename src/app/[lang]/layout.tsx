import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getDictionary, hasLocale, locales } from "@/i18n/dictionaries";
import "./globals.css";

// Same typeface as eloramtl.com, used for headings and body.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"] });

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL("https://www.eloramtl.com"),
    title: t.meta.title,
    description: t.meta.description,
    icons: { icon: "/icon.svg" },
    alternates: { languages: { fr: "/fr", en: "/en" } },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      images: ["/photos/elora-6.jpg"],
      locale: lang === "fr" ? "fr_CA" : "en_CA",
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang === "fr" ? "fr-CA" : "en-CA"} className={`${jakarta.variable} antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

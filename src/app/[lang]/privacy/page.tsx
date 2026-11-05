import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { getDictionary, hasLocale } from "@/i18n/dictionaries";

// Standalone privacy policy (the footer also opens it as a dialog). Its address is what
// services like Meta ask for as the "Privacy Policy URL".

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${getDictionary(lang).privacy.link} · Elora MTL` };
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const p = getDictionary(lang).privacy;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-brown sm:px-6">
      <Link href={`/${lang}`} aria-label="Elora">
        <Wordmark className="h-12 w-auto" />
      </Link>
      <h1 className="mt-12 font-display text-5xl text-ink">{p.link}</h1>
      <p className="mt-2 text-sm text-brown-soft">{p.updated}</p>
      <div className="mt-8 space-y-6 leading-relaxed">
        <p>{p.intro}</p>
        {p.sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl text-ink">{s.title}</h2>
            <p className="mt-2 text-brown/85">{s.text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

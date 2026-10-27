"use client";

import { useState } from "react";
import { ADDRESS, PHONE_MAIN_DISPLAY } from "@/data/building";
import { EMAIL_BLANKS, fillHtmlTemplate, fillTemplate, todayInMontreal, type EmailTemplate } from "@/data/content";
import { EMAIL_LOGO_PNG_BASE64 } from "@/data/emailLogo";
import { CalendarIcon } from "./AdminIcons";
import { field, softBtn } from "./ui";

// Edits one automatic email: subject, designed (HTML) version and plain text, in French and English,
// with a live preview using a sample person.
export function EmailEditor({
  template,
  onChange,
  original,
  blanks,
  attachment,
}: {
  template: EmailTemplate;
  onChange: (t: EmailTemplate) => void;
  original: EmailTemplate;
  blanks: string[]; // which {words} this email can use
  attachment?: string; // e.g. the calendar invite's file name
}) {
  const [lang, setLang] = useState<"fr" | "en">("en");
  const [version, setVersion] = useState<"html" | "body">("html");
  const edit = (part: keyof EmailTemplate, value: string) => onChange({ ...template, [part]: { ...template[part], [lang]: value } });

  // A sample person for the preview: a showing next Thursday at 10:30, with a promotion running.
  const sample = new Date(`${todayInMontreal()}T12:00:00Z`);
  sample.setUTCDate(sample.getUTCDate() + ((4 - sample.getUTCDay() + 7) % 7 || 7));
  const intl = lang === "fr" ? "fr-CA" : "en-CA";
  const values = {
    name: "Maya Tremblay",
    date: new Intl.DateTimeFormat(intl, { dateStyle: "full", timeZone: "UTC" }).format(sample),
    time: new Intl.DateTimeFormat(intl, { timeStyle: "short", timeZone: "UTC" }).format(new Date("2000-01-01T10:30:00Z")),
    promotion: lang === "fr" ? "Un mois GRATUIT sur certains logements" : "One month FREE on select units",
    address: ADDRESS,
    phone: PHONE_MAIN_DISPLAY,
    website: `https://www.eloramtl.com/${lang}`,
    logo: `data:image/png;base64,${EMAIL_LOGO_PNG_BASE64}`,
  };
  const toggle = (on: boolean) => `px-4 py-2 text-sm ${on ? "bg-action text-white" : "bg-white"}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex overflow-hidden rounded-md ring-1 ring-brown/20">
            {(["fr", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={toggle(lang === l)}>
                {l === "fr" ? "French" : "English"}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-md ring-1 ring-brown/20">
            {(["html", "body"] as const).map((v) => (
              <button key={v} onClick={() => setVersion(v)} className={toggle(version === v)}>
                {v === "html" ? "Designed email" : "Plain text"}
              </button>
            ))}
          </div>
        </div>
        <button className={softBtn} onClick={() => confirm("Go back to the original email, in French and English?") && onChange(original)}>
          Restore the original
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block font-medium">Subject</span>
            <input className={field} value={template.subject[lang]} onChange={(e) => edit("subject", e.target.value)} />
          </label>
          {version === "html" ? (
            <label className="block">
              <span className="mb-1 block font-medium">Designed email (HTML)</span>
              <span className="mb-2 block text-sm text-brown-soft">Paste your own email design here, or edit this one. Leave it empty to send only the plain text.</span>
              <textarea className={`${field} font-mono text-xs`} rows={16} spellCheck={false} value={template.html[lang]} onChange={(e) => edit("html", e.target.value)} />
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block font-medium">Plain-text message</span>
              <span className="mb-2 block text-sm text-brown-soft">For email apps that don’t show designed emails{template.html[lang].trim() ? "" : " (sent to everyone while the designed email is empty)"}.</span>
              <textarea className={field} rows={12} value={template.body[lang]} onChange={(e) => edit("body", e.target.value)} />
            </label>
          )}
          <div className="rounded-md bg-cream-deep p-4 text-sm">
            <p className="font-medium text-brown">These words are filled in automatically:</p>
            <ul className="mt-2 space-y-1 text-brown-soft">
              {blanks.map((b) => (
                <li key={b}>
                  <code className="rounded bg-white px-1.5 py-0.5 text-brown ring-1 ring-sand">{b}</code> {EMAIL_BLANKS[b]}
                </li>
              ))}
            </ul>
            {blanks.includes("{promotion}") && (
              <p className="mt-2 text-brown-soft">
                Text between <code className="text-brown">{"{#promotion}"}</code> and <code className="text-brown">{"{/promotion}"}</code> only shows while a promotion is running.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1 font-medium">Preview</p>
          <div className="overflow-hidden rounded-md bg-white ring-1 ring-sand">
            <div className="border-b border-sand px-5 py-3 text-sm">
              <p className="text-brown-soft">From: Elora MTL</p>
              <p className="mt-0.5 font-medium text-ink">{fillTemplate(template.subject[lang], values)}</p>
            </div>
            {version === "html" && template.html[lang].trim() ? (
              // Sandboxed: the preview can't run anything or reach the admin page.
              <iframe title="Email preview" sandbox="" srcDoc={fillHtmlTemplate(template.html[lang], values)} className="block h-[560px] w-full border-0" />
            ) : (
              <p className="whitespace-pre-line px-5 py-4 text-brown">{fillTemplate(template.body[lang], values)}</p>
            )}
            {attachment && (
              <p className="mx-5 my-4 inline-flex items-center gap-2 rounded-md bg-cream-deep px-3 py-2 text-sm text-brown">
                <CalendarIcon className="size-4" /> {attachment}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

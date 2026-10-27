import { ADDRESS, INBOX_EMAIL, PHONE_MAIN_DISPLAY } from "@/data/building";
import { button, layout } from "@/data/emailDesigns";
import { fillHtmlTemplate, fillTemplate, scheduleState, siteUrl, type EmailTemplate, type SiteContent } from "@/data/content";
import { getContent } from "./content";
import { sendMail, type Attachment } from "./mail";

// Sending the automatic emails (confirmation, auto-reply, follow-up) and the team's notices.

type Lang = "fr" | "en";

// The words filled into an email: the person's details plus the building's.
export function emailBlanks(content: SiteContent, lang: Lang, person: { name: string; date?: string; time?: string }) {
  const p = content.promo;
  // The promotion as one line, e.g. "One month FREE on select units".
  const sub = p.sub[lang].trim();
  const promotion = scheduleState(p) === "live" ? [p.kicker[lang].trim(), p.big[lang].trim().toUpperCase(), sub.charAt(0).toLowerCase() + sub.slice(1)].filter(Boolean).join(" ") : "";
  return { name: person.name, date: person.date ?? "", time: person.time ?? "", promotion, address: ADDRESS, phone: PHONE_MAIN_DISPLAY, website: siteUrl(lang) };
}

// Sends one of the admin-editable emails to a visitor, in their language.
export function sendTemplate(t: EmailTemplate, lang: Lang, to: string, blanks: Record<string, string>, attachments?: Attachment[]) {
  return sendMail({
    to,
    fromName: "Elora MTL",
    replyTo: process.env.MAIL_TO || INBOX_EMAIL,
    subject: fillTemplate(t.subject[lang], blanks),
    text: fillTemplate(t.body[lang], blanks),
    ...(t.html[lang].trim() ? { html: fillHtmlTemplate(t.html[lang], blanks) } : {}),
    attachments,
  });
}

// The automatic reply to inquiries and Apply now (Automatic emails → Inquiry auto-reply).
export async function autoReply(name: string, email: string, lang: Lang) {
  const content = await getContent();
  if (content.emails.autoReply.enabled) await sendTemplate(content.emails.autoReply, lang, email, emailBlanks(content, lang, { name }));
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A notice to the leasing team (new booking, weekly summary…), as a designed email with a plain-text copy.
export function sendTeamNotice({ subject, heading, rows, note, sections = [], replyTo, attachments }: {
  subject: string;
  heading: string;
  rows: [string, string][];
  note?: string;
  sections?: { title: string; lines: string[] }[];
  replyTo?: string;
  attachments?: Attachment[];
}) {
  const admin = `${siteUrl("en").replace(/\/en$/, "")}/admin`;
  const table = rows.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;border:1px solid #e8e2da;">${rows
        .map(([k, v]) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #e8e2da;font-size:13px;color:#7d6b5d;width:38%;">${esc(k)}</td><td style="padding:10px 14px;border-bottom:1px solid #e8e2da;font-size:14px;color:#1d1814;">${esc(v)}</td></tr>`)
        .join("")}</table>`
    : "";
  const blocks = sections
    .map(
      (s) =>
        `<p style="margin:20px 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a8875a;">${esc(s.title)}</p>` +
        (s.lines.length ? s.lines.map((l) => `<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#503d32;">${esc(l)}</p>`).join("") : `<p style="margin:0;font-size:14px;color:#7d6b5d;">—</p>`),
    )
    .join("");
  const html = fillHtmlTemplate(
    layout({
      lang: "en",
      title: "Elora admin",
      preheader: heading,
      body: `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;line-height:1.25;color:#1d1814;">${esc(heading)}</h1>${table}${
        note ? `<p style="margin:0 0 20px;padding:14px 16px;background-color:#f7f5f2;font-size:14px;line-height:1.6;color:#503d32;white-space:pre-line;">${esc(note)}</p>` : ""
      }${blocks}${button(admin, "Open the admin")}`,
    }),
    { address: ADDRESS, phone: PHONE_MAIN_DISPLAY },
  );
  const text = [heading, "", ...rows.map(([k, v]) => `${k}: ${v}`), ...(note ? ["", note] : []), ...sections.flatMap((s) => ["", s.title.toUpperCase(), ...(s.lines.length ? s.lines : ["—"])]), "", `Admin: ${admin}`].join("\n");
  return sendMail({ subject, text, html, replyTo, attachments });
}

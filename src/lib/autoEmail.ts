import { ADDRESS, INBOX_EMAIL, PHONE_MAIN_DISPLAY } from "@/data/building";
import { button, layout } from "@/data/emailDesigns";
import { EMAIL_LOGO_CID, EMAIL_LOGO_PNG_BASE64 } from "@/data/emailLogo";
import { headers } from "next/headers";
import { fillHtmlTemplate, fillTemplate, scheduleState, type EmailTemplate, type SiteContent } from "@/data/content";
import { getContent } from "./content";
import type { Lead } from "./leads";
import { sendMail, type Attachment } from "./mail";
import { montrealToUtc, showingWords } from "./showingSlots";

// Sending the automatic emails (confirmation, auto-reply, follow-up) and the team's notices.

type Lang = "fr" | "en";

// The website's address for links in emails: the address the visitor (or admin) is using right now,
// so links work whether the site is reached at eloramtl.com or its Amplify address. Only our own
// domains are trusted; otherwise SITE_URL, then www.eloramtl.com.
const OUR_HOSTS = /^(?:[\w-]+\.)*(?:eloramtl\.com|amplifyapp\.com)$|^localhost(?::\d+)?$/;
export async function siteBase(): Promise<string> {
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
    if (OUR_HOSTS.test(host)) return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  } catch {
    // Not during a request.
  }
  return (process.env.SITE_URL || "https://www.eloramtl.com").replace(/\/$/, "");
}

// The words filled into an email: the person's details plus the building's.
export function emailBlanks(content: SiteContent, lang: Lang, person: { name: string; date?: string; time?: string }, base: string) {
  const p = content.promo;
  // The promotion as one line, e.g. "One month FREE on select units".
  const sub = p.sub[lang].trim();
  const promotion = scheduleState(p) === "live" ? [p.kicker[lang].trim(), p.big[lang].trim().toUpperCase(), sub.charAt(0).toLowerCase() + sub.slice(1)].filter(Boolean).join(" ") : "";
  return { name: person.name, date: person.date ?? "", time: person.time ?? "", promotion, address: ADDRESS, phone: PHONE_MAIN_DISPLAY, website: `${base}/${lang}`, logo: `cid:${EMAIL_LOGO_CID}` };
}

// Sends one of the admin-editable emails to a visitor, in their language.
export async function sendTemplate(t: EmailTemplate, lang: Lang, to: string, blanks: Record<string, string>, attachments: Attachment[] = []) {
  // Leads added by hand may have only a phone number.
  if (!to.trim()) return false;
  const html = t.html[lang].trim() ? fillHtmlTemplate(t.html[lang], blanks) : "";
  return sendMail({
    to,
    fromName: "Elora MTL",
    replyTo: process.env.MAIL_TO || INBOX_EMAIL,
    subject: fillTemplate(t.subject[lang], blanks),
    text: fillTemplate(t.body[lang], blanks),
    ...(html ? { html } : {}),
    attachments: withLogoImage(html, attachments),
  });
}

// The page where someone books a showing: the only way to book, through the link in their auto-reply.
export const bookingLink = (lead: Pick<Lead, "bookToken" | "lang">, base: string) => (lead.bookToken ? `${base}/${lead.lang}/book/${lead.bookToken}` : "");

// The automatic reply to inquiries and Apply now (Automatic emails → Inquiry auto-reply), with their
// booking link while online booking is on.
export async function autoReply(lead: Pick<Lead, "name" | "email" | "lang" | "bookToken">) {
  const content = await getContent();
  if (!content.emails.autoReply.enabled) return;
  const base = await siteBase();
  const booking = content.showings.enabled ? bookingLink(lead, base) : "";
  await sendTemplate(content.emails.autoReply, lead.lang, lead.email, { ...emailBlanks(content, lead.lang, { name: lead.name }, base), booking });
}

// The logo travels inside the email (not as a link), so it shows even before the site's domain is live.
const logoImage: Attachment = { filename: "elora-mtl.png", content: Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64"), contentType: "image/png", cid: EMAIL_LOGO_CID };
const withLogoImage = (html: string, attachments: Attachment[]) => (html.includes(`cid:${EMAIL_LOGO_CID}`) ? [logoImage, ...attachments] : attachments);

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A notice to the leasing team (new booking, weekly summary…), as a designed email with a plain-text copy.
// One person or suite in a team email: a bold first line, a small details line, tags (suites to
// show), a short note and a quoted message.
export type NoticeCard = { title: string; meta?: string; tagsLabel?: string; tags?: string[]; note?: string; quote?: string };
export type NoticeSection = { title: string; lines?: string[]; cards?: NoticeCard[]; empty?: string };

const cardHtml = (c: NoticeCard) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 10px;border:1px solid #e8e2da;background-color:#ffffff;"><tr><td style="padding:14px 16px;">` +
  `<p style="margin:0;font-size:16px;line-height:1.35;font-weight:bold;color:#1d1814;">${esc(c.title)}</p>` +
  (c.meta ? `<p style="margin:4px 0 0;font-size:13px;line-height:1.5;color:#7d6b5d;">${esc(c.meta)}</p>` : "") +
  (c.tags?.length
    ? `<p style="margin:10px 0 0;font-size:12px;line-height:2;color:#7d6b5d;">${c.tagsLabel ? `${esc(c.tagsLabel)}&nbsp; ` : ""}${c.tags
        .map((t) => `<span style="display:inline-block;margin:0 4px 0 0;padding:2px 10px;border:1px solid #e9d6ae;border-radius:12px;background-color:#f7f0e3;font-size:13px;font-weight:bold;color:#503d32;">${esc(t)}</span>`)
        .join("")}</p>`
    : "") +
  (c.note ? `<p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:#503d32;">${esc(c.note)}</p>` : "") +
  (c.quote ? `<p style="margin:10px 0 0;padding:0 0 0 10px;border-left:2px solid #e9d6ae;font-size:13px;line-height:1.5;font-style:italic;color:#7d6b5d;">${esc(c.quote)}</p>` : "") +
  `</td></tr></table>`;

export async function sendTeamNotice({ subject, heading, rows, note, sections = [], replyTo, attachments }: {
  subject: string;
  heading: string;
  rows: [string, string][];
  note?: string;
  sections?: NoticeSection[];
  replyTo?: string;
  attachments?: Attachment[];
}) {
  const admin = `${await siteBase()}/admin`;
  const table = rows.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;border:1px solid #e8e2da;">${rows
        .map(([k, v]) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #e8e2da;font-size:13px;color:#7d6b5d;width:38%;">${esc(k)}</td><td style="padding:10px 14px;border-bottom:1px solid #e8e2da;font-size:14px;color:#1d1814;">${esc(v)}</td></tr>`)
        .join("")}</table>`
    : "";
  const blocks = sections
    .map((s) => {
      const lines = s.lines ?? [];
      const cards = s.cards ?? [];
      const body =
        cards.map(cardHtml).join("") +
        lines.map((l) => `<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#503d32;">${esc(l)}</p>`).join("") ||
        `<p style="margin:0;font-size:14px;color:#7d6b5d;">${esc(s.empty ?? "—")}</p>`;
      return `<p style="margin:24px 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a8875a;">${esc(s.title)}</p>${body}`;
    })
    .join("");
  const cardText = (c: NoticeCard) => [`• ${c.title}`, c.meta && `  ${c.meta}`, c.tags?.length && `  ${c.tagsLabel ?? ""} ${c.tags.join(", ")}`.trimEnd(), c.note && `  ${c.note}`, c.quote && `  “${c.quote}”`].filter(Boolean) as string[];
  const html = fillHtmlTemplate(
    layout({
      lang: "en",
      title: "Elora admin",
      preheader: heading,
      body: `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;line-height:1.25;color:#1d1814;">${esc(heading)}</h1>${table}${
        note ? `<p style="margin:0 0 20px;padding:14px 16px;background-color:#f7f5f2;font-size:14px;line-height:1.6;color:#503d32;white-space:pre-line;">${esc(note)}</p>` : ""
      }${blocks}${button(admin, "Open the admin")}`,
    }),
    { address: ADDRESS, phone: PHONE_MAIN_DISPLAY, logo: `cid:${EMAIL_LOGO_CID}` },
  );
  const text = [heading, "", ...rows.map(([k, v]) => `${k}: ${v}`), ...(note ? ["", note] : []), ...sections.flatMap((s) => {
    const body = [...(s.cards ?? []).flatMap(cardText), ...(s.lines ?? [])];
    return ["", s.title.toUpperCase(), ...(body.length ? body : [s.empty ?? "—"])];
  }), "", `Admin: ${admin}`].join("\n");
  return sendMail({ subject, text, html, replyTo, attachments: withLogoImage(html, attachments ?? []) });
}

// After a showing is booked: the confirmation (with calendar invite) to the visitor and, for bookings
// made on the website, a notice to the leasing team.
export async function sendShowingEmails(lead: Lead, { team, confirm = true }: { team: boolean; confirm?: boolean }) {
  if (!lead.showing) return;
  const content = await getContent();
  const start = montrealToUtc(lead.showing.date, lead.showing.time);
  const end = new Date(start.getTime() + content.showings.slotMinutes * 60e3);
  const attachments = [{ filename: "elora-showing.ics", content: Buffer.from(invite(start, end, lead.id, lead.lang)), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }];
  const { date, time } = showingWords(lead.showing.date, lead.showing.time, lead.lang);
  const en = showingWords(lead.showing.date, lead.showing.time, "en");

  await Promise.all([
    team &&
      sendTeamNotice({
        subject: `New showing booked: ${lead.name}, ${en.date} at ${en.time}`,
        heading: `${lead.name} booked a showing`,
        rows: [
          ["When", `${en.date} at ${en.time}`],
          ["Phone", lead.phone],
          ["Email", lead.email],
          ["Suite type", lead.type || "Not sure yet"],
          ["Move-in date", lead.moveIn ?? ""],
          ["Language", lead.lang === "fr" ? "French" : "English"],
        ],
        note: lead.comments,
        replyTo: lead.email,
        attachments,
      }),
    // Wording set in the admin (Automatic emails → Showing confirmation).
    confirm && sendTemplate(content.showings.email, lead.lang, lead.email, emailBlanks(content, lead.lang, { name: lead.name, date, time }, await siteBase()), attachments),
  ]);
}

// The follow-up after a showing (Automatic emails → Follow-up), in the visitor's language.
export async function sendFollowUp(lead: Lead) {
  if (!lead.showing) return false;
  const content = await getContent();
  const { date, time } = showingWords(lead.showing.date, lead.showing.time, lead.lang);
  return sendTemplate(content.emails.followUp, lead.lang, lead.email, emailBlanks(content, lead.lang, { name: lead.name, date, time }, await siteBase()));
}

// A calendar invite for the showing, with a 30-minute reminder.
function invite(start: Date, end: Date, id: string, lang: Lang) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = lang === "fr" ? "Visite à Elora MTL" : "Showing at Elora MTL";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elora MTL//Showings//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${id}@eloramtl.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${ADDRESS.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${lang === "fr" ? "Des questions? " : "Questions? "}${PHONE_MAIN_DISPLAY}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${title}`,
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

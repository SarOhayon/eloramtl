"use server";

import { ADDRESS, INBOX_EMAIL, PHONE_MAIN_DISPLAY } from "@/data/building";
import { fillHtmlTemplate, fillTemplate } from "@/data/content";
import { getContent } from "@/lib/content";
import { addLead, readLeads } from "@/lib/leads";
import { sendMail } from "@/lib/mail";
import { freeSlots, montrealToUtc, type DaySlots } from "@/lib/showingSlots";
import { countEvent } from "@/lib/stats";

// Showing times visitors can book from the inquiry pop-up (empty when booking is turned off).
export async function getShowingSlots(): Promise<DaySlots[]> {
  const { showings } = await getContent();
  if (!showings.enabled) return [];
  return freeSlots(showings, await bookedShowings());
}

async function bookedShowings() {
  return (await readLeads()).filter((l) => l.showing && l.status !== "closed").map((l) => l.showing!);
}

export type BookState = { status: "idle" | "booked" | "invalid" | "taken" | "error"; values?: Record<string, string>; when?: { date: string; time: string } };

export async function bookShowing(_prev: BookState, formData: FormData): Promise<BookState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 2000);
  const v: Record<string, string> = {};
  for (const k of ["date", "time", "name", "email", "phone", "type", "moveIn", "comments", "lang"]) v[k] = get(k);
  const lang = v.lang === "fr" ? "fr" : "en";

  if (!v.name || v.phone.replace(/\D/g, "").length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) || !/^\d{4}-\d{2}-\d{2}$/.test(v.moveIn)) {
    return { status: "invalid", values: v };
  }
  // Check the time is still free right before booking it.
  const { showings } = await getContent();
  const open = freeSlots(showings, await bookedShowings()).some((d) => d.date === v.date && d.times.includes(v.time));
  if (!open) return { status: "taken", values: v };

  const lead = await addLead({
    kind: "showing",
    name: v.name,
    email: v.email,
    phone: v.phone,
    type: v.type || undefined,
    moveIn: v.moveIn,
    comments: v.comments || undefined,
    lang,
    showing: { date: v.date, time: v.time },
  });
  if (!lead) return { status: "error", values: v };
  await countEvent("showing");

  const start = montrealToUtc(v.date, v.time);
  const end = new Date(start.getTime() + showings.slotMinutes * 60e3);
  const ics = invite(start, end, lead.id, lang);
  const intl = lang === "fr" ? "fr-CA" : "en-CA";
  const dateText = new Intl.DateTimeFormat(intl, { dateStyle: "full", timeZone: "America/Montreal" }).format(start);
  const timeText = new Intl.DateTimeFormat(intl, { timeStyle: "short", timeZone: "America/Montreal" }).format(start);
  const whenText = `${dateText}, ${timeText}`;
  const blanks = { name: v.name, date: dateText, time: timeText, address: ADDRESS, phone: PHONE_MAIN_DISPLAY };
  const attachments = [{ filename: "elora-showing.ics", content: Buffer.from(ics), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }];

  await Promise.all([
    // To the leasing team.
    sendMail({
      subject: `Elora showing booked: ${v.name}, ${v.date} ${v.time}`,
      text: [`Showing: ${whenText}`, `Name: ${v.name}`, `Email: ${v.email}`, `Phone: ${v.phone}`, `Suite type: ${v.type || "Not sure yet"}`, `Move-in date: ${v.moveIn}`, ...(v.comments ? ["", v.comments] : [])].join("\n"),
      replyTo: v.email,
      attachments,
    }),
    // Confirmation to the visitor, with the calendar invite (it reminds them 30 minutes before).
    sendMail({
      to: v.email,
      fromName: "Elora MTL",
      replyTo: process.env.MAIL_TO || INBOX_EMAIL,
      // Wording set in the admin (Showings → Confirmation email).
      subject: fillTemplate(showings.email.subject[lang], blanks),
      text: fillTemplate(showings.email.body[lang], blanks),
      ...(showings.email.html[lang].trim() ? { html: fillHtmlTemplate(showings.email.html[lang], blanks) } : {}),
      attachments,
    }),
  ]);
  return { status: "booked", when: { date: v.date, time: v.time } };
}

// A calendar invite for the showing, with a 30-minute reminder.
function invite(start: Date, end: Date, id: string, lang: "fr" | "en") {
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

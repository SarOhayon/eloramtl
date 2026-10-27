"use server";

import { ADDRESS, INBOX_EMAIL, PHONE_MAIN_DISPLAY } from "@/data/building";
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
  const whenText = new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", { dateStyle: "full", timeStyle: "short", timeZone: "America/Montreal" }).format(start);
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
      subject: lang === "fr" ? `Votre visite à Elora : ${whenText}` : `Your Elora showing: ${whenText}`,
      text:
        lang === "fr"
          ? `Bonjour ${v.name},\n\nVotre visite est confirmée pour le ${whenText}, au ${ADDRESS}.\n\nL'invitation jointe l'ajoute à votre calendrier, avec un rappel 30 minutes avant.\nPour changer l'heure, répondez à ce courriel ou appelez-nous au ${PHONE_MAIN_DISPLAY}.\n\nÀ bientôt!\nL'équipe Elora`
          : `Hi ${v.name},\n\nYour showing is confirmed for ${whenText}, at ${ADDRESS}.\n\nThe attached invite adds it to your calendar, with a reminder 30 minutes before.\nTo change the time, reply to this email or call us at ${PHONE_MAIN_DISPLAY}.\n\nSee you soon!\nThe Elora team`,
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

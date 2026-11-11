import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { UNITS } from "@/data/building";
import { todayInMontreal } from "@/data/content";
import { readActivity } from "@/lib/activity";
import { isAdmin } from "@/lib/adminAuth";
import { getContent } from "@/lib/content";
import { readLeads, type LeadStatus } from "@/lib/leads";

// The daily report for the boss (Admin home → Daily report): the day's showings, what came in, and
// everything the team did, as a one- or two-page PDF. /admin/report.pdf?date=YYYY-MM-DD&note=…

const STATUS: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", toured: "Toured", applied: "Applied", leased: "Leased", closed: "Closed" };
const KIND = { inquiry: "Inquiry", application: "Application", showing: "Showing" };
const montrealDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Montreal" });
const montrealTime = (iso: string) => new Date(iso).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Montreal" });
const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`;
};

// The PDF's standard fonts only know Western European characters; swap or drop the rest (emojis, arrows).
const SAFE = /[ -~ -ÿ‘’“”–—•…€]/;
const clean = (s: string) =>
  [...s.replace(/→/g, "->").replace(/[\r\t]/g, " ")].map((c) => (c === "\n" || SAFE.test(c) ? c : "")).join("");

const BROWN = rgb(0.31, 0.24, 0.2);
const INK = rgb(0.11, 0.09, 0.08);
const SOFT = rgb(0.49, 0.42, 0.36);
const GOLD = rgb(0.66, 0.53, 0.35);
const SAND = rgb(0.91, 0.89, 0.85);
const CREAM = rgb(0.97, 0.96, 0.95);
const GREEN = rgb(0.18, 0.35, 0.22);
const RED = rgb(0.55, 0.15, 0.15);

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Please sign in to the admin first.", { status: 403 });
  const url = new URL(request.url);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date") ?? "") ? url.searchParams.get("date")! : todayInMontreal();
  const comment = clean((url.searchParams.get("note") ?? "").slice(0, 1500));
  const [leads, activity, content] = await Promise.all([readLeads(), readActivity(), getContent()]);

  const showings = leads.filter((l) => l.showing?.date === day && l.status !== "closed").sort((a, b) => a.showing!.time.localeCompare(b.showing!.time));
  const fresh = leads.filter((l) => montrealDay(l.createdAt) === day);
  const done = activity.filter((a) => montrealDay(a.at) === day && a.by === "you").sort((a, b) => a.at.localeCompare(b.at));
  const auto = activity.filter((a) => montrealDay(a.at) === day && a.by === "site");
  const came = showings.filter((l) => l.attendance === "came").length;
  const noShow = showings.filter((l) => l.attendance === "no-show").length;
  const movedTo = (s: LeadStatus) => done.filter((a) => a.what.endsWith(`→ ${STATUS[s]}`)).length;
  const open = (s: LeadStatus) => leads.filter((l) => l.status === s).length;
  const available = UNITS.filter((u) => content.suites[u.id]?.status === "available").length;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Elora daily report ${day}`);
  const fonts = { body: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold), serif: await pdf.embedFont(StandardFonts.TimesRoman) };
  const W = 612;
  const H = 792;
  const M = 48;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - M;
  };
  const room = (h: number) => {
    if (y - h < M + 20) newPage();
  };
  const wrap = (text: string, font: PDFFont, size: number, width: number) => {
    const lines: string[] = [];
    for (const para of clean(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      lines.push(line);
    }
    return lines;
  };
  const text = (s: string, { x = M, size = 10, font = fonts.body, color = BROWN, width = W - 2 * M, gap = 3 } = {}) => {
    for (const line of wrap(s, font, size, width)) {
      room(size + gap);
      page.drawText(line, { x, y: y - size, size, font, color });
      y -= size + gap;
    }
  };
  const heading = (s: string) => {
    room(40);
    y -= 16;
    page.drawText(clean(s).toUpperCase(), { x: M, y: y - 9, size: 9, font: fonts.bold, color: GOLD });
    y -= 16;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: SAND });
    y -= 8;
  };
  // A person: bold first line, then smaller detail lines.
  const card = (title: string, lines: string[], tone?: "good" | "bad") => {
    const body = lines.filter(Boolean).flatMap((l) => wrap(l, fonts.body, 9, W - 2 * M - 24));
    const h = 26 + body.length * 12;
    room(h + 6);
    page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: CREAM, borderColor: SAND, borderWidth: 0.6 });
    page.drawRectangle({ x: M, y: y - h, width: 3, height: h, color: tone === "good" ? GREEN : tone === "bad" ? RED : GOLD });
    page.drawText(clean(title), { x: M + 12, y: y - 17, size: 11, font: fonts.bold, color: INK });
    let yy = y - 31;
    for (const l of body) {
      page.drawText(l, { x: M + 12, y: yy, size: 9, font: fonts.body, color: SOFT });
      yy -= 12;
    }
    y -= h + 6;
  };

  // Header
  page.drawText("ELORA MTL", { x: M, y: y - 22, size: 22, font: fonts.serif, color: INK });
  page.drawText("DAILY LEASING REPORT", { x: M, y: y - 36, size: 8, font: fonts.bold, color: GOLD });
  const dateWords = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  page.drawText(clean(dateWords), { x: W - M - fonts.serif.widthOfTextAtSize(dateWords, 14), y: y - 20, size: 14, font: fonts.serif, color: BROWN });
  page.drawText("2855 chemin Bates, Montréal", { x: W - M - fonts.body.widthOfTextAtSize("2855 chemin Bates, Montréal", 8), y: y - 34, size: 8, font: fonts.body, color: SOFT });
  y -= 52;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.2, color: GOLD });
  y -= 18;

  // Key numbers
  const tiles: [string, string][] = [
    [String(showings.length), `Showing${showings.length === 1 ? "" : "s"}${showings.length ? ` (${came} came${noShow ? `, ${noShow} no-show` : ""})` : ""}`],
    [String(fresh.length), `New inquir${fresh.length === 1 ? "y" : "ies"}`],
    [String(done.length), `Action${done.length === 1 ? "" : "s"} taken`],
    [String(movedTo("applied") + movedTo("leased")), "Applied / leased today"],
  ];
  const tw = (W - 2 * M - 3 * 10) / 4;
  tiles.forEach(([n, label], i) => {
    const x = M + i * (tw + 10);
    page.drawRectangle({ x, y: y - 54, width: tw, height: 54, color: CREAM, borderColor: SAND, borderWidth: 0.6 });
    page.drawText(n, { x: x + 10, y: y - 30, size: 22, font: fonts.serif, color: INK });
    for (const [i2, l] of wrap(label, fonts.body, 7.5, tw - 20).entries()) page.drawText(l, { x: x + 10, y: y - 42 - i2 * 9, size: 7.5, font: fonts.body, color: SOFT });
  });
  y -= 66;

  if (comment) {
    heading("Note");
    text(comment, { size: 10, color: INK });
  }

  heading(`Showings (${showings.length})`);
  if (!showings.length) text("No showings this day.", { color: SOFT });
  for (const l of showings) {
    const units = l.leasedUnit ? [l.leasedUnit] : (l.units ?? []);
    const att = l.attendance === "came" ? "Came" : l.attendance === "no-show" ? "No-show" : "Not marked";
    card(`${clock(l.showing!.time)}  ·  ${l.name}  ·  ${att}`, [
      [l.type, l.moveIn && `Move-in ${l.moveIn}`, l.phone, l.source].filter(Boolean).join("  ·  "),
      units.length ? `Suites shown: ${units.join(", ")}` : "",
      `Status: ${STATUS[l.status]}${l.note ? `  ·  Note: ${l.note.replace(/\s+/g, " ").slice(0, 220)}` : ""}`,
    ], l.attendance === "came" ? "good" : l.attendance === "no-show" ? "bad" : undefined);
  }

  heading(`New inquiries (${fresh.length})`);
  if (!fresh.length) text("No new inquiries this day.", { color: SOFT });
  for (const l of fresh) {
    card(`${l.name}  ·  ${l.source ?? `Website ${KIND[l.kind].toLowerCase()}`}`, [
      [l.type, l.moveIn && `Move-in ${l.moveIn}`, l.phone || l.email].filter(Boolean).join("  ·  "),
      l.comments && !/^Added by hand/i.test(l.comments) ? `“${l.comments.replace(/\s+/g, " ").slice(0, 240)}”` : "",
      `Now: ${STATUS[l.status]}`,
    ]);
  }

  heading(`Work done (${done.length})`);
  if (!done.length) text("Nothing recorded in the admin this day.", { color: SOFT });
  const byPerson = new Map<string, typeof done>();
  for (const a of done) byPerson.set(a.name, [...(byPerson.get(a.name) ?? []), a]);
  for (const [name, list] of byPerson) card(name, list.map((a) => `${montrealTime(a.at)}  ${a.what}`));
  if (auto.length) {
    room(16);
    y -= 4;
    text(`Also handled automatically by the website: ${auto.length} (${[...new Set(auto.map((a) => a.what.replace(/:.*$/, "")))].slice(0, 4).join("; ")}).`, { size: 8.5, color: SOFT });
  }

  heading("Pipeline right now");
  text(`New ${open("new")}  ·  Contacted ${open("contacted")}  ·  Toured ${open("toured")}  ·  Applied ${open("applied")}  ·  Leased ${open("leased")}  ·  Suites available ${available}`, { size: 10, color: INK });

  // Footer on every page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const f = `Elora MTL · Daily report · ${day}${pages.length > 1 ? ` · ${i + 1}/${pages.length}` : ""}`;
    p.drawText(clean(f), { x: M, y: 26, size: 7.5, font: fonts.body, color: SOFT });
  });

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Elora-daily-report-${day}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

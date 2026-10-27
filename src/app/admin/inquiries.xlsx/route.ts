import ExcelJS from "exceljs";
import { isAdmin } from "@/lib/adminAuth";
import { readLeads } from "@/lib/leads";

// Every inquiry, application and showing as an Excel file (Inquiries → Download to Excel).
const KIND = { inquiry: "Inquiry", application: "Application", showing: "Showing" };
const STATUS = { new: "New", contacted: "Contacted", toured: "Toured", leased: "Leased", closed: "Closed" };
const local = new Intl.DateTimeFormat("en-CA", { dateStyle: "short", timeStyle: "short", hourCycle: "h23", timeZone: "America/Montreal" });

export async function GET() {
  if (!(await isAdmin())) return new Response("Please sign in to the admin first.", { status: 403 });
  const leads = await readLeads();

  const book = new ExcelJS.Workbook();
  book.creator = "Elora MTL";
  const sheet = book.addWorksheet("Inquiries", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Received", key: "received", width: 18 },
    { header: "Form", key: "kind", width: 13 },
    { header: "Status", key: "status", width: 12 },
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Suite type", key: "type", width: 18 },
    { header: "Move-in", key: "moveIn", width: 12 },
    { header: "Showing", key: "showing", width: 18 },
    { header: "Came?", key: "attendance", width: 10 },
    { header: "Follow-up sent", key: "followUp", width: 18 },
    { header: "Comments", key: "comments", width: 50 },
    { header: "Our note", key: "note", width: 40 },
    { header: "AI suggestion", key: "suggestion", width: 50 },
    { header: "Language", key: "lang", width: 10 },
  ];
  for (const l of leads) {
    sheet.addRow({
      received: local.format(new Date(l.createdAt)).replace(",", ""),
      kind: KIND[l.kind],
      status: STATUS[l.status],
      name: l.name,
      email: l.email,
      phone: l.phone,
      type: l.type ?? "",
      moveIn: l.moveIn ?? "",
      showing: l.showing ? `${l.showing.date} ${l.showing.time}` : "",
      attendance: l.attendance === "came" ? "Came" : l.attendance === "no-show" ? "No-show" : "",
      followUp: l.followUp?.sentAt ? local.format(new Date(l.followUp.sentAt)).replace(",", "") : "",
      comments: l.comments ?? "",
      note: l.note ?? "",
      suggestion: l.suggestion ? l.suggestion.picks.map((p) => p.unit).join(", ") + (l.suggestion.summary ? ` (${l.suggestion.summary})` : "") : "",
      lang: l.lang === "fr" ? "French" : "English",
    });
  }
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF503D32" } };
  sheet.eachRow((row, i) => {
    if (i > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  sheet.autoFilter = { from: "A1", to: "O1" };

  const body = Buffer.from(await book.xlsx.writeBuffer());
  const today = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="elora-inquiries-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

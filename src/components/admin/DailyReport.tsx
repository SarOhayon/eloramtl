"use client";

import { useState } from "react";
import { todayInMontreal } from "@/data/content";
import { field, softBtn } from "./ui";

// "Daily report" on the admin home: a PDF of the day's showings, new inquiries and the work done.
// On a phone it opens the share sheet (Messages, WhatsApp, Mail…); elsewhere it downloads.
export function DailyReport() {
  const [day, setDay] = useState(todayInMontreal());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const make = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/admin/report.pdf?date=${day}&note=${encodeURIComponent(note)}`);
      if (!res.ok) throw new Error(String(res.status));
      const file = new File([await res.blob()], `Elora-daily-report-${day}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Elora daily report ${day}` }).catch(() => {});
      } else {
        const url = URL.createObjectURL(file);
        const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMsg("Downloaded. Attach it to a text or email to your boss.");
      }
    } catch {
      setMsg("The report couldn't be made. Refresh the page and try again.");
    }
    setBusy(false);
  };

  return (
    <section className="mt-6 rounded-lg bg-cream p-5 shadow-sm ring-1 ring-sand">
      <p className="font-display text-2xl text-ink">Daily report for your boss</p>
      <p className="mt-1 text-sm text-brown-soft">A PDF of the day’s showings, new inquiries and everything you did in the admin. On your phone, it opens straight in Messages to text.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1 block text-sm text-brown-soft">Day</span>
          <input type="date" className={`${field} w-auto py-2`} value={day} max={todayInMontreal()} onChange={(e) => setDay(e.target.value || todayInMontreal())} />
        </label>
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-sm text-brown-soft">Add a note (optional)</span>
          <input className={`${field} py-2`} placeholder="e.g. Two strong applicants for 304, following up tomorrow." value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className={softBtn} onClick={make} disabled={busy}>
          {busy ? "Making the PDF…" : "📄 Create & send the report"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-brown">{msg}</p>}
    </section>
  );
}

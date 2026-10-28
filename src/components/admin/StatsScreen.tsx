"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/app/actions/stats";
import type { DayCounts, StatEvent } from "@/lib/stats";
import { ChartIcon } from "./AdminIcons";
import { ScreenTitle, Step } from "./ui";

type Row = { date: string; counts: DayCounts };

const TILES: { key: StatEvent; label: string; help: string }[] = [
  { key: "visit", label: "Visits", help: "People who opened the website" },
  { key: "promo", label: "Saw the promotion", help: "The pop-up appeared" },
  { key: "claim", label: "Claimed the offer", help: "Clicked “Claim the offer”" },
  { key: "whatsapp", label: "WhatsApp clicks", help: "Opened a WhatsApp chat" },
  { key: "call", label: "Call clicks", help: "Tapped the phone number" },
  { key: "inquiry", label: "Inquiries", help: "Sent the inquiry form" },
  { key: "application", label: "Applications", help: "Sent “Apply now”" },
  { key: "showing", label: "Showings booked", help: "Booked a time online" },
];
const short = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
const long = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const asDate = (d: string) => new Date(`${d}T00:00:00Z`);

// Simple visitor numbers: totals for the period and visits per day.
export function StatsScreen() {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    let live = true;
    getStats(days).then((r) => live && setRows(r ?? []));
    return () => {
      live = false;
    };
  }, [days]);

  const total = (k: StatEvent) => (rows ?? []).reduce((n, r) => n + (r.counts[k] ?? 0), 0);
  const max = Math.max(1, ...(rows ?? []).map((r) => r.counts.visit ?? 0));
  const contacts = total("whatsapp") + total("call") + total("inquiry") + total("application") + total("showing");

  return (
    <>
      <ScreenTitle
        icon={<ChartIcon className="size-5" />}
        title="Visitors"
        help="How many people visit the website and what they do. Each visit is counted once per browser session; the numbers show the trend, they aren't exact to the person."
      />
      <div className="mb-6 flex gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => { setRows(null); setDays(d); }} className={`rounded-md px-5 py-3 ring-1 ${days === d ? "bg-action text-white ring-action" : "bg-white ring-brown/20 hover:ring-brown/40"}`}>
            Last {d} days
          </button>
        ))}
      </div>

      {!rows ? (
        <p className="text-brown-soft">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {TILES.map((tile) => (
              <div key={tile.key} className="rounded-lg bg-cream p-4 ring-1 ring-sand">
                <p className="text-sm font-medium text-brown">{tile.label}</p>
                <p className="mt-1 font-display text-4xl tabular-nums text-ink">{total(tile.key).toLocaleString("en-CA")}</p>
                <p className="mt-1 text-xs text-brown-soft">{tile.help}</p>
              </div>
            ))}
          </div>
          <p className="text-brown">
            <span className="font-medium">{contacts.toLocaleString("en-CA")}</span> {contacts === 1 ? "time" : "times"} someone reached out (WhatsApp, call, form or booking) in the last {days} days.
          </p>

          <Step title="Visits per day">
            <div className="mb-3 flex justify-end">
              <button onClick={() => setAsTable((v) => !v)} className="text-sm text-brown underline underline-offset-4">
                {asTable ? "Show as a chart" : "Show as a table"}
              </button>
            </div>
            {asTable ? (
              <table className="w-full text-left text-sm">
                <thead className="text-brown-soft">
                  <tr className="border-b border-sand">
                    <th className="py-1.5 font-medium">Day</th>
                    <th className="py-1.5 text-right font-medium">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .slice()
                    .reverse()
                    .map((r) => (
                      <tr key={r.date} className="border-b border-sand/60 last:border-0">
                        <td className="py-1.5">{long.format(asDate(r.date))}</td>
                        <td className="py-1.5 text-right tabular-nums">{r.counts.visit ?? 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : total("visit") === 0 ? (
              <p className="py-10 text-center text-brown-soft">No visits counted yet for this period.</p>
            ) : (
              <figure>
                <div className="relative flex h-48 items-end gap-0.5 border-b border-brown/20" role="img" aria-label={`Visits per day for the last ${days} days`}>
                  <span className="absolute left-0 top-0 text-xs tabular-nums text-brown-soft">{max}</span>
                  {rows.map((r) => {
                    const n = r.counts.visit ?? 0;
                    return (
                      <div key={r.date} className="group relative flex h-full flex-1 items-end justify-center">
                        <div className="w-full max-w-10 rounded-t-[4px] bg-brown transition group-hover:bg-gold" style={{ height: `${(n / max) * 100}%`, minHeight: n ? 2 : 0 }} />
                        <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-sm bg-ink px-2.5 py-1.5 text-xs text-white shadow group-hover:block">
                          {long.format(asDate(r.date))}: <b>{n}</b> visit{n === 1 ? "" : "s"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-brown-soft">
                  <span>{short.format(asDate(rows[0].date))}</span>
                  <span>{short.format(asDate(rows[rows.length - 1].date))}</span>
                </div>
              </figure>
            )}
          </Step>
        </div>
      )}
    </>
  );
}

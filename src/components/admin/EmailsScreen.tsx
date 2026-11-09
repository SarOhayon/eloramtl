"use client";

import { useEffect, useState } from "react";
import { morningStatus, sendMorningBriefNow } from "@/app/actions/leads";
import { DEFAULT_CONTENT, type AutoEmails, type SiteContent } from "@/data/content";
import { MailIcon } from "./AdminIcons";
import { EmailEditor } from "./EmailEditor";
import { ScreenTitle, Step, Switch, field, softBtn, type Update } from "./ui";

const D = DEFAULT_CONTENT;

// Every email the website sends by itself, in one place.
export function EmailsScreen({ content, update }: { content: SiteContent; update: Update }) {
  const e = content.emails;
  const setEmails = (patch: Partial<AutoEmails>) => update((c) => ({ ...c, emails: { ...c.emails, ...patch } }));

  return (
    <>
      <ScreenTitle
        icon={<MailIcon className="size-5" />}
        title="Automatic emails"
        help="The emails the website sends by itself. Each one goes out in the language the person used on the website. Turn them on or off, change the wording, or paste your own design."
      />
      <section className={`mb-6 rounded-lg p-5 ring-1 ${e.testMode ? "bg-gold-light/50 ring-gold" : "bg-cream ring-sand"}`}>
        <p className="font-display text-2xl text-ink">Test mode</p>
        <p className="mt-1 text-brown-soft">
          While the website is being set up: every email meant for a client (auto-reply, booking confirmation, follow-up) comes to your inbox instead, marked “TEST · would have gone to …”, except your test addresses below, which get the real thing. Turn it off when you go live.
        </p>
        <div className="mt-3">
          <Switch on={e.testMode} onChange={(v) => setEmails({ testMode: v })} label={e.testMode ? "ON: only your test addresses get real emails" : "OFF: emails go to clients"} />
        </div>
        <TestAddresses list={e.testAddresses} onChange={(testAddresses) => setEmails({ testAddresses })} />
      </section>

      <section className="mb-6 rounded-lg bg-cream p-5 ring-1 ring-sand">
        <p className="font-display text-2xl text-ink">People from your inbox or added by hand</p>
        <p className="mt-1 text-brown-soft">
          Leads read from your email (Rentsync, Apartments.com, Zumper…) and people you add yourself never get automatic emails: no confirmation when you book them a showing, no follow-up. People who use the website’s forms get the emails above.
        </p>
        <div className="mt-3">
          <Switch on={e.emailOutsideLeads} onChange={(v) => setEmails({ emailOutsideLeads: v })} label={e.emailOutsideLeads ? "They get emails too" : "Never email them (recommended)"} />
        </div>
      </section>
      <div className="space-y-6">
        <Step n={1} title="Reply to inquiries and applications" help="Sent right away to everyone who sends the inquiry form or “Apply now”. It carries their personal “Book my showing” button: this is the only way to book a showing, so keep {booking} in it.">
          <Switch on={e.autoReply.enabled} onChange={(v) => setEmails({ autoReply: { ...e.autoReply, enabled: v } })} label={e.autoReply.enabled ? "On" : "Off"} />
          {e.autoReply.enabled && (
            <div className="mt-5">
              <EmailEditor
                template={e.autoReply}
                original={D.emails.autoReply}
                onChange={(t) => setEmails({ autoReply: { ...e.autoReply, ...t } })}
                blanks={["{name}", "{booking}", "{promotion}", "{phone}", "{address}", "{website}"]}
              />
            </div>
          )}
        </Step>

        <Step n={2} title="Showing confirmation" help="Sent right after someone books a showing, with the calendar invite (30-minute reminder) attached.">
          <EmailEditor
            template={content.showings.email}
            original={D.showings.email}
            onChange={(t) => update((c) => ({ ...c, showings: { ...c.showings, email: t } }))}
            blanks={["{name}", "{date}", "{time}", "{promotion}", "{phone}", "{address}", "{website}"]}
            attachment="elora-showing.ics"
          />
        </Step>

        <Step n={3} title="Follow-up after a showing" help="Sent a few days after a showing, only to people you marked as “Came” in Showings or Inquiries.">
          <div className="flex flex-wrap items-center gap-6">
            <Switch on={e.followUp.enabled} onChange={(v) => setEmails({ followUp: { ...e.followUp, enabled: v } })} label={e.followUp.enabled ? "On" : "Off"} />
            <label className="flex items-center gap-3">
              <span className="font-medium">Send it</span>
              <select className={`${field} w-auto`} value={e.followUp.days} onChange={(ev) => setEmails({ followUp: { ...e.followUp, days: Number(ev.target.value) } })}>
                {[1, 2, 3, 5, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} day{d > 1 ? "s" : ""} after
                  </option>
                ))}
              </select>
            </label>
          </div>
          {e.followUp.enabled && (
            <div className="mt-5">
              <EmailEditor
                template={e.followUp}
                original={D.emails.followUp}
                onChange={(t) => setEmails({ followUp: { ...e.followUp, ...t } })}
                blanks={["{name}", "{date}", "{time}", "{promotion}", "{phone}", "{address}", "{website}"]}
              />
            </div>
          )}
        </Step>

        <Step n={4} title="Weekly summary" help="Every Monday at 8 a.m., to the leasing inbox: new inquiries, this week’s showings, who came last week, suites available and visitor numbers.">
          <Switch on={e.weekly.enabled} onChange={(v) => setEmails({ weekly: { enabled: v } })} label={e.weekly.enabled ? "On" : "Off"} />
        </Step>

        <Step n={5} title="Morning brief" help="Every day at 7:30 a.m., to the leasing inbox: today’s showings with the suites to show each person, new leads from the last 24 hours with suggested suites, who needs a follow-up, and a fun fact of the day.">
          <Switch on={e.morning.enabled} onChange={(v) => setEmails({ morning: { enabled: v } })} label={e.morning.enabled ? "On" : "Off"} />
          <MorningStatus />
        </Step>

        <Step n={6} title="Pre-tour cheat sheet" help="When you check someone in for their showing (“Came”), the leasing inbox gets a one-glance sheet: who they are, budget, move-in, pets, what they asked, the suites to show and two talking points.">
          <Switch on={e.cheatSheet.enabled} onChange={(v) => setEmails({ cheatSheet: { enabled: v } })} label={e.cheatSheet.enabled ? "On" : "Off"} />
        </Step>
      </div>
    </>
  );
}

const sentAt = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Montreal" });

// When the last brief went out, and a button to send today's now.
function MorningStatus() {
  const [status, setStatus] = useState<{ lastMorningAt?: string; scheduler: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    morningStatus().then(setStatus);
  }, []);
  const send = async () => {
    setBusy(true);
    setMsg("");
    const res = await sendMorningBriefNow();
    setMsg(res.ok ? "Sent to the leasing inbox." : (res.error ?? ""));
    if (res.ok) setStatus((s) => (s ? { ...s, lastMorningAt: res.at } : s));
    setBusy(false);
  };
  return (
    <div className="mt-4 space-y-2 text-sm">
      <p className="text-brown-soft">
        Last sent: {status?.lastMorningAt ? sentAt.format(new Date(status.lastMorningAt)) : "not yet"}
      </p>
      {status && !status.scheduler && (
        <p className="rounded-md bg-gold-light/60 px-3 py-2 text-brown">
          The website wakes up only when someone visits it, so on a quiet morning the brief can come late. To get it at 7:30 sharp, set up the free scheduler (CRON_SECRET + cron-job.org).
        </p>
      )}
      <button className={softBtn} onClick={send} disabled={busy}>
        {busy ? "Sending…" : "Send today’s brief now"}
      </button>
      {msg && <span className="ml-3 text-brown">{msg}</span>}
    </div>
  );
}

// Your own addresses for testing: in Test mode they still get the real emails, like a client would.
function TestAddresses({ list, onChange }: { list: string[]; onChange: (l: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !list.includes(v)) onChange([...list, v]);
    setDraft("");
  };
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-brown">Test addresses (get the real emails, like a client)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((a) => (
          <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-3 pr-1.5 text-sm ring-1 ring-sand">
            {a}
            <button aria-label={`Remove ${a}`} onClick={() => onChange(list.filter((x) => x !== a))} className="inline-flex size-6 items-center justify-center rounded-full text-brown-soft hover:text-brown">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <input type="email" className={`${field} max-w-xs py-2`} placeholder="you@example.com" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className={softBtn} onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

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
          While the website is being set up: every email meant for a client (auto-reply, booking confirmation, follow-up) comes to your inbox instead, marked “TEST · would have gone to …”. Turn it off when you go live.
        </p>
        <div className="mt-3">
          <Switch on={e.testMode} onChange={(v) => setEmails({ testMode: v })} label={e.testMode ? "ON: clients receive nothing" : "OFF: emails go to clients"} />
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

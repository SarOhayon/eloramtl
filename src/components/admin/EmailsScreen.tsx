"use client";

import { DEFAULT_CONTENT, type AutoEmails, type SiteContent } from "@/data/content";
import { MailIcon } from "./AdminIcons";
import { EmailEditor } from "./EmailEditor";
import { ScreenTitle, Step, Switch, field, type Update } from "./ui";

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
      </div>
    </>
  );
}

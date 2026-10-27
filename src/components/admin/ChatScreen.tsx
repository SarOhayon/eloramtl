"use client";

import { useEffect, useState } from "react";
import { chatStatus, dismissChat, listChats } from "@/app/actions/chat";
import type { FaqItem, SiteContent } from "@/data/content";
import type { ChatEntry } from "@/lib/chatLog";
import { ChatIcon, PlusIcon, TrashIcon } from "./AdminIcons";
import { BilingualFields, ScreenTitle, Step, Switch, bigBtn, softBtn, type Update } from "./ui";

const newId = () => `faq-${Date.now()}`;
const when = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Montreal" });

// The website's chat assistant: on/off, the questions and answers it uses, and what visitors asked.
export function ChatScreen({ content, update }: { content: SiteContent; update: Update }) {
  const faq = content.faq;
  const setItems = (fn: (items: FaqItem[]) => FaqItem[]) => update((c) => ({ ...c, faq: { ...c.faq, items: fn(c.faq.items) } }));
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [log, setLog] = useState<ChatEntry[] | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    chatStatus().then((s) => s && setAiReady(s.aiReady));
    listChats().then(setLog);
  }, []);
  useEffect(() => {
    if (focus) document.getElementById(`faq-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);

  const add = (q: Partial<FaqItem["q"]> = {}) => {
    const id = newId();
    setItems((items) => [{ id, q: { fr: q.fr ?? "", en: q.en ?? "" }, a: { fr: "", en: "" } }, ...items]);
    setFocus(id);
  };
  const unanswered = (log ?? []).filter((e) => !e.answered);

  return (
    <>
      <ScreenTitle
        icon={<ChatIcon className="size-5" />}
        title="Chat assistant"
        help="A small “Questions?” button on the website opens a chat that answers visitors in French or English, using your questions and answers below plus live facts (suites available, prices, the promotion, office hours). When it doesn't know, it says so and offers to put them in touch with you."
      />
      <div className="space-y-6">
        <Step n={1} title="Turn it on or off">
          <Switch on={faq.enabled} onChange={(v) => update((c) => ({ ...c, faq: { ...c.faq, enabled: v } }))} label={faq.enabled ? "The chat is ON" : "The chat is OFF"} />
          {aiReady === false && (
            <p className="mt-3 rounded-md bg-gold-light/60 px-4 py-3 text-brown">
              The AI key isn’t set yet, so the chat won’t appear on the website. Add <code>ANTHROPIC_API_KEY</code> in Amplify and redeploy.
            </p>
          )}
          <p className="mt-3 text-sm text-brown-soft">Each answer costs about 1–2 cents. The chat is limited to 600 messages a day for the whole site.</p>
        </Step>

        {unanswered.length > 0 && (
          <Step title="Questions it couldn’t answer" help="Add the answer to the FAQ and the chat will know it next time.">
            <ul className="divide-y divide-sand">
              {unanswered.slice(0, 20).map((e) => (
                <li key={e.at} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-ink">“{e.question}”</p>
                    <p className="text-xs text-brown-soft">
                      {when.format(new Date(e.at))} · {e.lang === "fr" ? "French" : "English"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={softBtn}
                      onClick={async () => {
                        add({ [e.lang]: e.question });
                        const next = await dismissChat(e.at);
                        if (next) setLog(next);
                      }}
                    >
                      <PlusIcon className="size-4" /> Add to FAQ
                    </button>
                    <button
                      className={softBtn}
                      onClick={async () => {
                        const next = await dismissChat(e.at);
                        if (next) setLog(next);
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Step>
        )}

        <Step n={2} title="Questions and answers" help="Write each answer in French and English. The first 3 questions are suggested to visitors when they open the chat. Prices, available suites, the promotion and office hours are added automatically: no need to write them here.">
          <button className={bigBtn} onClick={() => add()}>
            <PlusIcon className="size-5" /> Add a question
          </button>
          <ol className="mt-5 space-y-4">
            {faq.items.map((f, i) => (
              <li key={f.id} id={`faq-${f.id}`} className={`rounded-md bg-white p-4 ring-1 ${focus === f.id ? "ring-2 ring-gold" : "ring-sand"}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-brown-soft">#{i + 1}</span>
                  <div className="flex items-center gap-3">
                    {i > 0 && (
                      <button className="text-sm text-brown underline underline-offset-4" onClick={() => setItems((items) => [f, ...items.filter((x) => x.id !== f.id)])}>
                        Move to the top
                      </button>
                    )}
                    <button
                      aria-label="Delete this question"
                      onClick={() => confirm("Delete this question?") && setItems((items) => items.filter((x) => x.id !== f.id))}
                      className="inline-flex size-9 items-center justify-center rounded-full text-brown-soft ring-1 ring-brown/15 hover:text-red-800"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <BilingualFields label="Question" value={f.q} onChange={(v) => setItems((items) => items.map((x) => (x.id === f.id ? { ...x, q: v } : x)))} />
                  <BilingualFields long label="Answer" value={f.a} onChange={(v) => setItems((items) => items.map((x) => (x.id === f.id ? { ...x, a: v } : x)))} />
                </div>
              </li>
            ))}
          </ol>
        </Step>

        <Step title="Recent questions" help="What visitors asked, and what the chat answered.">
          {!log ? (
            <p className="text-brown-soft">Loading…</p>
          ) : log.length === 0 ? (
            <p className="text-brown-soft">No questions yet.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {log.slice(0, 30).map((e) => (
                <li key={e.at} className="py-3">
                  <p className="text-ink">
                    “{e.question}” {!e.answered && <span className="ml-1 rounded-full bg-gold-light px-2 py-0.5 text-xs text-brown">not in the FAQ</span>}
                  </p>
                  <p className="mt-1 text-sm text-brown">{e.reply}</p>
                  <p className="mt-1 text-xs text-brown-soft">{when.format(new Date(e.at))}</p>
                </li>
              ))}
            </ul>
          )}
        </Step>
      </div>
    </>
  );
}

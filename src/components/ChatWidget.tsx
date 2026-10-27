"use client";

import { useEffect, useRef, useState } from "react";
import { askElora, type ChatAction, type ChatTurn } from "@/app/actions/chat";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { CloseIcon } from "./icons";
import { openApply, openInquiry } from "./inquiry";

type Message = ChatTurn & { action?: ChatAction };

// The chat assistant: a small button at the bottom left that opens a conversation.
export function ChatWidget({ locale, suggestions }: { locale: Locale; suggestions: string[] }) {
  const t = getDictionary(locale).chat;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, open]);

  const send = async (text: string) => {
    const question = text.trim().slice(0, 600);
    if (!question || busy) return;
    const next: Message[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    const res = await askElora(
      next.map(({ role, text }) => ({ role, text })),
      locale,
    ).catch(() => ({ ok: false as const, error: "failed" as const }));
    setBusy(false);
    setMessages((m) => [
      ...m,
      res.ok
        ? { role: "assistant", text: res.reply, action: res.action }
        : { role: "assistant", text: res.error === "busy" ? t.busy : res.error === "limit" ? t.limit : t.failed, action: "contact" },
    ]);
  };

  const actionButton = (a?: ChatAction) => {
    if (!a || a === "none") return null;
    const label = a === "book" ? t.book : a === "apply" ? t.apply : t.contact;
    const go = () => {
      setOpen(false);
      if (a === "apply") openApply();
      else openInquiry({ askOnly: a === "contact" });
    };
    return (
      <button onClick={go} className="mt-2 rounded-full bg-action px-4 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-action-deep">
        {label}
      </button>
    );
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-full bg-brown px-4 py-3 text-sm font-medium text-cream shadow-lg shadow-black/20 transition hover:bg-brown-deep sm:bottom-6 sm:left-6"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4 3.5v-3.5h0a2 2 0 0 1-1.5-2v-8Z" />
          <path d="M8.5 9.5h7M8.5 12.5h4.5" />
        </svg>
        {t.open}
      </button>
    );

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80svh] flex-col overflow-hidden rounded-lg bg-cream shadow-2xl ring-1 ring-brown/15 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:h-[540px] sm:w-[380px]" role="dialog" aria-label={t.title}>
      <div className="flex items-center justify-between border-t-2 border-gold bg-brown px-4 py-3 text-cream">
        <div>
          <p className="font-display text-xl leading-none tracking-[0.2em]">{t.title.toUpperCase()}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-cream/70">{t.subtitle}</p>
        </div>
        <button onClick={() => setOpen(false)} aria-label={t.close} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/10">
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="max-w-[85%] rounded-lg rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-brown ring-1 ring-sand">{t.hello}</div>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full bg-cream-deep px-3 py-1.5 text-left text-xs text-brown ring-1 ring-sand transition hover:ring-brown/40">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-action px-3.5 py-2.5 text-sm text-white">
              {m.text}
            </div>
          ) : (
            <div key={i} className="max-w-[85%]">
              <div className="whitespace-pre-line rounded-lg rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-brown ring-1 ring-sand">{m.text}</div>
              {actionButton(m.action)}
            </div>
          ),
        )}
        {busy && (
          <div className="inline-flex gap-1 rounded-lg bg-white px-3.5 py-3 ring-1 ring-sand" aria-label="…">
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-1.5 animate-bounce rounded-full bg-brown-soft" style={{ animationDelay: `${d * 0.15}s` }} />
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      <form
        className="flex gap-2 border-t border-sand bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={600}
          placeholder={t.placeholder}
          aria-label={t.placeholder}
          className="min-w-0 flex-1 rounded-full bg-cream-deep px-4 py-2.5 text-sm text-brown placeholder:text-brown-soft/70 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button disabled={busy || !draft.trim()} className="rounded-full bg-action px-4 text-sm font-medium text-white transition hover:bg-action-deep disabled:opacity-40">
          {t.send}
        </button>
      </form>
      <p className="bg-white pb-2 text-center text-[10px] text-brown-soft">{t.note}</p>
    </div>
  );
}

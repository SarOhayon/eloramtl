"use client";

import { useActionState, useState } from "react";
import { submitMaintenance, type MaintenanceState } from "@/app/actions/maintenance";
import { PHONE_MAIN, PHONE_MAIN_DISPLAY } from "@/data/building";
import { ROOMS, type Item, type Problem, type Room } from "@/data/maintenance";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { PhoneIcon } from "./icons";

const field =
  "w-full rounded-sm border-0 bg-white px-4 py-3 text-brown ring-1 ring-brown/15 placeholder:text-brown-soft/60 focus:outline-none focus:ring-2 focus:ring-gold";

// Phone photos are several MB; shrink to 1600px JPEG before upload.
async function resize(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

function Bot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brown font-display text-sm text-gold-light">E</span>
      <div className="rounded-lg rounded-tl-none bg-cream-deep px-4 py-3 text-sm text-brown">{children}</div>
    </div>
  );
}

function Me({ children, onChange, changeLabel }: { children: React.ReactNode; onChange: () => void; changeLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onChange} className="text-xs text-brown-soft underline-offset-4 hover:underline">
        {changeLabel}
      </button>
      <div className="rounded-lg rounded-tr-none bg-brown px-4 py-2.5 text-sm text-cream">{children}</div>
    </div>
  );
}

function Choices<T extends { id: string }>({ items, label, onPick }: { items: T[]; label: (x: T) => string; onPick: (x: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pl-11">
      {items.map((x) => (
        <button
          key={x.id}
          type="button"
          onClick={() => onPick(x)}
          className="rounded-full bg-white px-4 py-2 text-sm text-brown ring-1 ring-brown/20 transition hover:bg-gold-light/40 hover:ring-gold"
        >
          {label(x)}
        </button>
      ))}
    </div>
  );
}

export function MaintenanceAssistant({ locale }: { locale: Locale }) {
  const m = getDictionary(locale).maint;
  const [room, setRoom] = useState<Room | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [state, formAction, pending] = useActionState<MaintenanceState, FormData>(submitMaintenance, { status: "idle" });

  const back = (step: "room" | "item" | "problem" | "photo") => {
    if (step === "room") setRoom(null);
    if (step === "room" || step === "item") setItem(null);
    if (step !== "photo") setProblem(null);
    setPhoto(null);
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;
    const file = await resize(original);
    setPhoto({ file, url: URL.createObjectURL(file) });
  };

  if (state.status === "sent") {
    return (
      <div role="status" className="space-y-4 py-2">
        <Bot>
          <p className="font-medium">{m.sentTitle}</p>
          <p className="mt-1">{m.sentText}</p>
        </Bot>
        <button type="button" onClick={() => window.location.reload()} className="ml-11 text-sm text-brown underline-offset-4 hover:underline">
          {m.restart}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
        <span className="h-px w-8 bg-gold" />
        {m.bot}
      </p>

      <Bot>{m.where}</Bot>
      {room ? (
        <Me onChange={() => back("room")} changeLabel={m.change}>
          {room.label[locale]}
        </Me>
      ) : (
        <Choices items={ROOMS} label={(r) => r.label[locale]} onPick={setRoom} />
      )}

      {room && (
        <>
          <Bot>{m.what(room.label[locale].toLowerCase())}</Bot>
          {item ? (
            <Me onChange={() => back("item")} changeLabel={m.change}>
              {item.label[locale]}
            </Me>
          ) : (
            <Choices items={room.items} label={(i) => i.label[locale]} onPick={setItem} />
          )}
        </>
      )}

      {item && (
        <>
          <Bot>{m.problem(item.label[locale].toLowerCase())}</Bot>
          {problem ? (
            <Me onChange={() => back("problem")} changeLabel={m.change}>
              {problem.label[locale]}
            </Me>
          ) : (
            <Choices items={item.problems} label={(x) => x.label[locale]} onPick={setProblem} />
          )}
        </>
      )}

      {problem?.urgent && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gold-light/40 px-4 py-3 text-sm text-brown ring-1 ring-gold/50" role="alert">
          <span>{m.urgentNote}</span>
          <a href={`tel:+${PHONE_MAIN}`} className="inline-flex items-center gap-2 font-medium">
            <PhoneIcon className="size-4" /> {PHONE_MAIN_DISPLAY}
          </a>
        </div>
      )}

      {problem && (
        <>
          <Bot>{m.photo}</Bot>
          <div className="pl-11">
            {photo ? (
              <div className="flex items-end justify-end gap-3">
                <button type="button" onClick={() => back("photo")} className="text-xs text-brown-soft underline-offset-4 hover:underline">
                  {m.change}
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file */}
                <img src={photo.url} alt={m.photoAlt} className="h-32 w-auto rounded-lg object-cover ring-1 ring-brown/10" />
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm text-brown ring-1 ring-brown/20 transition hover:bg-gold-light/40 hover:ring-gold">
                📷 {m.photoButton}
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pickPhoto} />
              </label>
            )}
          </div>
        </>
      )}

      {room && item && problem && photo && (
        <>
          <Bot>{m.details}</Bot>
          <form
            action={(fd) => {
              fd.set("photo", photo.file);
              formAction(fd);
            }}
            className="grid gap-4 rounded-lg bg-white/60 p-4 ring-1 ring-brown/10 sm:grid-cols-2 sm:p-5"
          >
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="room" value={room.id} />
            <input type="hidden" name="item" value={item.id} />
            <input type="hidden" name="problem" value={problem.id} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.name} *</span>
              <input name="name" required autoComplete="name" className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.suite} *</span>
              <input name="suite" required inputMode="numeric" className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.phone} *</span>
              <input name="phone" type="tel" required autoComplete="tel" className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{m.email} *</span>
              <input name="email" type="email" required autoComplete="email" className={field} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">{m.note}</span>
              <input name="note" className={field} placeholder={m.noteHint} />
            </label>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input name="access" type="checkbox" className="size-4 accent-[#3b2a20]" />
              {m.access}
            </label>
            {(state.status === "invalid" || state.status === "error") && (
              <p className="text-sm text-red-800 sm:col-span-2" role="alert">
                {state.status === "invalid" ? m.invalid : m.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-sm bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-brown-deep transition hover:bg-gold-light disabled:opacity-60 sm:col-span-2"
            >
              {pending ? m.sending : m.submit}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

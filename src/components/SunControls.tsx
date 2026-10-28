"use client";

import { useEffect } from "react";
import type { Dictionary, Locale } from "@/i18n/dictionaries";
import { SEASONS, clockLabel, compassWord, daylight, sunAt, type Season } from "@/lib/sun";

type Props = {
  t: Dictionary;
  locale: Locale;
  topFacing: number;
  season: Season;
  setSeason: (s: Season) => void;
  clock: number;
  setClock: (c: number | ((c: number) => number)) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
};

// Compass, season and time of day for the sunlight view of the floor plan.
export function SunControls({ t, locale, topFacing, season, setSeason, clock, setClock, playing, setPlaying }: Props) {
  const s = t.explorer.sun;
  const { alt, az } = sunAt(season, clock);
  const [rise, set] = daylight(season);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setClock((c) => {
        if (c >= set) {
          setPlaying(false);
          return c;
        }
        return Math.min(set, c + 1 / 6);
      });
    }, 70);
    return () => window.clearInterval(id);
  }, [playing, set, setClock, setPlaying]);

  const play = () => {
    if (playing) return setPlaying(false);
    if (clock >= set - 0.2 || clock < rise) setClock(rise);
    setPlaying(true);
  };

  return (
    <div className="mt-3 rounded-md bg-cream-deep p-3 ring-1 ring-brown/10 sm:p-4">
      <div className="flex items-center gap-4">
        <Compass topFacing={topFacing} az={az} up={alt > 0} label={s.north} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5" role="group">
            {SEASONS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={k === season}
                onClick={() => setSeason(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${k === season ? "bg-brown text-cream ring-brown" : "bg-cream text-brown ring-brown/20 hover:ring-brown/40"}`}
              >
                {s.seasons[k]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={play}
              aria-label={playing ? s.pause : s.play}
              title={playing ? s.pause : s.play}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-action text-white transition hover:bg-action-deep"
            >
              {playing ? (
                <svg viewBox="0 0 12 12" className="size-3" fill="currentColor"><rect x="2" y="1.5" width="3" height="9" /><rect x="7" y="1.5" width="3" height="9" /></svg>
              ) : (
                <svg viewBox="0 0 12 12" className="ml-0.5 size-3" fill="currentColor"><path d="M2.5 1.5v9l8-4.5z" /></svg>
              )}
            </button>
            <input
              type="range"
              min={300}
              max={1260}
              step={10}
              value={Math.round(clock * 60)}
              onChange={(e) => {
                setPlaying(false);
                setClock(Number(e.target.value) / 60);
              }}
              aria-label={s.time}
              className="w-full accent-[#a8875a]"
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-brown" aria-live="polite">
        {alt > 0 ? s.now(clockLabel(clock, locale), compassWord(az, locale), Math.round(alt)) : `${clockLabel(clock, locale)} · ${s.night}`}
      </p>
      <p className="mt-0.5 text-xs text-brown-soft">{s.litHint}</p>
    </div>
  );
}

// North arrow turned to match the drawing, with the sun on its ring.
function Compass({ topFacing, az, up, label }: { topFacing: number; az: number; up: boolean; label: string }) {
  const north = -topFacing;
  const sun = az - topFacing;
  return (
    <svg viewBox="-38 -38 76 76" className="size-20 shrink-0" aria-hidden>
      <circle r={27} fill="#faf8f5" stroke="#d8cfc3" strokeWidth={1.5} />
      <rect x={-11} y={-6} width={22} height={12} rx={1.5} fill="#e8e2da" stroke="#503d32" strokeWidth={1.2} />
      <g transform={`rotate(${north})`}>
        <path d="M0 -25 L4 -15 L-4 -15 Z" fill="#503d32" />
        <text y={-29} textAnchor="middle" fontSize={8} fontWeight={600} fill="#503d32">
          {label}
        </text>
      </g>
      {up && (
        <g transform={`rotate(${sun}) translate(0 -21)`}>
          <circle r={5.5} fill="#f2c14e" stroke="#fff" strokeWidth={1.5} />
        </g>
      )}
    </svg>
  );
}

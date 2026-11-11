"use client";

import { useSyncExternalStore } from "react";

// The theme lives on <html data-admin-theme>, set before the page paints (admin/layout.tsx).
const subscribe = (onChange: () => void) => {
  const watch = new MutationObserver(onChange);
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-admin-theme"] });
  return () => watch.disconnect();
};
const isDark = () => document.documentElement.dataset.adminTheme === "dark";

// Light or dark admin, remembered on this computer.
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const toggle = () => {
    const next = !dark;
    if (next) document.documentElement.dataset.adminTheme = "dark";
    else delete document.documentElement.dataset.adminTheme;
    try {
      localStorage.setItem("elora-admin-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex size-11 items-center justify-center rounded-md bg-white ring-1 ring-brown/20 transition hover:ring-brown/40"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" className="size-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5 text-brown" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}

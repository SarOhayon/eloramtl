"use client";

import { useEffect, useState } from "react";
import { ChevronIcon } from "./icons";

// Arrow that appears near the bottom of the page and scrolls back to the top. `raised` lifts it
// above the chat button (bottom right).
export function BackToTop({ label, raised = false }: { label: string; raised?: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-5 z-30 inline-flex size-12 items-center justify-center rounded-full bg-cream text-brown shadow-lg shadow-black/15 ring-1 ring-brown/15 transition duration-300 hover:bg-cream-deep sm:right-6 ${raised ? "bottom-[9.5rem] sm:bottom-[5.75rem]" : "bottom-20 sm:bottom-6"} ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ChevronIcon dir="up" className="size-5" />
    </button>
  );
}

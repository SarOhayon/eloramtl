"use client";

import { useEffect } from "react";
import { track } from "./track";

// Counts one visit per browser session, and clicks on WhatsApp and phone links.
export function Tracker() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("elora-visit")) {
        sessionStorage.setItem("elora-visit", "1");
        track("visit");
      }
    } catch {
      track("visit");
    }
    const onClick = (e: MouseEvent) => {
      const href = (e.target as Element | null)?.closest("a")?.getAttribute("href") ?? "";
      if (href.includes("wa.me/")) track("whatsapp");
      else if (href.startsWith("tel:")) track("call");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

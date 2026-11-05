// Counts a visitor event for the admin's visitor numbers (see /api/track).
export function track(event: "visit" | "promo" | "claim" | "whatsapp" | "call") {
  try {
    if (!navigator.sendBeacon?.("/api/track", event)) void fetch("/api/track", { method: "POST", body: event, keepalive: true });
  } catch {}
}

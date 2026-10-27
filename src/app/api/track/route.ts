import { runDueJobs } from "@/lib/jobs";
import { countEvent, type StatEvent } from "@/lib/stats";

// Visitor numbers from the browser (forms and bookings are counted on the server instead).
const FROM_BROWSER: StatEvent[] = ["visit", "promo", "claim", "whatsapp", "call"];
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless/i;

export async function POST(request: Request) {
  const event = (await request.text()).trim() as StatEvent;
  if (FROM_BROWSER.includes(event) && !BOT.test(request.headers.get("user-agent") ?? "")) {
    await countEvent(event);
    // Visits also send any scheduled emails that are due (follow-ups, Monday summary).
    await runDueJobs().catch((err) => console.error("[jobs] failed", err));
  }
  return new Response(null, { status: 204 });
}

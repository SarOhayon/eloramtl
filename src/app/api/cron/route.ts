import { timingSafeEqual } from "node:crypto";
import { runDueJobs } from "@/lib/jobs";

// Optional: an outside scheduler (e.g. cron-job.org, hourly) can call
// /api/cron?key=<CRON_SECRET> so scheduled emails go out on time even when nobody visits.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const key = Buffer.from(new URL(request.url).searchParams.get("key") ?? "");
  if (!secret || key.length !== secret.length || !timingSafeEqual(key, Buffer.from(secret))) return new Response("Forbidden", { status: 403 });
  await runDueJobs({ force: true });
  return Response.json({ ok: true });
}

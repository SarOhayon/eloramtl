"use server";

import { isAdmin } from "@/lib/adminAuth";
import { recentCounts, type DayCounts } from "@/lib/stats";

export async function getStats(days: number): Promise<{ date: string; counts: DayCounts }[] | null> {
  if (!(await isAdmin())) return null;
  return recentCounts(Math.min(Math.max(Math.round(days) || 7, 1), 90));
}

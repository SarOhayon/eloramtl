import type { Lead, LeadStatus } from "./leads";

// An open inquiry whose status hasn't changed in a few days shows in Inquiries → To follow up.
export const FOLLOW_UP_AFTER_DAYS = 4;
const OPEN: LeadStatus[] = ["new", "contacted", "toured"];

export const daysSinceUpdate = (l: Lead, now: number) => Math.floor((now - Date.parse(l.statusAt ?? l.createdAt)) / 864e5);
export const needsFollowUp = (l: Lead, now: number) => OPEN.includes(l.status) && daysSinceUpdate(l, now) >= FOLLOW_UP_AFTER_DAYS;

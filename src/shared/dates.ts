/**
 * Shared date helpers built on date-fns — keep formatting consistent
 * across server (SEO/edition) and client (templates, audit, history).
 */
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  formatISO,
  getDayOfYear,
  isValid,
  parseISO,
} from "date-fns";

export type DateInput = Date | string | number;

function toDate(value: DateInput): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const fromEpoch = new Date(Number(trimmed));
    return isValid(fromEpoch) ? fromEpoch : null;
  }
  const iso = parseISO(trimmed);
  if (isValid(iso)) return iso;
  const fallback = new Date(trimmed);
  return isValid(fallback) ? fallback : null;
}

/** Broadsheet masthead: "Friday, 17 October 2026" (UTC calendar day). */
export function formatDateline(value: DateInput = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  return format(d, "EEEE, d MMMM yyyy");
}

/** Short issued stamp: "17 Oct 2026". */
export function formatIssued(value: DateInput = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  return format(d, "d MMM yyyy");
}

/** Long document date (letter / library insert): "17 October 2026". */
export function formatLongDate(value: DateInput = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  return format(d, "d MMMM yyyy");
}

/** Sitemap / ISO calendar day: "2026-10-17". */
export function formatIsoDay(value: DateInput = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  return formatISO(d, { representation: "date" });
}

/** Audit / doc list: "Oct 17, 14:32:05". */
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return typeof value === "string" ? value : "";
  return format(d, "MMM d, HH:mm:ss");
}

/** History panel clock: "14:32:05". */
export function formatTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return typeof value === "string" ? value : "";
  return format(d, "HH:mm:ss");
}

/** Compact relative age: "12s" / "5m" / "3h" / "2d". */
export function formatRelativeShort(value: DateInput, now: DateInput = new Date()): string {
  const d = toDate(value);
  const n = toDate(now);
  if (!d || !n) return typeof value === "string" ? value : "";
  const sec = Math.max(0, differenceInSeconds(n, d));
  if (sec < 60) return `${sec}s`;
  const min = differenceInMinutes(n, d);
  if (min < 60) return `${min}m`;
  const hr = differenceInHours(n, d);
  if (hr < 24) return `${hr}h`;
  return `${differenceInDays(n, d)}d`;
}

/** Day-of-year as zero-padded edition number ("290"). */
export function formatEditionNumber(value: DateInput = new Date()): string {
  const d = toDate(value);
  if (!d) return "000";
  return String(getDayOfYear(d)).padStart(3, "0");
}

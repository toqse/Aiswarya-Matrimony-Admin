import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `trailingSlash: true` in Next can surface a trailing `/` from `usePathname()`. */
export function withoutTrailingSlash(path: string): string {
  if (path.length <= 1) return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function isDashboardPath(path: string): boolean {
  const p = withoutTrailingSlash(path);
  return p === "/dashboard" || p.startsWith("/dashboard/");
}

/** True when we should render a real `<img>` — avoids flashing stock demo URLs on refresh. */
export function isUsableProfilePhotoUrl(url: string | null | undefined): boolean {
  const t = typeof url === "string" ? url.trim() : "";
  if (!t) return false;
  if (t.includes("images.unsplash.com")) return false;
  return true;
}

/** Parse API / ISO / numeric epoch (seconds or ms) into a local `Date`. */
export function parseApiDate(input: unknown): Date | null {
  if (input instanceof Date)
    return Number.isNaN(input.getTime()) ? null : input;
  if (input === null || input === undefined) return null;

  if (typeof input === "number" && Number.isFinite(input)) {
    const ms = input < 1e12 ? input * 1000 : input;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;

    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = Number(s);
      if (!Number.isFinite(n)) return null;
      const ms = n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    let normalized = s.replace(" ", "T");
    normalized = normalized.replace(/(\.\d{3})\d+/, "$1");
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) return d;

    const d2 = new Date(s);
    return Number.isNaN(d2.getTime()) ? null : d2;
  }

  return null;
}

/** Display calendar date as DD/MM/YYYY. Non-parseable strings are returned as-is (e.g. relative phrases). */
export function formatDateDdMmYyyy(input: unknown): string {
  const d =
    input instanceof Date && !Number.isNaN(input.getTime())
      ? input
      : parseApiDate(input);
  if (!d || Number.isNaN(d.getTime())) {
    if (typeof input === "string" && input.trim()) return input.trim();
    return "—";
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** DD/MM/YYYY plus local time (12-hour), for timestamps. */
export function formatDateTimeDdMmYyyy(input: unknown): string {
  const d =
    input instanceof Date && !Number.isNaN(input.getTime())
      ? input
      : parseApiDate(input);
  if (!d || Number.isNaN(d.getTime())) {
    if (typeof input === "string" && input.trim()) return input.trim();
    return "—";
  }
  const datePart = formatDateDdMmYyyy(d);
  const timePart = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

/** 24h HH:MM or HH:MM:SS → 12h for birth-time display; other strings returned trimmed. */
export function formatTimeOfBirthDisplay(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "—";
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(t);
  if (!m) return t;
  const hour24 = Number(m[1]);
  const minute = m[2];
  const meridian = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${meridian}`;
}

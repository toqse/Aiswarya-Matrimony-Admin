function pad(n: number | string): string {
  return String(n).padStart(2, "0");
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

/**
 * Format a date-only string as dd/mm/yyyy without `new Date(...)`.
 * Profile API DOB is DD-MM-YYYY; engines treat `new Date("06-03-2000")` as US MM-DD and swap.
 */
function formatDateOnlyString(raw: string, sep: "/" | "-" = "/"): string | null {
  const s = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (!isValidYmd(year, month, day)) return null;
    return `${iso[3]}${sep}${iso[2]}${sep}${iso[1]}`;
  }
  // Day-first: 6/3/2000, 06-03-2000, 06/03/2000 — never US MM/DD.
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    if (!isValidYmd(year, month, day)) return null;
    return `${pad(day)}${sep}${pad(month)}${sep}${year}`;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** dd/mm/yyyy. Accepts Date | ISO string | yyyy-mm-dd | dd-mm-yyyy | epoch. Returns "—" if invalid/empty. */
export function formatDate(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") {
    const formatted = formatDateOnlyString(value, "/");
    if (formatted) return formatted;
  }
  const d = toDate(value);
  if (!d) return typeof value === "string" ? value : "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** HH:mm (24h). Returns "—" if invalid/empty. */
export function formatTime(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = toDate(value);
  if (!d) return typeof value === "string" ? value : "—";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** dd-mm-yyyy for chart centre panel (matches Kerala jathakam printouts). */
export function formatDateDdMmYyyyDash(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const formatted = formatDateOnlyString(value, "-");
    if (formatted) return formatted;
    if (value.trim()) return value.trim();
  }
  const d = toDate(value);
  if (!d) return typeof value === "string" ? value : "";
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** 24h HH:MM[:SS] → 12h display for birth time. */
export function formatTimeOfBirthDisplay(raw: unknown): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(t);
  if (!m) return t;
  const hour24 = Number(m[1]);
  const minute = m[2];
  const meridian = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${meridian}`;
}

/** dd/mm/yyyy, HH:mm (24h). Date-only strings omit time. Returns "—" if invalid/empty. */
export function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") {
    const dateOnly = formatDateOnlyString(value, "/");
    if (dateOnly) return dateOnly;
  }
  const d = toDate(value);
  if (!d) return typeof value === "string" ? value : "—";
  return `${formatDate(d)}, ${formatTime(d)}`;
}

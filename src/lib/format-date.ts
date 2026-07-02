function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** dd/mm/yyyy. Accepts Date | ISO string | yyyy-mm-dd | epoch. Returns "—" if invalid/empty. */
export function formatDate(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** HH:mm (24h). Returns "—" if invalid/empty. */
export function formatTime(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** dd-mm-yyyy for chart centre panel (matches Kerala jathakam printouts). */
export function formatDateDdMmYyyyDash(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
    const dmy = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(value.trim());
    if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;
    if (value.trim()) return value.trim();
  }
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "";
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

/** dd/mm/yyyy, HH:mm (24h). Returns "—" if invalid/empty. */
export function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—";
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/** Strip to 10-digit Indian mobile (digits only, last 10 if longer). */
export function digitsOnlyMobile(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

/** Format for API: +91XXXXXXXXXX */
export function formatPhoneForApi(value: string): string {
  const d = digitsOnlyMobile(value);
  if (d.length !== 10) return d;
  return `+91${d}`;
}

/** Display: +91 XXXXXXXXXX */
export function formatPhoneDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  const raw = String(value).trim();
  if (!raw) return "—";
  const d = digitsOnlyMobile(raw);
  if (d.length === 10) return `+91 ${d}`;
  if (raw.startsWith("+91")) return `+91 ${raw.slice(3).replace(/\D/g, "").slice(-10)}`;
  return raw;
}

export function isValidIndianMobile(value: string): boolean {
  const d = digitsOnlyMobile(value);
  return /^[6-9]\d{9}$/.test(d);
}

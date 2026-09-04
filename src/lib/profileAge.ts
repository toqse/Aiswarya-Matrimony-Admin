/** Profile age must satisfy 18 <= age < 80 (completed years). */

export const PROFILE_AGE_ERROR =
  "Age must be at least 18 and less than 80 years";

export const PROFILE_AGE_HINT =
  "Must be 18 or older and younger than 80";

export function isProfileAgeLimitError(message: string): boolean {
  return /Age must be (at least|greater than) 18 and less than 80 years/i.test(
    message,
  );
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseProfileDobLocal(value: string): Date | null {
  const s = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    return dateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (dmy) {
    return dateFromParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  }
  return null;
}

function dateFromParts(y: number, mo: number, d: number): Date | null {
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function formatIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftYears(d: Date, years: number): Date {
  const next = new Date(d.getFullYear() + years, d.getMonth(), d.getDate());
  if (next.getMonth() !== d.getMonth()) {
    next.setDate(0);
  }
  return next;
}

export function calculateAge(
  isoDate: string,
  today = new Date(),
): number | null {
  const dob = parseProfileDobLocal(isoDate);
  if (!dob) return null;
  const t = startOfLocalDay(today);
  let age = t.getFullYear() - dob.getFullYear();
  if (
    t.getMonth() < dob.getMonth() ||
    (t.getMonth() === dob.getMonth() && t.getDate() < dob.getDate())
  ) {
    age -= 1;
  }
  return age;
}

/** Latest allowed DOB (youngest member): exactly 18 years old today. */
export function dobInputMax(today = new Date()): string {
  return formatIsoDateLocal(shiftYears(startOfLocalDay(today), -18));
}

/** Earliest allowed DOB (oldest member): the day after the 80th birthday. */
export function dobInputMin(today = new Date()): string {
  const eightyAgo = shiftYears(startOfLocalDay(today), -80);
  eightyAgo.setDate(eightyAgo.getDate() + 1);
  return formatIsoDateLocal(eightyAgo);
}

export function profileAgeError(
  isoDate: string,
  today = new Date(),
): string | undefined {
  if (!isoDate.trim()) return undefined;
  const dob = parseProfileDobLocal(isoDate);
  if (!dob) return "Invalid date of birth.";
  const t = startOfLocalDay(today);
  if (dob > t) return "DOB cannot be in the future";
  const age = calculateAge(isoDate, today);
  if (age == null || !(age >= 18 && age < 80)) {
    return PROFILE_AGE_ERROR;
  }
  return undefined;
}

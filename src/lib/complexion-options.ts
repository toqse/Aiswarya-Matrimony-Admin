/** Canonical complexion values accepted by profile create/update APIs. */
export const VALID_COMPLEXION_OPTIONS = [
  "Very Fair",
  "Fair",
  "Wheatish",
  "Dark",
] as const;

const COMPLEXION_ALIASES: Record<string, string> = {
  white: "Very Fair",
  medium: "Wheatish",
  "medium white": "Wheatish",
  black: "Dark",
  "wheatish brown": "Wheatish",
};

export function isValidComplexionName(name: string): boolean {
  const key = name.trim().toLowerCase();
  return VALID_COMPLEXION_OPTIONS.some((option) => option.toLowerCase() === key);
}

export function normalizeComplexionOption(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const alias = COMPLEXION_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  const exact = VALID_COMPLEXION_OPTIONS.find((option) => option.toLowerCase() === raw.toLowerCase());
  return exact ?? "";
}

export function filterValidComplexions<T extends { name: string; is_active?: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.is_active !== false && isValidComplexionName(item.name));
}

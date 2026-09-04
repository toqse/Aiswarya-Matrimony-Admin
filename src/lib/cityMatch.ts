/**
 * Normalize city names for exact / fuzzy matching (client-side).
 */

export function sanitizeCityName(raw: string): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s.'’-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

export function normalizeCityKey(raw: string): string {
  return sanitizeCityName(raw)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function editDistance(a: string, b: string): number {
  const s = normalizeCityKey(a);
  const t = normalizeCityKey(b);
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const prev = new Array(t.length + 1);
  const curr = new Array(t.length + 1);
  for (let j = 0; j <= t.length; j++) prev[j] = j;
  for (let i = 1; i <= s.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= t.length; j++) prev[j] = curr[j];
  }
  return prev[t.length];
}

export function isExactCityMatch(query: string, name: string): boolean {
  const q = normalizeCityKey(query);
  return !!q && q === normalizeCityKey(name);
}

export function isFuzzyCityMatch(query: string, name: string): boolean {
  const q = normalizeCityKey(query);
  const n = normalizeCityKey(name);
  if (!q || !n || q === n) return false;
  if (n.includes(q) || q.includes(n)) return q.length >= 3;
  const maxDist = q.length <= 4 ? 1 : q.length <= 8 ? 2 : 3;
  return editDistance(q, n) <= maxDist;
}

export type CityOption = { id: number; name: string };

export function rankCitySuggestions(
  query: string,
  options: CityOption[],
): { exact: CityOption[]; fuzzy: CityOption[]; rest: CityOption[] } {
  const q = sanitizeCityName(query);
  if (!q) {
    return { exact: [], fuzzy: [], rest: options.slice(0, 50) };
  }
  const exact: CityOption[] = [];
  const fuzzy: CityOption[] = [];
  const rest: CityOption[] = [];
  for (const opt of options) {
    if (isExactCityMatch(q, opt.name)) exact.push(opt);
    else if (isFuzzyCityMatch(q, opt.name)) fuzzy.push(opt);
    else if (normalizeCityKey(opt.name).includes(normalizeCityKey(q))) rest.push(opt);
  }
  return { exact, fuzzy, rest };
}

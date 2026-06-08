import type { ChartPlanetsMap } from "@/lib/astrologyApi";

/**
 * Fixed South Indian (Kerala-style) rāśi box order for a 4×4 grid with a 2×2 merged centre.
 * Canonical keys used for lookup after {@link normalizeChartPlanetsMap}.
 */
export const SOUTH_INDIAN_GRID_SIGNS: readonly string[] = [
  "Meena",
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Kumbha",
  "Karka",
  "Makara",
  "Simha",
  "Dhanus",
  "Vrishchika",
  "Tula",
  "Kanya",
] as const;

const normSegment = (s: string) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

/** Malayalam grid titles (Unicode) → canonical grid key (same ordering as RASI labels in §4b). */
const ML_RASI_TO_CANONICAL: Record<string, string> = {
  മീനം: "Meena",
  മേടം: "Mesha",
  ഇടവം: "Vrishabha",
  മിഥുനം: "Mithuna",
  കർക്കടകം: "Karka",
  കുംഭം: "Kumbha",
  മകരം: "Makara",
  ചിങ്ങം: "Simha",
  ധനു: "Dhanus",
  വൃശ്ചികം: "Vrishchika",
  തുലാം: "Tula",
  കന്നി: "Kanya",
};

/**
 * Alternate English / Malayalam romanization / Kerala-calendar tokens → canonical grid key.
 * Backend serializers may disagree (e.g. `mesha` vs `medam`, `Gemini` vs `Mithuna`).
 */
const RASI_VARIANT_TO_CANONICAL: Record<string, string> = (() => {
  const pairs: Array<[readonly string[], string]> = [
    [["Meena", "Meenam", "meena", "meenam", "pisces", "pisceses"], "Meena"],
    [["Mesha", "Medam", "mesha", "mesam", "medam", "mesham", "aries"], "Mesha"],
    [["Vrishabha", "Vrisha", "vrishabha", "idavam", "edavam", "taurus"], "Vrishabha"],
    [["Mithuna", "mithuna", "mithunam", "midhunam", "Gemini"], "Mithuna"],
    [["Kumbha", "Kumbham", "kumbha", "kumbham", "Aquarius"], "Kumbha"],
    [
      ["Karka", "Karkataka", "Karkida", "karka", "karkataka", "karkatakam", "kark", "karkidakam", "cancer"],
      "Karka",
    ],
    [["Makara", "makara", "makaram", "Capricorn"], "Makara"],
    [["Simha", "simha", "chingam", "simham", "leo"], "Simha"],
    [["Dhanus", "Dhanu", "dhanus", "dhanu", "saggitarius", "sagittarius"], "Dhanus"],
    [["Vrishchika", "Vrischika", "vrushchika", "vrishchika", "vrushchikam", "vrishchikam", "Scorpio"], "Vrishchika"],
    [["Tula", "Thula", "tula", "thulaam", "thulam", "tulaam", "Libra"], "Tula"],
    [["Kanya", "Kanni", "kanya", "kanni", "virgo"], "Kanya"],
  ];
  const out: Record<string, string> = {};
  for (const [aliases, canon] of pairs) {
    for (const a of aliases) {
      out[normSegment(a)] = canon;
    }
  }
  for (const c of SOUTH_INDIAN_GRID_SIGNS) {
    out[normSegment(c)] = c;
  }
  return out;
})();

function stripParenLabel(s: string): string {
  return s.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function isMalayalamScript(s: string): boolean {
  return /[\u0D00-\u0D7F]/.test(s);
}

/**
 * Map one API `planets` object key to a canonical {@link SOUTH_INDIAN_GRID_SIGNS} name, or null.
 */
export function resolveChartRasiKey(rawKey: string): string | null {
  const t = String(rawKey ?? "").trim();
  if (!t) return null;
  if (isMalayalamScript(t)) {
    const hit = ML_RASI_TO_CANONICAL[t];
    return hit ?? null;
  }
  const noParen = stripParenLabel(t);
  const tryKeys = [t, noParen, t.split(/[\s,·]+/)[0] ?? t].map((k) => normSegment(k));
  for (const k of tryKeys) {
    if (!k) continue;
    const hit = RASI_VARIANT_TO_CANONICAL[k];
    if (hit) return hit;
  }
  return null;
}

/**
 * Merge planet lists from any API key spellings into the fixed grid keys the UI renders.
 * Without this, grahas under e.g. `pisces` / `meenam` / `Gemini` never appear in any cell.
 */
export function normalizeChartPlanetsMap(raw: ChartPlanetsMap | undefined): ChartPlanetsMap {
  if (!raw || typeof raw !== "object") return {};
  const out: ChartPlanetsMap = {};
  for (const [key, bodies] of Object.entries(raw)) {
    if (!Array.isArray(bodies)) continue;
    const canon = resolveChartRasiKey(key);
    if (!canon) continue;
    if (!out[canon]) out[canon] = [];
    for (const b of bodies) {
      if (b == null) continue;
      const label = String(b).trim();
      if (label) out[canon]!.push(label);
    }
  }
  return out;
}

/** 1-based row/col for a 4×4 CSS grid; centre is rows 2–3, cols 2–3 (merged separately). */
export const SOUTH_INDIAN_CELL_RC: readonly { row: number; col: number }[] = [
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 2, col: 1 },
  { row: 2, col: 4 },
  { row: 3, col: 1 },
  { row: 3, col: 4 },
  { row: 4, col: 1 },
  { row: 4, col: 2 },
  { row: 4, col: 3 },
  { row: 4, col: 4 },
];

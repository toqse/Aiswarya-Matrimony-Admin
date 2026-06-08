/**
 * Horoscope chart i18n, types, and layout constants.
 * Render-only — no calculations; data comes from API as-is.
 */

export const MAROON = "#7a1f3d";

/** Noto Sans Malayalam (loaded in index.html) for crisp Malayalam glyphs. */
export const MALAYALAM_FONT = "'Noto Sans Malayalam', sans-serif";

export type HoroscopeLang = "en" | "ml";

export type ChartKind = "rasi" | "amsa" | "bhava";

export interface ChartPlanet {
  key: string;
  abbr: string;
  name: string;
}

export interface ChartGrid {
  lagna_sign?: number;
  sign_names?: Record<string, string>;
  houses?: Record<string, ChartPlanet[]>;
  planets?: unknown[];
}

export interface StarInfo {
  number?: number;
  name?: string;
  pada?: number;
}

export interface DasaInfo {
  lord?: string;
  balance_days?: number;
  years?: number;
  months?: number;
  days?: number;
  balance_text?: string;
}

export interface HoroscopeCharts {
  rasi?: ChartGrid | null;
  amsa?: ChartGrid | null;
  bhava?: ChartGrid | null;
  star?: StarInfo | null;
  dasa?: DasaInfo | null;
}

/**
 * Malayalam planet abbreviations — matches the Windows EXE output.
 * Keyed by the canonical planet key (used by the pr_* string parser) plus
 * legacy/aliases so backend-provided `charts.houses` keys also resolve.
 */
export const PLANET_ML: Record<string, string> = {
  // Canonical keys (pr_rasi/pr_amsa/pr_bhav string parser)
  lagnam: "ല",
  ravi: "ര",
  chandran: "ച",
  kuja: "കു",
  budhan: "ബു",
  guru: "ഗു",
  sukran: "ശു",
  sani: "ശ",
  rahu: "രാ",
  kethu: "കേ",
  maandi: "മ",
  // Legacy / backend aliases
  la: "ല",
  su: "ര",
  sun: "ര",
  mo: "ച",
  moon: "ച",
  ma: "കു",
  mars: "കു",
  me: "ബു",
  mercury: "ബു",
  ju: "ഗു",
  jupiter: "ഗു",
  ve: "ശു",
  venus: "ശു",
  sa: "ശ",
  saturn: "ശ",
  ra: "രാ",
  ke: "കേ",
  gulika: "മ",
  md: "മ",
};

/**
 * English planet abbreviations — matches the Windows EXE output.
 * Same keying scheme as PLANET_ML.
 */
export const PLANET_EN: Record<string, string> = {
  lagnam: "La",
  ravi: "Ra",
  chandran: "Ch",
  kuja: "Ku",
  budhan: "Bu",
  guru: "Gu",
  sukran: "Sk",
  sani: "Sn",
  rahu: "Ra",
  kethu: "Ke",
  maandi: "Md",
  la: "La",
  su: "Ra",
  sun: "Ra",
  mo: "Ch",
  moon: "Ch",
  ma: "Ku",
  mars: "Ku",
  me: "Bu",
  mercury: "Bu",
  ju: "Gu",
  jupiter: "Gu",
  ve: "Sk",
  venus: "Sk",
  sa: "Sn",
  saturn: "Sn",
  ra: "Ra",
  ke: "Ke",
  gulika: "Md",
  md: "Md",
};

/** Romanized full planet name, used for cell tooltips (language-neutral). */
export const PLANET_NAME: Record<string, string> = {
  lagnam: "Lagnam",
  ravi: "Ravi",
  chandran: "Chandran",
  kuja: "Kuja",
  budhan: "Budhan",
  guru: "Guru",
  sukran: "Sukran",
  sani: "Sani",
  rahu: "Rahu",
  kethu: "Kethu",
  maandi: "Maandi",
};

/** UI label translations. */
export const HOROSCOPE_LABELS: Record<HoroscopeLang, Record<string, string>> = {
  en: {
    rasi: "Rasi",
    amsa: "Amsakom",
    bhava: "Bhavom",
    star: "Star",
    pada: "Pada",
    dasa: "Dasa",
    lord: "Lord",
    latitude: "Latitude",
    longitude: "Longitude",
    time_zone: "Time Zone",
    not_calculated: "Not calculated yet",
    not_calculated_hint: "The chart will appear here once the horoscope has been calculated.",
    asc: "Asc",
    chart_type: "Chart type",
  },
  ml: {
    rasi: "രാശി",
    amsa: "അംശകം",
    bhava: "ഭാവം",
    star: "നക്ഷത്രം",
    pada: "പാദം",
    dasa: "ദശ",
    lord: "ദശാനാഥൻ",
    latitude: "അക്ഷാംശം",
    longitude: "രേഖാംശം",
    time_zone: "സമയ മേഖല",
    not_calculated: "ഇതുവരെ കണക്കാക്കിയിട്ടില്ല",
    not_calculated_hint: "ജാതകം കണക്കാക്കിയ ശേഷം ചാർട്ട് ഇവിടെ കാണാം.",
    asc: "ലഗ്നം",
    chart_type: "ചാർട്ട് തരം",
  },
};

export const CHART_TABS: Array<{ kind: ChartKind; key: string }> = [
  { kind: "rasi", key: "rasi" },
  { kind: "amsa", key: "amsa" },
  { kind: "bhava", key: "bhava" },
];

/** sign number -> CSS grid position (1-indexed column/row in a 4x4 grid). */
export const SIGN_POSITION: Record<number, { col: number; row: number }> = {
  12: { col: 1, row: 1 },
  1: { col: 2, row: 1 },
  2: { col: 3, row: 1 },
  3: { col: 4, row: 1 },
  11: { col: 1, row: 2 },
  4: { col: 4, row: 2 },
  10: { col: 1, row: 3 },
  5: { col: 4, row: 3 },
  9: { col: 1, row: 4 },
  8: { col: 2, row: 4 },
  7: { col: 3, row: 4 },
  6: { col: 4, row: 4 },
};

export const PERIMETER_SIGNS = [12, 1, 2, 3, 11, 4, 10, 5, 9, 8, 7, 6] as const;

export function t(lang: HoroscopeLang, key: string): string {
  return HOROSCOPE_LABELS[lang]?.[key] ?? HOROSCOPE_LABELS.en[key] ?? key;
}

/** Returns the planet abbreviation for the chosen language (EXE-matched). */
export function planetSymbol(planet: ChartPlanet, lang: HoroscopeLang): string {
  const k = (planet.key || "").toLowerCase();
  if (lang === "ml") return PLANET_ML[k] ?? planet.abbr;
  return PLANET_EN[k] ?? planet.abbr;
}

export function asChartGrid(value: unknown): ChartGrid | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ChartGrid;
}

export function chartHasPlanets(grid: ChartGrid | null): boolean {
  if (!grid?.houses) return false;
  return Object.values(grid.houses).some((arr) => Array.isArray(arr) && arr.length > 0);
}

/** Extracts the render-ready `charts` object from a horoscope payload, if present. */
export function extractHoroscopeCharts(horoscope: unknown): HoroscopeCharts | null {
  if (!horoscope || typeof horoscope !== "object" || Array.isArray(horoscope)) return null;
  const charts = (horoscope as Record<string, unknown>).charts;
  if (!charts || typeof charts !== "object" || Array.isArray(charts)) return null;
  return charts as HoroscopeCharts;
}

/* ------------------------------------------------------------------ *
 * EXE-matched chart building from the 11-char pr_rasi/pr_amsa/pr_bhav
 * strings. Each index is a planet; its value is a zodiac letter A-L
 * (1-12) which becomes the Kerala-grid cell number.
 * ------------------------------------------------------------------ */

/** Planet position in the 11-char chart string + EXE abbreviations. */
export const PLANET_POSITIONS: ReadonlyArray<{
  key: string;
  index: number;
  ml: string;
  en: string;
}> = [
  { key: "lagnam", index: 0, ml: "ല", en: "La" },
  { key: "ravi", index: 1, ml: "ര", en: "Ra" },
  { key: "chandran", index: 2, ml: "ച", en: "Ch" },
  { key: "kuja", index: 3, ml: "കു", en: "Ku" },
  { key: "budhan", index: 4, ml: "ബു", en: "Bu" },
  { key: "guru", index: 5, ml: "ഗു", en: "Gu" },
  { key: "sukran", index: 6, ml: "ശു", en: "Sk" },
  { key: "sani", index: 7, ml: "ശ", en: "Sn" },
  { key: "rahu", index: 8, ml: "രാ", en: "Ra" },
  { key: "kethu", index: 9, ml: "കേ", en: "Ke" },
  { key: "maandi", index: 10, ml: "മ", en: "Md" },
];

/** Zodiac letter (A-L) -> sign/cell number (1-12). */
export const RASI_CELL: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6,
  G: 7, H: 8, I: 9, J: 10, K: 11, L: 12,
};

/** Star (nakshatra) names 1-27 — index 0 unused. */
export const STAR_NAMES_ML: ReadonlyArray<string> = [
  "", "അശ്വതി", "ഭരണി", "കാർത്തിക", "രോഹിണി", "മകീര്യം",
  "തിരുവാതിര", "പുണർതം", "പൂയം", "ആയില്യം", "മകം",
  "പൂരം", "ഉത്രം", "അത്തം", "ചിത്തിര", "ചോതി", "വിശാഖം",
  "അനിഴം", "തൃക്കേട്ട", "മൂലം", "പൂരാടം", "ഉത്രാടം",
  "തിരുവോണം", "അവിട്ടം", "ചതയം", "പൂരുരുട്ടാതി",
  "ഉതൃട്ടാതി", "രേവതി",
];

export const STAR_NAMES_EN: ReadonlyArray<string> = [
  "", "Ashwini", "Bharani", "Karthika", "Rohini", "Mrigasira",
  "Thiruvathira", "Punartham", "Pooyam", "Ayilyam", "Makam",
  "Pooram", "Uthram", "Atham", "Chithra", "Chothi", "Vishakam",
  "Anizham", "Thrikketta", "Moolam", "Pooradam", "Uthradam",
  "Thiruvonam", "Avittam", "Chathayam", "Pooruruttathi",
  "Uthuruttathi", "Revathi",
];

/** Dasa lord names, keyed by canonical planet key. */
export const DASA_LORDS_ML: Record<string, string> = {
  kethu: "കേതു",
  sukran: "ശുക്രൻ",
  ravi: "രവി",
  chandran: "ചന്ദ്രൻ",
  kuja: "കുജൻ",
  rahu: "രാഹു",
  guru: "ഗുരു",
  sani: "ശനി",
  budhan: "ബുധൻ",
};

export const DASA_LORDS_EN: Record<string, string> = {
  kethu: "Ketu",
  sukran: "Venus",
  ravi: "Sun",
  chandran: "Moon",
  kuja: "Mars",
  rahu: "Rahu",
  guru: "Jupiter",
  sani: "Saturn",
  budhan: "Mercury",
};

/** Raw chart fields pulled off a horoscope record, used to build the chart. */
export interface HoroscopeChartSource {
  rasiString?: unknown;
  amsaString?: unknown;
  bhavaString?: unknown;
  starNumber?: unknown;
  starName?: unknown;
  pada?: unknown;
  dasaLord?: unknown;
  dasaBalanceText?: unknown;
}

/**
 * Builds a South-Indian chart grid from an 11-char pr_* string.
 * Planet placement and abbreviations are language-independent here
 * (planetSymbol resolves ml/en at render time via the planet key).
 */
export function parseChartGridFromString(chartString: unknown): ChartGrid | null {
  if (typeof chartString !== "string") return null;
  const s = chartString.trim().toUpperCase();
  if (!s) return null;

  const houses: Record<string, ChartPlanet[]> = {};
  let lagna_sign: number | undefined;

  for (const pos of PLANET_POSITIONS) {
    const letter = s[pos.index];
    const cellNum = letter ? RASI_CELL[letter] : undefined;
    if (!cellNum) continue;
    if (pos.key === "lagnam") lagna_sign = cellNum;
    const planet: ChartPlanet = {
      key: pos.key,
      abbr: pos.en,
      name: PLANET_NAME[pos.key] ?? pos.key,
    };
    (houses[String(cellNum)] ??= []).push(planet);
  }

  if (Object.keys(houses).length === 0) return null;
  return { lagna_sign, houses };
}

/** Normalizes any spelling of a dasa lord to a canonical planet key. */
function normalizeDasaKey(value: unknown): string {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "";
  if (/(kethu|ketu)/.test(s)) return "kethu";
  if (/(sukran|sukra|shukra|venus)/.test(s)) return "sukran";
  if (/(ravi|surya|soorya|sun)/.test(s)) return "ravi";
  if (/(chandr|moon)/.test(s)) return "chandran";
  if (/(kuja|mangal|chevvai|sevvai|mars)/.test(s)) return "kuja";
  if (/(rahu)/.test(s)) return "rahu";
  if (/(guru|jupiter|brihaspati|vyaza)/.test(s)) return "guru";
  if (/(sani|shani|saturn)/.test(s)) return "sani";
  if (/(budha|mercury)/.test(s)) return "budhan";
  return s;
}

/** Formats the star (nakshatra) display for the chosen language. */
export function formatStarDisplay(
  source: HoroscopeChartSource,
  lang: HoroscopeLang,
): StarInfo | null {
  const names = lang === "ml" ? STAR_NAMES_ML : STAR_NAMES_EN;
  const n = Number(source.starNumber);
  let name = "";
  let number: number | undefined;
  if (Number.isInteger(n) && n >= 1 && n <= 27) {
    name = names[n];
    number = n;
  } else if (typeof source.starName === "string" && source.starName.trim()) {
    name = source.starName.trim();
  }
  const padaNum = Number(source.pada);
  const pada = Number.isFinite(padaNum) && padaNum > 0 ? padaNum : undefined;
  if (!name && pada === undefined) return null;
  return { name, number, pada };
}

/** Formats the dasa balance + lord display for the chosen language. */
export function formatDasaDisplay(
  source: HoroscopeChartSource,
  lang: HoroscopeLang,
): DasaInfo | null {
  const map = lang === "ml" ? DASA_LORDS_ML : DASA_LORDS_EN;
  const key = normalizeDasaKey(source.dasaLord);
  const lord =
    (key && map[key]) ||
    (typeof source.dasaLord === "string" && source.dasaLord.trim()
      ? source.dasaLord.trim()
      : undefined);
  const balance_text =
    typeof source.dasaBalanceText === "string" && source.dasaBalanceText.trim()
      ? source.dasaBalanceText.trim()
      : undefined;
  if (!lord && !balance_text) return null;
  return { lord, balance_text };
}

/** True when at least one pr_* chart string is present in the source. */
export function hasChartSource(source: HoroscopeChartSource | null | undefined): boolean {
  if (!source) return false;
  return [source.rasiString, source.amsaString, source.bhavaString].some(
    (s) => typeof s === "string" && s.trim().length > 0,
  );
}

/** Builds the full render-ready charts object from raw pr_* source fields. */
export function buildChartsFromSource(
  source: HoroscopeChartSource,
  lang: HoroscopeLang,
): HoroscopeCharts {
  return {
    rasi: parseChartGridFromString(source.rasiString),
    amsa: parseChartGridFromString(source.amsaString),
    bhava: parseChartGridFromString(source.bhavaString),
    star: formatStarDisplay(source, lang),
    dasa: formatDasaDisplay(source, lang),
  };
}

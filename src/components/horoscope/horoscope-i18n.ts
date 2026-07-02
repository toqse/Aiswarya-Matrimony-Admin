/**
 * Horoscope chart i18n, types, and layout constants.
 * Render-only — no calculations; data comes from API as-is.
 */

export const MAROON = "#7a1f3d";

/** Noto Sans Malayalam (loaded in index.html) for crisp Malayalam glyphs. */
export const MALAYALAM_FONT = "'Noto Sans Malayalam', sans-serif";

/**
 * Traditional Malayalam font for chart cells — matches the EXE's old-style
 * glyph forms (Anjali Old Lipi / Karthika family). Used only inside chart
 * cells so planet abbreviations visually match the desktop EXE output.
 */
export const MALAYALAM_CHART_FONT =
  "'Anjali Old Lipi', 'AnjaliOldLipi', 'Rachana', 'Meera', 'Karthika', 'ML-TT Karthika', 'Noto Sans Malayalam', serif";

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

/**
 * Finalized display strings produced by the backend. The UI renders these
 * verbatim — it never recomputes star/dasa/lagnam/rasi values. Backend is the
 * single source of truth.
 */
export interface HoroscopeDisplay {
  /** Profile name shown at top of chart centre panel. */
  name?: string;
  /** ISO or yyyy-mm-dd date of birth. */
  date_of_birth?: string;
  /** Birth time (24h HH:MM[:SS] or display string). */
  time_of_birth?: string;
  star_display?: string;
  /** Nakshatra pada (1–4) for centre-panel formatting. */
  nakshatra_pada?: number | string;
  dasa_display?: string;
  dasa_lord?: string;
  lagnam_display?: string;
  rasi_display?: string;
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
  sani: "മ",
  rahu: "സ",
  kethu: "ശി",
  maandi: "മാ",
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
  sa: "മ",
  saturn: "മ",
  ra: "സ",
  ke: "ശി",
  gulika: "മാ",
  md: "മാ",
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
    center_dob: "DOB",
    center_tob: "Time",
    center_nathan: "Lord",
    center_lagna: "Lagna",
    center_rasi: "Rasi",
    latitude: "Latitude",
    longitude: "Longitude",
    time_zone: "Time Zone",
    not_calculated: "Not calculated yet",
    not_calculated_hint: "The chart will appear here once the horoscope has been calculated.",
    asc: "Asc",
    chart_type: "Chart type",
    overall_match: "Overall match",
    porutham_details: "Porutham Details",
    uthamam: "Uthamam",
    madhyamam: "Madhyamam",
    adhamam: "Adhamam",
    dosham_compatibility: "Dosham & Compatibility",
    bride: "Bride",
    groom: "Groom",
    remaining: "Remaining",
  },
  ml: {
    rasi: "രാശി",
    amsa: "അംശകം",
    bhava: "ഭാവം",
    star: "നക്ഷത്രം",
    pada: "പാദം",
    dasa: "ദശ",
    lord: "ദശാനാഥൻ",
    center_dob: "ജനന തീയതി",
    center_tob: "ജനന സമയം",
    center_nathan: "നാഥൻ",
    center_lagna: "ലഗ്നം",
    center_rasi: "രാശി",
    latitude: "അക്ഷാംശം",
    longitude: "രേഖാംശം",
    time_zone: "സമയ മേഖല",
    not_calculated: "ഇതുവരെ കണക്കാക്കിയിട്ടില്ല",
    not_calculated_hint: "ജാതകം കണക്കാക്കിയ ശേഷം ചാർട്ട് ഇവിടെ കാണാം.",
    asc: "ലഗ്നം",
    chart_type: "ചാർട്ട് തരം",
    overall_match: "മൊത്തം പൊരുത്തം",
    porutham_details: "പൊരുത്തം വിശദാംശങ്ങൾ",
    uthamam: "ഉത്തമം",
    madhyamam: "മധ്യമം",
    adhamam: "അധമം",
    dosham_compatibility: "ദോഷം & പൊരുത്തം",
    bride: "വധു",
    groom: "വരൻ",
    remaining: "ബാക്കി",
  },
};

export function poruthamsMatchedSummary(
  lang: HoroscopeLang,
  matched: number,
  total: number,
): string {
  return lang === "ml"
    ? `${total} ൽ ${matched} പൊരുത്തങ്ങൾ`
    : `${matched} out of ${total} poruthams matched`;
}

/** Porutham row labels keyed by normalized API field name (display only). */
const PORUTHAM_ROW_LABELS: Record<HoroscopeLang, Record<string, string>> = {
  en: {
    dinam: "Dinam",
    dina: "Dinam",
    din: "Dinam",
    ganam: "Ganam",
    gana: "Ganam",
    mahendra: "Mahendram",
    mahendram: "Mahendram",
    sthree_deerga: "Sthree Deergham",
    sthree_deergha: "Sthree Deergham",
    sthreedeergha: "Sthree Deergham",
    sthree_deergham: "Sthree Deergham",
    streedeerga: "Sthree Deergham",
    yoni: "Yoni",
    yonim: "Yoni",
    rasi: "Rasi",
    rashi: "Rasi",
    rasyadhipam: "Rasyadhipathi",
    rasi_adhipathi: "Rasyadhipathi",
    rasiyadhipathy: "Rasyadhipathi",
    rasiadhipathi: "Rasyadhipathi",
    rasyadhipathi: "Rasyadhipathi",
    vasyam: "Vasyam",
    vasya: "Vasyam",
    rajju_dosham: "Rajju",
    rajju: "Rajju",
    rajjus: "Rajju",
    vedha_dosham: "Vedha",
    vedha: "Vedha",
    vedham: "Vedha",
  },
  ml: {
    dinam: "ദിനം",
    dina: "ദിനം",
    din: "ദിനം",
    ganam: "ഗണം",
    gana: "ഗണം",
    mahendra: "മഹേന്ദ്രം",
    mahendram: "മഹേന്ദ്രം",
    sthree_deerga: "സ്ത്രീദീർഘം",
    sthree_deergha: "സ്ത്രീദീർഘം",
    sthreedeergha: "സ്ത്രീദീർഘം",
    sthree_deergham: "സ്ത്രീദീർഘം",
    streedeerga: "സ്ത്രീദീർഘം",
    yoni: "യോനി",
    yonim: "യോനി",
    rasi: "രാശി",
    rashi: "രാശി",
    rasyadhipam: "രാശ്യാധിപതി",
    rasi_adhipathi: "രാശ്യാധിപതി",
    rasiyadhipathy: "രാശ്യാധിപതി",
    rasiadhipathi: "രാശ്യാധിപതി",
    rasyadhipathi: "രാശ്യാധിപതി",
    vasyam: "വശ്യം",
    vasya: "വശ്യം",
    rajju_dosham: "രജ്ജു ദോഷം",
    rajju: "രജ്ജു ദോഷം",
    rajjus: "രജ്ജു ദോഷം",
    vedha_dosham: "വേധം",
    vedha: "വേധം",
    vedham: "വേധം",
    chovva_dosham: "കുജ ദോഷം",
    kuja_dosham: "കുജ ദോഷം",
    mangal_dosham: "കുജ ദോഷം",
    dasa_sandhi: "ദശാ സന്ധി",
    dasasandhi: "ദശാ സന്ധി",
    papa_samyam: "പാപം സാമ്യം",
    papam_samyam: "പാപം സാമ്യം",
    papam_samyom: "പാപം സാമ്യം",
  },
};

/** Dosha / compatibility row labels (display only). */
export const DOSHA_LABELS_I18N: Record<HoroscopeLang, Record<string, string>> = {
  en: {
    chovva_dosham: "Kuja Dosham (Chovva)",
    papa_samyam: "Papa Samyam",
    dasa_sandhi: "Dasa Sandhi",
  },
  ml: {
    chovva_dosham: "കുജ ദോഷം",
    kuja_dosham: "കുജ ദോഷം",
    mangal_dosham: "കുജ ദോഷം",
    papa_samyam: "പാപം സാമ്യം",
    papam_samyam: "പാപം സാമ്യം",
    dasa_sandhi: "ദശാ സന്ധി",
  },
};

function normalizePoruthamKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z]/g, "");
}

/** Resolve a porutham row label for the chosen language (no effect on matching logic). */
export function poruthamRowLabel(
  lang: HoroscopeLang,
  key: string,
  fallback: string,
): string {
  const norm = normalizePoruthamKey(key);
  return (
    PORUTHAM_ROW_LABELS[lang][norm] ??
    PORUTHAM_ROW_LABELS[lang][key] ??
    DOSHA_LABELS_I18N[lang][key] ??
    DOSHA_LABELS_I18N[lang][norm] ??
    fallback
  );
}

/** Resolve a dosha-check label for the chosen language. */
export function doshaCheckLabel(
  lang: HoroscopeLang,
  key: string,
  fallback: string,
): string {
  return DOSHA_LABELS_I18N[lang][key] ?? fallback;
}

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

function alreadyMalayalamScript(value: string): boolean {
  return /[\u0D00-\u0D7F]/.test(value);
}

/** English graha / dasa-lord names → Malayalam (Kerala jathakam style). */
const GRAHA_EN_TO_ML: Record<string, string> = {
  sun: "രവി",
  ravi: "രവി",
  surya: "രവി",
  moon: "ചന്ദ്രൻ",
  chandra: "ചന്ദ്രൻ",
  chandran: "ചന്ദ്രൻ",
  mars: "കുജൻ",
  mangal: "കുജൻ",
  kuja: "കുജൻ",
  mercury: "ബുധൻ",
  budhan: "ബുധൻ",
  budha: "ബുധൻ",
  jupiter: "ഗുരു",
  guru: "ഗുരു",
  venus: "ശുക്രൻ",
  sukran: "ശുക്രൻ",
  shukra: "ശുക്രൻ",
  saturn: "ശനി",
  sani: "ശനി",
  shani: "ശനി",
  rahu: "രാഹു",
  ketu: "കേതു",
  kethu: "കേതു",
};

/** Extra nakshatra spellings (API / EXE) → STAR_NAMES_EN index. */
const STAR_ALIAS_TO_INDEX: Record<string, number> = {
  ashwini: 1,
  aswini: 1,
  krithika: 3,
  krittika: 3,
  mrigashira: 5,
  ardra: 6,
  pushya: 8,
  pooyam: 8,
  ashlesha: 9,
  ayilyam: 9,
  aayilyam: 9,
  magha: 10,
  makam: 10,
  hasta: 13,
  atham: 13,
  chitra: 14,
  chithira: 14,
  chithra: 14,
  swati: 15,
  chothi: 15,
  vishakha: 16,
  vishakham: 16,
  anuradha: 17,
  anizham: 17,
  jyeshtha: 18,
  jyeshta: 18,
  thrikketta: 18,
  mula: 19,
  moolam: 19,
  pooradam: 20,
  uthradam: 21,
  uthramadam: 21,
  shravana: 22,
  sravana: 22,
  thiruvonam: 22,
  dhanishta: 23,
  avittam: 23,
  shatabhisha: 24,
  chathayam: 24,
  revati: 27,
};

export function localizeStarName(name: string | undefined | null, lang: HoroscopeLang): string {
  const raw = (name ?? "").trim();
  if (!raw || lang !== "ml" || alreadyMalayalamScript(raw)) return raw;
  const base = raw.replace(/\s*\(\d+\)\s*$/, "").trim();
  const norm = base.toLowerCase();
  let idx = STAR_NAMES_EN.findIndex((n, i) => i > 0 && n.toLowerCase() === norm);
  if (idx < 0) idx = STAR_ALIAS_TO_INDEX[norm] ?? 0;
  if (idx > 0) return STAR_NAMES_ML[idx] ?? raw;
  return raw;
}

export function localizeSignName(name: string | undefined | null, lang: HoroscopeLang): string {
  const raw = (name ?? "").trim();
  if (!raw || lang !== "ml" || alreadyMalayalamScript(raw)) return raw;
  const norm = raw.toLowerCase();
  const idx = SIGN_NAMES_EN.findIndex((n, i) => i > 0 && n.toLowerCase() === norm);
  if (idx > 0) return SIGN_NAMES_ML[idx] ?? raw;
  const aliases: Record<string, number> = {
    karka: 4,
    karkataka: 4,
    cancer: 4,
    simha: 5,
    leo: 5,
    kanya: 6,
    virgo: 6,
    tula: 7,
    libra: 7,
    vrischika: 8,
    scorpio: 8,
    dhanus: 9,
    sagittarius: 9,
    makaram: 10,
    capricorn: 10,
    kumbham: 11,
    aquarius: 11,
    meenam: 12,
    pisces: 12,
    mesha: 1,
    aries: 1,
    vrishabha: 2,
    taurus: 2,
    mithuna: 3,
    gemini: 3,
    midhunam: 3,
  };
  const aliasIdx = aliases[norm];
  if (aliasIdx) return SIGN_NAMES_ML[aliasIdx] ?? raw;
  return raw;
}

export function localizeGrahaName(name: string | undefined | null, lang: HoroscopeLang): string {
  const raw = (name ?? "").trim();
  if (!raw || lang !== "ml" || alreadyMalayalamScript(raw)) return raw;
  const norm = raw.toLowerCase();
  if (GRAHA_EN_TO_ML[norm]) return GRAHA_EN_TO_ML[norm];
  const lordKey = Object.entries(DASA_LORDS_EN).find(([, v]) => v.toLowerCase() === norm)?.[0];
  if (lordKey) return DASA_LORDS_ML[lordKey] ?? raw;
  return raw;
}

function formatDasaDurationMalayalam(years: string, months: string, days: string): string {
  return `${String(years).padStart(2, "0")} വർഷം ${String(months).padStart(2, "0")} മാസം ${String(days).padStart(2, "0")} ദിവസം`;
}

/** "09y 08m 15d" → "09 വർഷം 08 മാസം 15 ദിവസം" (Kerala jathakam printout). */
export function localizeDasaDuration(raw: string | undefined | null, lang: HoroscopeLang): string {
  const s = (raw ?? "").trim();
  if (!s || lang !== "ml") return s;

  const mlYmd = s.match(/(\d+)\s*വർഷം\s*(\d+)\s*മാസം\s*(\d+)\s*ദിവസം/u);
  if (mlYmd) {
    return formatDasaDurationMalayalam(mlYmd[1]!, mlYmd[2]!, mlYmd[3]!);
  }

  const ymd = s.match(
    /(\d+)\s*y(?:ears?)?[.\s]*(\d+)\s*m(?:onths?)?[.\s]*(\d+)\s*d(?:ays?)?/i,
  );
  if (ymd) {
    return formatDasaDurationMalayalam(ymd[1]!, ymd[2]!, ymd[3]!);
  }

  return s;
}

/** Malayalam centre-panel values when lang is ml (star, lord, dasa, lagnam, rasi). */
export function localizeHoroscopeDisplay(
  display: HoroscopeDisplay | null | undefined,
  lang: HoroscopeLang,
): HoroscopeDisplay | null {
  if (!display) return null;
  if (lang !== "ml") return display;
  return {
    ...display,
    star_display: display.star_display
      ? localizeStarName(display.star_display, lang)
      : display.star_display,
    dasa_lord: display.dasa_lord ? localizeGrahaName(display.dasa_lord, lang) : display.dasa_lord,
    dasa_display: display.dasa_display
      ? localizeDasaDuration(display.dasa_display, lang)
      : display.dasa_display,
    lagnam_display: display.lagnam_display
      ? localizeSignName(display.lagnam_display, lang)
      : display.lagnam_display,
    rasi_display: display.rasi_display
      ? localizeSignName(display.rasi_display, lang)
      : display.rasi_display,
  };
}

/** Centre-panel star line: "Rohini - Pada 4" / "രോഹിണി - പാദം 4". */
export function formatChartStarLine(
  starDisplay: string | undefined,
  pada: unknown,
  lang: HoroscopeLang,
): string {
  const star = localizeStarName((starDisplay ?? "").trim(), lang);
  if (!star) return "";
  const p = Number(pada);
  if (!Number.isFinite(p) || p <= 0) return star;
  return `${star} - ${t(lang, "pada")} ${p}`;
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
  { key: "sani", index: 7, ml: "മ", en: "Sn" },
  { key: "rahu", index: 8, ml: "സ", en: "Ra" },
  { key: "kethu", index: 9, ml: "ശി", en: "Ke" },
  { key: "maandi", index: 10, ml: "മാ", en: "Md" },
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

/** Kerala rasi names 1–12 — index 0 unused (matches backend RASI_NAMES). */
export const RASI_NAMES_EN: ReadonlyArray<string> = [
  "", "Medam", "Edavam", "Midhunam", "Kadakam", "Chingam", "Kanni",
  "Thulam", "Vrischikam", "Dhanu", "Makaram", "Kumbham", "Meenam",
];

/** Dasa-lord names keyed by canonical planet key (EXE-matched). */
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

/** Romanized dasa-lord names (uppercase) — matches the legacy EXE (e.g. RAHU, SANI). */
export const DASA_LORDS_EN: Record<string, string> = {
  kethu: "KETHU",
  sukran: "SUKRAN",
  ravi: "RAVI",
  chandran: "CHANDRAN",
  kuja: "KUJA",
  rahu: "RAHU",
  guru: "GURU",
  sani: "SANI",
  budhan: "BUDHAN",
};

/**
 * Vimshottari dasa-lord order starting at Ashwini (star 1), repeating every 9
 * nakshatras. Used to resolve the running dasa lord directly from the star.
 * This is a fixed nakshatra→lord lookup, NOT a dasa-balance recomputation.
 */
const VIMSHOTTARI_LORD_KEYS: ReadonlyArray<string> = [
  "kethu", "sukran", "ravi", "chandran", "kuja", "rahu", "guru", "sani", "budhan",
];

/** Returns the canonical dasa-lord planet key for a star number (1-27). */
export function dasaLordKeyFromStar(starNumber: unknown): string {
  const n = Number(starNumber);
  if (!Number.isInteger(n) || n < 1 || n > 27) return "";
  return VIMSHOTTARI_LORD_KEYS[(n - 1) % 9];
}

/**
 * Raw chart-string fields pulled off a horoscope record, used to build the
 * South-Indian grid (planet placement) only. Star/Dasa/Lagnam/Rasi text is
 * never derived here — those come finalized from the backend (HoroscopeDisplay).
 */
export interface HoroscopeChartSource {
  rasiString?: unknown;
  amsaString?: unknown;
  bhavaString?: unknown;
}

/** Zodiac sign names 1-12 — index 0 unused. */
export const SIGN_NAMES_ML: ReadonlyArray<string> = [
  "", "മേടം", "ഇടവം", "മിഥുനം", "കർക്കടകം", "ചിങ്ങം", "കന്നി",
  "തുലാം", "വൃശ്ചികം", "ധനു", "മകരം", "കുംഭം", "മീനം",
];

export const SIGN_NAMES_EN: ReadonlyArray<string> = [
  "", "Medam", "Edavam", "Midhunam", "Kadakam", "Chingam", "Kanni",
  "Thulam", "Vrischikam", "Dhanu", "Makaram", "Kumbham", "Meenam",
];

/**
 * Resolves a zodiac sign name from a pr_* chart string at the given planet
 * index (e.g. index 0 = Lagnam sign, index 2 = Chandran/Rasi sign).
 */
export function signNameFromChartString(
  chartString: unknown,
  index: number,
  lang: HoroscopeLang,
): string {
  if (typeof chartString !== "string") return "";
  const letter = chartString.trim().toUpperCase()[index];
  const sign = letter ? RASI_CELL[letter] : undefined;
  if (!sign) return "";
  return (lang === "ml" ? SIGN_NAMES_ML : SIGN_NAMES_EN)[sign] ?? "";
}

/**
 * Resolves the nakshatra display ("Chothi (2)" / "ചോതി (2)") from a star number
 * (1-27) and optional pada. Pure name lookup — no dasa-balance computation.
 */
export function nakshatraDisplayFromStar(
  starNumber: unknown,
  pada: unknown,
  lang: HoroscopeLang,
): string {
  const n = Number(starNumber);
  if (!Number.isInteger(n) || n < 1 || n > 27) return "";
  const name = (lang === "ml" ? STAR_NAMES_ML : STAR_NAMES_EN)[n] ?? "";
  if (!name) return "";
  const padaNum = Number(pada);
  return Number.isFinite(padaNum) && padaNum > 0 ? `${name} (${padaNum})` : name;
}

/** Resolves the dasa-lord display ("RAHU" / "രാഹു") from a star number (1-27). */
export function dasaLordDisplayFromStar(
  starNumber: unknown,
  lang: HoroscopeLang,
): string {
  const key = dasaLordKeyFromStar(starNumber);
  if (!key) return "";
  return (lang === "ml" ? DASA_LORDS_ML : DASA_LORDS_EN)[key] ?? "";
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

/** True when at least one pr_* chart string is present in the source. */
export function hasChartSource(source: HoroscopeChartSource | null | undefined): boolean {
  if (!source) return false;
  return [source.rasiString, source.amsaString, source.bhavaString].some(
    (s) => typeof s === "string" && s.trim().length > 0,
  );
}

/**
 * Builds the render-ready grids (planet placement) from raw pr_* source
 * strings. Star/Dasa/Lagnam/Rasi text is NOT computed here — those finalized
 * values come from the backend via HoroscopeDisplay.
 */
export function buildChartsFromSource(
  source: HoroscopeChartSource,
): HoroscopeCharts {
  return {
    rasi: parseChartGridFromString(source.rasiString),
    amsa: parseChartGridFromString(source.amsaString),
    bhava: parseChartGridFromString(source.bhavaString),
  };
}

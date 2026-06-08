/**
 * UI copy and label translation for jyotish / porutham views (Kerala Malayalam).
 * Rāśi keys follow API (southIndianChartLayout) English spellings; values use standard Malayalam names.
 */
import { normalizePoruthamKey } from "@/lib/astrologyPoruthamDisplay";

const _norm = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, " ");

/** API grid keys / common spellings → Malayalam (മലയാളം) */
const RASI_EN_TO_ML: Record<string, string> = {
  meena: "മീനം",
  mesha: "മേടം",
  mesam: "മേടം",
  vrishabha: "ഇടവം",
  mithuna: "മിഥുനം",
  mithunam: "മിഥുനം",
  kumbha: "കുംഭം",
  karkataka: "കർക്കടകം",
  karka: "കർക്കടകം",
  kark: "കർക്കടകം",
  makara: "മകരം",
  simha: "ചിങ്ങം",
  dhanu: "ധനു",
  dhanus: "ധനു",
  vrishchika: "വൃശ്ചികം",
  tula: "തുലാം",
  tulaam: "തുലാം",
  kanya: "കന്നി",
  aries: "മേടം",
  taurus: "ഇടവം",
  gemini: "മിഥുനം",
  cancer: "കർക്കടകം",
  leo: "ചിങ്ങം",
  virgo: "കന്നി",
  libra: "തുലാം",
  scorpio: "വൃശ്ചികം",
  sagittarius: "ധനു",
  capricorn: "മകരം",
  aquarius: "കുംഭം",
  pisces: "മീനം",
};

const GRAHA_EN_TO_ML: Record<string, string> = {
  surya: "രവി",
  sun: "രവി",
  chandra: "ചന്ദ്രൻ",
  moon: "ചന്ദ്രൻ",
  mangal: "കുജൻ",
  mangala: "കുജൻ",
  mars: "കുജൻ",
  kuja: "കുജൻ",
  budha: "ബുദൻ",
  mercury: "ബുദൻ",
  guru: "ഗുരു",
  jupiter: "ഗുരു",
  shukra: "ശുക്രൻ",
  venus: "ശുക്രൻ",
  shani: "ശനി",
  sani: "ശനി",
  saturn: "ശനി",
  sat: "ശനി",
  rahu: "രാഹു",
  ketu: "കേതു",
  ra: "രാഹു",
  ke: "കേതു",
  mercur: "ബുദൻ",
};

const NAK_EN_TO_ML: Record<string, string> = {
  ashvini: "അശ്വതി",
  aswini: "അശ്വതി",
  bharani: "ഭരണി",
  krittika: "കാർത്തിക",
  rohini: "രോഹിണി",
  krithika: "കാർത്തിക",
  mrigashira: "മകയിരം",
  mrigasira: "മകയിരം",
  ardra: "തിരുവാതിര",
  thiruvathira: "തിരുവാതിര",
  punarvasu: "പുണർതം",
  punartham: "പുണർതം",
  pushya: "പൂയം",
  pooyam: "പൂയം",
  ashlesha: "ആയില്യം",
  aayilyam: "ആയില്യം",
  magha: "മകം",
  purva: "പൂരം",
  "purva phalguni": "പൂരം",
  purvaphalguni: "പൂരം",
  "uttara phalguni": "ഉത്രം",
  uthram: "ഉത്രം",
  hasta: "അത്തം",
  atham: "അത്തം",
  chitra: "ചിത്തിര",
  chithira: "ചിത്തിര",
  swati: "ചോതി",
  vishakha: "വിശാഖം",
  vishakham: "വിശാഖം",
  anuradha: "അനിഴം",
  anizham: "അനിഴം",
  jyeshtha: "തൃക്കേട്ട",
  jyeshta: "തൃക്കേട്ട",
  mula: "മൂളം",
  moolam: "മൂളം",
  "purva ashadha": "പൂരടം",
  purvashadha: "പൂരടം",
  pooradam: "പൂരടം",
  "uttara ashadha": "ഉത്രാഡം",
  uthramadam: "ഉത്രാഡം",
  shravana: "തിരുവോണം",
  sravana: "തിരുവോണം",
  thiruvonam: "തിരുവോണം",
  dhanishta: "അവിട്ടം",
  avittam: "അവിട്ടം",
  shatabhisha: "ചതയം",
  chathayam: "ചതയം",
  "purva bhadrapada": "പൂരുരുട്ടാതി",
  purvabhadra: "പൂരുരുട്ടാതി",
  "uttara bhadrapada": "ഉത്രട്ടാതി",
  uttarabhadra: "ഉത്രട്ടാതി",
  uthrattathi: "ഉത്രട്ടാതി",
  revati: "രേവതി",
};

const PORUTHAM_KEY_TO_ML: Record<string, string> = {
  rasi: "രാശി",
  rasyadhip: "രാശ്യാധിപതി",
  vasyam: "വശ്യം",
  vashyam: "വശ്യം",
  deergaham: "ദീർഘം",
  deergham: "ദീർഘം",
  deerg: "ദീർഘം",
  dinam: "ദിനം",
  mahendra: "മഹേന്ദ്രം",
  ganam: "ഗണം",
  yoni: "യോനി",
  rajju_dosham: "രജ്ജു ദോഷം",
  rajju: "രജ്ജു ദോഷം",
  vedham: "വേധം",
  kuja_dosham: "കുജ ദോഷം",
  kuja_dosha: "കുജ ദോഷം",
  kuja_alignment: "കുജ ദോഷം",
  dasa_sandhi: "ദശാ സന്ധി",
  dasa_sandh: "ദശാ സന്ധി",
  papam_samyom: "പാപ സാമ്യം",
  papam_samyam: "പാപ സാമ്യം",
};

const ROLE_EN_TO_ML: Record<string, string> = {
  bride: "വധു",
  groom: "വരൻ",
  male: "വരൻ",
  female: "വധു",
  vadhu: "വധു",
  varan: "വരൻ",
};

function alreadyMalayalamScript(s: string): boolean {
  return /[\u0D00-\u0D7F]/.test(s);
}

function mapDict(s: string, dict: Record<string, string>): string {
  if (!s || alreadyMalayalamScript(s)) return s;
  const k = _norm(s);
  if (dict[k]) return dict[k]!;
  const noParen = k.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (dict[noParen]) return dict[noParen]!;
  return s;
}

export const ml = {
  chartNotAvailable: "ചാർട്ട് ലഭ്യമല്ല",
  loadingChart: "ചാർട്ട് ലോഡ് ചെയ്യുന്നു…",
  chartJsonErrorHint:
    "ചുവടെയുള്ള സെർവർ PNG ചാർട്ടുകൾ കൊണ്ട് തുടരാനാകും.",
  rasi: "രാശി",
  amsakom: "അംശകം",
  bhavam: "ഭാവം",
  roleBride: "വധു",
  roleGroom: "വരൻ",
  primary: "മുൻനിര",
  partner: "പങ്കാളി",
  dob: "ജനന തീയതി",
  tob: "ജനന സമയം",
  /** Birth place (Janana Sthalam) */
  pob: "ജനന സ്ഥലം",
  padaLabel: (n: number) => `പാദം ${n}`,
  dasa: "ദശ",
  dasaLord: "നാഥൻ",
  lagna: "ലഗ്നം",
  rasiShort: "രാശി",
  nakshatra: "നക്ഷത്രം",
  padam: "പാദം",
  dasaTitle: "ദശ",
  kujaDosham: "കുജദോഷം",
  kendraMalefic: "കേന്ദ്ര പാപികൾ",
  poruthamTitle: "പൊരുത്തം",
  yes: "അതെ",
  no: "അല്ല",
  defaultReportTitle: "വിവാഹ പൊരുത്ത റിപോർട്ട്",
  defaultSubtitle: "ജാതക പൊരുത്തം (കേരള ദശകൂട്)",
  compatibilityGrade: "പൊരുത്ത നില",
  downloadMatchPdf: "പൊരുത്ത റിപോർട്ട് ഡൗൺലോഡ് (PDF)",
  consultFooter:
    "അന്തിമ നിർണയത്തിന് ഒരു ജോതിഷനെ കാണുക. ക്വാട്ടാ നിയമങ്ങൾ സെർവറിലെ പ്ലാൻ അനുസരിക്കും.",
  astrologerCta: "ജ്യോതിഷ സേവനങ്ങൾ ലഭ്യമാണ്",
  astrologerContact: "സമ്പർക്കം",
  sideBySideBlurb:
    "താഴെയുള്ള റിപ്പോർട്ടിൽ രണ്ട് ഗ്രഹനില ചാർട്ടുകളും പൊരുത്ത പട്ടികയും കാണാം.",
  clickCheckMatchBlurb:
    "പൊരുത്തം കാണാൻ \"ചെക്ക് മാച്ച്\" ക്ലിക്ക് ചെയ്യുക. കൃത്യമായ ഫലത്തിന് ജനന വിവരങ്ങൾ പൂർത്തിയാക്കുക.",
  planRequiredBlurb:
    "മറ്റംഗങ്ങളെ പട്ടികപ്പെടുത്തി പൊരുത്തം പരിശോധിക്കാൻ സജീവമായ സബ്‌സ്‌ക്രിപ്‌ഷൻ വേണം.",
  jothishaAdviceShort:
    "അന്തിമ തീരുമാനത്തിന് ഒരു ജോതിഷനെ കാണുക. ക്വാട്ടാ সെർവർ നിയമങ്ങൾ അനുസരിക്കും.",
} as const;

export function rasiNameMalayalam(english: string | undefined | null): string {
  if (english == null) return "—";
  const t = String(english).trim();
  if (!t) return "—";
  if (alreadyMalayalamScript(t)) return t;
  const hit = mapDict(t, RASI_EN_TO_ML);
  if (hit !== t) return hit;
  const parts = t.split(/[\s,·]+/);
  if (parts.length > 1) {
    return parts.map((p) => rasiNameMalayalam(p)).filter(Boolean).join(" · ");
  }
  return t;
}

export function grahaNameMalayalam(name: string | undefined | null): string {
  if (name == null) return "—";
  const t = String(name).trim();
  if (!t) return "—";
  if (alreadyMalayalamScript(t)) return t;
  return mapDict(t.toLowerCase(), GRAHA_EN_TO_ML) || t;
}

export function nakshatraNameMalayalam(name: string | undefined | null): string {
  if (name == null) return "—";
  const t = String(name).trim();
  if (!t) return "—";
  if (alreadyMalayalamScript(t)) return t;
  return mapDict(t.toLowerCase(), NAK_EN_TO_ML) || t;
}

/** "10y 05m 22d" style → Malayalam (വർഷം/മാസം/ദിവസം) */
export function dasaDurationMalayalam(raw: string | undefined | null): string {
  if (raw == null) return "—";
  const s = String(raw).trim();
  if (!s) return "—";
  if (alreadyMalayalamScript(s)) return s;
  const ymd = s.match(
    /(\d+)\s*y(?:ears?)?[.\s]*(\d+)\s*m(?:onths?)?[.\s]*(\d+)\s*d(?:ays?)?/i,
  );
  if (ymd) {
    return `${ymd[1]} വർഷം ${String(ymd[2]).padStart(2, "0")} മാസം ${String(ymd[3]).padStart(2, "0")} ദിവസം`;
  }
  return s;
}

export function roleNameMalayalam(raw: string | undefined | null): string {
  if (raw == null) return "—";
  const t = String(raw).trim();
  if (!t) return "—";
  if (alreadyMalayalamScript(t)) return t;
  const k = t.toLowerCase();
  if (ROLE_EN_TO_ML[k]) return ROLE_EN_TO_ML[k]!;
  if (/bride|vadhu|female|woman/i.test(t)) return ml.roleBride;
  if (/groom|varan|male|man/i.test(t)) return ml.roleGroom;
  if (k === "primary") return ml.primary;
  if (k === "partner") return ml.partner;
  return t;
}

export function matchHeaderLineMl(
  matriId: string | undefined,
  role: string | undefined,
  fallback: string,
): string {
  const i = matriId?.trim();
  const r = (role ?? "").trim();
  if (i && r) return `${i} · ${roleNameMalayalam(r)}`;
  if (i) return i;
  if (r) return roleNameMalayalam(r);
  return roleNameMalayalam(fallback) !== "—" ? roleNameMalayalam(fallback) : fallback;
}

export function poruthamRowLabelMalayalam(
  key: string | undefined,
  label: string | undefined,
): string {
  const nk = key ? normalizePoruthamKey(key) : "";
  if (nk && PORUTHAM_KEY_TO_ML[nk]) return PORUTHAM_KEY_TO_ML[nk]!;
  const nl = label ? normalizePoruthamKey(label) : "";
  if (nl && PORUTHAM_KEY_TO_ML[nl]) return PORUTHAM_KEY_TO_ML[nl]!;
  if (label && alreadyMalayalamScript(label)) return label;
  if (key && alreadyMalayalamScript(key)) return key;
  if (label?.trim()) return label.trim();
  if (key?.trim()) return key.trim();
  return "—";
}

export function zodiacLabelForApiKey(englishRasiKey: string): string {
  return rasiNameMalayalam(englishRasiKey);
}

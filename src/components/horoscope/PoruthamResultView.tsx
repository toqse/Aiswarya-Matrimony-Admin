import { useState, type CSSProperties } from "react";
import { CheckCircle, XCircle, Equal, ListChecks, Download, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadMatchReport } from "@/lib/admin-api/horoscope";
import type { UserRole } from "@/types/user-role";
import { HoroscopeChart, extractHoroscopeCharts } from "./HoroscopeChart";
import {
  MAROON,
  MALAYALAM_FONT,
  signNameFromChartString,
  nakshatraDisplayFromStar,
  dasaLordDisplayFromStar,
  localizeHoroscopeDisplay,
  poruthamRowLabel,
  poruthamsMatchedSummary,
  t,
  type HoroscopeDisplay,
  type HoroscopeLang,
} from "./horoscope-i18n";

/* ------------------------------------------------------------------ *
 * Generic value pickers (API field names vary across versions)
 * ------------------------------------------------------------------ */
function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return "";
}

function pickNum(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

/** Tri-state boolean reader: returns undefined when the field is absent. */
function pickBool(...vals: unknown[]): boolean | undefined {
  for (const v of vals) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number" && !Number.isNaN(v)) return v !== 0;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (["true", "yes", "1"].includes(s)) return true;
      if (["false", "no", "0"].includes(s)) return false;
    }
  }
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

/**
 * Resolves a bride/groom node from any of the known shapes:
 *   - flat horoscope object (legacy: bride_horoscope / groom_horoscope)
 *   - grahanila node { matri_id, name, profile_photo, horoscope: {...} }
 * In the latter case we flatten so the panel can read both the identity
 * fields (name/matri_id/photo) and the nested horoscope fields (pr_rasi…).
 */
function resolvePerson(...candidates: unknown[]): Record<string, unknown> | null {
  for (const c of candidates) {
    const node = asRecord(c);
    if (!node) continue;
    const horo = asRecord(node.horoscope);
    return horo ? { ...horo, ...node } : node;
  }
  return null;
}

/** API may return an envelope; the http client also unwraps — support both. */
function poruthamRoot(payload: unknown): Record<string, unknown> {
  const p = asRecord(payload);
  if (!p) return {};
  const inner = asRecord(p.data);
  if (inner) return inner;
  return p;
}

/* ------------------------------------------------------------------ *
 * Koota / porutham grading
 * ------------------------------------------------------------------ */
type KootaState = "uthamam" | "madhyamam" | "adhamam";

function normalizeGrade(v: unknown): KootaState | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase();
  if (!s) return undefined;
  if (s.includes("utham")) return "uthamam";
  if (s.includes("madhyam") || s.includes("madyam")) return "madhyamam";
  if (s.includes("adham") || s.includes("neech")) return "adhamam";
  return undefined;
}

function normalizeKootaKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z]/g, "");
}

/** Canonical porutham order + display labels (matches the legacy EXE list). */
const PORUTHAM_ROWS: { keys: string[]; label: string; isDosha?: boolean }[] = [
  { keys: ["rasi", "rashi"], label: "Rasi" },
  {
    keys: ["rasyadhipam", "rasi_adhipathi", "rasiyadhipathy", "rasiadhipathi", "rasyadhipathi"],
    label: "Rasyadhipam",
  },
  { keys: ["vasyam", "vasya"], label: "Vasyam" },
  {
    keys: ["sthree_deerga", "sthree_deergha", "sthreedeergha", "sthree_deergham", "streedeerga"],
    label: "Deergham",
  },
  { keys: ["dinam", "dina", "din"], label: "Dinam" },
  { keys: ["mahendra", "mahendram"], label: "Mahendram" },
  { keys: ["ganam", "gana"], label: "Ganam" },
  { keys: ["yoni", "yonim"], label: "Yoni" },
  { keys: ["rajju_dosham", "rajju", "rajjus"], label: "Rajju Dosham" },
  { keys: ["vedha_dosham", "vedha", "vedham"], label: "Vedha Dosham" },
  { keys: ["chovva_dosham", "kuja_dosham", "mangal_dosham"], label: "Kuja Dosham", isDosha: true },
  { keys: ["dasa_sandhi", "dasasandhi"], label: "Dasa Sandhi", isDosha: true },
  { keys: ["papa_samyam", "papam_samyam", "papam_samyom"], label: "Papam Samyam", isDosha: true },
];

/** Point value for a koota state (legacy EXE: 1 / 0.5 / 0). */
function pointsFor(state?: KootaState, pass?: boolean): number | null {
  if (state === "uthamam") return 1;
  if (state === "madhyamam") return 0.5;
  if (state === "adhamam") return 0;
  if (pass === true) return 1;
  if (pass === false) return 0;
  return null;
}

/* ------------------------------------------------------------------ *
 * Dosha / compatibility checks
 * ------------------------------------------------------------------ */
export interface DoshaCheck {
  key: string;
  label: string;
  matched: boolean | undefined;
}

/** Preferred UI labels for known dosha keys; these win over the API-supplied label. */
const DOSHA_LABELS: Record<string, string> = {
  chovva_dosham: "Kuja Dosham (Chovva)",
  papa_samyam: "Papa Samyam",
  dasa_sandhi: "Dasa Sandhi",
};

/**
 * Builds the dosha-check rows. Prefers the new `dosha_checks` array
 * (`{ key, label, matched }`); falls back to the legacy boolean fields.
 */
function buildDoshaChecks(root: Record<string, unknown>): DoshaCheck[] {
  const arr = root.dosha_checks;
  if (Array.isArray(arr)) {
    return arr
      .map((it): DoshaCheck | null => {
        const o = asRecord(it);
        if (!o) return null;
        const key = pickStr(o.key, o.name);
        const label = DOSHA_LABELS[key] || pickStr(o.label) || key || "—";
        return { key: key || label, label, matched: pickBool(o.matched, o.passed, o.value, o.result) };
      })
      .filter((x): x is DoshaCheck => x !== null);
  }

  // Legacy fallback: derive `matched` from individual boolean fields.
  const chovva = pickBool(root.chovva_dosham, root.chovva_dosha, root.mangal_dosham);
  const papa = pickBool(root.papa_samyam, root.papasamyam);
  const dasa = pickBool(root.dasa_sandhi, root.dasasandhi);
  const out: DoshaCheck[] = [];
  if (chovva !== undefined) out.push({ key: "chovva_dosham", label: DOSHA_LABELS.chovva_dosham, matched: !chovva });
  if (papa !== undefined) out.push({ key: "papa_samyam", label: DOSHA_LABELS.papa_samyam, matched: papa });
  if (dasa !== undefined) out.push({ key: "dasa_sandhi", label: DOSHA_LABELS.dasa_sandhi, matched: !dasa });
  return out;
}

function StatusIcon({ state, pass }: { state?: KootaState; pass?: boolean }) {
  if (state === "uthamam" || (state === undefined && pass === true)) {
    return <CheckCircle className="h-4 w-4 text-success shrink-0" aria-label="Uthamam — matched (1)" />;
  }
  if (state === "madhyamam") {
    return <Equal className="h-4 w-4 text-warning shrink-0" aria-label="Madhyamam — partial (0.5)" />;
  }
  if (state === "adhamam" || (state === undefined && pass === false)) {
    return <XCircle className="h-4 w-4 text-destructive shrink-0" aria-label="Adhamam — not matched (0)" />;
  }
  return <span className="text-muted-foreground text-xs">—</span>;
}

/* ------------------------------------------------------------------ *
 * Per-person panel (bride / groom)
 * ------------------------------------------------------------------ */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

function FieldBox({
  label,
  value,
  multiline = false,
  className,
  valueStyle,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div className={cn("rounded-md border bg-muted/20 px-2 py-1.5", className)}>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xs font-semibold",
          multiline ? "leading-snug break-words" : "truncate",
        )}
        title={value}
        style={valueStyle}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function dasaDisplayFromHoroscope(h: Record<string, unknown>): string {
  const direct = pickStr(h.dasa_display);
  if (direct) return direct;
  const charts = asRecord(h.charts);
  const dasa = asRecord(charts?.dasa);
  return pickStr(dasa?.balance_text);
}

export interface PersonNavSide {
  onPrev?: () => void;
  onNext?: () => void;
  /** Dismiss current profile and advance; skipped profiles stay hidden on prev/next. */
  onDismiss?: () => void;
  canPrev: boolean;
  canNext: boolean;
  loading?: boolean;
}

function PersonPanel({
  roleLabel,
  horoscope,
  lang,
  nav,
}: {
  roleLabel: string;
  horoscope: Record<string, unknown> | null;
  lang: HoroscopeLang;
  nav?: PersonNavSide;
}) {
  const h = horoscope ?? {};
  const name = pickStr(h.name, h.pr_name, h.profile_name, h.full_name) || roleLabel;
  const matriId = pickStr(h.matri_id, h.matriid, h.profile_matri_id);
  const photo = pickStr(h.photo_url, h.profile_photo, h.image, h.avatar, h.photo);

  const charts = extractHoroscopeCharts(h);
  const chartSource = {
    rasiString: h.pr_rasi,
    amsaString: h.pr_amsa,
    bhavaString: h.pr_bhav ?? h.pr_bhava,
  };

  const starNumber = h.pr_star;
  const starPada = h.pr_pada ?? h.nakshatra_pada;

  const displayRaw: HoroscopeDisplay = {
    name,
    date_of_birth: pickStr(h.dob, h.pr_dob, h.date_of_birth),
    time_of_birth: pickStr(h.pr_tob, h.time_of_birth),
    star_display: pickStr(h.star_display) || nakshatraDisplayFromStar(starNumber, starPada, lang),
    nakshatra_pada: starPada,
    dasa_display: dasaDisplayFromHoroscope(h),
    dasa_lord: pickStr(h.dasa_lord) || dasaLordDisplayFromStar(starNumber, lang),
    lagnam_display: pickStr(h.lagnam_display) || signNameFromChartString(chartSource.rasiString, 0, lang),
    rasi_display: pickStr(h.rasi_display) || signNameFromChartString(chartSource.rasiString, 2, lang),
  };
  const display = localizeHoroscopeDisplay(displayRaw, lang) ?? displayRaw;

  const mlFont = lang === "ml" ? MALAYALAM_FONT : undefined;

  const showNav = Boolean(nav?.onPrev || nav?.onNext);

  return (
    <div className="relative rounded-xl border bg-card p-3 sm:p-4 space-y-3">
      {nav?.loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: MAROON }} />
        </div>
      ) : null}
      {showNav && (nav?.onDismiss || nav?.onNext) ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-20 h-8 w-8 shrink-0"
          onClick={nav.onDismiss ?? nav.onNext}
          disabled={!nav.canNext || nav.loading}
          aria-label="Close and show next profile"
          title="Close and show next profile"
        >
          <X className="h-4 w-4" style={{ color: MAROON }} />
        </Button>
      ) : null}
      <div className={cn("flex items-center justify-center gap-1 pr-8", nav?.loading && "opacity-60")}>
        {showNav ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={nav?.onPrev}
            disabled={!nav?.canPrev || nav?.loading}
            aria-label="Previous profile"
            title="Previous"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: MAROON }} />
          </Button>
        ) : null}
        <p className="min-w-0 flex-1 text-center text-sm font-semibold" style={{ color: MAROON }}>
          {roleLabel}
        </p>
        {showNav ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={nav?.onNext}
            disabled={!nav?.canNext || nav?.loading}
            aria-label="Next profile"
            title="Next"
          >
            <ChevronRight className="h-5 w-5" style={{ color: MAROON }} />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-semibold text-white"
          style={{ background: MAROON }}
        >
          {photo ? (
            <img src={photo} alt={name} className="h-full w-full object-cover" />
          ) : (
            initials(name)
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight" title={name} style={{ fontFamily: mlFont }}>
            {name}
          </p>
          {matriId ? <p className="font-mono text-xs text-muted-foreground">{matriId}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <FieldBox label="Nakshatra" value={display.star_display ?? ""} valueStyle={{ fontFamily: mlFont }} />
        <FieldBox label="Padam" value={pickStr(starPada)} />
        <FieldBox label="Rasi" value={display.rasi_display ?? ""} valueStyle={{ fontFamily: mlFont }} />
        <FieldBox label="Lagnam" value={display.lagnam_display ?? ""} valueStyle={{ fontFamily: mlFont }} />
        <FieldBox
          label={t(lang, "dasa")}
          value={display.dasa_display ?? ""}
          multiline
          valueStyle={{ fontFamily: mlFont }}
        />
        <FieldBox label="Lord" value={display.dasa_lord ?? ""} valueStyle={{ fontFamily: mlFont }} />
      </div>

      <HoroscopeChart
        charts={charts}
        source={chartSource}
        display={display}
        lang={lang}
        showLanguageToggle={false}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Main view
 * ------------------------------------------------------------------ */
const matchResultColors: Record<string, string> = {
  Excellent: "bg-success text-success-foreground",
  Good: "bg-primary text-primary-foreground",
  Average: "bg-warning text-warning-foreground",
  Poor: "bg-destructive text-destructive-foreground",
};

export interface PoruthamResultViewProps {
  result: unknown;
  /** Role decides which API namespace (admin/staff/branch) serves the report. */
  role?: UserRole;
  /** Matri IDs for the report download; falls back to ids found in the result. */
  brideMatriId?: string;
  groomMatriId?: string;
  /** Profiles left in bride/groom navigation; decreases when either side is dismissed. */
  remainingCount?: number;
  personNav?: {
    bride?: PersonNavSide;
    groom?: PersonNavSide;
  };
}

export function PoruthamResultView({ result, role, brideMatriId, groomMatriId, remainingCount, personNav }: PoruthamResultViewProps) {
  const [lang, setLang] = useState<HoroscopeLang>("ml");
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const root = poruthamRoot(result);

  const grahanila = asRecord(root.grahanila);
  const brideH = resolvePerson(root.bride_horoscope, root.bride, grahanila?.bride);
  const groomH = resolvePerson(root.groom_horoscope, root.groom, grahanila?.groom);

  const brideMatri =
    (brideMatriId || "").trim() || pickStr(brideH?.matri_id, brideH?.matriid, brideH?.profile_matri_id);
  const groomMatri =
    (groomMatriId || "").trim() || pickStr(groomH?.matri_id, groomH?.matriid, groomH?.profile_matri_id);
  const canDownload = Boolean(role && brideMatri && groomMatri);

  const handleDownload = async () => {
    if (!canDownload || !role) return;
    setDownloading(true);
    try {
      await downloadMatchReport(role, brideMatri, groomMatri);
      toast({ title: "Report downloaded", description: `Match report for ${brideMatri} × ${groomMatri}.` });
    } catch (e) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Could not download the match report.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const score = pickNum(root.score, root.total_score, root.match_score);
  const maxScore = pickNum(root.max_score, root.max, 10);
  const overall = pickStr(root.result, root.overall_result, root.verdict);

  const poruthamsObj = asRecord(root.poruthams);
  const gradesObj = asRecord(root.grades);

  const gradeByNormKey = new Map<string, KootaState>();
  if (gradesObj) {
    for (const [k, v] of Object.entries(gradesObj)) {
      const st = normalizeGrade(v);
      if (st) gradeByNormKey.set(normalizeKootaKey(k), st);
    }
  }

  const lookupByKeys = (obj: Record<string, unknown> | null, keys: string[]): unknown => {
    if (!obj) return undefined;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
      const norm = normalizeKootaKey(key);
      for (const ok of Object.keys(obj)) {
        if (normalizeKootaKey(ok) === norm) return obj[ok];
      }
    }
    return undefined;
  };

  const doshaChecks = buildDoshaChecks(root);
  const doshaByNormKey = new Map<string, boolean | undefined>();
  for (const d of doshaChecks) {
    doshaByNormKey.set(normalizeKootaKey(d.key), d.matched);
  }

  const rows = PORUTHAM_ROWS.map((row) => {
    if (row.isDosha) {
      let matched: boolean | undefined;
      for (const k of row.keys) {
        const hit = doshaByNormKey.get(normalizeKootaKey(k));
        if (hit !== undefined) {
          matched = hit;
          break;
        }
      }
      return {
        key: row.keys[0]!,
        label: row.label,
        state: undefined as KootaState | undefined,
        pass: matched,
      };
    }

    let state: KootaState | undefined;
    const gradeVal = lookupByKeys(gradesObj, row.keys);
    state = normalizeGrade(gradeVal);
    if (!state) {
      for (const k of row.keys) {
        const hit = gradeByNormKey.get(normalizeKootaKey(k));
        if (hit) {
          state = hit;
          break;
        }
      }
    }
    const passVal = lookupByKeys(poruthamsObj, row.keys);
    const pass = typeof passVal === "boolean" ? passVal : undefined;
    return { key: row.keys[0]!, label: row.label, state, pass };
  });

  const kootaRows = rows.filter((r) => !PORUTHAM_ROWS.find((row) => row.keys[0] === r.key)?.isDosha);
  const matchedCount = kootaRows.filter(
    (r) => r.state === "uthamam" || (r.state === undefined && r.pass === true),
  ).length;
  const totalCount = maxScore > 0 ? maxScore : kootaRows.length;

  const mlFont = lang === "ml" ? MALAYALAM_FONT : undefined;
  const centerLoading = Boolean(personNav?.bride?.loading || personNav?.groom?.loading);
  const showRemainingCount = personNav != null && remainingCount != null;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {showRemainingCount ? (
          <div
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-semibold tabular-nums"
            style={{ borderColor: MAROON, color: MAROON, fontFamily: mlFont }}
            aria-live="polite"
            aria-label={`${t(lang, "remaining")}: ${remainingCount}`}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
              {t(lang, "remaining")}
            </span>
            <span className="text-lg leading-none">{remainingCount}</span>
          </div>
        ) : null}
        {canDownload ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="gap-1.5"
            title="Download match report"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">Report</span>
          </Button>
        ) : null}
        <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Language">
          {(["en", "ml"] as HoroscopeLang[]).map((l) => {
            const selected = lang === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={selected}
                className="rounded px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  fontFamily: l === "ml" ? MALAYALAM_FONT : undefined,
                  ...(selected
                    ? { background: MAROON, color: "#fff" }
                    : { color: MAROON, background: "transparent" }),
                }}
              >
                {l === "ml" ? "മലയാളം" : "English"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(220px,0.85fr)_1fr]">
        <PersonPanel
          roleLabel={t(lang, "bride")}
          horoscope={brideH}
          lang={lang}
          nav={personNav?.bride}
        />

        <div className="relative space-y-4" style={{ fontFamily: mlFont }}>
          {centerLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: MAROON }} />
            </div>
          ) : null}
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: MAROON }}>
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-white/40">
                <span className="text-lg font-bold leading-none tabular-nums">
                  {score > 0 || maxScore ? score.toFixed(score % 1 ? 1 : 0) : "—"}
                </span>
                {maxScore > 0 ? <span className="text-[10px] opacity-80">/{maxScore}</span> : null}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                  {t(lang, "overall_match")}
                </p>
                <p className="text-xl font-bold leading-tight">{overall || "—"}</p>
                <p className="text-[11px] opacity-90">
                  {poruthamsMatchedSummary(lang, matchedCount, totalCount)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <ListChecks className="h-4 w-4" style={{ color: MAROON }} /> {t(lang, "porutham_details")}
            </p>
            <ul className="divide-y">
              {rows.map((r) => {
                const pts = pointsFor(r.state, r.pass);
                const displayLabel = poruthamRowLabel(lang, r.key, r.label);
                return (
                  <li key={r.key} className="flex items-center justify-between py-2">
                    <span className="font-medium">{displayLabel}</span>
                    <span className="flex items-center gap-2">
                      <span className="w-7 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {pts === null ? "—" : Number.isInteger(pts) ? String(pts) : pts.toFixed(1)}
                      </span>
                      <StatusIcon state={r.state} pass={r.pass} />
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-success" /> {t(lang, "uthamam")} (1)
              </span>
              <span className="inline-flex items-center gap-1">
                <Equal className="h-3.5 w-3.5 text-warning" /> {t(lang, "madhyamam")} (0.5)
              </span>
              <span className="inline-flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-destructive" /> {t(lang, "adhamam")} (0)
              </span>
            </div>
          </div>

          {overall ? (
            <div
              className={cn(
                "mt-3 rounded-md px-3 py-1.5 text-center text-xs font-semibold",
                matchResultColors[overall] ?? "bg-muted text-muted-foreground",
              )}
            >
              {overall}
            </div>
          ) : null}
        </div>

        <PersonPanel
          roleLabel={t(lang, "groom")}
          horoscope={groomH}
          lang={lang}
          nav={personNav?.groom}
        />
      </div>
    </div>
  );
}

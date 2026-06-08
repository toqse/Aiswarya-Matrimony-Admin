import { useMemo, useState } from "react";
import { AmsaChart } from "./AmsaChart";
import { BhavaChart } from "./BhavaChart";
import { RasiChart } from "./RasiChart";
import {
  CHART_TABS,
  MAROON,
  MALAYALAM_FONT,
  buildChartsFromSource,
  extractHoroscopeCharts,
  hasChartSource,
  t,
  type ChartKind,
  type HoroscopeChartSource,
  type HoroscopeCharts,
  type HoroscopeLang,
} from "./horoscope-i18n";

export type { HoroscopeLang, HoroscopeCharts, HoroscopeChartSource } from "./horoscope-i18n";
export {
  MALAYALAM_FONT,
  extractHoroscopeCharts,
  t,
} from "./horoscope-i18n";

export interface HoroscopeChartProps {
  charts: HoroscopeCharts | null | undefined;
  /**
   * Raw pr_rasi/pr_amsa/pr_bhav strings + star/dasa fields. When present, the
   * chart is built from these (EXE-matched) instead of `charts`.
   */
  source?: HoroscopeChartSource | null;
  /** Controlled language. If omitted, the component manages its own (default Malayalam). */
  lang?: HoroscopeLang;
  onLangChange?: (lang: HoroscopeLang) => void;
  showLanguageToggle?: boolean;
}

/**
 * Horoscope chart container: Rasi / Amsakom / Bhavom tabs + English/Malayalam toggle.
 * Renders API `charts` data only — no frontend calculations.
 */
export function HoroscopeChart({
  charts,
  source,
  lang: controlledLang,
  onLangChange,
  showLanguageToggle = true,
}: HoroscopeChartProps) {
  const [active, setActive] = useState<ChartKind>("rasi");
  const [internalLang, setInternalLang] = useState<HoroscopeLang>("ml");
  const lang = controlledLang ?? internalLang;
  const setLang = (l: HoroscopeLang) => {
    setInternalLang(l);
    onLangChange?.(l);
  };
  const mlFont = lang === "ml" ? MALAYALAM_FONT : undefined;

  // Prefer EXE-matched pr_* strings; fall back to backend-built `charts`.
  const effectiveCharts = useMemo<HoroscopeCharts | null | undefined>(() => {
    if (hasChartSource(source)) return buildChartsFromSource(source!, lang);
    return charts;
  }, [source, charts, lang]);

  const renderActiveChart = () => {
    switch (active) {
      case "amsa":
        return <AmsaChart charts={effectiveCharts} lang={lang} />;
      case "bhava":
        return <BhavaChart charts={effectiveCharts} lang={lang} />;
      default:
        return <RasiChart charts={effectiveCharts} lang={lang} />;
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border p-0.5" role="tablist" aria-label={t(lang, "chart_type")}>
          {CHART_TABS.map((tab) => {
            const selected = active === tab.kind;
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(tab.kind)}
                className="rounded px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium transition-colors"
                style={{
                  fontFamily: mlFont,
                  ...(selected
                    ? { background: MAROON, color: "#fff" }
                    : { color: MAROON, background: "transparent" }),
                }}
              >
                {t(lang, tab.key)}
              </button>
            );
          })}
        </div>

        {showLanguageToggle && (
          <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Language">
            {(["ml", "en"] as HoroscopeLang[]).map((l) => {
              const selected = lang === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={selected}
                  className="rounded px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium transition-colors"
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
        )}
      </div>

      <div className="w-full">{renderActiveChart()}</div>
    </div>
  );
}

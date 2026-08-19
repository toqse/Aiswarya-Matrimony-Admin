import { formatDateDdMmYyyyDash, formatTimeOfBirthDisplay } from "@/lib/format-date";
import {
  MAROON,
  MALAYALAM_CHART_FONT,
  PERIMETER_SIGNS,
  SIGN_NAMES_EN,
  SIGN_NAMES_ML,
  SIGN_POSITION,
  formatChartStarLine,
  localizeHoroscopeDisplay,
  planetSymbol,
  t,
  type ChartGrid,
  type ChartPlanet,
  type HoroscopeDisplay,
  type HoroscopeLang,
} from "./horoscope-i18n";

const PLANET_RED = "#dc2626";
const GRID_LINE = "#d1d5db";
const LAGNA_HIGHLIGHT = "rgba(237, 233, 254, 0.55)";

function SignCell({
  sign,
  planets,
  signName,
  isLagna,
  lang,
}: {
  sign: number;
  planets: ChartPlanet[];
  signName?: string;
  isLagna: boolean;
  lang: HoroscopeLang;
}) {
  const pos = SIGN_POSITION[sign];
  if (!pos) return null;
  const signLabel =
    (lang === "ml" ? SIGN_NAMES_ML : SIGN_NAMES_EN)[sign] || signName || String(sign);
  return (
    <div
      title={signLabel || undefined}
      className="relative flex min-h-0 min-w-0 flex-col bg-white p-0.5 sm:p-1 min-h-[44px] sm:min-h-[58px] box-border"
      style={{
        gridColumn: pos.col,
        gridRow: pos.row,
        ...(isLagna ? { background: LAGNA_HIGHLIGHT } : null),
      }}
    >
      <span
        className="absolute top-0.5 left-1 max-w-[72%] truncate text-[7px] sm:text-[8px] leading-none text-muted-foreground"
        style={{ fontFamily: lang === "ml" ? MALAYALAM_CHART_FONT : undefined }}
      >
        {signLabel}
      </span>
      <div
        className="mt-3 flex min-h-0 min-w-0 max-w-full flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5 overflow-hidden sm:gap-x-1"
        style={{ fontFamily: lang === "ml" ? MALAYALAM_CHART_FONT : undefined }}
      >
        {planets.map((p, i) => (
          <span
            key={`${p.key}-${i}`}
            title={p.name}
            className="max-w-full truncate text-[11px] font-bold leading-none sm:text-[13px]"
            style={{ color: PLANET_RED }}
          >
            {planetSymbol(p, lang)}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartCenterPanel({
  display,
  lang,
}: {
  display?: HoroscopeDisplay | null;
  lang: HoroscopeLang;
}) {
  const mlFont = lang === "ml" ? MALAYALAM_CHART_FONT : undefined;
  const panel = localizeHoroscopeDisplay(display, lang);
  const name = (panel?.name ?? "").trim();
  const dob = formatDateDdMmYyyyDash(panel?.date_of_birth);
  const tob = formatTimeOfBirthDisplay(panel?.time_of_birth);
  const starLine = formatChartStarLine(
    panel?.star_display,
    panel?.nakshatra_pada,
    lang,
  );
  const lord = (panel?.dasa_lord ?? "").trim();
  const dasa = (panel?.dasa_display ?? "").trim();
  const lagnam = (panel?.lagnam_display ?? "").trim();
  const rasi = (panel?.rasi_display ?? "").trim();

  const lagnaRasiLine =
    lagnam || rasi
      ? [
          lagnam ? `${t(lang, "center_lagna")}: ${lagnam}` : null,
          rasi ? `${t(lang, "center_rasi")}: ${rasi}` : null,
        ]
          .filter(Boolean)
          .join(" - ")
      : "";

  const hasContent = name || dob || tob || starLine || lord || dasa || lagnaRasiLine;
  if (!hasContent) return null;

  return (
    <>
      {name ? (
        <p
          className="w-full break-words text-xs sm:text-sm font-bold leading-tight line-clamp-2"
          style={{ color: MAROON, fontFamily: mlFont }}
        >
          {name}
        </p>
      ) : null}
      {dob ? (
        <p
          className="text-[10px] sm:text-[11px] leading-tight"
          style={{ fontFamily: mlFont, color: MAROON }}
        >
          {t(lang, "center_dob")}: {dob}
        </p>
      ) : null}
      {tob ? (
        <p
          className="text-[10px] sm:text-[11px] leading-tight"
          style={{ fontFamily: mlFont, color: MAROON }}
        >
          {t(lang, "center_tob")}: {tob}
        </p>
      ) : null}
      {starLine ? (
        <p
          className="text-[10px] sm:text-[11px] leading-tight"
          style={{ fontFamily: mlFont, color: MAROON }}
        >
          {starLine}
        </p>
      ) : null}
      {lord ? (
        <p
          className="text-[10px] sm:text-[11px] leading-tight"
          style={{ fontFamily: mlFont, color: MAROON }}
        >
          {t(lang, "center_nathan")}: {lord}
        </p>
      ) : null}
      {dasa ? (
        <p
          className="text-[10px] sm:text-[11px] leading-tight"
          style={{ fontFamily: mlFont, color: MAROON }}
        >
          {t(lang, "dasa")}: {dasa}
        </p>
      ) : null}
      {lagnaRasiLine ? (
        <p
          className="text-[10px] sm:text-[11px] leading-tight"
          style={{ fontFamily: mlFont, color: MAROON }}
        >
          {lagnaRasiLine}
        </p>
      ) : null}
    </>
  );
}

export interface SouthIndianChartProps {
  grid: ChartGrid;
  /** Finalized backend display strings — rendered verbatim in the center panel. */
  display?: HoroscopeDisplay | null;
  lang: HoroscopeLang;
  /** Slightly smaller chart — use for Bhava when three charts sit in one row. */
  compact?: boolean;
}

/** South Indian (Kerala) 4x4 grid — planets placed by API `houses[signNumber]`. */
export function SouthIndianChart({ grid, display, lang, compact = false }: SouthIndianChartProps) {
  const houses = grid.houses ?? {};
  const signNames = grid.sign_names ?? {};
  const lagna = typeof grid.lagna_sign === "number" ? grid.lagna_sign : null;
  const maxW = compact ? "min(100%,380px)" : "min(100%,420px)";

  return (
    <div className="mx-auto w-full max-w-full px-0.5 pb-px box-border font-ml">
      <div className="mx-auto w-full aspect-square box-border" style={{ maxWidth: maxW }}>
        <div
          className="grid h-full w-full grid-cols-4 grid-rows-4 gap-px box-border"
          style={{ border: `1px solid ${GRID_LINE}`, backgroundColor: GRID_LINE }}
        >
        {PERIMETER_SIGNS.map((sign) => {
          const planets = Array.isArray(houses[String(sign)]) ? houses[String(sign)] : [];
          return (
            <SignCell
              key={sign}
              sign={sign}
              planets={planets}
              signName={signNames[String(sign)]}
              isLagna={lagna === sign}
              lang={lang}
            />
          );
        })}

        <div
          className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden bg-white p-1.5 text-center leading-tight sm:gap-1 sm:p-2 box-border"
          style={{
            gridColumn: "2 / span 2",
            gridRow: "2 / span 2",
          }}
        >
          <ChartCenterPanel display={display} lang={lang} />
        </div>
        </div>
      </div>
    </div>
  );
}

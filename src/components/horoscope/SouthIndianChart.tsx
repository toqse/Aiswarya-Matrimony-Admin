import {
  MAROON,
  MALAYALAM_FONT,
  PERIMETER_SIGNS,
  SIGN_POSITION,
  planetSymbol,
  t,
  type ChartGrid,
  type ChartPlanet,
  type DasaInfo,
  type HoroscopeLang,
  type StarInfo,
} from "./horoscope-i18n";

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
  return (
    <div
      title={signName || undefined}
      className="relative flex flex-col items-center justify-center gap-0.5 p-0.5 sm:p-1 min-h-[44px] sm:min-h-[58px]"
      style={{
        gridColumn: pos.col,
        gridRow: pos.row,
        border: `1px solid ${MAROON}33`,
        ...(isLagna
          ? { boxShadow: `inset 0 0 0 2px ${MAROON}`, background: `${MAROON}0d` }
          : null),
      }}
    >
      <span className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] leading-none text-muted-foreground">
        {sign}
      </span>
      {isLagna && (
        <span
          className="absolute top-0.5 right-1 text-[7px] sm:text-[8px] font-semibold leading-none"
          style={{ color: MAROON, fontFamily: lang === "ml" ? MALAYALAM_FONT : undefined }}
        >
          {t(lang, "asc")}
        </span>
      )}
      <div
        className="flex flex-wrap items-center justify-center gap-x-0.5 sm:gap-x-1 gap-y-0.5 mt-1"
        style={{ fontFamily: lang === "ml" ? MALAYALAM_FONT : undefined }}
      >
        {planets.map((p, i) => (
          <span
            key={`${p.key}-${i}`}
            title={p.name}
            className="text-[11px] sm:text-[13px] font-bold leading-none"
            style={{ color: MAROON }}
          >
            {planetSymbol(p, lang)}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface SouthIndianChartProps {
  grid: ChartGrid;
  star?: StarInfo | null;
  dasa?: DasaInfo | null;
  lang: HoroscopeLang;
}

/** South Indian (Kerala) 4x4 grid — planets placed by API `houses[signNumber]`. */
export function SouthIndianChart({ grid, star, dasa, lang }: SouthIndianChartProps) {
  const houses = grid.houses ?? {};
  const signNames = grid.sign_names ?? {};
  const lagna = typeof grid.lagna_sign === "number" ? grid.lagna_sign : null;
  const mlFont = lang === "ml" ? MALAYALAM_FONT : undefined;

  return (
    <div
      className="mx-auto grid aspect-square w-full max-w-[min(100%,420px)] grid-cols-4 grid-rows-4"
      style={{ border: `3px solid ${MAROON}` }}
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
        className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 text-center leading-tight"
        style={{
          gridColumn: "2 / span 2",
          gridRow: "2 / span 2",
          border: `1px solid ${MAROON}33`,
          fontFamily: mlFont,
        }}
      >
        {star?.name ? (
          <p className="text-[10px] sm:text-[11px]">
            <span className="text-muted-foreground">{t(lang, "star")}: </span>
            <span className="font-semibold" style={{ color: MAROON }}>
              {star.name}
            </span>
            {typeof star.pada === "number" ? (
              <span className="text-muted-foreground"> ({star.pada})</span>
            ) : null}
          </p>
        ) : null}
        {dasa?.balance_text ? (
          <p className="text-[10px] sm:text-[11px]">
            <span className="text-muted-foreground">{t(lang, "dasa")}: </span>
            <span className="font-semibold" style={{ color: MAROON }}>
              {dasa.balance_text}
            </span>
          </p>
        ) : null}
        {dasa?.lord ? (
          <p className="text-[10px] sm:text-[11px]">
            <span className="text-muted-foreground">{t(lang, "lord")}: </span>
            <span className="font-semibold" style={{ color: MAROON }}>
              {dasa.lord}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

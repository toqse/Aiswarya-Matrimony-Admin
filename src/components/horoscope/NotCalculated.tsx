import { MAROON, MALAYALAM_FONT, t, type HoroscopeLang } from "./horoscope-i18n";

export function NotCalculated({ lang }: { lang: HoroscopeLang }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-8 sm:py-12 text-center px-4"
      style={{ borderColor: `${MAROON}55`, fontFamily: lang === "ml" ? MALAYALAM_FONT : undefined }}
    >
      <p className="text-sm font-semibold" style={{ color: MAROON }}>
        {t(lang, "not_calculated")}
      </p>
      <p className="text-xs text-muted-foreground mt-1 leading-tight">{t(lang, "not_calculated_hint")}</p>
    </div>
  );
}

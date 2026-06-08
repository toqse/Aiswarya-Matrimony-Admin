import { NotCalculated } from "./NotCalculated";
import { SouthIndianChart } from "./SouthIndianChart";
import {
  asChartGrid,
  chartHasPlanets,
  type HoroscopeCharts,
  type HoroscopeLang,
} from "./horoscope-i18n";

export interface ChartViewProps {
  charts: HoroscopeCharts | null | undefined;
  lang: HoroscopeLang;
}

export function BhavaChart({ charts, lang }: ChartViewProps) {
  const grid = asChartGrid(charts?.bhava);
  if (!grid || !chartHasPlanets(grid)) {
    return <NotCalculated lang={lang} />;
  }
  return (
    <SouthIndianChart
      grid={grid}
      star={charts?.star ?? null}
      dasa={charts?.dasa ?? null}
      lang={lang}
    />
  );
}

import { NotCalculated } from "./NotCalculated";
import { SouthIndianChart } from "./SouthIndianChart";
import {
  asChartGrid,
  chartHasPlanets,
  type HoroscopeCharts,
  type HoroscopeDisplay,
  type HoroscopeLang,
} from "./horoscope-i18n";

export interface ChartViewProps {
  charts: HoroscopeCharts | null | undefined;
  display?: HoroscopeDisplay | null;
  lang: HoroscopeLang;
}

export function AmsaChart({ charts, display, lang }: ChartViewProps) {
  const grid = asChartGrid(charts?.amsa);
  if (!grid || !chartHasPlanets(grid)) {
    return <NotCalculated lang={lang} />;
  }
  return <SouthIndianChart grid={grid} display={display} lang={lang} />;
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  getMatchChartJson,
  type ChartJsonType,
  type HoroscopePrimaryPanel,
  type MatchChartJsonResponse,
  type MatchChartPersonJson,
} from "@/lib/astrologyApi";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SouthIndianChartGrid } from "./SouthIndianChartGrid";
import { panelsBrideGroom } from "@/lib/astrologyBrideGroomPanels";
import { ml, matchHeaderLineMl } from "@/lib/malayalam/horoscopeDisplayMl";
import { cn } from "@/lib/utils";

/** API `chart_type` — labels in Malayalam. */
const CHART_MODE_OPTIONS: { value: ChartJsonType; label: string }[] = [
  { value: "rasi", label: ml.rasi },
  { value: "amsakom", label: ml.amsakom },
  { value: "bhavam", label: ml.bhavam },
];

/** Left column = bride, right column = groom (match desktop / traditional order). */
function columnPersons(
  payload: MatchChartJsonResponse,
): { left: MatchChartPersonJson; right: MatchChartPersonJson } {
  return { left: payload.bride, right: payload.groom };
}

export interface MatchChartComparisonProps {
  brideProfileId: number;
  groomProfileId: number;
  primary: HoroscopePrimaryPanel;
  partner: HoroscopePrimaryPanel;
  className?: string;
  /**
   * Rendered below the Rasi / Amsakom / Bhavam radios (e.g. Porutham + profile detail cards),
   * so controls sit between the chart grids and the text summary — same idea as desktop matching UIs.
   */
  footer?: ReactNode;
  /** When a tab fetch fails (after any prior success, success clears again via onJsonChartOk). */
  onJsonChartFail?: () => void;
  /** Called when chart JSON loads successfully for the active tab. */
  onJsonChartOk?: () => void;
}

export function MatchChartComparison({
  brideProfileId,
  groomProfileId,
  primary,
  partner,
  className,
  footer,
  onJsonChartFail,
  onJsonChartOk,
}: MatchChartComparisonProps) {
  const [chartType, setChartType] = useState<ChartJsonType>("rasi");
  const [activeData, setActiveData] = useState<MatchChartJsonResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cacheRef = useRef<Partial<Record<ChartJsonType, MatchChartJsonResponse>>>({});
  const pairKeyRef = useRef(`${brideProfileId}-${groomProfileId}`);
  const onFailRef = useRef(onJsonChartFail);
  const onOkRef = useRef(onJsonChartOk);
  onFailRef.current = onJsonChartFail;
  onOkRef.current = onJsonChartOk;

  useEffect(() => {
    const key = `${brideProfileId}-${groomProfileId}`;
    if (pairKeyRef.current !== key) {
      pairKeyRef.current = key;
      cacheRef.current = {};
      setActiveData(null);
      setLoadError(null);
    }
  }, [brideProfileId, groomProfileId]);

  useEffect(() => {
    const cached = cacheRef.current[chartType];
    if (cached) {
      setActiveData(cached);
      setLoadError(null);
      setLoading(false);
      onOkRef.current?.();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setActiveData(null);

    const partnerMatriId = partner.matri_id?.trim();
    const loadPromise = partnerMatriId
      ? getMatchChartJson({ partnerMatriId, chartType })
      : getMatchChartJson(brideProfileId, groomProfileId, chartType);

    loadPromise
      .then((data) => {
        if (cancelled) return;
        cacheRef.current = { ...cacheRef.current, [chartType]: data };
        setActiveData(data);
        onOkRef.current?.();
      })
      .catch((e) => {
        if (cancelled) return;
        setActiveData(null);
        setLoadError(e instanceof Error ? e.message : "Could not load chart data.");
        onFailRef.current?.();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chartType, brideProfileId, groomProfileId, partner.matri_id]);

  const { bride: bridePanel, groom: groomPanel } = panelsBrideGroom(
    primary,
    partner,
    brideProfileId,
    groomProfileId,
  );
  const leftRight = activeData && columnPersons(activeData);

  const pngLeft = bridePanel.chart_url?.trim();
  const pngRight = groomPanel.chart_url?.trim();

  return (
    <div className={cn("space-y-4 font-ml", className)} dir="ltr">
      <div className="min-h-[8rem]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{ml.loadingChart}</span>
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
            {loadError}
            {(pngLeft || pngRight) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {ml.chartJsonErrorHint}
              </p>
            )}
          </div>
        ) : leftRight ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SouthIndianChartGrid
              person={{
                ...leftRight.left,
                date_of_birth: leftRight.left.date_of_birth ?? bridePanel.date_of_birth,
                time_of_birth: leftRight.left.time_of_birth ?? bridePanel.time_of_birth,
                place_of_birth: leftRight.left.place_of_birth ?? bridePanel.place_of_birth,
              }}
              headerLine={matchHeaderLineMl(
                bridePanel.matri_id,
                bridePanel.role,
                ml.roleBride,
              )}
            />
            <SouthIndianChartGrid
              person={{
                ...leftRight.right,
                date_of_birth: leftRight.right.date_of_birth ?? groomPanel.date_of_birth,
                time_of_birth: leftRight.right.time_of_birth ?? groomPanel.time_of_birth,
                place_of_birth: leftRight.right.place_of_birth ?? groomPanel.place_of_birth,
              }}
              headerLine={matchHeaderLineMl(
                groomPanel.matri_id,
                groomPanel.role,
                ml.roleGroom,
              )}
            />
          </div>
        ) : null}
      </div>

      <RadioGroup
        value={chartType}
        onValueChange={(v) => setChartType(v as ChartJsonType)}
        className="flex flex-row flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-primary/10 py-3"
        aria-label={ml.rasi}
      >
        {CHART_MODE_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={`match-chart-${opt.value}`} />
            <Label
              htmlFor={`match-chart-${opt.value}`}
              className="cursor-pointer text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {footer ? <div className="pt-1">{footer}</div> : null}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { fetchHoroscopeRecordDetail } from "@/lib/admin-api/horoscope";
import { getApiErrorMessage } from "@/lib/admin-api/http";
import { formatDate, formatTimeOfBirthDisplay } from "@/lib/format-date";
import {
  HoroscopeChart,
  extractHoroscopeCharts,
  type HoroscopeDisplay,
  type HoroscopeLang,
} from "@/components/horoscope/HoroscopeChart";
import {
  dasaLordDisplayFromStar,
  localizeHoroscopeDisplay,
  nakshatraDisplayFromStar,
  signNameFromChartString,
} from "@/components/horoscope/horoscope-i18n";

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function pickPada(...vals: unknown[]): string | number | undefined {
  for (const v of vals) {
    if (v == null || v === "") continue;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

export function ProfileHoroscopeView({ userUuid }: { userUuid: string }) {
  const { role } = useRole();
  const [lang, setLang] = useState<HoroscopeLang>("ml");

  const { data, isLoading, error } = useQuery({
    queryKey: ["horoscope", role, "detail", userUuid],
    queryFn: () => fetchHoroscopeRecordDetail(role, userUuid),
    enabled: Boolean(userUuid.trim()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading horoscope chart…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {getApiErrorMessage(
          error,
          "Horoscope chart is not available yet. Open Horoscope Management to generate it.",
        )}
        <div className="mt-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/horoscope" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Horoscope
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const payload = asRecord(data);
  const record = Object.keys(asRecord(payload.record)).length ? asRecord(payload.record) : payload;
  const horoscope = asRecord(payload.horoscope);
  const horo = Object.keys(horoscope).length ? horoscope : record;

  const charts = extractHoroscopeCharts(horo);
  const chartSource = {
    rasiString: horo.pr_rasi ?? record.pr_rasi ?? payload.pr_rasi,
    amsaString: horo.pr_amsa ?? record.pr_amsa ?? payload.pr_amsa,
    bhavaString: horo.pr_bhav ?? horo.pr_bhava ?? record.pr_bhav ?? record.pr_bhava,
  };

  const starNumber = horo.pr_star ?? record.pr_star ?? payload.pr_star;
  const starPada = pickPada(horo.pr_pada, horo.nakshatra_pada, record.pr_pada);
  const dasaDirect = pickStr(horo.dasa_display);
  const dasaFallback = pickStr(asRecord(asRecord(horo.charts).dasa).balance_text);

  const displayRaw: HoroscopeDisplay = {
    name: pickStr(record.name, horo.pr_name),
    date_of_birth: pickStr(record.dob, horo.pr_dob),
    time_of_birth: pickStr(horo.pr_tob),
    star_display: pickStr(horo.star_display) || nakshatraDisplayFromStar(starNumber, starPada, lang),
    nakshatra_pada: starPada,
    dasa_display: dasaDirect || dasaFallback,
    dasa_lord: pickStr(horo.dasa_lord) || dasaLordDisplayFromStar(starNumber, lang),
    lagnam_display: pickStr(horo.lagnam_display) || signNameFromChartString(chartSource.rasiString, 0, lang),
    rasi_display: pickStr(horo.rasi_display) || signNameFromChartString(chartSource.rasiString, 2, lang),
  };
  const display = localizeHoroscopeDisplay(displayRaw, lang) ?? displayRaw;

  const summary = [
    ["Star", display.star_display],
    ["Pada", starPada],
    ["Rasi", display.rasi_display],
    ["Lagnam", display.lagnam_display],
    ["Dasa", display.dasa_display],
    ["Lord", display.dasa_lord],
    ["Date of birth", formatDate(display.date_of_birth)],
    ["Time of birth", formatTimeOfBirthDisplay(display.time_of_birth) || display.time_of_birth],
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {summary.map(([label, value]) => (
          <div key={label} className="rounded-md border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm break-words">{value ? String(value) : "-"}</p>
          </div>
        ))}
      </div>

      <HoroscopeChart
        charts={charts}
        source={chartSource}
        display={display}
        lang={lang}
        onLangChange={setLang}
      />

      <Button variant="outline" size="sm" asChild>
        <Link to="/horoscope" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Open in Horoscope Management
        </Link>
      </Button>
    </div>
  );
}

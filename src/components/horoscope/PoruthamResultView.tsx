import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";

const matchResultColors: Record<string, string> = {
  Excellent: "bg-success text-success-foreground",
  Good: "bg-primary text-primary-foreground",
  Average: "bg-warning text-warning-foreground",
  Poor: "bg-destructive text-destructive-foreground",
};

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

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

/** API may return envelope; unwrap also happens in http client — support both. */
function poruthamRoot(payload: unknown): Record<string, unknown> {
  const p = asRecord(payload);
  if (!p) return {};
  const inner = asRecord(p.data);
  if (inner) return inner;
  return p;
}

function chartUrlFromHoroscope(h: Record<string, unknown> | null): string {
  if (!h) return "";
  return pickStr(h.bride_chart_url, h.groom_chart_url, h.chart_url, h.jathakam_url, h.horoscope_chart_url);
}

const KOOTA_ORDER = [
  "dina",
  "gana",
  "mahendra",
  "sthree_deergha",
  "yoni",
  "rasi",
  "rasi_adhipathi",
  "rasiyadhipathy",
  "vasya",
  "rajju",
  "vedha",
];

function formatKootaKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function sortKootaKeys(keys: string[]): string[] {
  const orderMap = new Map(KOOTA_ORDER.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => {
    const ia = orderMap.get(a.toLowerCase()) ?? 999;
    const ib = orderMap.get(b.toLowerCase()) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });
}

const COMPARE_ROWS: { keys: string[]; label: string }[] = [
  { keys: ["date_of_birth", "dob", "birth_date"], label: "Date of birth" },
  { keys: ["time_of_birth", "birth_time"], label: "Time of birth" },
  { keys: ["place_of_birth", "birth_place"], label: "Place of birth" },
  { keys: ["lagna"], label: "Lagna" },
  { keys: ["rasi", "rashi", "moon_sign"], label: "Rasi" },
  { keys: ["nakshatra", "nakshatram", "star"], label: "Nakshatra" },
  { keys: ["nakshatra_pada", "pada"], label: "Pada" },
  { keys: ["gana"], label: "Gana" },
  { keys: ["yoni"], label: "Yoni" },
  { keys: ["rajju"], label: "Rajju" },
  { keys: ["madi"], label: "Madi" },
];

function fieldValue(h: Record<string, unknown> | null, keys: string[]): string {
  if (!h) return "—";
  for (const k of keys) {
    const v = h[k];
    const s = pickStr(v);
    if (s) return s;
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return "—";
}

function latLngLine(h: Record<string, unknown> | null): string | null {
  if (!h) return null;
  const lat = pickStr(h.latitude);
  const lng = pickStr(h.longitude);
  if (!lat && !lng) return null;
  return [lat && `Lat ${lat}`, lng && `Lng ${lng}`].filter(Boolean).join(" · ");
}

type SpecialCheckRow = {
  label: string;
  pass: boolean | undefined;
  points: number | null;
};

function pickByKeys(obj: Record<string, unknown> | null, keys: string[]): unknown {
  if (!obj) return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  }
  return undefined;
}

function parseCheckPass(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (!s) return undefined;
    if (["yes", "true", "pass", "matched", "match", "ok"].includes(s)) return true;
    if (["no", "false", "fail", "failed", "not matched", "unmatched", "x"].includes(s)) return false;
    if (!Number.isNaN(Number(s))) return Number(s) > 0;
  }
  return undefined;
}

function parseCheckPoints(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

export function PoruthamResultView({ result }: { result: unknown }) {
  const root = poruthamRoot(result);

  const brideH = asRecord(root.bride_horoscope) ?? asRecord(root.bride);
  const groomH = asRecord(root.groom_horoscope) ?? asRecord(root.groom);

  const brideChart = chartUrlFromHoroscope(brideH) || pickStr(root.bride_chart_url);
  const groomChart = chartUrlFromHoroscope(groomH) || pickStr(root.groom_chart_url);

  const score = pickNum(root.score, root.total_score, root.match_score);
  const maxScore = pickNum(root.max_score, root.max, 10);
  const overall = pickStr(root.result, root.overall_result, root.verdict);

  const kootaPoints = asRecord(root.koota_points) ?? {};
  const poruthamsObj = asRecord(root.poruthams);

  const kootaKeys = sortKootaKeys(
    Array.from(
      new Set([...Object.keys(kootaPoints), ...(poruthamsObj ? Object.keys(poruthamsObj) : [])]),
    ).filter((k) => !["score", "max_score", "result", "bride_chart_url", "groom_chart_url"].includes(k)),
  );

  const pct = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;

  const legacyList = Array.isArray(root.poruthams) ? root.poruthams : Array.isArray(root.porutham_list) ? root.porutham_list : null;
  const specialChecks: SpecialCheckRow[] = [
    {
      label: "Kujadhosham",
      pass: parseCheckPass(
        pickByKeys(poruthamsObj, ["kujadhosham", "kuja_dosham", "kuja_dosham_match", "mangal_dosham"]) ??
          pickByKeys(root, ["kujadhosham", "kuja_dosham", "kuja_dosham_match", "mangal_dosham"]),
      ),
      points: parseCheckPoints(
        pickByKeys(kootaPoints, ["kujadhosham", "kuja_dosham", "kuja_dosham_match", "mangal_dosham"]) ??
          pickByKeys(root, ["kujadhosham_points", "kuja_dosham_points", "mangal_dosham_points"]),
      ),
    },
    {
      label: "Papam Samyam",
      pass: parseCheckPass(
        pickByKeys(poruthamsObj, ["papam_samyam", "papam_samayam", "paapa_samyam", "paapam_samyam"]) ??
          pickByKeys(root, ["papam_samyam", "papam_samayam", "paapa_samyam", "paapam_samyam"]),
      ),
      points: parseCheckPoints(
        pickByKeys(kootaPoints, ["papam_samyam", "papam_samayam", "paapa_samyam", "paapam_samyam"]) ??
          pickByKeys(root, ["papam_samyam_points", "papam_samayam_points", "paapa_samyam_points", "paapam_samyam_points"]),
      ),
    },
    {
      label: "Dasa Sandhi",
      pass: parseCheckPass(
        pickByKeys(poruthamsObj, ["dasa_sandhi", "dasasandhi", "dasha_sandhi"]) ??
          pickByKeys(root, ["dasa_sandhi", "dasasandhi", "dasha_sandhi"]),
      ),
      points: parseCheckPoints(
        pickByKeys(kootaPoints, ["dasa_sandhi", "dasasandhi", "dasha_sandhi"]) ??
          pickByKeys(root, ["dasa_sandhi_points", "dasasandhi_points", "dasha_sandhi_points"]),
      ),
    },
  ];
  const hasSpecialChecks = specialChecks.some((c) => c.pass !== undefined || c.points !== null);

  return (
    <div className="space-y-6 text-sm">
      {(score > 0 || overall || maxScore > 0) && (
        <div className="rounded-lg border bg-card/50 p-4 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Overall match</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold tabular-nums">{score > 0 || maxScore ? score.toFixed(score % 1 ? 1 : 0) : "—"}</span>
                {maxScore > 0 && (
                  <span className="text-muted-foreground tabular-nums">
                    / {maxScore}
                  </span>
                )}
              </div>
            </div>
            {overall ? (
              <Badge className={cn("text-sm px-3 py-1", matchResultColors[overall] ?? "bg-muted text-muted-foreground")}>{overall}</Badge>
            ) : null}
          </div>
          {maxScore > 0 && score >= 0 ? (
            <div className="space-y-1">
              <Progress value={pct} className="h-2" />
              <p className="text-xs text-muted-foreground">{pct}% of maximum koota score</p>
            </div>
          ) : null}
        </div>
      )}

      {(brideH || groomH) && (
        <div>
          <p className="text-sm font-semibold mb-2">Birth details</p>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[28%]">Field</TableHead>
                  <TableHead className="w-[36%]">Bride</TableHead>
                  <TableHead className="w-[36%]">Groom</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARE_ROWS.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="text-muted-foreground font-medium">{row.label}</TableCell>
                    <TableCell className="font-medium">{fieldValue(brideH, row.keys)}</TableCell>
                    <TableCell className="font-medium">{fieldValue(groomH, row.keys)}</TableCell>
                  </TableRow>
                ))}
                {(() => {
                  const b = latLngLine(brideH);
                  const g = latLngLine(groomH);
                  if (!b && !g) return null;
                  return (
                    <TableRow>
                      <TableCell className="text-muted-foreground font-medium">Coordinates</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{g ?? "—"}</TableCell>
                    </TableRow>
                  );
                })()}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {(brideChart || groomChart) && (
        <div>
          <p className="text-sm font-semibold mb-2">Charts</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-3 bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground uppercase">Bride</p>
              {brideChart ? (
                <a href={brideChart} target="_blank" rel="noopener noreferrer" className="block group">
                  <img
                    src={brideChart}
                    alt="Bride horoscope chart"
                    className="w-full max-h-64 object-contain rounded-md border bg-background"
                  />
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
                    <ExternalLink className="h-3 w-3" /> Open full size
                  </span>
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">No chart URL</p>
              )}
            </div>
            <div className="space-y-2 rounded-lg border p-3 bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground uppercase">Groom</p>
              {groomChart ? (
                <a href={groomChart} target="_blank" rel="noopener noreferrer" className="block group">
                  <img
                    src={groomChart}
                    alt="Groom horoscope chart"
                    className="w-full max-h-64 object-contain rounded-md border bg-background"
                  />
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
                    <ExternalLink className="h-3 w-3" /> Open full size
                  </span>
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">No chart URL</p>
              )}
            </div>
          </div>
        </div>
      )}

      {kootaKeys.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Koota breakdown</p>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Koota</TableHead>
                  <TableHead className="w-[100px] text-center">Porutham</TableHead>
                  <TableHead className="w-[90px] text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kootaKeys.map((key) => {
                  const pts = kootaPoints[key];
                  const num = typeof pts === "number" ? pts : typeof pts === "string" && !Number.isNaN(Number(pts)) ? Number(pts) : null;
                  const pass = poruthamsObj ? poruthamsObj[key] === true : undefined;
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{formatKootaKey(key)}</TableCell>
                      <TableCell className="text-center">
                        {pass === true && <CheckCircle className="h-4 w-4 text-success inline-block" aria-label="Match" />}
                        {pass === false && <XCircle className="h-4 w-4 text-destructive inline-block" aria-label="No match" />}
                        {pass === undefined && <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {num !== null ? (Number.isInteger(num) ? String(num) : num.toFixed(1)) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {hasSpecialChecks && (
        <div>
          <p className="text-sm font-semibold mb-2">Traditional checks</p>
          <div className="rounded-md border divide-y bg-card/40">
            {specialChecks.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-3 py-2">
                <span className="font-medium">{item.label}</span>
                <div className="flex items-center gap-3">
                  {item.pass === true && <CheckCircle className="h-4 w-4 text-success" aria-label="Match" />}
                  {item.pass === false && <XCircle className="h-4 w-4 text-destructive" aria-label="No match" />}
                  {item.pass === undefined && <span className="text-xs text-muted-foreground">—</span>}
                  <span className="w-10 text-right font-mono tabular-nums">
                    {item.points === null ? "—" : Number.isInteger(item.points) ? String(item.points) : item.points.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {legacyList && legacyList.length > 0 && !poruthamsObj && (
        <div>
          <p className="text-sm font-semibold mb-2">Breakdown (legacy)</p>
          <div className="space-y-2">
            {legacyList.map((p: unknown, i: number) => {
              const o = asRecord(p) ?? {};
              const name = pickStr(o.name, o.porutham, o.label) || `Item ${i + 1}`;
              const s = pickNum(o.score, o.value);
              const matched = o.matched === true || pickStr(o.status).toLowerCase() === "match";
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                  <span className="flex items-center gap-2">
                    {matched ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    {name}
                  </span>
                  <span className="font-mono">{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Raw API response</summary>
        <pre className="mt-2 p-2 rounded bg-muted overflow-x-auto max-h-56 text-[11px] leading-relaxed">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Sparkles,
  Check,
  X,
  Phone,
  Loader2,
  FileText,
} from "lucide-react";
import {
  cn,
  formatDateDdMmYyyy,
  formatTimeOfBirthDisplay,
} from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  getBirthDetails,
  getProfile,
  updateBirthDetails,
} from "@/lib/profileApi";
import { getMyPlan, type MyPlanDetails } from "@/lib/plansApi";
import {
  getMyHoroscope,
  postGenerateHoroscope,
  getBirthDetailCandidates,
  postAstrologyPdfOrder,
  postAstrologyPdfVerify,
  type AstrologyPdfProduct,
  type BirthDetailCandidate,
  type HoroscopeMeData,
  type HoroscopePrimaryPanel,
  type MatchBlock,
  type PoruthamDetailedItem,
} from "@/lib/astrologyApi";
import {
  extendedPoruthamChecklist,
  poruthamRowsFromMatch,
} from "@/lib/astrologyPoruthamDisplay";
import { panelsBrideGroom } from "@/lib/astrologyBrideGroomPanels";
import {
  dasaDurationMalayalam,
  grahaNameMalayalam,
  ml,
  nakshatraNameMalayalam,
  poruthamRowLabelMalayalam,
  rasiNameMalayalam,
  roleNameMalayalam,
} from "@/lib/malayalam/horoscopeDisplayMl";
import { downloadMatchCompatibilityReportPdf } from "@/lib/matchReportPdf";
import { MatchChartComparison } from "@/components/astrology/MatchChartComparison";

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name?: string;
      description?: string;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void;
      prefill?: { name?: string };
      theme?: { color?: string };
      modal?: { ondismiss?: () => void };
    }) => { open: () => void };
  }
}

type Meridian = "AM" | "PM";

function jathagamAuthKey(): string {
  const u = useAuthStore.getState().user;
  return (u?.matriId?.trim() || u?.phone || u?.email || "").trim();
}

type JathagamPageSessionCache = {
  authKey: string;
  displayName: string;
  timeOfBirth: string;
  timeMeridian: Meridian;
  placeOfBirth: string;
  myPlan: MyPlanDetails | null;
  candidates: BirthDetailCandidate[];
  selectedMatriId: string;
  candidatesError: string | null;
};

let jathagamPageSessionCache: JathagamPageSessionCache | null = null;

function readJathagamPageCache(): JathagamPageSessionCache | null {
  const key = jathagamAuthKey();
  if (!key || !jathagamPageSessionCache || jathagamPageSessionCache.authKey !== key) {
    return null;
  }
  return jathagamPageSessionCache;
}

function writeJathagamPageCache(patch: Omit<JathagamPageSessionCache, "authKey">) {
  const key = jathagamAuthKey();
  if (!key) return;
  jathagamPageSessionCache = { authKey: key, ...patch };
}

function parseApiTimeTo12Hour(value: string): {
  time12: string;
  meridian: Meridian;
} {
  const t = value.trim();
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(t);
  if (!m) return { time12: "", meridian: "AM" };
  const hour24 = Number(m[1]);
  const minute = m[2];
  const meridian: Meridian = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { time12: `${String(hour12).padStart(2, "0")}:${minute}`, meridian };
}

function toApiTime12(time12: string, meridian: Meridian): string {
  const t = time12.trim();
  const m = /^(0?[1-9]|1[0-2]):([0-5]\d)$/.exec(t);
  if (!m) return "";
  const hour12 = Number(m[1]);
  const minute = m[2];
  let hour24 = hour12 % 12;
  if (meridian === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${minute}:00`;
}

function get12HourParts(time12: string): {
  hour: string;
  minute: string;
} {
  const m = /^(0?[1-9]|1[0-2]):([0-5]\d)$/.exec(time12.trim());
  if (!m) return { hour: "12", minute: "00" };
  return { hour: String(Number(m[1])), minute: m[2] };
}

function build12HourTime(hour: string, minute: string): string {
  const h = Number(hour);
  if (!Number.isInteger(h) || h < 1 || h > 12) return "";
  const m = /^([0-5]\d)$/.exec(minute);
  if (!m) return "";
  return `${String(h).padStart(2, "0")}:${m[1]}`;
}

let razorpayScriptPromise: Promise<boolean> | null = null;
async function ensureRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

function ProfileChartColumn({
  panel,
  showChartPng = true,
}: {
  panel: HoroscopePrimaryPanel;
  /** When false, skip the PNG (e.g. JSON match charts shown above). */
  showChartPng?: boolean;
}) {
  const url = panel.chart_url?.trim() ?? "";
  const cp = panel.center_panel;
  const dasa = cp?.dasa;

  return (
    <div className="flex flex-col items-stretch gap-3 rounded-xl border border-primary/15 bg-card p-4 shadow-sm font-ml">
      <div className="text-center space-y-1 border-b border-primary/10 pb-3">
        {panel.matri_id ? (
          <p className="text-xs font-mono text-muted-foreground tracking-tight">
            {panel.matri_id}
          </p>
        ) : null}
        <p className="font-bold text-foreground text-sm sm:text-base uppercase tracking-wide">
          {panel.name ?? "—"}
        </p>
        {panel.role ? (
          <p className="text-xs font-semibold text-primary">
            {roleNameMalayalam(panel.role)}
          </p>
        ) : null}
      </div>
      {showChartPng ? (
        <div className="flex justify-center">
          {url ? (
            <img
              src={url}
              alt={`Horoscope chart for ${panel.name ?? panel.matri_id ?? "profile"}`}
              className="w-full max-w-[min(100%,420px)] rounded-lg border border-primary/10 bg-white object-contain"
            />
          ) : (
            <div className="flex h-48 w-full max-w-[280px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
              {ml.chartNotAvailable}
            </div>
          )}
        </div>
      ) : null}
      <div className="rounded-lg border border-primary/10 bg-muted/20 p-3 text-center text-xs space-y-1.5">
        {panel.chart_meta?.display_title ? (
          <p className="font-medium text-foreground leading-snug">
            {panel.chart_meta.display_title}
          </p>
        ) : null}
        <p className="text-muted-foreground">
          {[
            rasiNameMalayalam(panel.chart_meta?.rasi_label ?? panel.rasi),
            rasiNameMalayalam(panel.chart_meta?.lagna_label ?? panel.lagna),
          ]
            .filter((x) => x && x !== "—")
            .join(" · ")}
        </p>
        {panel.date_of_birth?.trim() ||
        panel.time_of_birth?.trim() ||
        panel.place_of_birth?.trim() ? (
          <div className="pt-1 space-y-0.5 text-[11px] text-muted-foreground">
            {panel.date_of_birth?.trim() ? (
              <p>
                {ml.dob}: {formatDateDdMmYyyy(panel.date_of_birth)}
              </p>
            ) : null}
            {panel.time_of_birth?.trim() ? (
              <p>
                {ml.tob}: {formatTimeOfBirthDisplay(panel.time_of_birth)}
              </p>
            ) : null}
            {panel.place_of_birth?.trim() ? (
              <p>
                {ml.pob}: {panel.place_of_birth.trim()}
              </p>
            ) : null}
          </div>
        ) : null}
        {cp?.nakshatra != null || cp?.padam != null ? (
          <div className="pt-2 border-t border-primary/10 space-y-0.5">
            {cp.nakshatra ? (
              <p>
                <span className="text-muted-foreground">{ml.nakshatra}</span> ·{" "}
                {nakshatraNameMalayalam(cp.nakshatra)}
                {cp.nakshatra_english
                  ? ` (${nakshatraNameMalayalam(cp.nakshatra_english)})`
                  : ""}
              </p>
            ) : null}
            {cp.padam != null ? (
              <p>
                <span className="text-muted-foreground">{ml.padam}</span> ·{" "}
                {cp.padam}
              </p>
            ) : null}
          </div>
        ) : null}
        {dasa && (dasa.remaining_label || dasa.lord) ? (
          <div className="pt-2 border-t border-primary/10 space-y-1">
            <p className="font-semibold text-foreground">{ml.dasaTitle}</p>
            {dasa.remaining_label ? (
              <p className="text-foreground">
                {dasaDurationMalayalam(dasa.remaining_label)}
              </p>
            ) : null}
            {dasa.lord ? (
              <p>
                <span className="text-muted-foreground">
                  {ml.dasaLord}
                </span>{" "}
                · {grahaNameMalayalam(dasa.lord)}
              </p>
            ) : null}
          </div>
        ) : null}
        {panel.kuja_dosham != null || panel.kendra_malefic_count != null ? (
          <p className="text-[11px] text-muted-foreground pt-1">
            {[
              panel.kuja_dosham != null
                ? `${ml.kujaDosham}: ${
                    panel.kuja_dosham ? ml.yes : ml.no
                  }`
                : null,
              panel.kendra_malefic_count != null
                ? `${ml.kendraMalefic}: ${panel.kendra_malefic_count}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PoruthamChecklistColumn({ rows }: { rows: PoruthamDetailedItem[] }) {
  return (
    <div className="flex flex-col justify-center gap-0 min-h-[120px] rounded-xl border-2 border-primary/20 bg-primary/5 px-3 py-4 sm:px-4 font-ml">
      <p className="text-[10px] tracking-wider text-muted-foreground font-semibold mb-2 text-center">
        {ml.poruthamTitle}
      </p>
      <ul className="space-y-1.5 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-2 text-xs sm:text-sm py-1 border-b border-primary/5 last:border-0"
          >
            <span className="text-foreground font-medium leading-tight">
              {poruthamRowLabelMalayalam(row.key, row.label)}
            </span>
            {typeof row.points === "number" ? (
              <span className="text-[11px] text-muted-foreground ml-auto mr-1">
                {row.points.toFixed(1)}
              </span>
            ) : null}
            <span
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded border border-primary/20 bg-background"
              title={row.description}
            >
              {row.matched ? (
                <Check className="h-3.5 w-3.5 text-green-600" strokeWidth={3} />
              ) : (
                <X className="h-3.5 w-3.5 text-red-500" strokeWidth={2.5} />
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JathagamPage() {
  const user = useAuthStore((s) => s.user);

  const [displayName, setDisplayName] = useState(
    () => readJathagamPageCache()?.displayName ?? "",
  );
  const [timeOfBirth, setTimeOfBirth] = useState(
    () => readJathagamPageCache()?.timeOfBirth ?? "",
  );
  const [timeMeridian, setTimeMeridian] = useState<Meridian>(
    () => readJathagamPageCache()?.timeMeridian ?? "AM",
  );
  const [placeOfBirth, setPlaceOfBirth] = useState(
    () => readJathagamPageCache()?.placeOfBirth ?? "",
  );
  const [savingBirthDetails, setSavingBirthDetails] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(
    () => readJathagamPageCache() == null,
  );
  const [myPlan, setMyPlan] = useState<MyPlanDetails | null>(
    () => readJathagamPageCache()?.myPlan ?? null,
  );

  const [candidates, setCandidates] = useState<BirthDetailCandidate[]>(
    () => readJathagamPageCache()?.candidates ?? [],
  );
  const [candidatesError, setCandidatesError] = useState<string | null>(
    () => readJathagamPageCache()?.candidatesError ?? null,
  );
  const [selectedMatriId, setSelectedMatriId] = useState(
    () => readJathagamPageCache()?.selectedMatriId ?? "",
  );
  const selectedMatriIdRef = useRef(selectedMatriId);
  selectedMatriIdRef.current = selectedMatriId;

  /** Shown only in Birth Details after "Generate Horoscope (chart)" or "Refresh" (self-only). */
  const [selfHoroscopeData, setSelfHoroscopeData] =
    useState<HoroscopeMeData | null>(null);
  /** Set only by "Check Match" — drives the comparison report; does not update the self Grahanila card. */
  const [matchResponseData, setMatchResponseData] =
    useState<HoroscopeMeData | null>(null);
  const [matchBlock, setMatchBlock] = useState<MatchBlock | null>(null);
  const [generatingChart, setGeneratingChart] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(false);
  const [processingPdfProduct, setProcessingPdfProduct] =
    useState<AstrologyPdfProduct | null>(null);
  const [downloadingMatchPdf, setDownloadingMatchPdf] = useState(false);
  /** If §4b JSON fails, show PNG charts in the pair columns again. */
  const [matchJsonChartFailed, setMatchJsonChartFailed] = useState(false);

  const loadPageData = useCallback(async () => {
    const hadWarmCache = readJathagamPageCache() != null;
    if (!hadWarmCache) {
      setLoadingInitial(true);
    }
    setCandidatesError(null);
    try {
      const [bdRes, profRes, planRes] = await Promise.all([
        getBirthDetails(),
        getProfile(),
        getMyPlan().catch(() => null),
      ]);

      const name = profRes.data?.basic_details?.name?.trim() ?? "";
      setDisplayName(name);

      const t = bdRes.data?.time_of_birth?.trim() ?? "";
      const parsed = parseApiTimeTo12Hour(t);
      const place = bdRes.data?.place_of_birth?.trim() ?? "";
      setTimeOfBirth(parsed.time12);
      setTimeMeridian(parsed.meridian);
      setPlaceOfBirth(place);

      let nextCandidates: BirthDetailCandidate[] = [];
      let nextCandError: string | null = null;
      let resolvedSelected = selectedMatriIdRef.current;

      if (planRes?.success && planRes.data) {
        setMyPlan(planRes.data);
        if (planRes.data.is_plan_active) {
          try {
            const cRes = await getBirthDetailCandidates({ limit: 20 });
            nextCandidates = cRes.data.results;
            setCandidates(nextCandidates);
            const firstId = nextCandidates[0]?.matri_id ?? "";
            if (
              resolvedSelected &&
              nextCandidates.some((r) => r.matri_id === resolvedSelected)
            ) {
              setSelectedMatriId(resolvedSelected);
            } else {
              resolvedSelected = firstId;
              setSelectedMatriId(resolvedSelected);
            }
          } catch (e) {
            nextCandidates = [];
            resolvedSelected = "";
            nextCandError =
              e instanceof Error ? e.message : "Could not load candidates.";
            setCandidates([]);
            setSelectedMatriId("");
            setCandidatesError(nextCandError);
          }
        } else {
          nextCandidates = [];
          resolvedSelected = "";
          setCandidates([]);
          setSelectedMatriId("");
        }
      } else {
        setMyPlan(null);
        nextCandidates = [];
        resolvedSelected = "";
        setCandidates([]);
        setSelectedMatriId("");
      }

      writeJathagamPageCache({
        displayName: name,
        timeOfBirth: parsed.time12,
        timeMeridian: parsed.meridian,
        placeOfBirth: place,
        myPlan: planRes?.success && planRes.data ? planRes.data : null,
        candidates: nextCandidates,
        selectedMatriId: resolvedSelected,
        candidatesError: nextCandError,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load page data.");
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    setMatchJsonChartFailed(false);
  }, [matchBlock?.bride_profile_id, matchBlock?.groom_profile_id]);

  const handleUpdateBirthDetails = async () => {
    const place = placeOfBirth.trim();
    const timeApi = toApiTime12(timeOfBirth, timeMeridian);
    if (!place) {
      toast.error("Place of birth is required.");
      return;
    }
    if (!timeApi) {
      toast.error("Time of birth is required.");
      return;
    }
    setSavingBirthDetails(true);
    try {
      const res = await updateBirthDetails({
        time_of_birth: timeApi,
        place_of_birth: place,
      });
      toast.success(res.message ?? "Birth details updated successfully.");
      const t = res.data?.time_of_birth?.trim() ?? "";
      const parsed = parseApiTimeTo12Hour(t);
      setTimeOfBirth(parsed.time12);
      setTimeMeridian(parsed.meridian);
      setPlaceOfBirth(res.data?.place_of_birth?.trim() ?? place);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save birth details.",
      );
    } finally {
      setSavingBirthDetails(false);
    }
  };

  const handleGenerateChart = async () => {
    setGeneratingChart(true);
    try {
      const res = await getMyHoroscope("south");
      setSelfHoroscopeData(res.data);
      setMatchResponseData(null);
      setMatchBlock(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load horoscope.";
      toast.error(msg);
    } finally {
      setGeneratingChart(false);
    }
  };

  const handleCheckMatch = async () => {
    const myMatri = user?.matriId?.trim();
    const partner = selectedMatriId.trim();
    if (!myMatri) {
      toast.error("Matri ID not found. Please sign in again.");
      return;
    }
    if (!partner) {
      toast.error("Select a candidate to check compatibility.");
      return;
    }
    setCheckingMatch(true);
    try {
      const res = await postGenerateHoroscope({
        matri_id: myMatri,
        partner_matri_id: partner,
      });
      setMatchResponseData(res.data);
      setMatchBlock(res.data.match ?? null);
      if (!res.data.match) {
        toast.message(
          "Compatibility report not available. The other member may need complete birth details or horoscope generation.",
        );
      } else {
        toast.success(
          res.data.match.summary?.result ?? "Compatibility calculated.",
        );
      }
      try {
        const planRes = await getMyPlan();
        if (planRes.success) setMyPlan(planRes.data);
      } catch {
        // banner may stay stale; non-fatal
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not check match.");
    } finally {
      setCheckingMatch(false);
    }
  };

  const handleDownloadMatchReportPdf = async () => {
    const myMatri = user?.matriId?.trim();
    if (!myMatri) {
      toast.error("Matri ID not found. Please sign in again.");
      return;
    }
    if (!matchResponseData || !matchBlock) {
      toast.error("Run Check Match first to build the report.");
      return;
    }
    if (!matchResponseData.primary || !matchResponseData.partner) {
      toast.error("Full pair profile is required for the PDF report.");
      return;
    }
    setDownloadingMatchPdf(true);
    try {
      await downloadMatchCompatibilityReportPdf({
        data: matchResponseData,
        match: matchBlock,
        userMatriId: myMatri,
      });
      toast.success("Match report downloaded.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not generate match report PDF.",
      );
    } finally {
      setDownloadingMatchPdf(false);
    }
  };

  const handleBuyAstrologyPdf = async (product: AstrologyPdfProduct) => {
    setProcessingPdfProduct(product);
    try {
      const sdkReady = await ensureRazorpayScript();
      if (!sdkReady || !window.Razorpay) {
        throw new Error("Could not load Razorpay checkout.");
      }
      const RazorpayCtor = window.Razorpay;

      const orderRes = await postAstrologyPdfOrder({ product });
      const order = orderRes.data;

      await new Promise<void>((resolve, reject) => {
        const rz = new RazorpayCtor({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          order_id: order.order_id,
          name: "Matrimony Astrology",
          description:
            product === "jathakam" ? "Jathakam PDF" : "Thalakuri PDF",
          prefill: { name: displayName || undefined },
          theme: { color: "#8d1b5b" },
          handler: async (payment) => {
            try {
              const verifyRes = await postAstrologyPdfVerify({
                product,
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,
              });
              const downloadUrl = verifyRes.data?.download_url?.trim();
              if (!downloadUrl) {
                throw new Error(
                  "Download URL missing in verification response.",
                );
              }
              window.open(downloadUrl, "_blank", "noopener,noreferrer");
              toast.success(
                verifyRes.message ??
                  `${product === "jathakam" ? "Jathakam" : "Thalakuri"} PDF is ready.`,
              );
              resolve();
            } catch (e) {
              reject(
                e instanceof Error
                  ? e
                  : new Error("Payment verified but PDF could not be opened."),
              );
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        });
        rz.open();
      });
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Could not process astrology PDF payment.";
      if (msg !== "Payment cancelled.") toast.error(msg);
    } finally {
      setProcessingPdfProduct(null);
    }
  };

  const selfPrimary = selfHoroscopeData?.primary;
  const chartUrlSelf = selfPrimary?.chart_url ?? selfHoroscopeData?.chart_url;
  const poruthamRows = matchBlock ? poruthamRowsFromMatch(matchBlock) : [];
  const comparisonRows = matchBlock
    ? extendedPoruthamChecklist(matchBlock)
    : [];
  const showPairComparison = Boolean(
    matchBlock && matchResponseData?.primary && matchResponseData?.partner,
  );
  /** §4b match-chart JSON (Rasi / Amsakom / Bhavam) — hide redundant PNGs when profile ids are present. */
  const jsonMatchChartsEnabled = Boolean(
    showPairComparison &&
      matchBlock?.bride_profile_id != null &&
      matchBlock?.groom_profile_id != null,
  );
  const showPairColumnPng = !jsonMatchChartsEnabled || matchJsonChartFailed;
  const matchBrideGroomPanels =
    showPairComparison &&
    matchResponseData?.primary &&
    matchResponseData?.partner &&
    matchBlock?.bride_profile_id != null &&
    matchBlock.groom_profile_id != null
      ? panelsBrideGroom(
          matchResponseData.primary,
          matchResponseData.partner,
          matchBlock.bride_profile_id,
          matchBlock.groom_profile_id,
        )
      : null;
  const timeParts = get12HourParts(timeOfBirth);
  const displayScore =
    matchBlock?.summary?.score ?? matchBlock?.score ?? null;
  const displayMaxScore =
    matchBlock?.summary?.max_score ?? matchBlock?.max_score ?? null;
  const compatibilityGradeLabel =
    matchBlock?.summary?.result ??
    matchBlock?.summary?.grade ??
    matchBlock?.result ??
    "—";
  const scorePct =
    matchBlock?.summary?.percentage ??
    (displayMaxScore &&
    displayMaxScore > 0 &&
    displayScore != null
      ? (displayScore / displayMaxScore) * 100
      : null);
  const selectedCandidate = candidates.find(
    (c) => c.matri_id === selectedMatriId,
  );

  const planBanner = (() => {
    if (!myPlan) {
      return (
        <div className="px-4 py-2 rounded-xl border border-primary/20 bg-muted/40 text-foreground shrink-0 max-w-xs">
          <p className="font-semibold text-sm">Plan status</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Birth details and your own chart are available. Subscribe for
            compatibility matching with other members.
          </p>
        </div>
      );
    }
    if (myPlan.is_plan_active) {
      return (
        <div className="px-4 py-2 rounded-xl bg-primary text-primary-foreground flex items-center gap-2 shrink-0">
          <Check className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold text-sm">
              {myPlan.plan_name ?? "Active plan"}
            </p>
            <p className="text-xs opacity-90">
              Horoscope matches remaining:{" "}
              <strong>{myPlan.horoscope_remaining}</strong>
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 shrink-0 max-w-xs">
        <p className="font-semibold text-sm text-foreground">No active plan</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You can still update birth details and view your own horoscope. Renew
          to unlock partner matching.
        </p>
      </div>
    );
  })();

  return (
    <div className="space-y-6 relative">
        {loadingInitial && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-xl">
            <Loader2
              className="w-10 h-10 animate-spin text-primary"
              aria-hidden
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary" />
              Jathagam & Horoscope
            </h1>
            <p className="text-muted-foreground mt-1">
              Enter your birth details to generate Horoscope PDF and calculate
              Porutham compatibility score
            </p>
          </div>
          {planBanner}
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
          <div className="bg-card rounded-2xl shadow-card p-6 border border-primary/10">
            <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              Birth Details
              <span className="text-xs font-normal text-muted-foreground">
                Required for Jathagam generation
              </span>
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    value={displayName}
                    readOnly
                    disabled
                    placeholder="From your profile"
                    className="mt-1.5 bg-muted/50"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">
                    Time of Birth
                  </Label>
                  <div className="flex gap-2 mt-1.5 items-center">
                    <Select
                      value={timeParts.hour}
                      onValueChange={(hour) =>
                        setTimeOfBirth(build12HourTime(hour, timeParts.minute))
                      }
                    >
                      <SelectTrigger className="w-[84px]">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(
                          (hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm">:</span>
                    <Select
                      value={timeParts.minute}
                      onValueChange={(minute) =>
                        setTimeOfBirth(build12HourTime(timeParts.hour, minute))
                      }
                    >
                      <SelectTrigger className="w-[84px]">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) =>
                          String(i).padStart(2, "0"),
                        ).map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={timeMeridian}
                      onValueChange={(value) =>
                        setTimeMeridian(value as Meridian)
                      }
                    >
                      <SelectTrigger className="w-[92px]">
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase text-muted-foreground">
                  Place of Birth
                </Label>
                <Input
                  placeholder="e.g. Thrissur, Kerala"
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-6 gap-2 border-2 border-primary"
                  onClick={handleUpdateBirthDetails}
                  disabled={savingBirthDetails || loadingInitial}
                >
                  {savingBirthDetails ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Update Birth Details"
                  )}
                </Button>
                <Button
                  variant="default"
                  className="flex-1 bg-primary hover:bg-primary-dark py-6 gap-2"
                  onClick={handleGenerateChart}
                  disabled={generatingChart || loadingInitial}
                >
                  {generatingChart ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Horoscope (chart)
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full py-6 gap-2 border-2 border-primary bg-white text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200 [&_svg]:text-current whitespace-normal text-center leading-snug"
                  type="button"
                  onClick={() => handleBuyAstrologyPdf("jathakam")}
                  disabled={processingPdfProduct != null}
                >
                  {processingPdfProduct === "jathakam" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Jathakam...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Jathakam PDF (Pay 175/-)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 gap-2 border-2 border-primary bg-white text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200 [&_svg]:text-current whitespace-normal text-center leading-snug"
                  type="button"
                  onClick={() => handleBuyAstrologyPdf("thalakuri")}
                  disabled={processingPdfProduct != null}
                >
                  {processingPdfProduct === "thalakuri" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Thalakuri...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Thalakuri PDF (Pay 20/-)
                    </>
                  )}
                </Button>
              </div>

              {selfHoroscopeData &&
                (chartUrlSelf || selfPrimary?.chart_meta?.display_title) && (
                  <div className="pt-4 border-t border-primary/10 space-y-3">
                    {(selfPrimary?.chart_meta?.display_title ||
                      selfHoroscopeData?.nakshatra) && (
                      <p className="text-sm font-medium text-foreground">
                        {selfPrimary?.chart_meta?.display_title ??
                          [
                            selfHoroscopeData?.nakshatra,
                            selfHoroscopeData?.nakshatra_pada != null
                              ? `Pada ${selfHoroscopeData.nakshatra_pada}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                      </p>
                    )}
                    {(selfPrimary?.rasi || selfHoroscopeData?.rasi) && (
                      <p className="text-xs text-muted-foreground">
                        Rasi: {selfPrimary?.rasi ?? selfHoroscopeData?.rasi}
                        {selfPrimary?.lagna || selfHoroscopeData?.lagna
                          ? ` · Lagna: ${selfPrimary?.lagna ?? selfHoroscopeData?.lagna}`
                          : ""}
                      </p>
                    )}
                    {chartUrlSelf ? (
                      <img
                        src={chartUrlSelf}
                        alt="South Indian horoscope chart"
                        className="w-full max-w-md rounded-lg border border-primary/10 bg-white"
                      />
                    ) : null}
                  </div>
                )}
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-6 border border-primary/10">
            <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              Porutham (Compatibility)
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              10 compatibility checks · 0–10 scale
            </p>

            {candidatesError && (
              <p className="text-sm text-destructive mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                {candidatesError}
              </p>
            )}

            {myPlan?.is_plan_active &&
              candidates.length === 0 &&
              !candidatesError && (
                <p className="text-sm text-muted-foreground mb-3">
                  No members with complete birth details found yet. Try again
                  later.
                </p>
              )}

            {candidates.length > 0 && (
              <div className="space-y-3 mb-5">
                <Label className="text-xs uppercase text-muted-foreground">
                  Candidate
                </Label>
                <Select
                  value={selectedMatriId || undefined}
                  onValueChange={setSelectedMatriId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((c) => (
                      <SelectItem key={c.matri_id} value={c.matri_id}>
                        {c.name} ({c.matri_id})
                        {c.has_horoscope ? " · chart ready" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCandidate && (
              <div className="rounded-xl p-4 mb-5 bg-accent-rose/10 border border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-accent-rose/30 flex items-center justify-center font-bold text-primary text-lg shrink-0">
                    {selectedCandidate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {selectedCandidate.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidate.matri_id} · {selectedCandidate.gender}
                      {selectedCandidate.has_horoscope
                        ? " · Horoscope ready"
                        : " · Generate on match"}
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-primary hover:bg-primary-dark shrink-0"
                    onClick={handleCheckMatch}
                    disabled={
                      checkingMatch ||
                      !myPlan?.is_plan_active ||
                      !selectedMatriId ||
                      loadingInitial
                    }
                  >
                    {checkingMatch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        Checking…
                      </>
                    ) : (
                      "Check Match"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {!myPlan?.is_plan_active && (
              <p className="text-sm text-muted-foreground mb-4 font-ml">
                {ml.planRequiredBlurb}
              </p>
            )}

            {matchBlock && poruthamRows.length > 0 ? (
              <div className="space-y-4">
                {showPairComparison ? (
                  <p className="text-sm text-muted-foreground font-ml">
                    {ml.sideBySideBlurb}
                  </p>
                ) : (
                  <>
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {scorePct != null ? (
                          <>
                            <span
                              className={cn(
                                "text-3xl font-bold",
                                scorePct >= 70
                                  ? "text-green-600"
                                  : scorePct >= 40
                                    ? "text-amber-600"
                                    : "text-red-600",
                              )}
                            >
                              {displayScore ?? "—"}/{displayMaxScore ?? "—"}
                            </span>
                            <span className="text-lg font-semibold text-muted-foreground">
                              ({Math.round(scorePct)}%)
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-bold text-foreground">
                            {displayScore ?? "—"}/{displayMaxScore ?? "—"}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Sparkles className="w-4 h-4 text-secondary" />
                          {compatibilityGradeLabel}
                        </span>
                      </div>
                      {scorePct != null && (
                        <Progress
                          value={scorePct}
                          className="h-2 mt-2 [&>div]:bg-primary"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {comparisonRows.map((item) => (
                        <div
                          key={item.key}
                          className={cn(
                            "flex items-center gap-2 py-2.5 px-3 rounded-lg border",
                            item.matched
                              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40"
                              : item.is_critical
                                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
                                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40",
                          )}
                        >
                          {item.matched ? (
                            <Check className="w-5 h-5 text-green-600 shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-red-600 shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-sm font-medium",
                              item.matched
                                ? "text-green-800 dark:text-green-200"
                                : item.is_critical
                                  ? "text-red-800 dark:text-red-200"
                                  : "text-amber-900 dark:text-amber-200",
                            )}
                          >
                            {poruthamRowLabelMalayalam(item.key, item.label)}
                            {typeof item.points === "number"
                              ? ` (${item.points.toFixed(1)})`
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground pt-2 font-ml">
                      {ml.jothishaAdviceShort}
                    </p>
                  </>
                )}
                {showPairComparison ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      onClick={handleDownloadMatchReportPdf}
                      disabled={downloadingMatchPdf}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      {downloadingMatchPdf ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {ml.downloadMatchPdf}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-1 font-ml">
                <Sparkles className="w-4 h-4" />
                {ml.clickCheckMatchBlurb}
              </p>
            )}

            <a
              href="tel:8921726855"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/5 px-4 py-3 text-center text-sm font-medium text-primary hover:bg-primary/10 transition-colors font-ml"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span className="text-center">
                {ml.astrologerCta}
                <br />
                {ml.astrologerContact}: 8921726855
              </span>
            </a>
          </div>

          {showPairComparison &&
          matchBlock &&
          matchResponseData?.primary &&
          matchResponseData.partner ? (
            <div className="lg:col-span-2 bg-card rounded-2xl shadow-card p-4 sm:p-6 border-2 border-primary/20 space-y-6 font-ml">
              <div className="text-center space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                  {matchResponseData.title ?? ml.defaultReportTitle}
                </h3>
                {matchResponseData.subtitle ? (
                  <p className="text-sm text-muted-foreground">
                    {matchResponseData.subtitle}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-start gap-2 border-b border-primary/10 pb-4 sm:items-end">
                <p
                  className={cn(
                    "text-base sm:text-lg font-bold",
                    matchBlock.summary?.color_code === "green" &&
                      "text-green-600",
                    matchBlock.summary?.color_code === "orange" &&
                      "text-amber-600",
                    matchBlock.summary?.color_code === "red" &&
                      "text-red-600",
                    matchBlock.summary?.color_code == null &&
                      scorePct != null &&
                      (scorePct >= 70
                        ? "text-green-600"
                        : scorePct >= 40
                          ? "text-amber-600"
                          : "text-red-600"),
                    matchBlock.summary?.color_code == null &&
                      scorePct == null &&
                      "text-foreground",
                  )}
                >
                  {ml.compatibilityGrade}: {compatibilityGradeLabel}
                  {displayScore != null && displayMaxScore != null
                    ? ` (${displayScore}/${displayMaxScore})`
                    : ""}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end w-full">
                  <button
                    type="button"
                    onClick={handleDownloadMatchReportPdf}
                    disabled={downloadingMatchPdf}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    {downloadingMatchPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {ml.downloadMatchPdf}
                  </button>
                </div>
              </div>

              {jsonMatchChartsEnabled &&
              matchBlock &&
              matchBlock.bride_profile_id != null &&
              matchBlock.groom_profile_id != null ? (
                <MatchChartComparison
                  key={`${matchBlock.bride_profile_id}-${matchBlock.groom_profile_id}`}
                  brideProfileId={matchBlock.bride_profile_id}
                  groomProfileId={matchBlock.groom_profile_id}
                  primary={matchResponseData.primary}
                  partner={matchResponseData.partner}
                  className="rounded-xl border border-primary/10 bg-muted/10 p-3 sm:p-4"
                  onJsonChartFail={() => setMatchJsonChartFailed(true)}
                  onJsonChartOk={() => setMatchJsonChartFailed(false)}
                />
              ) : null}

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(148px,200px)_1fr] gap-5 xl:gap-6 items-start">
                <ProfileChartColumn
                  panel={
                    matchBrideGroomPanels?.bride ?? matchResponseData.primary
                  }
                  showChartPng={showPairColumnPng}
                />
                <PoruthamChecklistColumn rows={comparisonRows} />
                <ProfileChartColumn
                  panel={
                    matchBrideGroomPanels?.groom ?? matchResponseData.partner
                  }
                  showChartPng={showPairColumnPng}
                />
              </div>

              {matchBlock.explanation?.overall ? (
                <p className="text-sm text-foreground leading-relaxed border-l-4 border-primary/30 pl-3">
                  {matchBlock.explanation.overall}
                </p>
              ) : null}

              {matchBlock.insights && matchBlock.insights.length > 0 ? (
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {matchBlock.insights.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : null}

              <p className="text-xs text-muted-foreground">
                {ml.consultFooter}
              </p>
            </div>
          ) : null}
        </div>
      </div>
  );
}

import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";

type ApiErrorPayload = {
  success?: boolean;
  error?: string | { code?: number; message?: string; details?: unknown };
  detail?: string | string[];
  message?: string;
  [key: string]: unknown;
};

const getErrorMessage = (data: ApiErrorPayload | unknown, fallback: string): string => {
  const payload = (data ?? {}) as ApiErrorPayload;
  const err = payload.error;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: string }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0]) return String(payload.detail[0]);
  return fallback;
};

function logAstrologyRequest(path: string, method: string, body: unknown | null) {
  const endpoint = `${BASE_URL}${path}`;
  console.log("[astrologyApi] request", redactSensitive({ endpoint, path, method, body }));
}

function logAstrologyResponse(path: string, method: string, status: number, response: unknown) {
  const endpoint = `${BASE_URL}${path}`;
  console.log(
    "[astrologyApi] response",
    redactSensitive({ endpoint, path, method, status, response }),
  );
}

function redactSigInUrl(url: string): string {
  // Redact TimestampSigner secret links: sig=...
  return url.replace(/([?&]sig=)([^&]+)/gi, "$1<redacted>");
}

function redactSensitive<T>(value: T): T {
  if (typeof value === "string") {
    return redactSigInUrl(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactSensitive(v)) as T;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = redactSensitive(v);
    }
    return out as T;
  }
  return value;
}

async function authedFetch<T>(
  path: string,
  opts: { method: string; body?: string },
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const bodyParsed: unknown | null =
    opts.body !== undefined ? (JSON.parse(opts.body) as unknown) : null;
  logAstrologyRequest(path, opts.method, bodyParsed);

  const res = await memberFetchWithAuthRetry(url, {
    method: opts.method,
    headers: { "Content-Type": "application/json" },
    ...(opts.body !== undefined && { body: opts.body }),
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  logAstrologyResponse(path, opts.method, res.status, data);

  if (!res.ok) throw new Error(getErrorMessage(data, "Request failed"));
  return data as T;
}

export type ChartStyle = "south" | "north";

export interface BirthDetailCandidate {
  profile_id: number;
  matri_id: string;
  name: string;
  gender: string;
  has_horoscope: boolean;
}

export interface BirthDetailCandidatesData {
  total: number;
  page: number;
  limit: number;
  results: BirthDetailCandidate[];
}

export interface BirthDetailCandidatesResponse {
  success: boolean;
  data: BirthDetailCandidatesData;
}

export interface PoruthamDetailedItem {
  key: string;
  label: string;
  matched: boolean;
  severity?: string;
  is_critical?: boolean;
  description?: string;
  points?: number;
}

export interface MatchFlags {
  kuja_dosham_bride?: boolean;
  kuja_dosham_groom?: boolean;
  dasa_sandhi?: boolean;
  papam_samyam_matched?: boolean;
  kendra_malefic_bride?: number;
  kendra_malefic_groom?: number;
}

export interface MatchBlock {
  bride_matri_id?: string;
  groom_matri_id?: string;
  bride_profile_id?: number;
  groom_profile_id?: number;
  poruthams?: Record<string, boolean>;
  matched_poruthams?: string[];
  score?: number;
  max_score?: number;
  result?: string;
  compatibility_grade?: number;
  summary?: {
    score?: number;
    max_score?: number;
    percentage?: number;
    result?: string;
    grade?: string;
    color_code?: string;
  };
  poruthams_detailed?: PoruthamDetailedItem[];
  koota_points?: Record<string, number>;
  flags?: MatchFlags;
  analysis?: {
    critical_issues?: Array<{ key?: string; label?: string; reason?: string }>;
    moderate_issues?: Array<{ key?: string; label?: string; reason?: string }>;
    minor_issues?: Array<{ key?: string; label?: string; reason?: string }>;
  };
  explanation?: { overall?: string; positives?: string[]; negatives?: string[] };
  insights?: string[];
}

export interface HoroscopePrimaryPanel {
  matri_id?: string;
  name?: string;
  role?: string;
  profile_id?: number;
  gender?: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  nakshatra?: string;
  nakshatra_label?: string;
  nakshatra_malayalam?: string;
  nakshatra_pada?: number;
  rasi?: string;
  lagna?: string;
  chart_url?: string;
  chart_meta?: {
    lagna_label?: string;
    rasi_label?: string;
    nakshatra_label?: string;
    display_title?: string;
  };
  center_panel?: {
    nakshatra?: string;
    nakshatra_english?: string;
    nakshatra_malayalam?: string;
    padam?: number;
    dasa?: {
      lord?: string;
      lord_key?: string;
      remaining?: { years?: number; months?: number; days?: number };
      remaining_label?: string;
    };
  };
  kuja_dosham?: boolean;
  kendra_malefic_count?: number;
}

/** Serializer + UI fields returned by horoscope/me and generate */
export interface HoroscopeMeData {
  profile?: number;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  lagna?: string;
  rasi?: string;
  nakshatra?: string;
  nakshatra_pada?: number;
  chart_url?: string;
  partner_chart_url?: string | null;
  match_report_pdf_url?: string | null;
  title?: string;
  subtitle?: string | null;
  primary?: HoroscopePrimaryPanel;
  partner?: HoroscopePrimaryPanel | null;
  match?: MatchBlock | null;
  ui_config?: Record<string, unknown>;
  grahanila?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface HoroscopeMeResponse {
  success: boolean;
  data: HoroscopeMeData;
}

export interface GenerateBody {
  matri_id: string;
  partner_matri_id?: string;
}

export interface GenerateResponse {
  success: boolean;
  data: HoroscopeMeData;
}

export interface PoruthamBody {
  bride_id: number;
  groom_id: number;
}

export interface PoruthamResponseData {
  poruthams: Record<string, boolean>;
  koota_points?: Record<string, number>;
  score: number;
  max_score: number;
  result: string;
}

export interface PoruthamResponse {
  success: boolean;
  data: PoruthamResponseData;
}

export type AstrologyPdfProduct = "jathakam" | "thalakuri";

export interface AstrologyPdfOrderBody {
  product: AstrologyPdfProduct;
}

export interface AstrologyPdfOrderData {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  product: AstrologyPdfProduct;
  price_inr: number;
}

export interface AstrologyPdfOrderResponse {
  success: boolean;
  data: AstrologyPdfOrderData;
}

export interface AstrologyPdfVerifyBody {
  product: AstrologyPdfProduct;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface AstrologyPdfVerifyData {
  credit_id: number;
  product: AstrologyPdfProduct;
  download_url: string;
  transaction_id?: string;
}

export interface AstrologyPdfVerifyResponse {
  success: boolean;
  message?: string;
  data: AstrologyPdfVerifyData;
}

/** §4b chart JSON — GET match-chart / chart (plain JSON on success) */
export type ChartJsonType = "rasi" | "amsakom" | "bhavam";

export type ChartPlanetsMap = Record<string, string[]>;

export interface MatchChartPersonJson {
  name?: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  nakshatra?: string;
  nakshatra_pada?: number;
  rasi?: string;
  lagna?: string;
  dasa_lord?: string;
  dasa_balance?: string;
  planets?: ChartPlanetsMap;
}

export interface MatchChartJsonResponse {
  chart_type: ChartJsonType;
  bride: MatchChartPersonJson;
  groom: MatchChartPersonJson;
}

export interface SingleChartJsonResponse {
  chart_type: ChartJsonType;
  profile: MatchChartPersonJson;
}

async function authedGet<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  logAstrologyRequest(path, "GET", null);

  const res = await memberFetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  logAstrologyResponse(path, "GET", res.status, data);

  if (!res.ok) throw new Error(getErrorMessage(data, "Request failed"));
  return data as T;
}

/** GET /api/v1/astrology/chart/<profile_id>/<chart_type>/ or /api/v1/astrology/chart/<profile_id>/ */
export async function getChartJson(
  profileId: number,
  chartType: ChartJsonType = "rasi",
): Promise<SingleChartJsonResponse> {
  const path =
    chartType === "rasi"
      ? `v1/astrology/chart/${profileId}/`
      : `v1/astrology/chart/${profileId}/${chartType}/`;
  return authedGet<SingleChartJsonResponse>(path);
}

type MatchChartByProfilePairArgs = {
  brideProfileId: number;
  groomProfileId: number;
  chartType?: ChartJsonType;
};

type MatchChartByPartnerMatriArgs = {
  partnerMatriId: string;
  chartType?: ChartJsonType;
};

/** Backward-compatible overload. */
export async function getMatchChartJson(
  brideProfileId: number,
  groomProfileId: number,
  chartType?: ChartJsonType,
): Promise<MatchChartJsonResponse>;

/** Object-style overload to support pair-id and partner-matri-id route variants. */
export async function getMatchChartJson(
  args: MatchChartByProfilePairArgs | MatchChartByPartnerMatriArgs,
): Promise<MatchChartJsonResponse>;

export async function getMatchChartJson(
  arg1: number | (MatchChartByProfilePairArgs | MatchChartByPartnerMatriArgs),
  arg2?: number,
  arg3?: ChartJsonType,
): Promise<MatchChartJsonResponse> {
  if (typeof arg1 === "number") {
    const brideProfileId = arg1;
    const groomProfileId = arg2;
    if (groomProfileId == null) {
      throw new Error("groomProfileId is required when calling getMatchChartJson with numbers.");
    }
    const resolvedType = arg3 ?? "rasi";
    const path =
      resolvedType === "rasi"
        ? `v1/astrology/match-chart/${brideProfileId}/${groomProfileId}/`
        : `v1/astrology/match-chart/${brideProfileId}/${groomProfileId}/${resolvedType}/`;
    return authedGet<MatchChartJsonResponse>(path);
  }

  if ("partnerMatriId" in arg1) {
    const args = arg1;
    const partnerMatriId = args.partnerMatriId.trim();
    const resolvedType = args.chartType ?? "rasi";
    const path =
      resolvedType === "rasi"
        ? `v1/astrology/match-chart/${partnerMatriId}/`
        : `v1/astrology/match-chart/${partnerMatriId}/${resolvedType}/`;
    return authedGet<MatchChartJsonResponse>(path);
  }

  const args = arg1;
  const resolvedType = args.chartType ?? "rasi";
  const path =
    resolvedType === "rasi"
      ? `v1/astrology/match-chart/${args.brideProfileId}/${args.groomProfileId}/`
      : `v1/astrology/match-chart/${args.brideProfileId}/${args.groomProfileId}/${resolvedType}/`;
  return authedGet<MatchChartJsonResponse>(path);
}

/** GET /api/v1/astrology/horoscope/me/ */
export async function getMyHoroscope(style: ChartStyle = "south"): Promise<HoroscopeMeResponse> {
  const q = new URLSearchParams({ style });
  return authedFetch<HoroscopeMeResponse>(`v1/astrology/horoscope/me/?${q}`, {
    method: "GET",
  });
}

/** POST /api/v1/astrology/generate/ */
export async function postGenerateHoroscope(body: GenerateBody): Promise<GenerateResponse> {
  return authedFetch<GenerateResponse>("v1/astrology/generate/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /api/v1/astrology/birth-detail-candidates/ */
export async function getBirthDetailCandidates(params?: {
  page?: number;
  limit?: number;
  search?: string;
  all_genders?: boolean;
}): Promise<BirthDetailCandidatesResponse> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.search?.trim()) q.set("search", params.search.trim());
  if (params?.all_genders) q.set("all_genders", "1");
  const qs = q.toString();
  const path = qs
    ? `v1/astrology/birth-detail-candidates/?${qs}`
    : "v1/astrology/birth-detail-candidates/";
  return authedFetch<BirthDetailCandidatesResponse>(path, { method: "GET" });
}

/** POST /api/v1/astrology/porutham/ — uses stored horoscopes only; consumes quota */
export async function postPorutham(body: PoruthamBody): Promise<PoruthamResponse> {
  return authedFetch<PoruthamResponse>("v1/astrology/porutham/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** POST /api/v1/astrology/pdf/order/ */
export async function postAstrologyPdfOrder(
  body: AstrologyPdfOrderBody,
): Promise<AstrologyPdfOrderResponse> {
  return authedFetch<AstrologyPdfOrderResponse>("v1/astrology/pdf/order/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** POST /api/v1/astrology/pdf/verify/ */
export async function postAstrologyPdfVerify(
  body: AstrologyPdfVerifyBody,
): Promise<AstrologyPdfVerifyResponse> {
  return authedFetch<AstrologyPdfVerifyResponse>("v1/astrology/pdf/verify/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

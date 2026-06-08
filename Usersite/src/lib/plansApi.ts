import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: number; message?: string; details?: unknown };
  detail?: string | string[];
  message?: string;
  [key: string]: unknown;
};

const getErrorMessage = (data: ApiErrorPayload | unknown, fallback: string): string => {
  const payload = (data ?? {}) as ApiErrorPayload;
  if (payload.error?.message) return payload.error.message;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0]) return String(payload.detail[0]);
  return fallback;
};

function redactSigInUrl(url: string): string {
  return url.replace(/([?&]sig=)([^&]+)/gi, "$1<redacted>");
}

function redactSensitive<T>(value: T): T {
  if (typeof value === "string") return redactSigInUrl(value) as T;
  if (Array.isArray(value)) return value.map((v) => redactSensitive(v)) as T;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = redactSensitive(v);
    return out as T;
  }
  return value;
}

function logPlansRequest(path: string, method: string, body: unknown | null) {
  const endpoint = `${BASE_URL}${path}`;
  console.log("[plansApi] request", redactSensitive({ endpoint, path, method, body }));
}

function logPlansResponse(path: string, method: string, status: number, response: unknown) {
  const endpoint = `${BASE_URL}${path}`;
  console.log("[plansApi] response", redactSensitive({ endpoint, path, method, status, response }));
}

async function authedFetch<T>(path: string, opts: { method: string; body?: string }): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const bodyParsed: unknown | null =
    opts.body !== undefined ? (JSON.parse(opts.body) as unknown) : null;
  logPlansRequest(path, opts.method, bodyParsed);

  const res = await memberFetchWithAuthRetry(url, {
    method: opts.method,
    headers: { "Content-Type": "application/json" },
    ...(opts.body !== undefined && { body: opts.body }),
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  logPlansResponse(path, opts.method, res.status, data);

  if (!res.ok) throw new Error(getErrorMessage(data, "Request failed"));
  return data as T;
}

/** GET /api/v1/my/plan/ — current subscription & remaining quotas */
export interface MyPlanDetails {
  is_plan_active: boolean;
  plan_name: string | null;
  valid_until: string | null;
  profile_views_remaining: number;
  interests_remaining: number;
  chat_remaining: number;
  contact_view_remaining: number;
  horoscope_remaining: number;
  service_charge_remaining: number;
  service_charge_paid: number;
}

export interface MyPlanResponse {
  success: boolean;
  data: MyPlanDetails;
}

export async function getMyPlan(): Promise<MyPlanResponse> {
  return authedFetch<MyPlanResponse>("v1/my/plan/", { method: "GET" });
}

export type PaymentMethod = "razorpay" | "stripe" | "upi" | "manual";

export interface AvailablePlan {
  id: number;
  name: string;
  price: number;
  service_charge: number;
  total_price: number;
  first_payment: number;
  service_charge_remaining: number;
  duration_days: number;
  profile_view_limit: number;
  interest_limit: number;
  chat_limit: number;
  horoscope_match_limit: number;
  contact_view_limit: number;
  description: string;
}

export interface PlansListResponse {
  success: boolean;
  data: {
    gender: string;
    plans: AvailablePlan[];
  };
}

export interface PlanPurchaseResponse {
  success: boolean;
  message: string;
  data: {
    transaction_id: number;
    plan_name: string;
    valid_until: string;
    amount_paid: number;
    total_amount: number;
    service_charge_remaining: number;
  };
}

export async function getAvailablePlans(): Promise<PlansListResponse> {
  return authedFetch<PlansListResponse>("v1/plans/", { method: "GET" });
}

export async function purchasePlan(planId: number, paymentMethod: PaymentMethod): Promise<PlanPurchaseResponse> {
  return authedFetch<PlanPurchaseResponse>("v1/plans/purchase/", {
    method: "POST",
    body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod }),
  });
}

export interface WebsitePlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  profile_view_limit: number;
  interest_limit: number;
  chat_limit: number;
  horoscope_match_limit: number;
  contact_view_limit: number;
  description: string;
  service_charge?: {
    male?: number;
    female?: number;
    other?: number;
  };
  total_price?: {
    male?: number;
    female?: number;
    other?: number;
  };
}

export interface WebsitePlansResponse {
  success: boolean;
  data: {
    plans: WebsitePlan[];
  };
}

/** Accepts `{ data: { plans } }`, `{ data: { results } }` (some DRF wrappers), or empty. */
function extractWebsitePlansFromPayload(data: unknown): WebsitePlan[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const inner = root["data"];
  if (!inner || typeof inner !== "object") return [];
  const d = inner as Record<string, unknown>;
  const fromPlans = d["plans"];
  if (Array.isArray(fromPlans) && fromPlans.length) return fromPlans as WebsitePlan[];
  const fromResults = d["results"];
  if (Array.isArray(fromResults) && fromResults.length) return fromResults as WebsitePlan[];
  return [];
}

/** Public endpoint (no token): GET /api/v1/website/plans/ */
export async function getWebsitePlans(): Promise<WebsitePlansResponse> {
  const path = "v1/website/plans/";
  const url = `${BASE_URL}${path}`;
  logPlansRequest(path, "GET", null);
  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as WebsitePlansResponse & ApiErrorPayload;
  logPlansResponse(path, "GET", res.status, data);
  if (!res.ok) throw new Error(getErrorMessage(data, "Failed to load website plans"));
  const plans = extractWebsitePlansFromPayload(data);
  return {
    success: Boolean((data as WebsitePlansResponse).success),
    data: { plans },
  };
}


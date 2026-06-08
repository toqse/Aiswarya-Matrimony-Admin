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

const logApi = (endpoint: string, method: string, body?: unknown, response?: { status: number; data: unknown }) => {
  try {
    // eslint-disable-next-line no-console
    console.log("[interestsApi]", method, endpoint, body ?? "");
    if (response) {
      // eslint-disable-next-line no-console
      console.log("[interestsApi] response", response);
    }
  } catch {
    // ignore
  }
};

async function authedFetch<T>(path: string, opts: { method: string; body?: string }): Promise<T> {
  const url = `${BASE_URL}${path}`;

  logApi(path, opts.method, opts.body ? JSON.parse(opts.body) : undefined);

  const res = await memberFetchWithAuthRetry(url, {
    method: opts.method,
    headers: { "Content-Type": "application/json" },
    ...(opts.body !== undefined && { body: opts.body }),
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  logApi(path, opts.method, undefined, { status: res.status, data });

  if (!res.ok) {
    const error = new Error(getErrorMessage(data, "Request failed")) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return data as T;
}

function clampPageLimit(page: number, limit: number): { page: number; limit: number } {
  return {
    page: Math.max(1, Math.floor(page) || 1),
    limit: Math.min(50, Math.max(1, Math.floor(limit) || 10)),
  };
}

export interface InterestCard {
  interest_id: number;
  matri_id: string;
  name: string;
  age: number;
  location: string;
  education: string;
  occupation: string;
  profile_photo: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
}

export interface InterestsListResponse {
  success: boolean;
  data: {
    total: number;
    results: InterestCard[];
  };
}

/** Combined sent + received (no pagination). */
export interface MyInterestsResponse {
  success: boolean;
  data: {
    sent: { total: number; results: InterestCard[] };
    received: { total: number; results: InterestCard[] };
  };
}

export interface SendInterestResponse {
  success: boolean;
  message: string;
}

/** GET /api/v1/interests/my/ */
export async function getMyInterests(): Promise<MyInterestsResponse> {
  return authedFetch<MyInterestsResponse>("v1/interests/my/", { method: "GET" });
}

/** GET /api/v1/interests/received/ — limit max 50 */
export async function getReceivedInterests(page = 1, limit = 10): Promise<InterestsListResponse> {
  const { page: p, limit: l } = clampPageLimit(page, limit);
  const path = `v1/interests/received/?page=${p}&limit=${l}`;
  return authedFetch<InterestsListResponse>(path, { method: "GET" });
}

/** GET /api/v1/interests/sent/ — limit max 50 */
export async function getSentInterests(page = 1, limit = 10): Promise<InterestsListResponse> {
  const { page: p, limit: l } = clampPageLimit(page, limit);
  const path = `v1/interests/sent/?page=${p}&limit=${l}`;
  return authedFetch<InterestsListResponse>(path, { method: "GET" });
}

/**
 * Load all pages from sent/ or received/ (some backends return empty from /my/).
 */
export async function fetchAllInterestPages(
  kind: "received" | "sent",
  pageSize = 50,
  maxPages = 30,
): Promise<{ total: number; results: InterestCard[] }> {
  const fetchPage = kind === "received" ? getReceivedInterests : getSentInterests;
  const first = await fetchPage(1, pageSize);
  const total = first.data.total;
  const results = [...first.data.results];
  let page = 2;
  while (results.length < total && page <= maxPages) {
    const res = await fetchPage(page, pageSize);
    if (!res.data.results.length) break;
    results.push(...res.data.results);
    page++;
  }
  return { total, results };
}

/** POST /api/v1/interests/send/ */
export async function sendInterest(receiverMatriId: string): Promise<SendInterestResponse> {
  const trimmed = receiverMatriId?.trim();
  if (!trimmed) throw new Error("receiver_matri_id is required");
  return authedFetch<SendInterestResponse>("v1/interests/send/", {
    method: "POST",
    body: JSON.stringify({ receiver_matri_id: trimmed }),
  });
}

/** POST /api/v1/interests/respond/ */
export async function respondInterest(
  interestId: number,
  action: "accept" | "reject",
): Promise<{ success: boolean; message: string }> {
  return authedFetch<{ success: boolean; message: string }>("v1/interests/respond/", {
    method: "POST",
    body: JSON.stringify({ interest_id: interestId, action }),
  });
}

/** POST /api/v1/interests/cancel/ — sender only, pending only */
export async function cancelInterest(interestId: number): Promise<{ success: boolean; message: string }> {
  return authedFetch<{ success: boolean; message: string }>("v1/interests/cancel/", {
    method: "POST",
    body: JSON.stringify({ interest_id: interestId }),
  });
}


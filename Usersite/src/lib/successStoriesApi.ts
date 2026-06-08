import { BASE_URL } from "./config";
import { parseApiDate } from "./utils";

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

/**
 * List path — `success-stories` only, not `website/plans/`.
 * Fetch URL: `${BASE_URL}${WEBSITE_SUCCESS_STORIES_V1_PATH}?page=…`  →  `/api/v1/website/success-stories/?…`
 */
export const WEBSITE_SUCCESS_STORIES_V1_PATH = "v1/website/success-stories/";

/** Matches DRF PageNumberPagination (page size 20) for this list. */
export const WEBSITE_SUCCESS_STORIES_PAGE_SIZE = 20;

function logSuccessStoriesRequest(path: string, method: string) {
  const endpoint = `${BASE_URL}${path}`;
  console.log("[successStoriesApi] request", { endpoint, path, method, body: null });
}

function logSuccessStoriesResponse(path: string, method: string, status: number, response: unknown) {
  const endpoint = `${BASE_URL}${path}`;
  console.log("[successStoriesApi] response", { endpoint, path, method, status, response });
}

export interface WebsiteSuccessStory {
  id: number;
  couple_name_1: string;
  couple_name_2: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  couple_photo: string;
  description: string;
  status: string;
  is_featured: boolean;
  views_count: number;
  created_at: string;
}

export interface WebsiteSuccessStoriesListData {
  count: number;
  next: string | null;
  previous: string | null;
  stories: WebsiteSuccessStory[];
}

export interface WebsiteSuccessStoriesResponse {
  success: boolean;
  data: WebsiteSuccessStoriesListData;
}

function apiOrigin(): string {
  return BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

/** `couple_photo` may be absolute (spec) or relative `/media/...` */
export function resolveSuccessStoryPhotoUrl(
  couplePhoto: string | null | undefined
): string {
  const s = typeof couplePhoto === "string" ? couplePhoto.trim() : "";
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `${apiOrigin()}${s.startsWith("/") ? s : `/${s}`}`;
}

export function formatWeddingDateDisplay(weddingDateIso: string): string {
  const d = parseApiDate(weddingDateIso);
  if (!d || Number.isNaN(d.getTime())) return weddingDateIso.trim() || "—";
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(d);
}

/**
 * Public endpoint (no token): GET /api/v1/website/success-stories/?page=
 * Invalid/empty page may return 404 (DRF). Thrown `Error` may include `.status === 404`.
 */
export async function getWebsiteSuccessStories(
  page = 1
): Promise<WebsiteSuccessStoriesResponse> {
  const p = Math.max(1, Math.floor(page));
  const path = `${WEBSITE_SUCCESS_STORIES_V1_PATH}?page=${p}`;
  const url = `${BASE_URL}${path}`;
  logSuccessStoriesRequest(path, "GET");

  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as WebsiteSuccessStoriesResponse &
    ApiErrorPayload;
  logSuccessStoriesResponse(path, "GET", res.status, data);

  if (!res.ok) {
    const err = new Error(
      getErrorMessage(data, "Failed to load success stories")
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (!data.success || !data.data) {
    const err = new Error("Invalid success stories response") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

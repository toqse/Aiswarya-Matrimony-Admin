import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: number; message?: string; details?: unknown };
  detail?: string | string[];
  message?: string;
  [key: string]: unknown;
};

function getErrorMessage(data: ApiErrorPayload | unknown, fallback: string): string {
  const payload = (data ?? {}) as ApiErrorPayload;
  if (payload.error?.message) return payload.error.message;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0]) return String(payload.detail[0]);
  return fallback;
}

function logApi(endpoint: string, method: string, body?: unknown, response?: { status: number; data: unknown }) {
  // Lightweight console logger similar to profile/auth APIs
  // Example: [matchesApi] GET v1/matches/?page=1 { ...response }
  try {
    // eslint-disable-next-line no-console
    console.log("[matchesApi]", method, endpoint, body ?? "");
    if (response) {
      // eslint-disable-next-line no-console
      console.log("[matchesApi] response", response);
    }
  } catch {
    // ignore logging errors
  }
}

async function authedFetch<T>(
  path: string,
  opts: { method: string; body?: string }
): Promise<T> {
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

// --- Types (match API doc) ---

export type SortBy = "newest" | "most_relevant" | "best_match";

/** GET v1/matches/ list item — see apidoc: PlanLimitService flags per profile. */
export interface MatchProfile {
  matri_id: string;
  name: string;
  age: number;
  height: number | null;
  education: string | null;
  occupation: string | null;
  profile_photo: string | null;
  /** Larger photo URL when provided */
  full_photo?: string | null;
  is_online: boolean;
  last_seen: string | null;
  is_new: boolean;
  match_percentage: number;
  /** Wishlist / heart — server state */
  is_wishlisted?: boolean;
  /** True if full profile can be opened (quota or already viewed). Same as can_view_details per API. */
  is_able_to_view?: boolean;
  /** True if this member was opened as full profile before */
  is_already_viewed?: boolean;
  can_view_details?: boolean;
  can_send_interest?: boolean;
  can_chat?: boolean;
  interest_status?: string;
  is_interest_sent?: boolean;
}

export interface MatchesParams {
  page?: number;
  limit?: number;
  search?: string;
  age_min?: number;
  age_max?: number;
  height_min?: number;
  height_max?: number;
  religion_id?: number;
  caste_id?: number;
  education_id?: number;
  occupation_id?: number;
  marital_status?: number;
  profile_with_photo?: boolean | 1 | "true" | "yes";
  sort_by?: SortBy;
}

export interface MatchesResponse {
  success: boolean;
  data: {
    total_profiles: number;
    page: number;
    limit: number;
    profiles: MatchProfile[];
  };
}

export interface MatchFiltersResponse {
  success: boolean;
  data: {
    religions: { id: number; name: string }[];
    castes: { id: number; name: string; religion_id: number }[];
    educations: { id: number; name: string }[];
    occupations: { id: number; name: string }[];
    marital_status: { id: number; name: string }[];
    heights: { id: number; value_cm: number; display_label: string }[];
  };
}

export interface ProfilePreviewData {
  matri_id: string;
  name: string;
  age: number;
  location: string;
  religion: string;
  caste: string;
  education: string;
  occupation: string;
  annual_income: string;
  marital_status: string;
  height: string;
  mother_tongue: string;
  profile_photo: string | null;
  about_me: string;
  family_background: string;
  contact_locked: boolean;
  is_interest_sent?: boolean;
  interest_status?: string;
  /**
   * If true, API indicates the user has access to full details already.
   * Some deployments include a nested `profile` object (sectioned shape) with phone/email.
   */
  is_viewed_by_me?: boolean;
  /** Optional nested profile payload (same shape as /profiles/{id}/full/ `data.profile`) */
  profile?: unknown;
}

export interface ProfilePreviewResponse {
  success: boolean;
  data: ProfilePreviewData;
}

export type { SendInterestResponse } from "./interestsApi";
export { sendInterest } from "./interestsApi";

export interface ChatStartResponse {
  success: boolean;
  data: { conversation_id: number; message: string };
}

export interface ChatPermissionResponse {
  success: boolean;
  data: { can_chat: boolean };
}

export interface WishlistToggleResponse {
  success: boolean;
  data: { is_wishlisted: boolean };
}

// --- API functions ---

const MATCHES_BASE = "v1/matches";
const PROFILES_BASE = "v1/profiles";
const CHAT_BASE = "v1/chat";
const WISHLIST_BASE = "v1/wishlist";

export async function getMatches(params: MatchesParams = {}): Promise<MatchesResponse> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.search) sp.set("search", params.search);
  if (params.age_min != null) sp.set("age_min", String(params.age_min));
  if (params.age_max != null) sp.set("age_max", String(params.age_max));
  if (params.height_min != null) sp.set("height_min", String(params.height_min));
  if (params.height_max != null) sp.set("height_max", String(params.height_max));
  if (params.religion_id != null) sp.set("religion_id", String(params.religion_id));
  if (params.caste_id != null) sp.set("caste_id", String(params.caste_id));
  if (params.education_id != null) sp.set("education_id", String(params.education_id));
  if (params.occupation_id != null) sp.set("occupation_id", String(params.occupation_id));
  if (params.marital_status != null) sp.set("marital_status", String(params.marital_status));
  if (params.profile_with_photo !== undefined) {
    const v = params.profile_with_photo;
    sp.set("profile_with_photo", v === true || v === 1 || v === "true" || v === "yes" ? "1" : "0");
  }
  if (params.sort_by) sp.set("sort_by", params.sort_by);

  const qs = sp.toString();
  const path = qs ? `${MATCHES_BASE}/?${qs}` : `${MATCHES_BASE}/`;
  return authedFetch<MatchesResponse>(path, { method: "GET" });
}

export async function getMatchFilters(): Promise<MatchFiltersResponse> {
  return authedFetch<MatchFiltersResponse>(`${MATCHES_BASE}/filters/`, { method: "GET" });
}

export async function getProfilePreview(matriId: string): Promise<ProfilePreviewResponse> {
  const path = `${PROFILES_BASE}/${encodeURIComponent(matriId)}/preview/`;
  return authedFetch<ProfilePreviewResponse>(path, { method: "GET" });
}

export interface ProfileFullResponse {
  success: boolean;
  data: {
    profile: unknown;
    plan?: {
      name?: string;
      profile_views_remaining?: number;
      interests_remaining?: number;
      chat_remaining?: number;
    };
  };
}

export async function getProfileFull(matriId: string): Promise<ProfileFullResponse> {
  const path = `${PROFILES_BASE}/${encodeURIComponent(matriId)}/full/`;
  return authedFetch<ProfileFullResponse>(path, { method: "GET" });
}

/** POST /api/v1/contact/unlock/ — phone & email (uses contact_view quota) */
export async function unlockContactDetails(matriId: string): Promise<{
  success: boolean;
  data: { phone: string; email: string };
}> {
  return authedFetch<{ success: boolean; data: { phone: string; email: string } }>("v1/contact/unlock/", {
    method: "POST",
    body: JSON.stringify({ matri_id: matriId }),
  });
}

export async function startChat(matriId: string): Promise<ChatStartResponse> {
  return authedFetch<ChatStartResponse>(`${CHAT_BASE}/start/`, {
    method: "POST",
    body: JSON.stringify({ matri_id: matriId }),
  });
}

export async function getChatPermission(matriId: string): Promise<ChatPermissionResponse> {
  const path = `${CHAT_BASE}/permission/${encodeURIComponent(matriId)}/`;
  return authedFetch<ChatPermissionResponse>(path, { method: "GET" });
}

export async function wishlistToggle(matriId: string): Promise<WishlistToggleResponse> {
  return authedFetch<WishlistToggleResponse>(`${WISHLIST_BASE}/toggle/`, {
    method: "POST",
    body: JSON.stringify({ matri_id: matriId }),
  });
}

export async function getWishlist(params?: { page?: number; limit?: number }): Promise<{
  success: boolean;
  data: { total: number; page: number; limit: number; profiles: MatchProfile[] };
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  const path = qs ? `${WISHLIST_BASE}/?${qs}` : `${WISHLIST_BASE}/`;
  return authedFetch(path, { method: "GET" });
}

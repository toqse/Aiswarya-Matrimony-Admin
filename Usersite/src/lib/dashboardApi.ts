import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";
import { useAuthStore } from "@/stores/authStore";

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: number; message?: string };
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

async function authedGet<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const store = useAuthStore.getState();
  const token = store.accessToken;
  if (!token) {
    store.logout();
    throw new Error("Session expired. Please log in again.");
  }
  console.log("[dashboardApi] GET", path);
  const res = await memberFetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  console.log("[dashboardApi] response", { status: res.status, data });
  if (!res.ok) throw new Error(getErrorMessage(data, "Request failed"));
  return data as T;
}

// ---- Types ----

export interface DashboardPlan {
  is_plan_active: boolean;
  plan_name: string;
  valid_until?: string | null;
  profile_views_remaining?: number;
  interests_remaining?: number;
  chat_remaining?: number;
  contact_view_remaining?: number;
  horoscope_remaining?: number;
  service_charge?: number;
  plan_price?: number;
  total_price?: number;
  service_charge_remaining?: number;
  service_charge_paid?: number;
}

export interface DashboardSummary {
  matri_id: string;
  profile_completion: number;
  location: string;
  profile_views: number;
  interests_received: number;
  interests_sent: number;
  new_matches: number;
  plan?: DashboardPlan | null;
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummary;
}

/** Profile card shape returned by new-matches, suggestions, and today-picks */
export interface DashboardProfile {
  matri_id: string;
  name: string;
  age: number;
  height?: number | string | null;
  education?: string | null;
  occupation?: string | null;
  location?: string | null;
  profile_photo?: string | null;
  is_online?: boolean;
  last_seen?: string | null;
  is_new?: boolean;
  match_percentage?: number | null;
  can_view_details?: boolean;
  can_send_interest?: boolean;
  can_chat?: boolean;
}

export interface DashboardProfilesResponse {
  success: boolean;
  data: DashboardProfile[];
}

export interface ProfileCompletionData {
  percentage: number;
  steps_remaining: string[];
}

export interface ProfileCompletionResponse {
  success: boolean;
  data: ProfileCompletionData;
}

export interface ProfileViewsData {
  total: number;
}

export interface ProfileViewsResponse {
  success: boolean;
  data: ProfileViewsData;
}

export interface ProfileBasicExtended {
  name?: string;
  gender?: string;
  dob?: string;
  email?: string;
  phone?: string;
  profile_photo?: string | null;
  location?: string | null;
  matri_id?: string;
}

export interface ProfileBasicExtendedResponse {
  success: boolean;
  data: ProfileBasicExtended;
}

export interface PartnerPreferenceBody {
  partner_preference_type: "own_religion_only" | "open_to_all" | "specific_religions";
  partner_religion_ids?: number[];
  partner_caste_preference?: "any" | "own_caste_only";
}

// ---- API functions ----

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return authedGet<DashboardSummaryResponse>("v1/dashboard/summary/");
}

export async function getDashboardNewMatches(limit = 4): Promise<DashboardProfilesResponse> {
  return authedGet<DashboardProfilesResponse>(`v1/dashboard/new-matches/?limit=${limit}`);
}

export async function getDashboardSuggestions(limit = 8): Promise<DashboardProfilesResponse> {
  return authedGet<DashboardProfilesResponse>(`v1/dashboard/suggestions/?limit=${limit}`);
}

export async function getDashboardTodayPicks(): Promise<DashboardProfilesResponse> {
  return authedGet<DashboardProfilesResponse>("v1/dashboard/today-picks/");
}

export async function getProfileCompletion(): Promise<ProfileCompletionResponse> {
  return authedGet<ProfileCompletionResponse>("v1/profile/completion/");
}

export async function getProfileViews(): Promise<ProfileViewsResponse> {
  return authedGet<ProfileViewsResponse>("v1/profile/views/");
}

export async function getProfileBasicExtended(): Promise<ProfileBasicExtendedResponse> {
  return authedGet<ProfileBasicExtendedResponse>("v1/profile/basic/");
}

export async function postPartnerPreference(body: PartnerPreferenceBody): Promise<{ success: boolean; data: unknown }> {
  const url = `${BASE_URL}v1/profile/partner-preference/`;
  const store = useAuthStore.getState();
  const token = store.accessToken;
  if (!token) {
    store.logout();
    throw new Error("Session expired. Please log in again.");
  }
  console.log("[dashboardApi] POST v1/profile/partner-preference/", body);
  const res = await memberFetchWithAuthRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { success: boolean; data: unknown } & ApiErrorPayload;
  console.log("[dashboardApi] response", { status: res.status, data });
  if (!res.ok) throw new Error(getErrorMessage(data, "Failed to update partner preference"));
  return data;
}

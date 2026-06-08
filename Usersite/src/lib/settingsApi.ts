import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";
import { useAuthStore } from "@/stores/authStore";

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileVisibility = "all_users" | "premium_only" | "hidden";
export type InterestPermission = "all_users" | "premium_only";

export interface SettingsNotifications {
  interest_request: boolean;
  chat: boolean;
  profile_views: boolean;
  new_matches: boolean;
}

export interface SettingsProfile {
  name: string;
  matri_id: string;
  profile_photo: string | null;
  location: string;
  plan: string;
  profile_visibility: ProfileVisibility;
  interest_permission: InterestPermission;
  notifications: SettingsNotifications;
}

export interface AccountUpdateBody {
  name?: string;
  email?: string;
  phone_number?: string;
}

export interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function v1(path: string): string {
  // BASE_URL = "http://host/api/" — already has trailing slash
  return `${BASE_URL}v1/${path}`;
}

async function request<T>(
  url: string,
  options: RequestInit & { _body?: unknown } = {}
): Promise<T> {
  const { _body, ...fetchOptions } = options;

  console.log("[settingsApi] URL:", url);
  if (_body !== undefined) console.log("[settingsApi] Body:", _body);

  const res = await memberFetchWithAuthRetry(url, fetchOptions);
  const json = await res.json();

  console.log("[settingsApi] Response:", json);

  if (!res.ok || json.success === false) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json.data as T;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** GET /api/v1/settings/profile/ */
export async function getSettingsProfile(): Promise<SettingsProfile> {
  return request<SettingsProfile>(v1("settings/profile/"), {
    headers: authHeaders(),
  });
}

/** PATCH /api/v1/settings/profile-visibility/ */
export async function updateProfileVisibility(
  visibility: ProfileVisibility
): Promise<void> {
  const body = { profile_visibility: visibility };
  await request<unknown>(v1("settings/profile-visibility/"), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
    _body: body,
  });
}

/** PATCH /api/v1/settings/interest-permission/ */
export async function updateInterestPermission(
  permission: InterestPermission
): Promise<void> {
  const body = { interest_permission: permission };
  await request<unknown>(v1("settings/interest-permission/"), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
    _body: body,
  });
}

/** PATCH /api/v1/settings/notifications/ */
export async function updateNotifications(
  notifications: Partial<SettingsNotifications>
): Promise<void> {
  await request<unknown>(v1("settings/notifications/"), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(notifications),
    _body: notifications,
  });
}

/** PATCH /api/v1/settings/account/ */
export async function updateAccount(body: AccountUpdateBody): Promise<void> {
  await request<unknown>(v1("settings/account/"), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
    _body: body,
  });
}

/** POST /api/v1/settings/change-password/ */
export async function changePassword(body: ChangePasswordBody): Promise<void> {
  await request<unknown>(v1("settings/change-password/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    _body: body,
  });
}

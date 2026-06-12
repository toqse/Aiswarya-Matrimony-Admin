import { BASE_URL } from "./config";
import { ApiError, fetchWithTimeout } from "./apiErrors";

type ApiErrorPayload = {
  detail?: string | string[];
  message?: string;
  error?: string | { message?: string } | { [key: string]: unknown };
  errors?: string | string[];
  /** Envelope: { status, data: { error: { message }, success } } */
  data?: {
    error?: string | { message?: string } | { [key: string]: unknown };
    message?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const getErrorMessage = (
  data: ApiErrorPayload | unknown,
  fallback: string,
): string => {
  const payload = (data ?? {}) as ApiErrorPayload;

  const inner = payload.data;
  if (inner && typeof inner === "object") {
    if (typeof inner.message === "string" && inner.message.trim())
      return inner.message;
    const err = inner.error;
    if (typeof err === "string" && err.trim()) return err;
    if (
      err &&
      typeof err === "object" &&
      "message" in err &&
      typeof (err as { message?: string }).message === "string"
    ) {
      const m = (err as { message: string }).message.trim();
      if (m) return m;
    }
  }

  if (typeof payload.detail === "string" && payload.detail.trim())
    return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0])
    return String(payload.detail[0]);

  if (typeof payload.message === "string" && payload.message.trim())
    return payload.message;

  if (typeof payload.error === "string" && payload.error.trim())
    return payload.error;
  if (
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error
  ) {
    const msg = (payload.error as { message?: string }).message;
    if (msg && msg.trim()) return msg;
  }

  if (typeof payload.errors === "string" && payload.errors.trim())
    return payload.errors;
  if (Array.isArray(payload.errors) && payload.errors[0])
    return String(payload.errors[0]);

  return fallback;
};

/** POST v1/auth/register/ — sends OTP after basic details */
export type RegisterProfileFor =
  | "myself"
  | "son"
  | "daughter"
  | "brother"
  | "sister"
  | "friend"
  | "relative";

export interface RegisterBody {
  name: string;
  phone_number: string;
  /** Omit or leave empty — not sent if blank */
  email?: string;
  dob: string; // DD-MM-YYYY
  gender: "M" | "F" | "O";
  /** Who the profile is for; always sent lowercase to API */
  profile_for?: RegisterProfileFor;
}

const REGISTER_PROFILE_FOR_VALUES: readonly RegisterProfileFor[] = [
  "myself",
  "son",
  "daughter",
  "brother",
  "sister",
  "friend",
  "relative",
] as const;

/** Normalize UI value to API `profile_for` (lowercase). */
export function normalizeRegisterProfileFor(
  s: string,
): RegisterProfileFor | undefined {
  const raw = s.toLowerCase().trim();
  return (REGISTER_PROFILE_FOR_VALUES as readonly string[]).includes(raw)
    ? (raw as RegisterProfileFor)
    : undefined;
}

function buildRegisterPayload(body: RegisterBody): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: body.name.trim(),
    phone_number: body.phone_number.trim(),
    dob: body.dob.trim(),
    gender: body.gender,
  };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email) payload.email = email;
  const pf =
    typeof body.profile_for === "string"
      ? normalizeRegisterProfileFor(body.profile_for)
      : body.profile_for;
  if (pf) payload.profile_for = pf;
  return payload;
}

export async function register(body: RegisterBody): Promise<unknown> {
  const url = `${BASE_URL}v1/auth/register/`;
  const payload = buildRegisterPayload(body);
  console.log("[authApi] register request body:", payload);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  console.log("[authApi] register response:", { status: res.status, data });
  if (!res.ok)
    throw new ApiError(getErrorMessage(data, "Registration failed"), res.status);
  return data;
}

/** POST v1/auth/verify-otp/ — verify OTP after registration */
export interface VerifyOtpBody {
  mobile: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success?: boolean;
  data?: VerifyMobileData;
}

export async function verifyOtp(
  body: VerifyOtpBody,
): Promise<VerifyOtpResponse> {
  const url = `${BASE_URL}v1/auth/verify-otp/`;
  console.log("[authApi] verifyOtp request body:", body);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as VerifyOtpResponse;
  console.log("[authApi] verifyOtp response:", { status: res.status, data });
  if (!res.ok)
    throw new ApiError(
      getErrorMessage(data, "OTP verification failed"),
      res.status,
    );
  return data;
}

export interface ResendOtpBody {
  phone_number: string;
}

export interface ResendOtpResponse {
  success?: boolean;
  message?: string;
  data?: {
    phone_number?: string;
    otp_sent?: boolean;
    otp?: string;
  };
}

/** POST v1/auth/resend-otp/ — send OTP again to the same number */
export async function resendOtp(
  body: ResendOtpBody,
): Promise<ResendOtpResponse> {
  const url = `${BASE_URL}v1/auth/resend-otp/`;
  const payload = { phone_number: body.phone_number.trim() };
  console.log("[authApi] resend-otp request body:", payload);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as ResendOtpResponse;
  if (!res.ok)
    throw new ApiError(getErrorMessage(data, "Failed to resend OTP"), res.status);
  return data;
}

export interface RegisterMobileBody {
  mobile: string;
}

export interface RegisterMobileResponse {
  success?: boolean;
  message?: string;
  data?: {
    mobile?: string;
    phone_number?: string;
    otp_sent?: boolean;
    otp?: string;
  };
}

export interface VerifyMobileBody {
  mobile: string;
  otp: string;
}

export interface VerifyMobileProfile {
  id?: string;
  matri_id?: string;
  basic_details?: {
    name?: string;
    gender?: string;
    dob?: string;
    email?: string;
    phone?: string;
  };
  location_details?: {
    country_id?: number;
    country?: string;
    state_id?: number;
    state?: string;
    district_id?: number;
    district?: string;
    city_id?: number;
    city?: string;
    address?: string;
  };
  religion_details?: Record<string, unknown> & {
    religion_id?: number;
    religion?: string;
    caste_id?: number;
    caste?: string;
    mother_tongue_id?: number;
    mother_tongue?: string;
  };
  personal_details?: Record<string, unknown> & {
    marital_status?: string;
    height?: number;
    weight?: number;
    complexion?: string;
  };
  education_details?: Record<string, unknown> & {
    highest_education?: string;
    education_subject?: string;
    employment?: string;
    occupation?: string;
    annual_income?: string;
  };
  about_me?: string;
  photos?: Record<string, unknown>;
}

export interface VerifyMobileData {
  access_token: string;
  refresh_token: string;
  matri_id: string;
  is_registered: boolean;
  is_registration_profile_completed: boolean;
  profile_status: string;
  profile_steps: Record<string, boolean>;
  profile_completion_percentage: number;
  next_step: string | null;
  profile?: VerifyMobileProfile;
}

export interface VerifyMobileResponse {
  success: boolean;
  data: VerifyMobileData;
}

/** POST v1/auth/register/mobile/ — send OTP to mobile */
export async function registerMobile(
  body: RegisterMobileBody,
): Promise<RegisterMobileResponse> {
  const url = `${BASE_URL}v1/auth/register/mobile/`;
  console.log("[authApi] registerMobile request body:", body);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as RegisterMobileResponse;
  console.log("[authApi] registerMobile response:", {
    status: res.status,
    data,
  });
  if (!res.ok)
    throw new ApiError(getErrorMessage(data, "Failed to send OTP"), res.status);
  return data;
}

/** POST v1/auth/verify/mobile/ — verify OTP and get tokens */
export async function verifyMobile(
  body: VerifyMobileBody,
): Promise<VerifyMobileResponse> {
  const url = `${BASE_URL}v1/auth/verify/mobile/`;
  console.log("[authApi] verifyMobile request body:", body);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as VerifyMobileResponse;
  console.log("[authApi] verifyMobile response:", { status: res.status, data });
  if (!res.ok)
    throw new ApiError(getErrorMessage(data, "Failed to verify OTP"), res.status);
  return data;
}

function pickStr(v: unknown): string {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/** Parse member refresh response (apidoc + common variants). */
export function parseMemberRefreshTokens(data: unknown): {
  access_token: string;
  refresh_token: string;
} | null {
  const root = (data ?? {}) as Record<string, unknown>;
  const d = (root.data ?? root) as Record<string, unknown>;
  const tokens = (d.tokens ?? d.token) as Record<string, unknown> | undefined;
  let access =
    pickStr(d.access_token) || pickStr(d.access);
  let refresh =
    pickStr(d.refresh_token) || pickStr(d.refresh);
  if (tokens && typeof tokens === "object") {
    access =
      access ||
      pickStr(tokens.access_token) ||
      pickStr(tokens.access);
    refresh =
      refresh ||
      pickStr(tokens.refresh_token) ||
      pickStr(tokens.refresh);
  }
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

export type MemberTokenRefreshResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; status: number };

/** POST v1/auth/token/refresh/ — body `{ refresh }` per apidoc. No auth header. */
export async function postMemberTokenRefresh(
  refreshToken?: string | null,
): Promise<MemberTokenRefreshResult> {
  const url = `${BASE_URL}v1/auth/token/refresh/`;
  const body =
    typeof refreshToken === "string" && refreshToken.trim()
      ? { refresh: refreshToken.trim() }
      : {};
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  const parsed = parseMemberRefreshTokens(data);
  if (!parsed) return { ok: false, status: res.status };
  return { ok: true, ...parsed };
}

/** POST v1/auth/logout/ — blacklist refresh token (member JWT). See apidoc: admin uses v1/admin/auth/logout/. */
export async function authLogout(
  accessToken: string,
  refreshToken: string | null,
): Promise<void> {
  const url = `${BASE_URL}v1/auth/logout/`;
  const body: Record<string, string> = {};
  if (refreshToken) body.refresh_token = refreshToken;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  await res.json().catch(() => ({}));
}

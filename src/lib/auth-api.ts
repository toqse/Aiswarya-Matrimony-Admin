import { apiUrl } from "@/lib/api-url";
import { getMatrimonyAdminSession } from "@/lib/matrimony-admin-storage";
import type { AdminBranchRef } from "@/lib/matrimony-admin-storage";
import { userRoleToApiRole } from "@/lib/role-mapping";
import type { UserRole } from "@/types/user-role";

export type { AdminBranchRef };

export interface SendOtpBody {
  role: string;
  mobile: string;
}

export interface VerifyOtpBody {
  role: string;
  mobile: string;
  otp: string;
}

export interface VerifyOtpResponseData {
  access_token: string;
  refresh_token: string;
  role: string;
  name: string;
  branch: AdminBranchRef | null;
  permissions: string[];
}

/** Nested shape returned when `success` is false (e.g. send-otp / verify-otp errors). */
export interface AuthApiErrorShape {
  code?: number;
  message?: string;
  details?: Record<string, string[] | string>;
}

export interface AuthApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  detail?: string;
  error?: string | AuthApiErrorShape;
}

const DEBUG_AUTH_LOGS = import.meta.env.VITE_API_DEBUG !== "false";

function authLog(...args: unknown[]) {
  if (DEBUG_AUTH_LOGS) {
    console.log(...args);
  }
}

function redactAuthBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const o = { ...(body as Record<string, unknown>) };
  for (const key of ["otp", "access_token", "refresh_token", "password"]) {
    if (key in o && o[key] != null) o[key] = "[redacted]";
  }
  return o;
}

/** Resolves user-facing text from API JSON (top-level or nested `error.message`). */
export function getAuthApiErrorMessage(data: AuthApiEnvelope<unknown> | undefined): string {
  if (!data) return "Request failed";
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  const err = data.error;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object" && err !== null && "message" in err) {
    const m = (err as AuthApiErrorShape).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "Request failed";
}

export async function postSendOtp(role: UserRole, mobile: string) {
  const url = apiUrl("v1/admin/auth/send-otp/");
  const body: SendOtpBody = {
    role: userRoleToApiRole(role),
    mobile: mobile.trim(),
  };
  authLog("[send-otp] URL:", url);
  authLog("[send-otp] body:", redactAuthBody(body));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  let data: AuthApiEnvelope<{ mobile?: string; otp?: string }> = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  authLog("[send-otp] response status:", res.status);
  authLog("[send-otp] response body:", redactAuthBody(data));
  return { ok: res.ok, status: res.status, data };
}

export async function postVerifyOtp(role: UserRole, mobile: string, otp: string) {
  const url = apiUrl("v1/admin/auth/verify-otp/");
  const body: VerifyOtpBody = {
    role: userRoleToApiRole(role).trim(),
    mobile: mobile.trim(),
    otp: otp.trim(),
  };
  authLog("[verify-otp] URL:", url);
  authLog("[verify-otp] body:", redactAuthBody(body));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  let data: AuthApiEnvelope<VerifyOtpResponseData> = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  authLog("[verify-otp] response status:", res.status);
  authLog("[verify-otp] response body:", redactAuthBody(data));
  return { ok: res.ok, status: res.status, data };
}

export async function postAdminRefreshToken(refreshToken: string) {
  const url = apiUrl("v1/admin/auth/token/refresh/");
  const body = { refresh_token: refreshToken };
  authLog("[admin-token-refresh] URL:", url);
  authLog("[admin-token-refresh] body:", { refresh_token: "[redacted]" });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  let data: AuthApiEnvelope<{ access_token: string; refresh_token?: string }> = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  authLog("[admin-token-refresh] response status:", res.status);
  authLog("[admin-token-refresh] response body:", redactAuthBody(data));
  return { ok: res.ok, status: res.status, data };
}

export async function postAdminLogout() {
  const s = getMatrimonyAdminSession();
  const url = apiUrl("v1/admin/auth/logout/");
  const body = { refresh_token: s?.refresh_token ?? "" };
  authLog("[admin-logout] URL:", url);
  authLog("[admin-logout] body:", { refresh_token: s?.refresh_token ? "[redacted]" : undefined });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(s?.access_token ? { Authorization: `Bearer ${s.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let data: AuthApiEnvelope<unknown> = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  authLog("[admin-logout] response status:", res.status);
  authLog("[admin-logout] response body:", redactAuthBody(data));
  return { ok: res.ok, status: res.status, data };
}

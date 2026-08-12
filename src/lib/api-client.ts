import { API_BASE_URL } from "@/lib/config";
import { apiUrl } from "@/lib/api-url";
import type { AuthApiEnvelope } from "@/lib/auth-api";
import {
  clearMatrimonyAdminSession,
  getMatrimonyAdminSession,
  setMatrimonyAdminSession,
} from "@/lib/matrimony-admin-storage";

const LOG_PREFIX = "[admin-api]";

/** Default network timeout for every API call (ms). Requests abort after this. */
export const API_TIMEOUT_MS = 20_000;
/** Profile create/edit multipart (photos) — allow slower VPS uploads. */
export const PROFILE_MULTIPART_TIMEOUT_MS = 60_000;

/**
 * fetch() wrapper that aborts the request after `timeoutMs`. Any caller-supplied
 * AbortSignal is respected too — aborting either the timeout or the caller's
 * signal cancels the request.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs);
  const external = init.signal;
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener("abort", () => controller.abort(external.reason), { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Logging:
 * - Every request URL + response is logged to the browser console (useful after deploy).
 * - Set `VITE_API_DEBUG=false` to silence request bodies only; URL/status still log.
 * - Set `VITE_API_DEBUG=true` (default) to also log request bodies.
 */
const API_DEBUG_ALL = import.meta.env.VITE_API_DEBUG !== "false";

function apiLogAll(...args: unknown[]) {
  if (!API_DEBUG_ALL) return;
  console.log(...args);
}

function apiLogUrl(...args: unknown[]) {
  console.log(...args);
}

function apiLogResponse(prefix: string, status: number, data: unknown) {
  // Always log response summary + body (capped) for easier debugging.
  const MAX_CHARS = 5000;
  let printable: unknown = data;
  try {
    const s = JSON.stringify(data);
    if (s.length > MAX_CHARS) {
      printable = `${s.slice(0, MAX_CHARS)}… (truncated, ${s.length} chars)`;
    }
  } catch {
    // non-serializable, just print as-is
    printable = data;
  }
  console.log(`${prefix} response:`, status, printable);
}

function apiLogOnError(...args: unknown[]) {
  console.warn(...args);
}

function isTimeoutError(err: unknown): boolean {
  return err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
}

/** User-facing message for a failed connection (offline / timeout / unreachable). */
function networkFailureMessage(err: unknown, timeoutMs: number = API_TIMEOUT_MS): string {
  if (isTimeoutError(err)) {
    return `The request timed out after ${timeoutMs / 1000}s. Please check your connection and try again.`;
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Please check your internet connection and try again.";
  }
  return "Cannot connect to the server. Please check your internet connection and try again.";
}

/** JSON error blob so blob callers (which read the body) can surface a real message. */
function blobError(message: string): Blob {
  return new Blob([JSON.stringify({ success: false, message })], { type: "application/json" });
}

function networkFailure<T>(
  url: string,
  err: unknown,
  timeoutMs: number = API_TIMEOUT_MS,
): { ok: false; status: 0; data: AuthApiEnvelope<T> } {
  const message = networkFailureMessage(err, timeoutMs);
  // Keep the developer-oriented hint (base URL + raw error) in the console only.
  apiLogOnError(
    `${LOG_PREFIX} network error:`,
    err,
    "URL:",
    url,
    "Current base:",
    API_BASE_URL,
    "(set VITE_API_BASE_URL in .env if this is wrong)",
  );
  return {
    ok: false,
    status: 0,
    data: { success: false, message },
  };
}

function logBody(body: RequestInit["body"]): unknown {
  if (body == null) return undefined;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  if (body instanceof FormData) {
    const o: Record<string, string> = {};
    body.forEach((v, k) => {
      o[k] = v instanceof File ? `[File:${v.name}]` : String(v);
    });
    return o;
  }
  return "[body]";
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const s = getMatrimonyAdminSession();
  if (!s?.refresh_token) return null;
  const url = apiUrl("v1/admin/auth/token/refresh/");
  const body = { refresh_token: s.refresh_token };
  apiLogAll(`${LOG_PREFIX} POST token/refresh URL:`, url);
  apiLogAll(`${LOG_PREFIX} POST token/refresh body:`, { refresh_token: "[redacted]" });
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
  let data: AuthApiEnvelope<{ access_token: string; refresh_token?: string }> = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  apiLogAll(`${LOG_PREFIX} POST token/refresh response status:`, res.status);
  apiLogAll(`${LOG_PREFIX} POST token/refresh response body:`, data);
  const access = data.data?.access_token;
  if (!res.ok || !access) return null;
  setMatrimonyAdminSession({
    ...s,
    access_token: access,
    refresh_token: data.data?.refresh_token ?? s.refresh_token,
  });
  return access;
}

export interface AdminRequestInit extends Omit<RequestInit, "body"> {
  body?: BodyInit | object | null;
  /** Do not attach Bearer token */
  skipAuth?: boolean;
  /** Override the default network timeout (ms). */
  timeoutMs?: number;
}

function serializeBody(body: AdminRequestInit["body"]): BodyInit | undefined {
  if (body == null || body === undefined) return undefined;
  if (typeof body === "string" || body instanceof FormData || body instanceof Blob) return body;
  return JSON.stringify(body);
}

/**
 * Authenticated JSON request. Logs method, URL, body, status, parsed JSON.
 * On 401, attempts token refresh once, then retries. If still 401, clears session and redirects to /login.
 */
export async function adminRequest<T = unknown>(
  path: string,
  init: AdminRequestInit = {},
): Promise<{ ok: boolean; status: number; data: AuthApiEnvelope<T> }> {
  const { skipAuth, body: rawBody, headers: initHeaders, timeoutMs, ...rest } = init;
  const method = (rest.method || "GET").toUpperCase();
  const url = path.startsWith("http") ? path : apiUrl(path.replace(/^\//, ""));
  const requestTimeoutMs = timeoutMs ?? API_TIMEOUT_MS;

  const body = serializeBody(rawBody ?? undefined);
  const headers = new Headers(initHeaders);
  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!skipAuth) {
    const token = getMatrimonyAdminSession()?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  apiLogUrl(`${LOG_PREFIX} ${method} URL:`, url);
  apiLogAll(`${LOG_PREFIX} ${method} body:`, logBody(body ?? null));

  const doFetch = () =>
    fetchWithTimeout(
      url,
      {
        ...rest,
        method,
        headers,
        body: body ?? null,
      },
      requestTimeoutMs,
    );

  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    return networkFailure<T>(url, err, requestTimeoutMs);
  }
  let refreshSucceeded = false;

  if (res.status === 401 && !skipAuth) {
    const newAccess = await tryRefreshAccessToken();
    if (newAccess) {
      headers.set("Authorization", `Bearer ${newAccess}`);
      apiLogAll(`${LOG_PREFIX} ${method} retry URL:`, url);
      try {
        res = await doFetch();
      } catch (err) {
        return networkFailure<T>(url, err, requestTimeoutMs);
      }
      refreshSucceeded = true;
    }
  }

  let data = {} as AuthApiEnvelope<T>;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = {} as AuthApiEnvelope<T>;
    }
  }

  apiLogResponse(`${LOG_PREFIX} ${method} ${url}`, res.status, data);

  if (!res.ok) {
    // Always print the URL in console for easier debugging (even when VITE_API_DEBUG is off).
    apiLogOnError(`${LOG_PREFIX} ${method} failed (${res.status}) URL:`, url);
  }

  // Only force logout when refresh could not recover auth.
  // If refresh succeeded but endpoint still returns 401 (backend permission/config issue),
  // keep session and let page show the exact API error instead of hard-redirecting to login.
  if (res.status === 401 && !skipAuth && !refreshSucceeded) {
    clearMatrimonyAdminSession();
    if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
  }

  return { ok: res.ok, status: res.status, data };
}

/** Binary response (PDF, CSV, file). Logs URL/method; logs status and content-type; returns blob. */
export async function adminFetchBlob(
  path: string,
  init: AdminRequestInit = {},
): Promise<{ ok: boolean; status: number; blob: Blob; filename: string | null }> {
  const { skipAuth, body: rawBody, headers: initHeaders, ...rest } = init;
  const method = (rest.method || "GET").toUpperCase();
  const url = path.startsWith("http") ? path : apiUrl(path.replace(/^\//, ""));

  const body = serializeBody(rawBody ?? undefined);
  const headers = new Headers(initHeaders);
  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = getMatrimonyAdminSession()?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  apiLogUrl(`${LOG_PREFIX} ${method} [blob] URL:`, url);
  apiLogAll(`${LOG_PREFIX} ${method} [blob] body:`, logBody(body ?? null));

  const doFetch = () =>
    fetchWithTimeout(url, {
      ...rest,
      method,
      headers,
      body: body ?? null,
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    apiLogOnError(`${LOG_PREFIX} ${method} [blob] network error:`, err, "URL:", url, API_BASE_URL);
    return {
      ok: false,
      status: 0,
      blob: blobError(networkFailureMessage(err)),
      filename: null,
    };
  }
  let refreshSucceeded = false;
  if (res.status === 401 && !skipAuth) {
    const newAccess = await tryRefreshAccessToken();
    if (newAccess) {
      headers.set("Authorization", `Bearer ${newAccess}`);
      try {
        res = await doFetch();
      } catch (err) {
        apiLogOnError(`${LOG_PREFIX} ${method} [blob] network error:`, err, "URL:", url, API_BASE_URL);
        return {
          ok: false,
          status: 0,
          blob: blobError(networkFailureMessage(err)),
          filename: null,
        };
      }
      refreshSucceeded = true;
    }
  }

  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition");
  let filename: string | null = null;
  if (disp) {
    const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(disp);
    if (m) filename = decodeURIComponent(m[1].replace(/"/g, ""));
  }
  apiLogResponse(`${LOG_PREFIX} ${method} [blob] ${url}`, res.status, {
    contentType: res.headers.get("content-type"),
    size: blob.size,
    filename,
  });

  if (!res.ok) {
    apiLogOnError(`${LOG_PREFIX} ${method} [blob] failed (${res.status}) URL:`, url);
  }

  if (res.status === 401 && !skipAuth && !refreshSucceeded) {
    clearMatrimonyAdminSession();
    if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
  }

  return { ok: res.ok, status: res.status, blob, filename };
}

export function downloadBlob(blob: Blob, filename: string) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(u);
}

export async function downloadSalarySlip(id: number): Promise<void> {
  const { ok, blob, filename } = await adminFetchBlob(`v1/branch/payroll/${id}/download/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `salary_${id}_slip.pdf`);
}

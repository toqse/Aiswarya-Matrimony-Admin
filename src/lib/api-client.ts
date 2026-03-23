import { apiUrl } from "@/lib/api-url";
import type { AuthApiEnvelope } from "@/lib/auth-api";
import {
  clearMatrimonyAdminSession,
  getMatrimonyAdminSession,
  setMatrimonyAdminSession,
} from "@/lib/matrimony-admin-storage";

const LOG_PREFIX = "[admin-api]";

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
  console.log(`${LOG_PREFIX} POST token/refresh URL:`, url);
  console.log(`${LOG_PREFIX} POST token/refresh body:`, { refresh_token: "[redacted]" });
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
  console.log(`${LOG_PREFIX} POST token/refresh response status:`, res.status);
  console.log(`${LOG_PREFIX} POST token/refresh response body:`, data);
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
  const { skipAuth, body: rawBody, headers: initHeaders, ...rest } = init;
  const method = (rest.method || "GET").toUpperCase();
  const url = path.startsWith("http") ? path : apiUrl(path.replace(/^\//, ""));

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

  console.log(`${LOG_PREFIX} ${method} URL:`, url);
  console.log(`${LOG_PREFIX} ${method} body:`, logBody(body ?? null));

  const doFetch = () =>
    fetch(url, {
      ...rest,
      method,
      headers,
      body: body ?? null,
    });

  let res = await doFetch();
  let refreshSucceeded = false;

  if (res.status === 401 && !skipAuth) {
    const newAccess = await tryRefreshAccessToken();
    if (newAccess) {
      headers.set("Authorization", `Bearer ${newAccess}`);
      console.log(`${LOG_PREFIX} ${method} retry URL:`, url);
      res = await doFetch();
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

  console.log(`${LOG_PREFIX} ${method} response status:`, res.status);
  console.log(`${LOG_PREFIX} ${method} response body:`, data);

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

  console.log(`${LOG_PREFIX} ${method} [blob] URL:`, url);
  console.log(`${LOG_PREFIX} ${method} [blob] body:`, logBody(body ?? null));

  const doFetch = () =>
    fetch(url, {
      ...rest,
      method,
      headers,
      body: body ?? null,
    });

  let res = await doFetch();
  let refreshSucceeded = false;
  if (res.status === 401 && !skipAuth) {
    const newAccess = await tryRefreshAccessToken();
    if (newAccess) {
      headers.set("Authorization", `Bearer ${newAccess}`);
      res = await doFetch();
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
  console.log(`${LOG_PREFIX} ${method} [blob] response status:`, res.status);
  console.log(`${LOG_PREFIX} ${method} [blob] content-type:`, res.headers.get("content-type"), "size:", blob.size);

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

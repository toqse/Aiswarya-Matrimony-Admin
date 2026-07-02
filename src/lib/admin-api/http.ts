import type { AuthApiEnvelope } from "@/lib/auth-api";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

/** Per-field validation messages, e.g. { mobile: ["Ensure this field has no more than 10 characters."] }. */
export type ApiFieldErrors = Record<string, string[] | string>;

/**
 * How an error originated, so the UI can react differently:
 * - `network`  : couldn't reach the server (offline / DNS / refused)
 * - `timeout`  : the request was aborted after the timeout window
 * - `api`      : server responded with a real, user-facing error message
 * - `http`     : server failed (4xx/5xx) without a usable message (e.g. HTML page)
 * - `unknown`  : anything we couldn't classify
 */
export type ApiErrorKind = "network" | "timeout" | "api" | "http" | "unknown";

/** Error thrown by `unwrap` that preserves the API status code and per-field validation details. */
export class ApiError extends Error {
  code?: number;
  details?: ApiFieldErrors;
  kind: ApiErrorKind;

  constructor(message: string, code?: number, details?: ApiFieldErrors, kind: ApiErrorKind = "unknown") {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.kind = kind;
  }
}

/** A clean, user-facing message for an HTTP status when the server gave us nothing useful. */
export function httpStatusMessage(status: number): string {
  switch (status) {
    case 0:
      return "Cannot connect to the server. Please check your internet connection and try again.";
    case 400:
      return "The request was invalid. Please check your input and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested item could not be found.";
    case 408:
      return "The request timed out. Please try again.";
    case 409:
      return "This action conflicts with the current data. Please refresh and try again.";
    case 413:
      return "The file or data you are sending is too large.";
    case 422:
      return "Some of the submitted data is invalid. Please review and try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Something went wrong on the server. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "The server is temporarily unavailable. Please try again in a moment.";
    default:
      if (status >= 500) return "A server error occurred. Please try again later.";
      if (status >= 400) return "The request could not be completed. Please try again.";
      return "Something went wrong. Please try again.";
  }
}

/** True for a JS-level fetch network failure (offline, DNS, connection refused). */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.kind === "network";
  // fetch() rejects with a TypeError on network failure.
  return error instanceof TypeError;
}

/** True for an aborted/timed-out request. */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof ApiError) return error.kind === "timeout";
  return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}

/**
 * Resolves a single, user-facing message from ANY thrown value.
 * Use this in catch blocks / toasts so every error path shows something sensible:
 *   network/timeout -> connection message, API error -> server's message,
 *   everything else (HTML pages, parse errors, unknown) -> a clean fallback.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) {
    return error.message?.trim() || httpStatusMessage(error.code ?? 0);
  }
  if (isTimeoutError(error)) {
    return "The request timed out. Please try again.";
  }
  if (isNetworkError(error)) {
    return httpStatusMessage(0);
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

function extractErrorDetails(
  data: AuthApiEnvelope<unknown> | undefined,
): { code?: number; details?: ApiFieldErrors } {
  const err = data?.error;
  if (err && typeof err === "object" && err !== null) {
    const e = err as { code?: number; details?: ApiFieldErrors };
    return { code: e.code, details: e.details };
  }
  return {};
}

/** First human-readable message out of a field-errors object, e.g. "Mobile: too long". */
function firstDetailMessage(details?: ApiFieldErrors): string {
  if (!details || typeof details !== "object") return "";
  for (const [field, val] of Object.entries(details)) {
    const text = Array.isArray(val) ? val.find((v) => typeof v === "string" && v.trim()) : val;
    if (typeof text === "string" && text.trim()) {
      const label = field && field !== "non_field_errors" && field !== "detail" ? `${field}: ` : "";
      return `${label}${text.trim()}`;
    }
  }
  return "";
}

export async function unwrap<T>(res: {
  ok: boolean;
  status: number;
  data: AuthApiEnvelope<T>;
}): Promise<T> {
  if (!res.ok || res.data.success === false) {
    const { code, details } = extractErrorDetails(res.data);
    const status = res.status;

    // 1) Prefer a real message from the server response.
    const serverMsg = getAuthApiErrorMessage(res.data);
    const hasRealMsg = !!serverMsg && serverMsg !== "Request failed";

    // 2) status 0 means the network layer failed (offline / unreachable / timeout).
    //    api-client put a friendly message in `data.message`, so use it.
    let kind: ApiErrorKind;
    let message: string;
    if (status === 0) {
      kind = /(timed?\s*out|timeout)/i.test(serverMsg) ? "timeout" : "network";
      message = hasRealMsg ? serverMsg : httpStatusMessage(0);
    } else if (hasRealMsg) {
      // Server returned a usable, user-facing message (e.g. validation error).
      kind = "api";
      message = serverMsg;
    } else {
      // No top-level message: try field-level validation details, else derive from status
      // (covers HTML error pages, empty bodies, and other non-JSON failures).
      const detailMsg = firstDetailMessage(details);
      kind = detailMsg ? "api" : "http";
      message = detailMsg || httpStatusMessage(status);
    }

    throw new ApiError(message, code ?? status, details, kind);
  }
  const d = res.data;
  // Envelope: { success: true, data: T } — only unwrap when `data` is present (not null).
  // Some backends send { success: true, data: null, count, results, summary } with the list at top level.
  if (d.data !== undefined && d.data !== null) {
    return d.data as T;
  }
  // DRF / plain JSON: resource or paginated payload at top level (no nested `data`, or `data` was null)
  return d as T;
}

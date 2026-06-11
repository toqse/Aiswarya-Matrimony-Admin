import type { AuthApiEnvelope } from "@/lib/auth-api";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

/** Per-field validation messages, e.g. { mobile: ["Ensure this field has no more than 10 characters."] }. */
export type ApiFieldErrors = Record<string, string[] | string>;

/** Error thrown by `unwrap` that preserves the API status code and per-field validation details. */
export class ApiError extends Error {
  code?: number;
  details?: ApiFieldErrors;

  constructor(message: string, code?: number, details?: ApiFieldErrors) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
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

export async function unwrap<T>(res: {
  ok: boolean;
  status: number;
  data: AuthApiEnvelope<T>;
}): Promise<T> {
  if (!res.ok || res.data.success === false) {
    const { code, details } = extractErrorDetails(res.data);
    throw new ApiError(getAuthApiErrorMessage(res.data), code ?? res.status, details);
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

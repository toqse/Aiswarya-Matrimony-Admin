import type { AuthApiEnvelope } from "@/lib/auth-api";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export async function unwrap<T>(res: {
  ok: boolean;
  status: number;
  data: AuthApiEnvelope<T>;
}): Promise<T> {
  if (!res.ok || res.data.success === false) {
    throw new Error(getAuthApiErrorMessage(res.data));
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

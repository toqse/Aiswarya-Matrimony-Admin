export const NETWORK_ERROR_MESSAGE = "Network error";
export const GENERIC_ERROR_MESSAGE = "Something went wrong, Try again later";

/** Default request timeout: abort and surface a network error after this. */
export const DEFAULT_API_TIMEOUT_MS = 20000;

/**
 * fetch() wrapper that aborts the request after `timeoutMs`. A timeout aborts
 * with an AbortError, which `isNetworkError` treats as a network failure so the
 * UI shows NETWORK_ERROR_MESSAGE. Any caller-provided signal is respected too.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const callerSignal = init.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else
      callerSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Thrown when the API responds with a non-OK status and a parseable error
 * payload. Carries the actual server-provided message so the UI can show it.
 */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** True for fetch/connection failures, aborts and request timeouts. */
export function isNetworkError(err: unknown): boolean {
  // fetch() rejects with a TypeError on connection failure / invalid URL.
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err && typeof err === "object") {
    const name = (err as { name?: string }).name;
    if (name === "AbortError" || name === "TimeoutError") return true;
  }
  return false;
}

/**
 * Maps any thrown error to a user-facing message:
 * - network / timeout      -> "Network error"
 * - API error response     -> the actual server message
 * - anything else          -> "Something went wrong, Try again later"
 *
 * API layers surface server errors either as an `ApiError` or as a plain
 * `Error` whose message is the parsed server message, so both are shown as-is.
 * Network failures are caught first, so a raw "Failed to fetch" never leaks.
 */
export function getDisplayErrorMessage(err: unknown): string {
  if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;
  if (err instanceof SyntaxError) return GENERIC_ERROR_MESSAGE;
  if (err instanceof Error && err.message.trim()) return err.message;
  return GENERIC_ERROR_MESSAGE;
}

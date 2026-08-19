import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RELOAD_KEY = "admin-stale-chunk-reload";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(
        new Error(
          "Page script took too long to load. Check your network or reload.",
        ),
      );
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Loading chunk .+ failed/i.test(message)
  );
}

/** Hard-reload once per tab after a deploy deleted old hashed JS files. */
export function reloadForStaleChunk(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === "1") {
      sessionStorage.removeItem(RELOAD_KEY);
      return false;
    }
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * React.lazy wrapper that retries failed chunk loads, then reloads once so
 * Suspense cannot spin on "Loading…" forever (common after a deploy).
 */
export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const mod = await withTimeout(factory(), CHUNK_TIMEOUT_MS);
        try {
          sessionStorage.removeItem(RELOAD_KEY);
        } catch {
          /* ignore */
        }
        return mod;
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    if (isChunkLoadError(lastError) && reloadForStaleChunk()) {
      return new Promise<{ default: T }>(() => {
        /* wait for reload */
      });
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to load this page. Please reload.");
  });
}

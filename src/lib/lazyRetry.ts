import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

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

/**
 * React.lazy wrapper that retries failed chunk loads and times out so Suspense
 * cannot spin on "Loading…" forever (common after a deploy with stale assets).
 */
export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await withTimeout(factory(), CHUNK_TIMEOUT_MS);
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to load this page. Please reload.");
  });
}

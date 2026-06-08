/** Waits for both the promise and a minimum delay so loading UI stays visible briefly. */
export function withMinDuration<T>(ms: number, promise: Promise<T>): Promise<T> {
  return Promise.all([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]).then(([result]) => result);
}

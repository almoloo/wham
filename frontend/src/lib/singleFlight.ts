/**
 * Wrap an async function so overlapping calls share one run. While a run is in
 * flight every caller gets the same promise; once it settles, the next call
 * starts a fresh run.
 */
export function createSingleFlight<T>(run: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;
  return () => {
    if (inFlight === null) {
      const current: Promise<T> = run().finally(() => {
        if (inFlight === current) inFlight = null;
      });
      inFlight = current;
    }
    return inFlight;
  };
}

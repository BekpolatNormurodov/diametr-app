import { useEffect, useRef } from "react";

/**
 * Runs `fn` immediately and then every `interval` milliseconds.
 * Automatically clears the interval when the component unmounts.
 *
 * @param fn       - async function to execute on each tick
 * @param interval - polling interval in ms (default: 10 000)
 * @param enabled  - set to false to pause polling (default: true)
 * @param resetKey - when this value changes, `fn` runs again immediately and the
 *                   interval restarts (e.g. pass the live shop id so a shop
 *                   reassignment refetches right away)
 */
export function usePolling(
  fn: () => Promise<void> | void,
  interval: number = 10_000,
  enabled: boolean = true,
  resetKey?: unknown
) {
  const fnRef = useRef(fn);
  fnRef.current = fn; // always keep the latest version

  useEffect(() => {
    if (!enabled) return;

    // run once immediately
    fnRef.current();

    const id = setInterval(() => {
      fnRef.current();
    }, interval);

    return () => clearInterval(id);
  }, [interval, enabled, resetKey]);
}

/**
 * Sequence guard for fetchers that are called from several places at once
 * (poll tick + post-mutation refetch). Call `next()` when a request starts and
 * only apply its response if `isLatest(id)` is still true — a slower, older
 * response can then never overwrite a newer one.
 */
export function useRequestSeq() {
  const seq = useRef(0);
  const next = () => ++seq.current;
  const isLatest = (id: number) => id === seq.current;
  return { next, isLatest };
}

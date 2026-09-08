import { useEffect, useRef } from "react";

/**
 * Runs `fn` immediately and then every `interval` milliseconds.
 * Automatically clears the interval when the component unmounts.
 *
 * @param fn       - async function to execute on each tick
 * @param interval - polling interval in ms (default: 10 000)
 * @param enabled  - set to false to pause polling (default: true)
 */
export function usePolling(
  fn: () => Promise<void> | void,
  interval: number = 10_000,
  enabled: boolean = true
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
  }, [interval, enabled]);
}

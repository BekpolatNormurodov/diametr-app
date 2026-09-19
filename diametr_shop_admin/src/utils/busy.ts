/**
 * App-wide "a multi-request save is running" counter.
 *
 * Stock saves send their requests one by one; a page reload in the middle silently drops the
 * rest. VersionWatcher checks isBusy() and postpones its automatic reload into a new deploy,
 * and while busy a beforeunload prompt guards full page loads (refresh, tab close, a plain
 * <a href> link). Always pair beginBusy() with endBusy() in a finally block.
 */

let count = 0;

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  // Older browsers only show the prompt when returnValue is set.
  e.returnValue = "";
}

export function beginBusy(): void {
  count++;
  if (count === 1) window.addEventListener("beforeunload", onBeforeUnload);
}

export function endBusy(): void {
  if (count === 0) return;
  count--;
  if (count === 0) window.removeEventListener("beforeunload", onBeforeUnload);
}

export function isBusy(): boolean {
  return count > 0;
}

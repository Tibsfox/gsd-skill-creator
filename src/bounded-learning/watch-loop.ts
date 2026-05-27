/**
 * Bounded-learning calibration loop — file-system watch loop (v1.49.799).
 *
 * Watches one or more file paths and invokes a callback after a debounce
 * window when any of them change. Designed for the CLI's `--watch` mode:
 * re-run the calibration loop whenever `.planning/patterns/suggestions.json`
 * or `.planning/skill-creator.json` is rewritten, without manual operator
 * intervention.
 *
 * Behavior:
 *   - One `fs.watch` per path (per-file watcher; recursive not needed here).
 *   - Missing paths are watched lazily by polling for creation every
 *     `pollMs` ms (default 500). Once the file exists, switches to fs.watch.
 *   - Changes within `debounceMs` are coalesced into a single callback
 *     invocation (default 200ms). Bursty editor saves don't thrash the loop.
 *   - The callback is awaited; concurrent invocations are NOT permitted
 *     (a re-fire during callback execution is queued and runs once the
 *     prior call resolves).
 *   - Stop the loop by aborting the provided AbortSignal OR calling the
 *     returned `stop()` function.
 *
 * @module bounded-learning/watch-loop
 */

import { existsSync, watch as fsWatch, type FSWatcher } from 'node:fs';

/**
 * Options for `runWatchLoop`.
 */
export interface WatchLoopOptions {
  /** Coalesce window for rapid changes. Default 200ms. */
  debounceMs?: number;
  /** Poll interval for missing-file creation detection. Default 500ms. */
  pollMs?: number;
  /** Abort signal for cooperative shutdown. */
  signal?: AbortSignal;
  /** Fire the callback once before the first watch event (default false). */
  fireImmediately?: boolean;
}

/**
 * Handle returned by `runWatchLoop`. Call `stop()` for cooperative
 * shutdown; `done` resolves once all watchers are torn down.
 */
export interface WatchLoopHandle {
  stop: () => void;
  done: Promise<void>;
}

/**
 * Watch the given paths and run the callback after a debounce window
 * when any of them change. Returns immediately with a handle whose
 * `done` promise resolves once the loop has been stopped and all
 * watchers torn down.
 *
 * The callback is awaited; if it throws, the error is re-thrown on the
 * NEXT tick (not the current one), so a single transient failure does
 * not tear down the watch loop.
 */
export function runWatchLoop(
  paths: string[],
  callback: () => Promise<void> | void,
  options: WatchLoopOptions = {},
): WatchLoopHandle {
  const debounceMs = options.debounceMs ?? 200;
  const pollMs = options.pollMs ?? 500;
  const signal = options.signal;

  let stopped = false;
  let debounceTimer: NodeJS.Timeout | null = null;
  let pollTimer: NodeJS.Timeout | null = null;
  let runningCallback = false;
  let pendingFire = false;
  let currentRunPromise: Promise<void> | null = null;
  const watchers = new Map<string, FSWatcher>();

  const resolveDone: { value: () => void } = { value: () => {} };
  const done = new Promise<void>((resolve) => {
    resolveDone.value = resolve;
  });

  function tearDown(): void {
    if (stopped) return;
    stopped = true;
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    for (const w of watchers.values()) {
      try {
        w.close();
      } catch {
        // Already closed.
      }
    }
    watchers.clear();
    // Wait for any in-flight callback to settle before signaling done.
    // This prevents the caller's cleanup logic (e.g. test afterEach
    // rmSync) from racing with the callback's file-system operations.
    const inflight = currentRunPromise;
    if (inflight !== null) {
      void inflight.then(() => resolveDone.value()).catch(() => resolveDone.value());
    } else {
      resolveDone.value();
    }
  }

  async function fireCallback(): Promise<void> {
    if (stopped) return;
    if (runningCallback) {
      pendingFire = true;
      return;
    }
    runningCallback = true;
    const promise = (async () => {
      try {
        await callback();
      } catch (err) {
        // Schedule the throw on the next microtick so this run's tear-down
        // logic completes first. Single transient errors don't tear down
        // the loop; the runtime's unhandledRejection will surface them.
        queueMicrotask(() => {
          throw err;
        });
      } finally {
        runningCallback = false;
        currentRunPromise = null;
        if (pendingFire && !stopped) {
          pendingFire = false;
          // Re-fire immediately to consume the queued event.
          void fireCallback();
        }
      }
    })();
    currentRunPromise = promise;
    await promise;
  }

  function scheduleFire(): void {
    if (stopped) return;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void fireCallback();
    }, debounceMs);
  }

  function startWatch(path: string): void {
    if (stopped || watchers.has(path)) return;
    try {
      const w = fsWatch(path, { persistent: true }, () => {
        scheduleFire();
      });
      watchers.set(path, w);
    } catch {
      // Path does not exist or cannot be watched right now; the poller
      // will retry.
    }
  }

  function startPoller(): void {
    pollTimer = setInterval(() => {
      if (stopped) return;
      for (const path of paths) {
        if (!watchers.has(path) && existsSync(path)) {
          startWatch(path);
        }
      }
    }, pollMs);
  }

  // Initial watch setup.
  for (const path of paths) {
    if (existsSync(path)) startWatch(path);
  }
  startPoller();

  // Abort-signal integration.
  if (signal) {
    if (signal.aborted) {
      tearDown();
    } else {
      signal.addEventListener('abort', tearDown, { once: true });
    }
  }

  if (options.fireImmediately) {
    void fireCallback();
  }

  return { stop: tearDown, done };
}

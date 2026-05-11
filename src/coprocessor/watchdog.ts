/**
 * @module coprocessor/watchdog
 *
 * Deterministic liveness watchdog for the math coprocessor MCP server.
 * Closes CONCERNS.md §14 (math coprocessor lifecycle, no watchdog).
 *
 * Public surface: `CoprocessorWatchdog` class plus module-level singleton
 * helpers `getCoprocessorStatus()` and `setSupervisorPolicy()`.
 *
 * Default supervisor policy is `observe-only` — the watchdog will track and
 * surface status to the caller, but will NOT spawn or restart the Python
 * MCP server. Opt into auto-restart via `setSupervisorPolicy('auto-restart')`
 * or via settings key `gsd-skill-creator.coprocessor.supervisor.policy`.
 */

export type WatchdogStatus =
  | { state: 'alive'; lastSeen: number; latencyMs: number }
  | { state: 'degraded'; lastSeen: number; latencyMs: number; reason: string }
  | { state: 'dead'; lastSeen: number | null; lastError: string }
  | { state: 'unknown'; reason: 'not-started' | 'startup-pending' };

export type SupervisorPolicy = 'observe-only' | 'auto-restart';

export interface WatchdogOptions {
  /** Probe interval in ms (default 2000). */
  intervalMs?: number;
  /** Latency threshold above which status becomes `degraded` (default 500ms). */
  degradedThresholdMs?: number;
  /** Number of consecutive missed/failed probes before status transitions to `dead` (default 3). */
  deadAfterMissedProbes?: number;
  /** Supervisor policy (default `observe-only`). */
  policy?: SupervisorPolicy;
  /** Injected ping function; resolves to latency in ms; rejects on failure. */
  pingFn: () => Promise<number>;
  /** Injected restart function (called only when policy === 'auto-restart' and state === 'dead'). */
  restartFn?: () => Promise<void>;
  /** Injected clock; defaults to `Date.now`. */
  now?: () => number;
  /** Injected setTimeout/clearTimeout pair for hermetic testing. */
  scheduler?: {
    setTimeout: (fn: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
  };
  /** Max auto-restart attempts inside a 60s window (default 3). */
  maxRestartsPerWindow?: number;
}

interface RestartAttempt {
  at: number;
  ok: boolean;
}

export class CoprocessorWatchdog {
  private readonly opts: Required<Omit<WatchdogOptions, 'restartFn'>> & { restartFn?: () => Promise<void> };
  private status: WatchdogStatus = { state: 'unknown', reason: 'not-started' };
  private missedProbes = 0;
  private timer: unknown = null;
  private running = false;
  private restartAttempts: RestartAttempt[] = [];
  private failedRestart = false;

  constructor(opts: WatchdogOptions) {
    this.opts = {
      intervalMs: opts.intervalMs ?? 2000,
      degradedThresholdMs: opts.degradedThresholdMs ?? 500,
      deadAfterMissedProbes: opts.deadAfterMissedProbes ?? 3,
      policy: opts.policy ?? 'observe-only',
      pingFn: opts.pingFn,
      restartFn: opts.restartFn,
      now: opts.now ?? Date.now,
      scheduler: opts.scheduler ?? {
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      },
      maxRestartsPerWindow: opts.maxRestartsPerWindow ?? 3,
    };
  }

  /** Begin probing. Idempotent; calling twice is a no-op. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.status = { state: 'unknown', reason: 'startup-pending' };
    this.scheduleNext(0);
  }

  /** Stop probing. Status freezes at last known value. */
  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      this.opts.scheduler.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getStatus(): WatchdogStatus {
    return this.status;
  }

  setPolicy(policy: SupervisorPolicy): void {
    this.opts.policy = policy;
  }

  getPolicy(): SupervisorPolicy {
    return this.opts.policy;
  }

  /** Run one probe synchronously. Exposed for hermetic testing. */
  async probeOnce(): Promise<void> {
    let latency: number;
    try {
      latency = await this.opts.pingFn();
    } catch (err) {
      this.missedProbes += 1;
      if (this.missedProbes >= this.opts.deadAfterMissedProbes) {
        const prevLastSeen = this.status.state === 'alive' || this.status.state === 'degraded' ? this.status.lastSeen : null;
        this.status = {
          state: 'dead',
          lastSeen: prevLastSeen,
          lastError: err instanceof Error ? err.message : String(err),
        };
        await this.maybeRestart();
      }
      return;
    }

    this.missedProbes = 0;
    const lastSeen = this.opts.now();
    if (latency > this.opts.degradedThresholdMs) {
      this.status = {
        state: 'degraded',
        lastSeen,
        latencyMs: latency,
        reason: `latency ${latency}ms > threshold ${this.opts.degradedThresholdMs}ms`,
      };
    } else {
      this.status = { state: 'alive', lastSeen, latencyMs: latency };
    }
  }

  private scheduleNext(delayMs: number): void {
    if (!this.running) return;
    this.timer = this.opts.scheduler.setTimeout(() => {
      this.probeOnce()
        .catch(() => {
          /* probeOnce handles its own errors; this guard is belt+suspenders */
        })
        .finally(() => {
          if (this.running) {
            this.scheduleNext(this.opts.intervalMs);
          }
        });
    }, delayMs);
  }

  private async maybeRestart(): Promise<void> {
    if (this.opts.policy !== 'auto-restart') return;
    if (this.failedRestart) return;
    if (!this.opts.restartFn) return;

    const now = this.opts.now();
    const windowStart = now - 60_000;
    this.restartAttempts = this.restartAttempts.filter((a) => a.at >= windowStart);

    if (this.restartAttempts.length >= this.opts.maxRestartsPerWindow) {
      this.failedRestart = true;
      this.status = {
        state: 'dead',
        lastSeen: this.status.state === 'dead' ? this.status.lastSeen : null,
        lastError: `failed-restart: ${this.opts.maxRestartsPerWindow} attempts in 60s exhausted`,
      };
      return;
    }

    try {
      await this.opts.restartFn();
      this.restartAttempts.push({ at: now, ok: true });
      this.missedProbes = 0;
      this.status = { state: 'unknown', reason: 'startup-pending' };
    } catch (err) {
      this.restartAttempts.push({ at: now, ok: false });
      this.status = {
        state: 'dead',
        lastSeen: this.status.state === 'dead' ? this.status.lastSeen : null,
        lastError: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

let sharedWatchdog: CoprocessorWatchdog | null = null;

/**
 * Register the singleton watchdog. The coprocessor client wires this at
 * `connect()` time with a `pingFn` that calls `math.capabilities` and times
 * the round trip.
 */
export function registerWatchdog(watchdog: CoprocessorWatchdog): void {
  if (sharedWatchdog) {
    sharedWatchdog.stop();
  }
  sharedWatchdog = watchdog;
}

/**
 * Clear the shared watchdog. Used by `disconnect()` and by tests.
 */
export function clearWatchdog(): void {
  if (sharedWatchdog) {
    sharedWatchdog.stop();
    sharedWatchdog = null;
  }
}

/**
 * Get current coprocessor liveness status. Returns `{ state: 'unknown',
 * reason: 'not-started' }` if no watchdog is registered.
 */
export function getCoprocessorStatus(): WatchdogStatus {
  if (!sharedWatchdog) {
    return { state: 'unknown', reason: 'not-started' };
  }
  return sharedWatchdog.getStatus();
}

/**
 * Set the supervisor policy on the shared watchdog. No-op if no watchdog
 * is registered.
 */
export function setSupervisorPolicy(policy: SupervisorPolicy): void {
  if (sharedWatchdog) {
    sharedWatchdog.setPolicy(policy);
  }
}

/**
 * Build an error-surface message for callers when a coprocessor call is
 * attempted against a dead/degraded server. Returns null if the status
 * doesn't warrant a surfaced warning.
 */
export function describeWatchdogError(status: WatchdogStatus = getCoprocessorStatus()): string | null {
  if (status.state === 'dead') {
    const seen = status.lastSeen ? `last seen ${new Date(status.lastSeen).toISOString()}` : 'never seen';
    const policy = sharedWatchdog?.getPolicy() ?? 'observe-only';
    return `MCPWatchdog: server dead (${seen}); supervisor policy ${policy} — ${policy === 'auto-restart' ? 'restart attempted' : 'no restart attempted'}; lastError: ${status.lastError}`;
  }
  return null;
}

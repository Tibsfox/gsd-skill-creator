/**
 * Filesystem write watchdog.
 *
 * Detects stuck agents producing no file output for a configurable
 * timeout period and triggers an executor halt with an actionable message.
 *
 * Fixes RC-10: in v1.49 Phase 449, an agent consumed ~218K tokens over
 * ~5 hours with zero filesystem output. The watchdog timer provides a
 * safety net.
 *
 * @module autonomy/write-watchdog
 */

// ============================================================================
// Named Constants
// ============================================================================

/** Default timeout in milliseconds (10 minutes) */
export const DEFAULT_TIMEOUT_MS = 600_000;

/** Default check interval in milliseconds (2 minutes) */
export const DEFAULT_CHECK_INTERVAL_MS = 120_000;

// ============================================================================
// Types
// ============================================================================

/** Configuration for the write watchdog */
export interface WatchdogConfig {
  /** Timeout in milliseconds before considering agent stuck (default: 600000) */
  timeoutMs: number;
  /** Interval between periodic checks in milliseconds (default: 120000) */
  checkIntervalMs: number;
  /** Callback fired when timeout is detected */
  onTimeout: (status: WatchdogStatus) => void;
}

/** Status snapshot from the watchdog */
export interface WatchdogStatus {
  /** Timestamp of last recorded write */
  lastWriteAt: Date;
  /** Milliseconds since last write */
  silentMs: number;
  /** Minutes since last write (rounded) */
  silentMinutes: number;
  /** Whether the timeout threshold has been exceeded */
  isTimedOut: boolean;
  /** Human-readable message about the watchdog state */
  message: string;
}

// ============================================================================
// WriteWatchdog
// ============================================================================

/**
 * Timer-based watchdog that detects stuck agents with no filesystem writes.
 *
 * The watchdog fires its onTimeout callback exactly once per timeout detection.
 * Subsequent checks do NOT re-trigger until after a recordWrite() resets the timer.
 *
 * Usage:
 *   const wd = new WriteWatchdog({ onTimeout: (status) => halt(status.message) });
 *   wd.start();
 *   // ... on each file write ...
 *   wd.recordWrite('/path/to/file');
 *   // ... when done ...
 *   wd.stop();
 */
export class WriteWatchdog {
  private _config: WatchdogConfig;
  private _lastWriteAt: Date;
  private _lastFilePath: string | undefined;
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _running = false;
  private _triggered = false;

  constructor(config: Partial<WatchdogConfig> & { onTimeout: (status: WatchdogStatus) => void }) {
    this._config = {
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      checkIntervalMs: config.checkIntervalMs ?? DEFAULT_CHECK_INTERVAL_MS,
      onTimeout: config.onTimeout,
    };
    this._lastWriteAt = new Date();
  }

  /**
   * Start the watchdog timer.
   *
   * Sets lastWriteAt to now and begins periodic checks.
   * No-op if already running (prevents duplicate timers).
   */
  start(): void {
    if (this._running) return;

    this._lastWriteAt = new Date();
    this._triggered = false;
    this._running = true;
    this._intervalId = setInterval(
      () => this._checkAndNotify(),
      this._config.checkIntervalMs,
    );
  }

  /**
   * Stop the watchdog timer.
   *
   * Clears the periodic check interval. No-op if already stopped.
   */
  stop(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._running = false;
  }

  /**
   * Record a file write, resetting the watchdog timer.
   *
   * Re-arms the watchdog so it can fire again after the next timeout period.
   * Valid to call before start() (updates lastWriteAt but no timer running).
   */
  recordWrite(filePath?: string): void {
    this._lastWriteAt = new Date();
    this._lastFilePath = filePath;
    this._triggered = false;
  }

  /**
   * Manually check the current watchdog status.
   *
   * Pure status check — does NOT call onTimeout. Use this to inspect
   * the watchdog state without triggering side effects.
   */
  check(): WatchdogStatus {
    return this._buildStatus();
  }

  /**
   * Alias for check() for convenience.
   */
  getStatus(): WatchdogStatus {
    return this.check();
  }

  /**
   * Whether the watchdog timer is active.
   */
  isRunning(): boolean {
    return this._running;
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  /**
   * Internal method called by setInterval.
   * Checks status and fires onTimeout if timed out and not already triggered.
   */
  private _checkAndNotify(): void {
    const status = this._buildStatus();
    if (status.isTimedOut && !this._triggered) {
      this._triggered = true;
      this._config.onTimeout(status);
    }
  }

  /**
   * Build a WatchdogStatus snapshot from current state.
   */
  private _buildStatus(): WatchdogStatus {
    if (!this._running) {
      return {
        lastWriteAt: this._lastWriteAt,
        silentMs: 0,
        silentMinutes: 0,
        isTimedOut: false,
        message: 'Watchdog: not running.',
      };
    }

    const now = Date.now();
    const silentMs = now - this._lastWriteAt.getTime();
    const silentMinutes = Math.round(silentMs / 60_000);
    const isTimedOut = silentMs >= this._config.timeoutMs;

    const fileInfo = this._lastFilePath ? `, file: ${this._lastFilePath}` : '';
    const message = isTimedOut
      ? `Watchdog: no writes for ${silentMinutes} minutes (last write: ${this._lastWriteAt.toISOString()}${fileInfo}). Halting executor.`
      : `Watchdog: ${silentMinutes} minutes since last write. Timeout at ${Math.round(this._config.timeoutMs / 60_000)} minutes.`;

    return {
      lastWriteAt: this._lastWriteAt,
      silentMs,
      silentMinutes,
      isTimedOut,
      message,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a WriteWatchdog instance.
 *
 * Ergonomic alternative to the class constructor.
 */
export function createWatchdog(
  onTimeout: (status: WatchdogStatus) => void,
  options?: Partial<Omit<WatchdogConfig, 'onTimeout'>>,
): WriteWatchdog {
  return new WriteWatchdog({ onTimeout, ...options });
}

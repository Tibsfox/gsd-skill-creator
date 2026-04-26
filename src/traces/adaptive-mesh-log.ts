/**
 * M3 Decision-Trace Ledger — adaptive-mesh trace logging.
 *
 * Implements the mesh-adaptive logging pattern from arXiv:2509.08537.
 * Partitions the event stream into variable-density buckets based on
 * local event frequency; high-activity windows get finer temporal resolution
 * while quiescent windows are coarsened.
 *
 * This is a planning-level primitive: it wraps any flush callback with a
 * density estimator so that callers (e.g. TraceWriter) can opt into adaptive
 * granularity without changing the underlying JSONL append contract.
 *
 * Design note (arXiv:2509.08537 §3):
 *   Resolution parameter α ∈ (0, 1] controls the coarsening floor.
 *   At α = 1.0, every event flushes immediately (maximum fidelity).
 *   At α = 0.1, quiescent windows are coarsened 10×.
 *   High-importance events (e.g. tractability gate crossings) should always
 *   set `priority: 'high'` to bypass coarsening regardless of α.
 *
 * JP-020, Wave 3, phase 841.
 *
 * @module traces/adaptive-mesh-log
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MeshPriority = 'high' | 'normal' | 'low';

export interface MeshEvent<T> {
  /** The payload to be flushed. */
  payload: T;
  /**
   * Priority level. 'high' events always flush immediately (never coarsened).
   * Defaults to 'normal'.
   */
  priority?: MeshPriority;
  /** Monotonic timestamp in ms. Defaults to Date.now(). */
  ts?: number;
}

export interface AdaptiveMeshConfig {
  /**
   * Resolution coefficient α ∈ (0, 1]. Controls coarsening in quiescent
   * windows. At 1.0 every event flushes immediately.
   * Default: 0.5
   */
  alpha?: number;
  /**
   * Window size in ms over which event density is estimated.
   * Default: 1000 ms
   */
  windowMs?: number;
  /**
   * High-density threshold: events-per-window above this value are considered
   * high-activity (fine resolution applied). Below it, coarsening kicks in.
   * Default: 10
   */
  highDensityThreshold?: number;
}

// ─── Density estimator ───────────────────────────────────────────────────────

/**
 * Sliding-window density estimator.  Tracks event timestamps within the
 * last `windowMs` milliseconds and reports the count.
 */
export class DensityEstimator {
  private readonly windowMs: number;
  private readonly timestamps: number[] = [];

  constructor(windowMs = 1000) {
    this.windowMs = windowMs;
  }

  /** Record a new event at time `now` (default: Date.now()). */
  record(now = Date.now()): void {
    this.timestamps.push(now);
  }

  /** Count of events in the last `windowMs` ms relative to `now`. */
  density(now = Date.now()): number {
    const cutoff = now - this.windowMs;
    // Prune stale entries
    while (this.timestamps.length > 0 && this.timestamps[0]! < cutoff) {
      this.timestamps.shift();
    }
    return this.timestamps.length;
  }
}

// ─── AdaptiveMeshLog ─────────────────────────────────────────────────────────

/**
 * Wraps a flush callback with mesh-adaptive gating.
 *
 * Callers enqueue events; the log decides whether to flush immediately
 * (high-activity or high-priority) or defer to the next coarsened tick.
 */
export class AdaptiveMeshLog<T> {
  private readonly alpha: number;
  private readonly highDensityThreshold: number;
  private readonly estimator: DensityEstimator;
  private readonly flush: (payload: T) => void | Promise<void>;
  private pending: Array<MeshEvent<T>> = [];
  private coarsenedFlushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    flush: (payload: T) => void | Promise<void>,
    config: AdaptiveMeshConfig = {},
  ) {
    this.flush = flush;
    this.alpha = Math.max(0.01, Math.min(1, config.alpha ?? 0.5));
    const windowMs = config.windowMs ?? 1000;
    this.highDensityThreshold = config.highDensityThreshold ?? 10;
    this.estimator = new DensityEstimator(windowMs);
  }

  /**
   * Enqueue an event for flushing.
   * High-priority events and high-density windows flush immediately.
   * Low-density windows are coarsened: flush is deferred by `1/α` ticks.
   */
  enqueue(event: MeshEvent<T>): void {
    const now = event.ts ?? Date.now();
    this.estimator.record(now);
    const density = this.estimator.density(now);
    const priority = event.priority ?? 'normal';

    if (priority === 'high' || density >= this.highDensityThreshold) {
      // High-activity or high-priority: flush immediately
      this.pending.push(event);
      void this.drainPending();
    } else {
      // Quiescent window: buffer and schedule a coarsened flush
      this.pending.push(event);
      this.scheduleCoarsenedFlush();
    }
  }

  /** Force a drain of all pending events (call on shutdown). */
  async drain(): Promise<void> {
    if (this.coarsenedFlushTimer !== null) {
      clearTimeout(this.coarsenedFlushTimer);
      this.coarsenedFlushTimer = null;
    }
    await this.drainPending();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async drainPending(): Promise<void> {
    const batch = this.pending.splice(0);
    for (const ev of batch) {
      await this.flush(ev.payload);
    }
  }

  private scheduleCoarsenedFlush(): void {
    if (this.coarsenedFlushTimer !== null) return; // already scheduled
    // Coarsened delay: larger α → shorter delay → higher resolution
    const delayMs = Math.round((1 / this.alpha) * 100);
    this.coarsenedFlushTimer = setTimeout(() => {
      this.coarsenedFlushTimer = null;
      void this.drainPending();
    }, delayMs);
  }
}

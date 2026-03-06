/**
 * drift-monitor.ts — Data Lifecycle: Post-Promotion Output Monitoring
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * DriftMonitor watches the execution results of promoted scripts for output drift.
 * When a script consistently produces different output than expected, it triggers
 * automatic demotion — reverting the operation back to live tool-call mode.
 *
 * WHY DRIFT MONITORING EXISTS
 * ----------------------------
 * Script promotion is based on historical data: "this operation always produced
 * X." But the world changes. A file gets modified. A command's behavior changes
 * across versions. The expected output is no longer the actual output.
 *
 * Without drift monitoring, a promoted script silently returns stale results
 * forever. With drift monitoring, consecutive mismatches trigger demotion,
 * restoring the live operation that produces current results.
 *
 * This is the self-correcting feedback loop: promote when stable, demote when
 * drift is detected. The system adapts to change rather than freezing on
 * historical assumptions.
 *
 * From CENTERCAMP-PERSONAL-JOURNAL, "The Story of Compression Tracking":
 * "Mastery is measurable as step count reduction." Similarly, drift is measurable
 * as consecutive hash mismatches. The number doesn't lie.
 *
 * CONSECUTIVE MISMATCH TRACKING
 * ------------------------------
 * DriftMonitor counts consecutive mismatches per operationId. When a match occurs,
 * the counter resets to 0. When mismatches accumulate to >= sensitivity, demotion is triggered.
 *
 * Why consecutive? Because occasional mismatches may be transient:
 * - Network flakiness in git-hash measurements
 * - Test suite non-determinism (legitimate variance)
 * - File system cache effects
 *
 * Consecutive mismatches indicate a sustained change, not transient noise.
 * Sensitivity (default: configurable) controls how many mismatches before demotion.
 *
 * PERSISTENCE ACROSS SESSIONS
 * ----------------------------
 * In-memory counters reset on process restart. DriftMonitor uses lazy initialization
 * (ensureInitialized()) to restore counter state from PatternStore 'feedback' on
 * the first check() call.
 *
 * DriftEvent records are stored alongside FeedbackBridge entries in the 'feedback'
 * category. Each DriftEvent includes the consecutive mismatch count at the time of
 * recording. On startup, the latest count per operationId is restored.
 *
 * This persistence ensures:
 * - A mismatch before shutdown + 2 mismatches after restart = 3 consecutive mismatches
 * - Session boundaries don't reset drift tracking artificially
 * - The sensitivity threshold applies across multiple sessions
 *
 * LAZY INITIALIZATION
 * -------------------
 * ensureInitialized() is called at the start of every check(). This pattern
 * avoids initialization overhead when DriftMonitor is constructed but never used.
 * The initialized flag prevents repeated disk reads.
 *
 * DISABLE/ENABLE TOGGLE
 * ---------------------
 * When config.enabled is false, check() returns immediately with demoted=false.
 * This allows drift monitoring to be disabled during testing or initial deployment
 * without requiring code changes.
 *
 * STORAGE CATEGORY
 * ----------------
 * DriftEvents are stored in the 'feedback' category alongside FeedbackBridge entries.
 * They are distinguished by having the consecutiveMismatches field — FeedbackBridge
 * entries don't have this field.
 *
 * The shared category is intentional: both FeedbackBridge and DriftMonitor represent
 * feedback about execution outcomes. Using separate categories would split related
 * data without benefit.
 *
 * SATISFIES
 * ---------
 * FEED-01: Variance monitoring of promoted script execution results
 * FEED-02: Automatic demotion when sensitivity threshold is reached
 * FEED-03: Configurable sensitivity (number of consecutive mismatches before demotion)
 *
 * @see FeedbackBridge (feedback-bridge.ts) — writes to the same 'feedback' category
 * @see ScriptGenerator (script-generator.ts) — produces the scripts being monitored
 * @see DemotionDecision, DriftEvent (core/types/observation.ts) — data structures
 * @see DEFAULT_DRIFT_MONITOR_CONFIG — default sensitivity and enabled flag
 */

import { PatternStore } from '../../core/storage/pattern-store.js';
import type {
  DriftMonitorConfig,
  DriftEvent,
  DemotionDecision,
} from '../../core/types/observation.js';
import { DEFAULT_DRIFT_MONITOR_CONFIG } from '../../core/types/observation.js';

/**
 * Monitors post-promotion script execution results for output drift.
 *
 * Compares actual output hashes against expected hashes from observations.
 * When consecutive mismatches reach the configured sensitivity threshold,
 * returns a DemotionDecision indicating the promoted script should be
 * demoted back to skill-level operation.
 *
 * Drift events are persisted to PatternStore's 'feedback' category so
 * consecutive mismatch state survives across sessions.
 *
 * Satisfies: FEED-01 (variance monitoring), FEED-02 (automatic demotion),
 * FEED-03 (configurable sensitivity).
 */
export class DriftMonitor {
  private store: PatternStore;
  private config: DriftMonitorConfig;
  /** In-memory mismatch counters. Key: operationId. Value: consecutive mismatch count. */
  private counters: Map<string, number> = new Map();
  /** In-memory event history. Key: operationId. Value: all drift events for this operation. */
  private eventHistory: Map<string, DriftEvent[]> = new Map();
  /** True once ensureInitialized() has run — prevents repeated disk reads. */
  private initialized: boolean = false;

  constructor(
    store: PatternStore,
    config: DriftMonitorConfig = DEFAULT_DRIFT_MONITOR_CONFIG,
  ) {
    this.store = store;
    this.config = config;
  }

  /**
   * Lazy initialization: reads existing feedback entries from PatternStore
   * to restore consecutive mismatch state from prior sessions.
   *
   * Only DriftEvent records (those with consecutiveMismatches field) are processed.
   * FeedbackBridge records share the 'feedback' category but lack this field.
   *
   * For each operationId, the latest consecutive count is restored.
   * This ensures cross-session drift tracking works correctly.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const entries = await this.store.read('feedback');
    for (const entry of entries) {
      const event = entry.data as unknown as DriftEvent;
      // Only process DriftEvent records — FeedbackBridge records don't have consecutiveMismatches
      if (!event.operationId || typeof event.consecutiveMismatches !== 'number') continue;

      // Update counter to the latest consecutive value for each operation
      // Later entries overwrite earlier ones — most recent state wins
      this.counters.set(event.operationId, event.consecutiveMismatches);

      // Build event history for getHistory() queries
      const history = this.eventHistory.get(event.operationId) ?? [];
      history.push(event);
      this.eventHistory.set(event.operationId, history);
    }
  }

  /**
   * Check an execution result against the expected output hash.
   *
   * Compares actualHash vs expectedHash, updates the consecutive mismatch
   * counter for the given operationId, persists the drift event to
   * PatternStore, and returns a DemotionDecision.
   *
   * On match: consecutive counter resets to 0 (clean slate).
   * On mismatch: consecutive counter increments by 1.
   * When consecutive >= sensitivity: demoted = true.
   *
   * The reason field in DemotionDecision explains the outcome in plain text,
   * suitable for logging or user notification.
   *
   * @param operationId - Operation ID of the promoted script
   * @param actualHash - SHA-256 hash of the actual execution output
   * @param expectedHash - SHA-256 hash of the expected output from observations
   * @returns DemotionDecision indicating whether demotion is triggered
   */
  async check(
    operationId: string,
    actualHash: string,
    expectedHash: string,
  ): Promise<DemotionDecision> {
    // Short-circuit when monitoring is disabled — no-op demotion
    if (!this.config.enabled) {
      return {
        operationId,
        demoted: false,
        reason: 'Drift monitoring is disabled',
        consecutiveMismatches: 0,
        events: [],
      };
    }

    // Restore cross-session state on first check
    await this.ensureInitialized();

    const matched = actualHash === expectedHash;

    // Update consecutive counter: reset on match, increment on mismatch
    const previousCount = this.counters.get(operationId) ?? 0;
    const consecutiveMismatches = matched ? 0 : previousCount + 1;
    this.counters.set(operationId, consecutiveMismatches);

    // Build drift event for storage and history
    const event: DriftEvent = {
      operationId,
      timestamp: new Date().toISOString(),
      matched,
      actualHash,
      expectedHash,
      consecutiveMismatches,
    };

    // Update in-memory event history
    const history = this.eventHistory.get(operationId) ?? [];
    history.push(event);
    this.eventHistory.set(operationId, history);

    // Persist drift event to PatternStore feedback category
    // This ensures consecutive state survives process restarts
    await this.store.append('feedback', {
      operationId: event.operationId,
      timestamp: event.timestamp,
      matched: event.matched,
      actualHash: event.actualHash,
      expectedHash: event.expectedHash,
      consecutiveMismatches: event.consecutiveMismatches,
    });

    // Demotion decision: consecutive >= sensitivity triggers demotion
    const demoted = consecutiveMismatches >= this.config.sensitivity;

    // Plain-text reason for logging and debugging
    let reason: string;
    if (matched) {
      reason = 'Output matched expected hash, consecutive mismatches reset to 0';
    } else if (demoted) {
      reason = `Consecutive mismatches (${consecutiveMismatches}) reached sensitivity threshold (${this.config.sensitivity}), demotion triggered`;
    } else {
      reason = `Output mismatch (${consecutiveMismatches}/${this.config.sensitivity} consecutive), below demotion threshold`;
    }

    return {
      operationId,
      demoted,
      reason,
      consecutiveMismatches,
      // Events filtered to this operationId — complete history for caller
      events: history.filter(e => e.operationId === operationId),
    };
  }
}

export { DEFAULT_DRIFT_MONITOR_CONFIG };

import { PatternStore } from '../storage/pattern-store.js';
import type {
  DriftMonitorConfig,
  DriftEvent,
  DemotionDecision,
} from '../types/observation.js';
import { DEFAULT_DRIFT_MONITOR_CONFIG } from '../types/observation.js';

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
  private counters: Map<string, number> = new Map();
  private eventHistory: Map<string, DriftEvent[]> = new Map();
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
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const entries = await this.store.read('feedback');
    for (const entry of entries) {
      const event = entry.data as unknown as DriftEvent;
      if (!event.operationId || typeof event.consecutiveMismatches !== 'number') continue;

      // Update counter to the latest consecutive value for each operation
      this.counters.set(event.operationId, event.consecutiveMismatches);

      // Build event history
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
    if (!this.config.enabled) {
      return {
        operationId,
        demoted: false,
        reason: 'Drift monitoring is disabled',
        consecutiveMismatches: 0,
        events: [],
      };
    }

    await this.ensureInitialized();

    const matched = actualHash === expectedHash;

    const previousCount = this.counters.get(operationId) ?? 0;
    const consecutiveMismatches = matched ? 0 : previousCount + 1;
    this.counters.set(operationId, consecutiveMismatches);

    const event: DriftEvent = {
      operationId,
      timestamp: new Date().toISOString(),
      matched,
      actualHash,
      expectedHash,
      consecutiveMismatches,
    };

    // Store event history in memory
    const history = this.eventHistory.get(operationId) ?? [];
    history.push(event);
    this.eventHistory.set(operationId, history);

    // Persist drift event to PatternStore feedback category
    await this.store.append('feedback', {
      operationId: event.operationId,
      timestamp: event.timestamp,
      matched: event.matched,
      actualHash: event.actualHash,
      expectedHash: event.expectedHash,
      consecutiveMismatches: event.consecutiveMismatches,
    });

    const demoted = consecutiveMismatches >= this.config.sensitivity;

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
      events: history.filter(e => e.operationId === operationId),
    };
  }
}

export { DEFAULT_DRIFT_MONITOR_CONFIG };

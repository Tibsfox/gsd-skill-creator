/**
 * Deployment observation pipeline: pattern capture and promotion detection.
 *
 * The DeploymentObserver is a pure in-memory observer fed by the deployment
 * crew's observation loop. It detects recurring deployment action sequences
 * and identifies patterns that are reliable enough to become reusable skills.
 *
 * No file I/O. Events are recorded via recordEvent(), patterns are detected
 * via detectPatterns(), and promotion candidates are identified via
 * identifyPromotionCandidates(). The skill-creator pipeline consumes the
 * promotion candidates.
 *
 * INTEG-04: observation pipeline for deployment pattern capture.
 *
 * @module cloud-ops/observation/deployment-observer
 */

import type {
  DeploymentAction,
  DeploymentEvent,
  DeploymentPattern,
  PromotionCandidate,
  DeploymentObserverConfig,
} from './types.js';
import { DEFAULT_DEPLOYMENT_OBSERVER_CONFIG } from './types.js';

/**
 * In-memory deployment observer that captures events, detects patterns, and
 * identifies promotion candidates based on configurable thresholds.
 *
 * Pattern detection algorithm:
 * 1. Group events by service (all events with the same service name together)
 * 2. For each service group, find repeating action sub-sequences of any length
 * 3. Count non-overlapping occurrences of each candidate sub-sequence
 * 4. Aggregate stats (avg duration per sub-sequence window, success rate, timestamps)
 * 5. Return patterns meeting minOccurrences threshold
 *
 * Promotion confidence formula: min((occurrences / 10) * successRate, 1.0)
 */
export class DeploymentObserver {
  private readonly config: DeploymentObserverConfig;
  private eventLog: DeploymentEvent[];

  constructor(config: Partial<DeploymentObserverConfig> = {}) {
    this.config = { ...DEFAULT_DEPLOYMENT_OBSERVER_CONFIG, ...config };
    this.eventLog = [];
  }

  // -------------------------------------------------------------------------
  // Event recording
  // -------------------------------------------------------------------------

  /**
   * Append a deployment event to the internal event log.
   *
   * Events are appended in the order they are recorded. The observer does not
   * validate event timestamps against wall clock time -- callers are responsible
   * for providing accurate timestamps.
   *
   * @param event - The deployment event to record.
   */
  recordEvent(event: DeploymentEvent): void {
    this.eventLog.push({ ...event });
  }

  /**
   * Return a read-only copy of the event log.
   *
   * The returned array is a shallow copy -- modifying it does not affect the
   * observer's internal state.
   */
  getEventLog(): readonly DeploymentEvent[] {
    return [...this.eventLog];
  }

  /**
   * Clear all recorded events from the event log.
   *
   * Resets the observer to its initial state. Useful for testing or when
   * starting a new deployment session.
   */
  clearEventLog(): void {
    this.eventLog = [];
  }

  // -------------------------------------------------------------------------
  // Pattern detection
  // -------------------------------------------------------------------------

  /**
   * Scan the event log for recurring action sequences.
   *
   * Groups events by service, then identifies repeating sub-sequences within
   * each service's event stream. For each candidate sub-sequence length W,
   * counts non-overlapping occurrences of that exact action pattern.
   *
   * Returns patterns that have been observed at least `config.minOccurrences`
   * times, sorted by occurrence count descending.
   *
   * @returns Array of detected patterns, sorted by occurrence count descending.
   */
  detectPatterns(): DeploymentPattern[] {
    if (this.eventLog.length === 0) return [];

    // Group events by service
    const serviceGroups = new Map<string, DeploymentEvent[]>();
    for (const event of this.eventLog) {
      if (!serviceGroups.has(event.service)) {
        serviceGroups.set(event.service, []);
      }
      serviceGroups.get(event.service)!.push(event);
    }

    // Collect all candidate patterns across all services
    // Key: canonical sequence key ("action1:action2:...")
    const patternMap = new Map<string, {
      sequence: DeploymentAction[];
      services: Set<string>;
      occurrences: number;
      totalDurationMs: number;
      successCount: number;
      timestamps: string[];
    }>();

    for (const [service, events] of serviceGroups) {
      const serviceCandidates = this.findRepeatingSubsequences(events);

      for (const candidate of serviceCandidates) {
        const key = candidate.sequence.join(':');
        if (!patternMap.has(key)) {
          patternMap.set(key, {
            sequence: candidate.sequence,
            services: new Set(),
            occurrences: 0,
            totalDurationMs: 0,
            successCount: 0,
            timestamps: [],
          });
        }

        const entry = patternMap.get(key)!;
        entry.services.add(service);
        entry.occurrences += candidate.occurrences;
        entry.totalDurationMs += candidate.totalDurationMs;
        entry.successCount += candidate.successCount;
        entry.timestamps.push(...candidate.timestamps);
      }
    }

    // Build pattern objects, filtering by minOccurrences
    const patterns: DeploymentPattern[] = [];

    for (const [_key, entry] of patternMap) {
      if (entry.occurrences < this.config.minOccurrences) continue;

      const avgDurationMs = entry.occurrences > 0
        ? Math.round(entry.totalDurationMs / entry.occurrences)
        : 0;

      const successRate = entry.occurrences > 0
        ? entry.successCount / entry.occurrences
        : 0;

      const sortedTimestamps = [...entry.timestamps].sort();
      const firstSeen = sortedTimestamps[0] ?? '';
      const lastSeen = sortedTimestamps[sortedTimestamps.length - 1] ?? '';

      patterns.push({
        sequence: entry.sequence,
        services: [...entry.services].sort(),
        occurrences: entry.occurrences,
        avgDurationMs,
        successRate,
        firstSeen,
        lastSeen,
      });
    }

    // Sort by occurrence count descending
    patterns.sort((a, b) => b.occurrences - a.occurrences);

    return patterns;
  }

  // -------------------------------------------------------------------------
  // Promotion candidate identification
  // -------------------------------------------------------------------------

  /**
   * Identify deployment patterns that are candidates for skill promotion.
   *
   * Runs detectPatterns() and applies additional filtering:
   * 1. Pattern successRate must be >= config.minSuccessRate
   * 2. Computed confidence must be >= config.promotionThreshold
   *
   * Confidence formula: min((occurrences / 10) * successRate, 1.0)
   *
   * The suggested skill name is derived from the pattern's services:
   * `deploy-{services.join('-')}-sequence`
   *
   * @returns Array of promotion candidates sorted by confidence descending.
   */
  identifyPromotionCandidates(): PromotionCandidate[] {
    const patterns = this.detectPatterns();
    const candidates: PromotionCandidate[] = [];

    for (const pattern of patterns) {
      // Filter by success rate threshold
      if (pattern.successRate < this.config.minSuccessRate) continue;

      // Compute confidence score
      const confidence = Math.min((pattern.occurrences / 10) * pattern.successRate, 1.0);

      // Filter by promotion threshold
      if (confidence < this.config.promotionThreshold) continue;

      // Build reason string
      const reason = [
        `Observed ${pattern.occurrences} times`,
        `${Math.round(pattern.successRate * 100)}% success rate`,
        `sequence: ${pattern.sequence.join(' → ')}`,
      ].join(', ');

      // Suggest skill name from services
      const suggestedSkillName = `deploy-${pattern.services.join('-')}-sequence`;

      candidates.push({
        pattern,
        confidence,
        reason,
        suggestedSkillName,
      });
    }

    // Sort by confidence descending (highest confidence first)
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  // -------------------------------------------------------------------------
  // Statistics
  // -------------------------------------------------------------------------

  /**
   * Return summary statistics about the current observer state.
   *
   * @returns Object with totalEvents, uniquePatterns, and promotionCandidates counts.
   */
  getStats(): { totalEvents: number; uniquePatterns: number; promotionCandidates: number } {
    const patterns = this.detectPatterns();
    const candidates = this.identifyPromotionCandidates();

    return {
      totalEvents: this.eventLog.length,
      uniquePatterns: patterns.length,
      promotionCandidates: candidates.length,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Find repeating action sub-sequences within a single service's event stream.
   *
   * For each candidate window size W (from 1 to floor(events.length / 2)),
   * checks whether the first W events repeat consecutively in the stream.
   * Counts non-overlapping occurrences by scanning left-to-right and
   * advancing by W on each match.
   *
   * Returns the best candidate per window size (the one with the most
   * non-overlapping occurrences). Shorter window sizes are preferred when
   * occurrence counts are equal.
   *
   * @param events - All events for a single service, in recording order.
   * @returns Array of candidate patterns with occurrence stats.
   */
  private findRepeatingSubsequences(events: DeploymentEvent[]): Array<{
    sequence: DeploymentAction[];
    occurrences: number;
    totalDurationMs: number;
    successCount: number;
    timestamps: string[];
  }> {
    if (events.length === 0) return [];

    const candidates: Array<{
      sequence: DeploymentAction[];
      occurrences: number;
      totalDurationMs: number;
      successCount: number;
      timestamps: string[];
    }> = [];

    const maxWindowSize = Math.floor(events.length / 2);

    for (let w = 1; w <= maxWindowSize; w++) {
      const window = events.slice(0, w);
      const windowActions = window.map(e => e.action);
      const windowKey = windowActions.join(':');

      // Count non-overlapping occurrences starting from position 0
      let occurrences = 0;
      let totalDurationMs = 0;
      let successCount = 0;
      const timestamps: string[] = [];
      let i = 0;

      while (i + w <= events.length) {
        const slice = events.slice(i, i + w);
        const sliceKey = slice.map(e => e.action).join(':');

        if (sliceKey === windowKey) {
          // This slice matches the window pattern
          occurrences++;
          totalDurationMs += slice.reduce((sum, e) => sum + e.durationMs, 0);
          // Sequence succeeds if all events in the window succeeded
          const allSucceeded = slice.every(e => e.success);
          if (allSucceeded) successCount++;
          timestamps.push(slice[0]!.timestamp, slice[w - 1]!.timestamp);
          i += w; // advance past this occurrence (non-overlapping)
        } else {
          break; // consecutive occurrences only -- stop on first mismatch
        }
      }

      if (occurrences >= 2) {
        candidates.push({
          sequence: windowActions as DeploymentAction[],
          occurrences,
          totalDurationMs,
          successCount,
          timestamps,
        });
      }
    }

    return candidates;
  }
}

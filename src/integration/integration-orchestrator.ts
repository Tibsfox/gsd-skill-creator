/**
 * Wires HealthEventWriter, StagingHealthGate, and PatternLearner.
 *
 * Provides a unified integration API:
 *   logEvent()      — INTG-01, INTG-03: append-only health log with provenance
 *   checkGate()     — INTG-02: staging health gate (synchronous, pure)
 *   getAllPatterns() — INTG-04: cross-project pattern detection
 *   getWarning()    — INTG-04: pre-emptive warning for a specific package
 */

import { writeEvent, readEvents } from './health-event-writer.js';
import { checkHealthGate } from './staging-health-gate.js';
import { detectPatterns, getPackageWarning } from './pattern-learner.js';
import type {
  HealthEvent,
  HealthGateResult,
  PatternMatch,
  IntegrationConfig,
} from './types.js';
import type { WriteEventInput } from './health-event-writer.js';
import type { GateCheckInput } from './staging-health-gate.js';

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export class IntegrationOrchestrator {
  private readonly healthLogPath: string;
  private readonly patternThreshold: number;

  constructor(config: IntegrationConfig) {
    this.healthLogPath = config.healthLogPath;
    this.patternThreshold = config.patternThreshold ?? 5;
  }

  /**
   * Logs a health event to health.jsonl.
   * Returns the written HealthEvent (with generated id and timestamp).
   * INTG-01: append-only. INTG-03: timestamp + packageVersion + decisionRationale.
   */
  logEvent(input: WriteEventInput): Promise<HealthEvent> {
    return writeEvent(this.healthLogPath, input);
  }

  /**
   * Evaluates the staging health gate.
   * Synchronous — receives pre-computed data from the caller.
   * INTG-02: blocks on dry-run failure or abandoned/vulnerable critical-path dep.
   */
  checkGate(input: GateCheckInput): HealthGateResult {
    return checkHealthGate(input);
  }

  /**
   * Returns all pattern matches from all logged events.
   * Reads events fresh on each call — no caching.
   * INTG-04.
   */
  async getAllPatterns(): Promise<PatternMatch[]> {
    const events = await readEvents(this.healthLogPath);
    return detectPatterns(events, this.patternThreshold);
  }

  /**
   * Returns the pre-emptive warning for a specific package if its failure
   * pattern has been seen in >= patternThreshold projects.
   * Returns null when no pattern is found.
   * Reads events fresh on each call. INTG-04.
   */
  async getWarning(packageName: string): Promise<PatternMatch | null> {
    const events = await readEvents(this.healthLogPath);
    return getPackageWarning(events, packageName, this.patternThreshold);
  }
}

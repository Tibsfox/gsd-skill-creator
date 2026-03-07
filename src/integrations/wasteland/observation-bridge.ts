/**
 * observation-bridge.ts — Phase 3: Observation Layer Adapters
 *
 * Five adapters connecting the core observation layer to wasteland federation:
 *
 * R3.1: DoltHubPatternAdapter — wraps PatternStore for wasteland categories
 * R3.2: TrustScorer — adapts PromotionEvaluator's 5-factor model for rig trust
 * R3.3: StampGatekeeper — adapts PromotionGatekeeper's 6-gate model for stamps
 * R3.4: ValidationLineage — adapts LineageTracker for completion→stamp→escalation
 * R3.5: TrustDriftMonitor — adapts DriftMonitor for trust level behavioral drift
 *
 * These are thin adapters, not rewrites. Each translates wasteland signals into
 * the format the core observation module expects, then delegates.
 *
 * @module observation-bridge
 */

import { PatternStore } from '../../core/storage/pattern-store.js';
import { PromotionEvaluator } from '../../platform/observation/promotion-evaluator.js';
import type { PromotionResult, EvaluationContext } from '../../platform/observation/promotion-evaluator.js';
import { PromotionGatekeeper } from '../../platform/observation/promotion-gatekeeper.js';
import type { GatekeeperConfig, GatekeeperDecision } from '../../core/types/observation.js';
import { LineageTracker } from '../../platform/observation/lineage-tracker.js';
import type { LineageEntry, ArtifactType } from '../../core/types/observation.js';
import { DriftMonitor } from '../../platform/observation/drift-monitor.js';
import type { DemotionDecision } from '../../core/types/observation.js';

// ============================================================================
// R3.1: DoltHub Pattern Adapter
// ============================================================================

/**
 * DoltHubPatternAdapter — wraps PatternStore with wasteland-specific
 * write/read operations for rig activity, trust events, and scan results.
 *
 * Uses source-tagged entries to coexist with core observation data.
 */
export class DoltHubPatternAdapter {
  private store: PatternStore;

  constructor(store: PatternStore) {
    this.store = store;
  }

  /** Record a rig activity event (task claimed, completed, stamp issued). */
  async recordRigActivity(activity: {
    handle: string;
    action: string;
    wantedId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.store.append('events', {
      source: 'wasteland',
      kind: 'rig-activity',
      handle: activity.handle,
      action: activity.action,
      wantedId: activity.wantedId,
      ...activity.metadata,
    });
  }

  /** Record a trust level change. */
  async recordTrustChange(change: {
    handle: string;
    fromLevel: number;
    toLevel: number;
    reason: string;
  }): Promise<void> {
    await this.store.append('events', {
      source: 'wasteland',
      kind: 'trust-change',
      handle: change.handle,
      fromLevel: change.fromLevel,
      toLevel: change.toLevel,
      reason: change.reason,
    });
  }

  /** Record a scan cycle result. */
  async recordScanResult(result: {
    rigCount: number;
    eventCount: number;
    durationMs: number;
    source: string;
  }): Promise<void> {
    await this.store.append('events', {
      source: 'wasteland',
      kind: 'scan-result',
      rigCount: result.rigCount,
      eventCount: result.eventCount,
      durationMs: result.durationMs,
      scanSource: result.source,
    });
  }

  /** Read all rig activity events. */
  async readRigActivities(): Promise<Array<{ handle: string; action: string; wantedId?: string }>> {
    const patterns = await this.store.read('events');
    return patterns
      .filter(p => p.data['source'] === 'wasteland' && p.data['kind'] === 'rig-activity')
      .map(p => ({
        handle: String(p.data['handle'] ?? ''),
        action: String(p.data['action'] ?? ''),
        wantedId: p.data['wantedId'] ? String(p.data['wantedId']) : undefined,
      }));
  }

  /** Read trust change history for a rig. */
  async readTrustHistory(handle?: string): Promise<Array<{ handle: string; fromLevel: number; toLevel: number; reason: string }>> {
    const patterns = await this.store.read('events');
    return patterns
      .filter(p =>
        p.data['source'] === 'wasteland' &&
        p.data['kind'] === 'trust-change' &&
        (!handle || p.data['handle'] === handle)
      )
      .map(p => ({
        handle: String(p.data['handle'] ?? ''),
        fromLevel: Number(p.data['fromLevel'] ?? 0),
        toLevel: Number(p.data['toLevel'] ?? 0),
        reason: String(p.data['reason'] ?? ''),
      }));
  }

  /** Get the underlying PatternStore for direct access. */
  getStore(): PatternStore {
    return this.store;
  }
}

// ============================================================================
// R3.2: Trust Scorer (PromotionEvaluator adapter)
// ============================================================================

/**
 * Input signals for trust scoring — translates rig activity into the
 * 5-factor weighted model used by PromotionEvaluator.
 */
export interface TrustSignals {
  completionCount: number;
  stampCount: number;
  avgValence: number;        // 0-1 scale
  daysSinceFirstCompletion: number;
  activeDays: number;
  crossRigEndorsements: number;
}

/**
 * TrustScorer — adapts PromotionEvaluator's weighted scoring model for
 * rig trust evaluation. Maps wasteland signals to the 5-factor framework:
 *
 *   Factor 1 (Tool Calls → Completions): Has the rig done real work?
 *   Factor 2 (Duration → Tenure): How long has the rig been active?
 *   Factor 3 (File Activity → Stamps): Has the rig received feedback?
 *   Factor 4 (User Engagement → Endorsements): Do other rigs trust them?
 *   Factor 5 (Rich Metadata → Quality): Is the work high quality?
 *
 * This is NOT a direct type mapping — it's a conceptual mapping. The
 * evaluator doesn't know about rigs. We construct a synthetic
 * SessionObservation that encodes rig signals into the evaluator's
 * expected shape.
 */
export class TrustScorer {
  private evaluator: PromotionEvaluator;

  constructor(minScore: number = 0.3) {
    this.evaluator = new PromotionEvaluator(minScore);
  }

  /**
   * Evaluate a rig's trust worthiness using the 5-factor model.
   *
   * Returns a PromotionResult with:
   * - promote: whether the rig meets minimum trust threshold
   * - score: composite trust score (0-1)
   * - reasons: human-readable breakdown of scoring factors
   */
  evaluate(signals: TrustSignals, context?: EvaluationContext): PromotionResult {
    // Construct synthetic SessionObservation from rig signals
    const syntheticObs = {
      sessionId: 'trust-eval',
      startTime: 0,
      endTime: 0,
      durationMinutes: signals.daysSinceFirstCompletion >= 30 ? 10 : signals.daysSinceFirstCompletion >= 7 ? 3 : 0,
      source: 'startup' as const,
      reason: 'other' as const,
      metrics: {
        userMessages: signals.crossRigEndorsements >= 3 ? 5 : signals.crossRigEndorsements,
        assistantMessages: 0,
        toolCalls: signals.completionCount,
        uniqueFilesRead: signals.stampCount,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
      topCommands: signals.avgValence >= 0.7 ? ['high-quality'] : [],
      topFiles: signals.activeDays >= 5 ? ['active'] : [],
      topTools: signals.completionCount >= 3 ? ['experienced'] : [],
      activeSkills: [],
      squashedFrom: signals.crossRigEndorsements,
    };

    return this.evaluator.evaluate(syntheticObs, context);
  }
}

// ============================================================================
// R3.3: Stamp Gatekeeper (PromotionGatekeeper adapter)
// ============================================================================

/**
 * Stamp quality signals for gate evaluation.
 */
export interface StampQualitySignals {
  evidenceQuality: number;   // 0-1: how well-documented is the completion
  valenceScore: number;      // 0-1: aggregate stamp valence
  completionCount: number;   // total completions by this rig
  f1Score?: number;          // optional: from automated testing
  accuracy?: number;         // optional: from review feedback
}

/**
 * StampGatekeeper — adapts PromotionGatekeeper's 6-gate model for stamp
 * validation. Maps stamp quality signals to the gatekeeper's thresholds:
 *
 *   Gate 1 (Determinism → Evidence Quality): Is the evidence clear?
 *   Gate 2 (Confidence → Valence Score): Do stamps support quality?
 *   Gate 3 (Observations → Completions): Enough track record?
 *   Gates 4-6 (F1/Accuracy/MCC): Optional calibration metrics
 */
export class StampGatekeeper {
  private gatekeeper: PromotionGatekeeper;

  constructor(config?: Partial<GatekeeperConfig>, store?: PatternStore) {
    const fullConfig: GatekeeperConfig = {
      minDeterminism: config?.minDeterminism ?? 0.7,  // Lower than core — evidence is subjective
      minConfidence: config?.minConfidence ?? 0.6,
      minObservations: config?.minObservations ?? 3,
      minF1: config?.minF1,
      minAccuracy: config?.minAccuracy,
      minMCC: config?.minMCC,
    };
    this.gatekeeper = new PromotionGatekeeper(fullConfig, store);
  }

  /**
   * Evaluate stamp quality through the gate model.
   * Returns a GatekeeperDecision with approved/rejected + full reasoning.
   */
  async evaluate(signals: StampQualitySignals): Promise<GatekeeperDecision> {
    // Construct a synthetic PromotionCandidate from stamp signals
    const syntheticCandidate = {
      operation: {
        score: {
          operation: { toolName: 'stamp-validation', inputHash: 'wasteland' },
          varianceScore: 1 - signals.evidenceQuality,
          observationCount: signals.completionCount,
          uniqueOutputs: 1,
          sessionIds: [],
        },
        classification: 'deterministic' as const,
        determinism: signals.evidenceQuality,
      },
      toolName: 'stamp-validation',
      frequency: signals.completionCount,
      estimatedTokenSavings: 0,
      compositeScore: signals.valenceScore,
      meetsConfidence: signals.valenceScore >= 0.6,
    };

    // Build optional benchmark report from signals
    const report = (signals.f1Score !== undefined || signals.accuracy !== undefined)
      ? {
          metrics: {
            f1Score: signals.f1Score ?? 0,
            accuracy: signals.accuracy ?? 0,
            truePositives: 0,
            trueNegatives: 0,
            falsePositives: 0,
            falseNegatives: 0,
          },
          toolName: 'stamp-validation',
          totalSamples: signals.completionCount,
          timestamp: new Date().toISOString(),
        }
      : undefined;

    return this.gatekeeper.evaluate(syntheticCandidate, report);
  }
}

// ============================================================================
// R3.4: Validation Lineage (LineageTracker adapter)
// ============================================================================

/**
 * ValidationLineage — adapts LineageTracker for wasteland's validation chain:
 * completion → stamp → trust escalation.
 *
 * Each stage of the wasteland trust pipeline produces artifacts that can
 * be traced upstream (what evidence produced this stamp?) and downstream
 * (what trust changes did this completion enable?).
 */
export class ValidationLineage {
  private tracker: LineageTracker;

  constructor(store: PatternStore) {
    this.tracker = new LineageTracker(store);
  }

  /** Record a completion as a lineage artifact. */
  async recordCompletion(completionId: string, wantedId: string, handle: string): Promise<void> {
    const entry: LineageEntry = {
      artifactId: completionId,
      artifactType: 'observation' as ArtifactType,
      stage: 'completion-submit',
      inputs: [wantedId],
      outputs: [],
      metadata: { handle, wantedId },
      timestamp: new Date().toISOString(),
    };
    await this.tracker.record(entry);
  }

  /** Record a stamp linking to its completion. */
  async recordStamp(stampId: string, completionId: string, author: string): Promise<void> {
    const entry: LineageEntry = {
      artifactId: stampId,
      artifactType: 'pattern' as ArtifactType,
      stage: 'stamp-validation',
      inputs: [completionId],
      outputs: [],
      metadata: { author },
      timestamp: new Date().toISOString(),
    };
    await this.tracker.record(entry);
  }

  /** Record a trust escalation linking to the stamps that triggered it. */
  async recordEscalation(
    escalationId: string,
    handle: string,
    fromLevel: number,
    toLevel: number,
    triggeringStampIds: string[],
  ): Promise<void> {
    const entry: LineageEntry = {
      artifactId: escalationId,
      artifactType: 'decision' as ArtifactType,
      stage: 'trust-escalation',
      inputs: triggeringStampIds,
      outputs: [],
      metadata: { handle, fromLevel, toLevel },
      timestamp: new Date().toISOString(),
    };
    await this.tracker.record(entry);
  }

  /** Trace the full provenance chain for any artifact. */
  async getChain(artifactId: string) {
    return this.tracker.getChain(artifactId);
  }

  /** Get all completions in the lineage. */
  async getCompletions() {
    return this.tracker.getByArtifactType('observation' as ArtifactType);
  }

  /** Get all stamps in the lineage. */
  async getStamps() {
    return this.tracker.getByArtifactType('pattern' as ArtifactType);
  }

  /** Get all escalation decisions in the lineage. */
  async getEscalations() {
    return this.tracker.getByArtifactType('decision' as ArtifactType);
  }
}

// ============================================================================
// R3.5: Trust Drift Monitor (DriftMonitor adapter)
// ============================================================================

/**
 * TrustDriftMonitor — adapts DriftMonitor for trust level behavioral drift.
 *
 * Instead of monitoring script output hashes, monitors rig behavior hashes.
 * A rig's "expected hash" is derived from their typical behavior pattern.
 * When consecutive mismatches accumulate, trust demotion is triggered.
 *
 * Behavior hashing: a simple fingerprint of recent activity patterns
 * (completion rate, stamp valence, active hours). When the fingerprint
 * drifts from the established baseline, the monitor flags it.
 */
export class TrustDriftMonitor {
  private monitor: DriftMonitor;

  constructor(store: PatternStore, sensitivity: number = 3) {
    this.monitor = new DriftMonitor(store, {
      enabled: true,
      sensitivity,
    });
  }

  /**
   * Check a rig's current behavior against their established baseline.
   *
   * @param handle - Rig handle
   * @param currentHash - Hash of current behavior pattern
   * @param baselineHash - Hash of established behavior pattern
   * @returns DemotionDecision with trust demotion recommendation
   */
  async check(handle: string, currentHash: string, baselineHash: string): Promise<DemotionDecision> {
    return this.monitor.check(`rig:${handle}`, currentHash, baselineHash);
  }
}

/**
 * Compute a behavior fingerprint from rig activity signals.
 * Deterministic: same inputs always produce the same hash.
 */
export function computeBehaviorHash(signals: {
  completionRate: number;
  avgValence: number;
  activeDaysPct: number;
}): string {
  // Quantize to prevent noise from triggering false drift
  const qRate = Math.round(signals.completionRate * 10) / 10;
  const qValence = Math.round(signals.avgValence * 10) / 10;
  const qActive = Math.round(signals.activeDaysPct * 10) / 10;
  return `${qRate}:${qValence}:${qActive}`;
}

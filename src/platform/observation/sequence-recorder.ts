/**
 * sequence-recorder.ts — Signal Intake: Workflow Classification and Arc Tracking
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * The SequenceRecorder listens on the SignalBus for CompletionSignal events,
 * classifies each operation by type (SCOUT, VALIDATE, BUILD, etc.), resolves
 * the agent's cluster membership, predicts failure risks, and persists a
 * structured SequenceRecord to PatternStore 'workflows' category.
 *
 * WHY IT EXISTS
 * -------------
 * After Batch 1 mapped the territory and Batch 2 built the infrastructure,
 * Batch 3's mission was closing the loop: make the system observe its own work.
 * This file is the observer. Every operation an agent completes passes through
 * here as a ClassificationSignal that becomes a permanent, mineable record.
 *
 * The key insight from the CENTERCAMP-PERSONAL-JOURNAL, "The Story of Creator's Arc":
 * "No inference. No pattern mining. Just raw data becoming visible."
 * SequenceRecorder doesn't discover patterns — it makes patterns discoverable.
 *
 * SIGNAL FLOW
 * -----------
 * SignalBus 'completion' event
 *   → classify(signal)           — what kind of operation was this?
 *   → resolveCluster(agent)      — where does this agent live in the topology?
 *   → predictRisks(...)          — what could go wrong with this transition?
 *   → store.append('workflows')  — durable JSONL record written
 *
 * PARALLEL LISTENER ARCHITECTURE
 * --------------------------------
 * This is the key architectural discovery from Batch 3. Both FeedbackBridge and
 * SequenceRecorder call bus.on('completion'). They share the same SignalBus and
 * PatternStore instance — but write to different categories ('feedback' vs 'workflows').
 * No locks. No coordination overhead. Zero interference.
 *
 * Design principle: "Separation of Concerns Over Shared Optimization"
 * (CENTERCAMP-PERSONAL-JOURNAL, Part III, Philosophy 1)
 * FeedbackBridge asks: "Did it work?" SequenceRecorder asks: "What did it do?"
 * Different questions. Different storage. Both answer correctly.
 *
 * THE CLASSIFIER'S HONESTY
 * ------------------------
 * The classify() method uses 8 regex patterns in priority order. When nothing
 * matches, it returns { type: 'BUILD', confidence: 0.3 }.
 *
 * This default is not a failure — it's an admission of ignorance. The classifier
 * is saying: "I don't know what this is, but BUILD is the safest guess at 0.3
 * confidence (below the risk-prediction threshold)."
 *
 * Former quirk (fixed): '/certify|approve|sign/i' matched before '/design|architect/i'
 * because "design" contains "sign". Fixed by reordering DESIGN before CERTIFY and
 * using word boundary \bsign\b. See BATCH-3-RETROSPECTIVE.md, Willow's debrief.
 *
 * Design principle: "Honest Uncertainty Over Confident Wrongness"
 * (CENTERCAMP-PERSONAL-JOURNAL, Part III, Philosophy 2)
 *
 * CLUSTER TOPOLOGY
 * ----------------
 * Three Louvain clusters (Q=0.72) from Batch 1 topology analysis:
 *   'creative-nexus'  — Foxy, Cedar. Exploration, synthesis, creative work.
 *   'bridge-zone'     — Willow, Sam. Translation, connection, coordination.
 *   'rigor-spine'     — Hemlock, Lex. Verification, standards, precise work.
 *
 * Cluster distances are Euclidean distances on the complex plane (validated in
 * BATCH-3-RETROSPECTIVE.md). These distances drive risk prediction: a direct
 * creative-nexus → rigor-spine hop (d=0.972) is the most dangerous transition.
 *
 * COMPRESSION TRACKING
 * --------------------
 * completeArc() records the final step count for each completed workflow arc.
 * arcHistory stores the sequence of step counts per agent over time. When an
 * agent completes the same arc type in fewer steps, ratio < 1.0 — that's
 * measurable learning.
 *
 * From CENTERCAMP-PERSONAL-JOURNAL, "The Story of Compression Tracking":
 * "First run: 8 steps. Second run: 6 steps (ratio 0.75). Third run: 5 steps (ratio 0.625)."
 * Ratio < 1.0 = the agent is learning. This is the signature of skill acquisition.
 *
 * completeArc() is wired at phase boundaries via startPhaseCompleteListener(),
 * which subscribes to 'phase-complete' events on the SignalBus. When a phase
 * completes, all active arcs are finalized and their step counts recorded to
 * arcHistory for compression ratio tracking. Wired in Batch 3 retro item #7.
 *
 * DESIGN DECISIONS
 * ----------------
 * - Target cluster defaults to source cluster (intra-cluster). Cross-cluster targeting
 *   requires richer signal metadata — future iteration.
 * - Agent name is extracted from operationId using ':' convention (e.g., "lex:build-phase-3").
 *   If no ':' found, agent defaults to 'unknown' and maps to bridge-zone.
 * - DEFAULT_CLUSTER_MAP is extensible — add agent names and their cluster assignments.
 *   See BATCH-3-RETROSPECTIVE.md for instructions on extending the map.
 *
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "The Story of Creator's Arc" for why this matters
 * @see BATCH-3-RETROSPECTIVE.md — Willow's and Foxy's debriefs for compression + classifier
 * @see feedback-bridge.ts — The parallel listener this module coexists with
 * @see pattern-analyzer.ts — What reads and analyzes these workflow records
 * @see sequence-recorder-listener.ts — How to wire this into the application
 */

import { SignalBus } from '../../services/chipset/blitter/signals.js';
import type { CompletionSignal } from '../../services/chipset/blitter/types.js';
import { PatternStore } from '../../core/storage/pattern-store.js';

/**
 * The 8 operation types from Foxy's sequence mining (Batch 1).
 * These map to the 8 workflow phases identified in the topology analysis.
 * Confidence values in CLASSIFY_PATTERNS reflect how reliably the regex
 * identifies each type: SCOUT and VALIDATE are clearest (0.9), BUILD is
 * the generic fallback (0.3 when used as default).
 */
export type OperationType =
  | 'SCOUT' | 'GOVERN' | 'PROPOSE' | 'VALIDATE'
  | 'CERTIFY' | 'ANALYZE' | 'DESIGN' | 'BUILD';

/**
 * The 3 Louvain clusters from Sam's topology analysis (Batch 1, Q=0.72).
 * Cluster Q=0.72 is strong modularity — these groups are real, not artificial.
 * See agent-positions.csv and BATCH-1-OUTPUTS for the full topology data.
 */
export type ClusterId = 'creative-nexus' | 'bridge-zone' | 'rigor-spine';

/**
 * Failure risk categories from Hemlock's FMEA-based taxonomy (Batch 1).
 * Each category represents a structurally different failure mode:
 * - capability-gap: agent skills don't match task requirements (cluster distance)
 * - safety-violation: attempt to operate outside permitted scope
 * - unclear-requirements: task spec is ambiguous (low-confidence classification)
 * - dependency-missing: required resource/artifact not found
 * - timeout: operation exceeded time budget
 * - communication-failure: cross-cluster handoff broke down (extreme distance)
 */
export type FailureRisk =
  | 'capability-gap' | 'safety-violation' | 'unclear-requirements'
  | 'dependency-missing' | 'timeout' | 'communication-failure';

/**
 * Single workflow record stored to PatternStore 'workflows' category.
 * This is the core data unit of the observation system — each CompletionSignal
 * becomes one SequenceRecord. 105 records were written in the Phase 2b mini-batch.
 *
 * Key fields for pattern analysis:
 * - sequenceId: groups records into arcs (e.g., "arc-lex")
 * - step: position within the arc (enables sequencing and compression comparison)
 * - compressionNote: comparison against arc baseline (undefined until arc completes twice)
 */
export interface SequenceRecord {
  sequenceId: string;
  step: number;
  operationType: OperationType;
  agent: string;
  clusterSource: ClusterId;
  clusterTarget: ClusterId;
  transitionDistance: number;
  failureRisks: FailureRisk[];
  riskConfidence: number;
  timestamp: number;
  feedbackRef: string;
  compressionNote?: string;
}

/** Configuration surface for SequenceRecorder — override for testing or custom topologies */
export interface SequenceRecorderConfig {
  clusterMap: Record<string, ClusterId>;
  clusterDistances: Record<string, number>;
  capabilityGapThreshold: number;
  communicationFailureThreshold: number;
}

/**
 * Default cluster assignments for the 6 named muses.
 * If an agent name is not in this map, it defaults to 'bridge-zone' — the
 * connecting cluster. This is intentionally conservative: bridge-zone is
 * the safest default (minimal capability-gap risk with either neighbor cluster).
 *
 * Extended with all 15 profiled agents (Batch 3 retro item #6). Assignments
 * match routing-advisor.ts inferClusterFromName(). Extend when adding new agents.
 */
const DEFAULT_CLUSTER_MAP: Record<string, ClusterId> = {
  // Creative Nexus — exploration, synthesis, creative work
  'foxy': 'creative-nexus',
  'cedar': 'creative-nexus',
  // Bridge Zone — translation, connection, coordination
  'willow': 'bridge-zone',
  'sam': 'bridge-zone',
  'gsd-orchestrator': 'bridge-zone',
  'gsd-planner': 'bridge-zone',
  'observer': 'bridge-zone',
  'codebase-navigator': 'bridge-zone',
  'changelog-generator': 'bridge-zone',
  // Rigor Spine — verification, standards, precise work
  'hemlock': 'rigor-spine',
  'lex': 'rigor-spine',
  'gsd-executor': 'rigor-spine',
  'gsd-verifier': 'rigor-spine',
  'photon': 'rigor-spine',
  'doc-linter': 'rigor-spine',
};

/**
 * Inter-cluster distances from the complex plane geometry.
 * These are Euclidean distances derived from polar coordinates (Batch 1).
 * The asymmetry is intentional: creative → rigor and rigor → creative both
 * have d=0.972 (the full diagonal), which is above the communication-failure
 * threshold of 0.9, triggering the most severe risk flag.
 *
 * Threshold interpretation:
 * - d >= 0.9 (communicationFailureThreshold): direct mediation needed
 * - d >= 0.5 (capabilityGapThreshold): capability gap warning
 * - d < 0.5: smooth transition, no special handling
 */
const DEFAULT_CLUSTER_DISTANCES: Record<string, number> = {
  'creative-nexus->creative-nexus': 0.0,
  'bridge-zone->bridge-zone': 0.0,
  'rigor-spine->rigor-spine': 0.0,
  'creative-nexus->bridge-zone': 0.410,
  'bridge-zone->creative-nexus': 0.410,
  'bridge-zone->rigor-spine': 0.570,
  'rigor-spine->bridge-zone': 0.570,
  'creative-nexus->rigor-spine': 0.972,
  'rigor-spine->creative-nexus': 0.972,
};

/** Default configuration — use as-is for the standard 6-muse topology */
export const DEFAULT_RECORDER_CONFIG: SequenceRecorderConfig = {
  clusterMap: DEFAULT_CLUSTER_MAP,
  clusterDistances: DEFAULT_CLUSTER_DISTANCES,
  capabilityGapThreshold: 0.5,
  communicationFailureThreshold: 0.9,
};

/**
 * Operation classification patterns in priority order.
 * Each entry: [regex, OperationType, confidence].
 *
 * ORDERING: More specific patterns before more generic ones. The classifier
 * iterates in order and returns on first match. DESIGN is checked before
 * CERTIFY because "design" contains "sign" — word boundaries on "sign"
 * prevent the substring false-match (fixed in Batch 3 retro item #4).
 *
 * Confidence values reflect classification certainty:
 * - 0.9: unambiguous keywords (scout, validate)
 * - 0.8: common but slightly polysemous (certify, analyze)
 * - 0.7: context-dependent (design, build)
 * - 0.3: default BUILD when nothing matches (explicit uncertainty signal)
 */
const CLASSIFY_PATTERNS: [RegExp, OperationType, number][] = [
  [/scout|recon/i, 'SCOUT', 0.9],
  [/validate|verify|test/i, 'VALIDATE', 0.9],
  [/design|architect/i, 'DESIGN', 0.7],
  [/certify|approve|\bsign\b/i, 'CERTIFY', 0.8],
  [/govern|standard/i, 'GOVERN', 0.8],
  [/analyze|audit|inspect/i, 'ANALYZE', 0.8],
  [/propose|plan/i, 'PROPOSE', 0.8],
  [/build|implement|create/i, 'BUILD', 0.7],
];

/**
 * Classifies CompletionSignals into workflow-level SequenceRecords and stores
 * them to PatternStore 'workflows' category. Parallel listener alongside
 * FeedbackBridge on the same SignalBus.
 *
 * Lifecycle:
 *   new SequenceRecorder(bus, store, config?) — construct (does not start listening)
 *   .start()                                  — begin listening (idempotent)
 *   ...signals fire...                        — each triggers recordSignal()
 *   .completeArc(sequenceId, agent)           — mark arc complete, record step count
 *   .stop()                                   — stop listening (idempotent)
 *   SequenceRecorder.exportCsv(store)         — static: export all records as CSV
 */
export class SequenceRecorder {
  private bus: SignalBus;
  private store: PatternStore;
  private config: SequenceRecorderConfig;
  private listener: ((signal: CompletionSignal) => void) | null = null;
  private phaseCompleteListener: ((signal: CompletionSignal) => void) | null = null;
  /** Current step count per arc (sequenceId → step count). Resets on arc completion. */
  private arcSteps: Map<string, number> = new Map();
  /** Historical step counts per agent (agent → [stepCount1, stepCount2, ...]).
   *  Used to compute compression ratios across arc runs. */
  private arcHistory: Map<string, number[]> = new Map();

  constructor(bus: SignalBus, store: PatternStore, config?: Partial<SequenceRecorderConfig>) {
    this.bus = bus;
    this.store = store;
    this.config = { ...DEFAULT_RECORDER_CONFIG, ...config };
  }

  /**
   * Register listener on SignalBus 'completion' channel.
   * Idempotent: safe to call multiple times — only one listener is registered.
   * The listener is async-safe: errors are caught and logged, not thrown.
   */
  start(): void {
    if (this.listener) return;
    this.listener = (signal: CompletionSignal) => {
      this.recordSignal(signal).catch(err => {
        console.warn('SequenceRecorder: failed to record:', err);
      });
    };
    this.bus.on('completion', this.listener);
  }

  /**
   * Unregister all listeners from SignalBus. Idempotent.
   * Call during application shutdown to allow clean teardown.
   */
  stop(): void {
    if (this.listener) {
      this.bus.off('completion', this.listener);
      this.listener = null;
    }
    this.stopPhaseCompleteListener();
  }

  /**
   * Subscribe to 'phase-complete' events on the SignalBus.
   * When fired, completes all active arcs — moving their step counts into
   * arcHistory so future runs can compute compression ratios.
   *
   * This closes the Batch 3 gap: completeArc() is now called at phase
   * boundaries, enabling measurable learning detection across phase runs.
   *
   * Idempotent: safe to call multiple times.
   */
  startPhaseCompleteListener(): void {
    if (this.phaseCompleteListener) return;
    this.phaseCompleteListener = () => {
      this.completeAllArcs();
    };
    this.bus.on('phase-complete', this.phaseCompleteListener);
  }

  /**
   * Unregister the phase-complete listener. Idempotent.
   */
  stopPhaseCompleteListener(): void {
    if (!this.phaseCompleteListener) return;
    this.bus.off('phase-complete', this.phaseCompleteListener);
    this.phaseCompleteListener = null;
  }

  /**
   * Complete all active arcs, recording step counts to arcHistory.
   * Called by the phase-complete listener. Visible for testing.
   */
  completeAllArcs(): void {
    for (const [sequenceId, steps] of this.arcSteps.entries()) {
      if (steps === 0) continue;
      const agent = sequenceId.replace(/^arc-/, '');
      this.completeArc(sequenceId, agent);
    }
  }

  /**
   * Classify a CompletionSignal's operationId into an OperationType.
   * Iterates CLASSIFY_PATTERNS in order, returns first match.
   * Falls back to { type: 'BUILD', confidence: 0.3 } — the honesty default.
   *
   * The 0.3 confidence propagates correctly: predictRisks() checks classification
   * confidence when status === 'failure', flagging 'unclear-requirements' for
   * low-confidence failures. Low confidence is useful signal, not noise.
   */
  classify(signal: CompletionSignal): { type: OperationType; confidence: number } {
    const id = signal.operationId.toLowerCase();
    for (const [pattern, opType, confidence] of CLASSIFY_PATTERNS) {
      if (pattern.test(id)) return { type: opType, confidence };
    }
    return { type: 'BUILD', confidence: 0.3 };
  }

  /**
   * Resolve an agent name to its cluster assignment.
   * Defaults to 'bridge-zone' for unknown agents — the safest assumption.
   * Bridge-zone is the connecting cluster, adjacent to both creative-nexus and
   * rigor-spine, so defaulting here minimizes false capability-gap risk flags.
   */
  resolveCluster(agent: string): ClusterId {
    return this.config.clusterMap[agent.toLowerCase()] ?? 'bridge-zone';
  }

  /**
   * Predict failure risks for a cluster transition.
   * Distance-based risks: high distance → communication-failure or capability-gap.
   * Signal-status risks: timeout → timeout, error → dependency-missing,
   *   low-confidence failure → unclear-requirements.
   *
   * Risk prediction accuracy was validated in Phase 3a (Hemlock's sign-off):
   * 0 false positives across 105 Phase 2b records. All records were intra-cluster
   * (distance=0.0), so no distance-based risks triggered. Cross-cluster validation
   * is still outstanding — see BATCH-3-RETROSPECTIVE.md "Hemlock: Safety Gates Calibrated".
   */
  predictRisks(source: ClusterId, target: ClusterId, signal: CompletionSignal): FailureRisk[] {
    const risks: FailureRisk[] = [];
    const distKey = `${source}->${target}`;
    const distance = this.config.clusterDistances[distKey] ?? 0;

    if (distance >= this.config.communicationFailureThreshold) {
      risks.push('communication-failure');
    } else if (distance >= this.config.capabilityGapThreshold) {
      risks.push('capability-gap');
    }

    if (signal.status === 'timeout') risks.push('timeout');
    if (signal.status === 'error') risks.push('dependency-missing');
    if (signal.status === 'failure' && this.classify(signal).confidence < 0.5) {
      risks.push('unclear-requirements');
    }

    return risks;
  }

  /** Get the current step count for an arc in progress. */
  getArcStepCount(sequenceId: string): number {
    return this.arcSteps.get(sequenceId) ?? 0;
  }

  /**
   * Export all workflow records as CSV for external analysis.
   * This was the "most revealing moment" of Batch 3 (Willow's debrief):
   * the Creator's Arc pattern appeared directly in the exported data without
   * any inference — just making the data visible.
   *
   * CSV columns: sequenceId, step, operationType, agent, clusterSource,
   * clusterTarget, transitionDistance, failureRisks (semicolon-separated), timestamp
   */
  static async exportCsv(store: PatternStore): Promise<string> {
    const records = await store.read('workflows');
    const header = 'sequenceId,step,operationType,agent,clusterSource,clusterTarget,transitionDistance,failureRisks,timestamp\n';
    const rows = records.map(r => {
      const d = r.data as unknown as SequenceRecord;
      return `${d.sequenceId},${d.step},${d.operationType},${d.agent},${d.clusterSource},${d.clusterTarget},${d.transitionDistance},"${d.failureRisks.join(';')}",${d.timestamp}`;
    }).join('\n');
    return header + rows;
  }

  /**
   * Core record pipeline: classify → resolve → predict → store.
   * Each CompletionSignal produces exactly one SequenceRecord.
   * The arc step counter is incremented before storing so step 1 is the first
   * operation in an arc, matching the natural sequence expectation.
   */
  private async recordSignal(signal: CompletionSignal): Promise<void> {
    const { type: operationType, confidence } = this.classify(signal);
    const agent = this.extractAgent(signal.operationId);
    const clusterSource = this.resolveCluster(agent);
    // For now, target defaults to source (intra-cluster). Cross-cluster
    // targeting requires richer signal metadata in future iterations.
    const clusterTarget = clusterSource;
    const risks = this.predictRisks(clusterSource, clusterTarget, signal);
    const riskConfidence = risks.length > 0 ? confidence : 0;

    const sequenceId = `arc-${agent}`;
    const step = (this.arcSteps.get(sequenceId) ?? 0) + 1;
    this.arcSteps.set(sequenceId, step);

    const record: SequenceRecord = {
      sequenceId,
      step,
      operationType,
      agent,
      clusterSource,
      clusterTarget,
      transitionDistance: this.config.clusterDistances[`${clusterSource}->${clusterTarget}`] ?? 0,
      failureRisks: risks,
      riskConfidence,
      timestamp: Date.now(),
      feedbackRef: signal.operationId,
      compressionNote: this.computeCompression(sequenceId, agent, step),
    };

    await this.store.append('workflows', record as unknown as Record<string, unknown>);
  }

  /**
   * Extract agent name from operationId using ':' convention.
   * Example: "lex:build-phase-3" → "lex"
   * If no ':' separator, defaults to 'unknown' → resolves to 'bridge-zone'.
   */
  private extractAgent(operationId: string): string {
    // Convention: operationId may contain agent name as prefix before ':'
    const parts = operationId.split(':');
    return parts.length > 1 ? parts[0].toLowerCase() : 'unknown';
  }

  /**
   * Compute compression note comparing current arc step count to baseline.
   * Returns undefined on first arc run (no baseline to compare against).
   * On subsequent runs, returns a string like "step 22/30 (ratio: 0.73)".
   *
   * Ratio interpretation:
   *   < 1.0: fewer steps than baseline — learning has occurred
   *   = 1.0: same step count — stable performance
   *   > 1.0: more steps than baseline — possible regression or harder task
   */
  private computeCompression(sequenceId: string, agent: string, currentStep: number): string | undefined {
    const historyKey = agent;
    const history = this.arcHistory.get(historyKey);
    if (!history || history.length === 0) return undefined;
    const baseline = history[0];
    const ratio = currentStep / baseline;
    return `step ${currentStep}/${baseline} (ratio: ${ratio.toFixed(2)})`;
  }

  /**
   * Record an arc's final step count for compression tracking.
   * Called automatically at phase boundaries via startPhaseCompleteListener(),
   * or manually for explicit arc completion.
   *
   * Moves the current step count to arcHistory for the agent,
   * enabling future ratio calculations via computeCompression().
   * Resets the arc's step counter so the next arc starts fresh.
   */
  completeArc(sequenceId: string, agent: string): void {
    const steps = this.arcSteps.get(sequenceId) ?? 0;
    if (steps === 0) return;
    const historyKey = agent;
    const history = this.arcHistory.get(historyKey) ?? [];
    history.push(steps);
    this.arcHistory.set(historyKey, history);
    this.arcSteps.delete(sequenceId);
  }
}

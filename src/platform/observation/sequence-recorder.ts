import { SignalBus } from '../../services/chipset/blitter/signals.js';
import type { CompletionSignal } from '../../services/chipset/blitter/types.js';
import { PatternStore } from '../../core/storage/pattern-store.js';

/** The 8 operation types from Foxy's sequence mining */
export type OperationType =
  | 'SCOUT' | 'GOVERN' | 'PROPOSE' | 'VALIDATE'
  | 'CERTIFY' | 'ANALYZE' | 'DESIGN' | 'BUILD';

/** The 3 Louvain clusters from Sam's topology */
export type ClusterId = 'creative-nexus' | 'bridge-zone' | 'rigor-spine';

/** Failure risk categories from Hemlock's taxonomy */
export type FailureRisk =
  | 'capability-gap' | 'safety-violation' | 'unclear-requirements'
  | 'dependency-missing' | 'timeout' | 'communication-failure';

/** Single workflow record stored to PatternStore 'workflows' category */
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

export interface SequenceRecorderConfig {
  clusterMap: Record<string, ClusterId>;
  clusterDistances: Record<string, number>;
  capabilityGapThreshold: number;
  communicationFailureThreshold: number;
}

const DEFAULT_CLUSTER_MAP: Record<string, ClusterId> = {
  'foxy': 'creative-nexus',
  'cedar': 'creative-nexus',
  'willow': 'bridge-zone',
  'sam': 'bridge-zone',
  'hemlock': 'rigor-spine',
  'lex': 'rigor-spine',
};

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

export const DEFAULT_RECORDER_CONFIG: SequenceRecorderConfig = {
  clusterMap: DEFAULT_CLUSTER_MAP,
  clusterDistances: DEFAULT_CLUSTER_DISTANCES,
  capabilityGapThreshold: 0.5,
  communicationFailureThreshold: 0.9,
};

const CLASSIFY_PATTERNS: [RegExp, OperationType, number][] = [
  [/scout|recon/i, 'SCOUT', 0.9],
  [/validate|verify|test/i, 'VALIDATE', 0.9],
  [/certify|approve|sign/i, 'CERTIFY', 0.8],
  [/govern|standard/i, 'GOVERN', 0.8],
  [/analyze|audit|inspect/i, 'ANALYZE', 0.8],
  [/propose|plan/i, 'PROPOSE', 0.8],
  [/design|architect/i, 'DESIGN', 0.7],
  [/build|implement|create/i, 'BUILD', 0.7],
];

/**
 * Classifies CompletionSignals into workflow-level SequenceRecords and stores
 * them to PatternStore 'workflows' category. Parallel listener alongside
 * FeedbackBridge on the same SignalBus.
 */
export class SequenceRecorder {
  private bus: SignalBus;
  private store: PatternStore;
  private config: SequenceRecorderConfig;
  private listener: ((signal: CompletionSignal) => void) | null = null;
  private arcSteps: Map<string, number> = new Map();
  private arcHistory: Map<string, number[]> = new Map();

  constructor(bus: SignalBus, store: PatternStore, config?: Partial<SequenceRecorderConfig>) {
    this.bus = bus;
    this.store = store;
    this.config = { ...DEFAULT_RECORDER_CONFIG, ...config };
  }

  start(): void {
    if (this.listener) return;
    this.listener = (signal: CompletionSignal) => {
      this.recordSignal(signal).catch(err => {
        console.warn('SequenceRecorder: failed to record:', err);
      });
    };
    this.bus.on('completion', this.listener);
  }

  stop(): void {
    if (!this.listener) return;
    this.bus.off('completion', this.listener);
    this.listener = null;
  }

  classify(signal: CompletionSignal): { type: OperationType; confidence: number } {
    const id = signal.operationId.toLowerCase();
    for (const [pattern, opType, confidence] of CLASSIFY_PATTERNS) {
      if (pattern.test(id)) return { type: opType, confidence };
    }
    return { type: 'BUILD', confidence: 0.3 };
  }

  resolveCluster(agent: string): ClusterId {
    return this.config.clusterMap[agent.toLowerCase()] ?? 'bridge-zone';
  }

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

  getArcStepCount(sequenceId: string): number {
    return this.arcSteps.get(sequenceId) ?? 0;
  }

  static async exportCsv(store: PatternStore): Promise<string> {
    const records = await store.read('workflows');
    const header = 'sequenceId,step,operationType,agent,clusterSource,clusterTarget,transitionDistance,failureRisks,timestamp\n';
    const rows = records.map(r => {
      const d = r.data as unknown as SequenceRecord;
      return `${d.sequenceId},${d.step},${d.operationType},${d.agent},${d.clusterSource},${d.clusterTarget},${d.transitionDistance},"${d.failureRisks.join(';')}",${d.timestamp}`;
    }).join('\n');
    return header + rows;
  }

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

  private extractAgent(operationId: string): string {
    // Convention: operationId may contain agent name as prefix before ':'
    const parts = operationId.split(':');
    return parts.length > 1 ? parts[0].toLowerCase() : 'unknown';
  }

  private computeCompression(sequenceId: string, agent: string, currentStep: number): string | undefined {
    const historyKey = agent;
    const history = this.arcHistory.get(historyKey);
    if (!history || history.length === 0) return undefined;
    const baseline = history[0];
    const ratio = currentStep / baseline;
    return `step ${currentStep}/${baseline} (ratio: ${ratio.toFixed(2)})`;
  }

  /** Call when an arc completes to record its final step count for compression tracking */
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

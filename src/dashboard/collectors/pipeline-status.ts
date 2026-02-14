import { createHash } from 'crypto';
import { PatternStore } from '../../storage/pattern-store.js';
import type { PipelineStatusView, PipelineStageStatus } from '../../types/dashboard.js';
import type { StoredExecutionBatch, ToolExecutionPair, DriftEvent } from '../../types/observation.js';

/**
 * Collects pipeline status data by reading from PatternStore categories
 * and counting artifacts at each pipeline stage.
 *
 * Satisfies DASH-01: Pipeline status view shows artifact counts at each stage.
 */
export class PipelineStatusCollector {
  private store: PatternStore;
  private demotionSensitivity: number;

  constructor(store: PatternStore, demotionSensitivity: number = 3) {
    this.store = store;
    this.demotionSensitivity = demotionSensitivity;
  }

  /**
   * Collect pipeline status data from all relevant PatternStore categories.
   * Returns counts for: observations, patterns, candidates, scripts, promoted, demoted.
   */
  async collect(): Promise<PipelineStatusView> {
    const [observationsCount, patternsCount] = await this.countExecutionData();
    const [candidatesCount, scriptsCount, promotedCount] = await this.countDecisionData();
    const demotedCount = await this.countDemoted();

    const stages: PipelineStageStatus[] = [
      { name: 'Observations', count: observationsCount, key: 'observations' },
      { name: 'Patterns', count: patternsCount, key: 'patterns' },
      { name: 'Candidates', count: candidatesCount, key: 'candidates' },
      { name: 'Scripts', count: scriptsCount, key: 'scripts' },
      { name: 'Promoted', count: promotedCount, key: 'promoted' },
      { name: 'Demoted', count: demotedCount, key: 'demoted' },
    ];

    return {
      stages,
      totalArtifacts: stages.reduce((sum, s) => sum + s.count, 0),
      collectedAt: new Date().toISOString(),
    };
  }

  /**
   * Count observations (total execution batches) and patterns (unique operation keys).
   */
  private async countExecutionData(): Promise<[number, number]> {
    const entries = await this.store.read('executions');

    // Observations = number of stored execution batch entries
    const observationsCount = entries.length;

    // Patterns = unique operation keys across all batches
    const operationKeys = new Set<string>();

    for (const entry of entries) {
      const batch = entry.data as unknown as StoredExecutionBatch;

      for (const pair of batch.pairs) {
        if (pair.status !== 'complete' || pair.outputHash === null) {
          continue;
        }

        const inputHash = this.computeInputHash(pair.input);
        operationKeys.add(`${pair.toolName}:${inputHash}`);
      }
    }

    return [observationsCount, operationKeys.size];
  }

  /**
   * Count candidates (all decisions), scripts (same as candidates), and promoted (approved).
   */
  private async countDecisionData(): Promise<[number, number, number]> {
    const entries = await this.store.read('decisions');

    const candidatesCount = entries.length;
    const scriptsCount = entries.length; // Each candidate gets a script attempt
    const promotedCount = entries.filter(e => {
      const data = e.data as Record<string, unknown>;
      return data.approved === true;
    }).length;

    return [candidatesCount, scriptsCount, promotedCount];
  }

  /**
   * Count demoted operations from feedback category.
   * Groups feedback entries by operationId and checks if the highest
   * consecutiveMismatches >= demotionSensitivity.
   */
  private async countDemoted(): Promise<number> {
    const entries = await this.store.read('feedback');

    // Group by operationId, track max consecutiveMismatches
    const maxMismatches = new Map<string, number>();

    for (const entry of entries) {
      const data = entry.data as unknown as DriftEvent;
      const opId = data.operationId;
      const current = maxMismatches.get(opId) ?? 0;
      const mismatches = data.consecutiveMismatches ?? 0;

      if (mismatches > current) {
        maxMismatches.set(opId, mismatches);
      }
    }

    // Count operations that reached demotion threshold
    let demotedCount = 0;
    for (const [, max] of maxMismatches) {
      if (max >= this.demotionSensitivity) {
        demotedCount++;
      }
    }

    return demotedCount;
  }

  /**
   * Compute SHA-256 hash of JSON-serialized input with sorted keys.
   * Same algorithm as DeterminismAnalyzer.computeInputHash.
   */
  private computeInputHash(input: Record<string, unknown>): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }
}

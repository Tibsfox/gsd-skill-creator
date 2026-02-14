import { DeterminismAnalyzer } from '../../observation/determinism-analyzer.js';
import type { DeterminismViewData, DeterminismRow, DeterminismSortField, SortDirection } from '../../types/dashboard.js';

/**
 * Collects determinism analysis data and produces a sortable per-operation
 * breakdown with score, classification, and sample count.
 *
 * Satisfies DASH-02: Determinism scores displayed per-operation.
 */
export class DeterminismViewCollector {
  private analyzer: DeterminismAnalyzer;

  constructor(analyzer: DeterminismAnalyzer) {
    this.analyzer = analyzer;
  }

  /**
   * Collect determinism data from the analyzer.
   * Returns operations sorted by score descending (most deterministic first).
   */
  async collect(): Promise<DeterminismViewData> {
    const classified = await this.analyzer.classify();

    const operations: DeterminismRow[] = classified.map(op => ({
      toolName: op.score.operation.toolName,
      inputHash: op.score.operation.inputHash,
      score: op.determinism,
      classification: op.classification,
      sampleCount: op.score.observationCount,
      uniqueOutputs: op.score.uniqueOutputs,
    }));

    return {
      operations,
      totalOperations: operations.length,
      collectedAt: new Date().toISOString(),
    };
  }

  /**
   * Return a new DeterminismViewData with operations sorted by the specified field.
   */
  sortBy(data: DeterminismViewData, field: DeterminismSortField, direction: SortDirection = 'desc'): DeterminismViewData {
    const sorted = [...data.operations].sort((a, b) => {
      let cmp: number;
      if (field === 'toolName') {
        cmp = a.toolName.localeCompare(b.toolName);
      } else if (field === 'classification') {
        // Order: deterministic > semi-deterministic > non-deterministic
        const order: Record<string, number> = { 'deterministic': 2, 'semi-deterministic': 1, 'non-deterministic': 0 };
        cmp = order[a.classification] - order[b.classification];
      } else {
        cmp = a[field] - b[field];
      }
      return direction === 'desc' ? -cmp : cmp;
    });
    return { ...data, operations: sorted };
  }
}

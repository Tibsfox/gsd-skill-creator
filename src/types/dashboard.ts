import type { DeterminismClassification } from './observation.js';

/** Status indicator for a pipeline stage (DASH-01) */
export interface PipelineStageStatus {
  /** Stage name as displayed in the dashboard */
  name: string;
  /** Number of artifacts currently at this stage */
  count: number;
  /** Machine-readable stage key for programmatic access */
  key: 'observations' | 'patterns' | 'candidates' | 'scripts' | 'promoted' | 'demoted';
}

/** Complete pipeline status view showing artifact counts at each stage (DASH-01) */
export interface PipelineStatusView {
  /** Ordered list of pipeline stages with counts */
  stages: PipelineStageStatus[];
  /** Total artifacts across all stages */
  totalArtifacts: number;
  /** ISO timestamp when this view was collected */
  collectedAt: string;
}

/** A single row in the determinism scores view (DASH-02) */
export interface DeterminismRow {
  /** Tool name (e.g., 'Read', 'Bash') */
  toolName: string;
  /** SHA-256 input hash identifying the operation */
  inputHash: string;
  /** Determinism score (1 - varianceScore), 0.0 to 1.0 */
  score: number;
  /** Classification: deterministic, semi-deterministic, non-deterministic */
  classification: DeterminismClassification;
  /** Number of observations for this operation */
  sampleCount: number;
  /** Number of unique output hashes seen */
  uniqueOutputs: number;
}

/** Complete determinism view data (DASH-02) */
export interface DeterminismViewData {
  /** Rows sorted by score descending (most deterministic first) */
  operations: DeterminismRow[];
  /** Total number of analyzed operations */
  totalOperations: number;
  /** ISO timestamp when this view was collected */
  collectedAt: string;
}

/** Sort field options for DeterminismViewData */
export type DeterminismSortField = 'score' | 'classification' | 'sampleCount' | 'toolName';

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

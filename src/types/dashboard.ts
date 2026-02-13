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

/** Artifact type in the promotion pipeline (mirrors observation module's ArtifactType) */
export type DashboardArtifactType = 'observation' | 'pattern' | 'candidate' | 'script' | 'decision';

/** A single node in a lineage graph (DASH-03) */
export interface LineageNode {
  /** Unique artifact ID */
  artifactId: string;
  /** Type of artifact at this node */
  artifactType: DashboardArtifactType;
  /** Pipeline stage where this artifact was created */
  stage: string;
  /** ISO timestamp when this artifact was recorded */
  timestamp: string;
  /** Summary metadata for display (e.g., tool name, decision outcome) */
  metadata: Record<string, unknown>;
}

/** A complete lineage graph for one promoted artifact (DASH-03) */
export interface LineageGraphEntry {
  /** The promoted artifact this graph traces */
  promotedArtifactId: string;
  /** Tool name of the promoted operation */
  toolName: string;
  /** The full chain from observation to current state, ordered chronologically */
  chain: LineageNode[];
  /** Total number of nodes in the chain */
  depth: number;
}

/** Complete lineage view data for all promoted artifacts (DASH-03) */
export interface LineageViewData {
  /** One graph entry per promoted artifact */
  graphs: LineageGraphEntry[];
  /** Total number of promoted artifacts with lineage data */
  totalPromoted: number;
  /** ISO timestamp when this view was collected */
  collectedAt: string;
}

/**
 * @file Batch detection type definitions
 * @description Types for heuristic detection of batch-production patterns
 *              via timestamp clustering, session compression, content depth,
 *              and template similarity. Consumed by Phase 558 (Batch Detection Advisory).
 * @module core/validation/batch-detection
 */

/**
 * Category of content depth marker used to assess whether
 * artifacts show genuine engagement or batch production.
 * - `specific-path`: References specific file paths in the codebase
 * - `struggle-note`: Contains struggle or surprise language
 * - `genuine-question`: Contains genuine exploratory questions
 * - `personalized-observation`: Contains first-person observations
 */
export type DepthMarkerCategory =
  | 'specific-path'
  | 'struggle-note'
  | 'genuine-question'
  | 'personalized-observation';

/**
 * A configurable marker for content depth analysis.
 * Each marker defines a pattern to search for and its relative
 * importance when scoring artifact depth.
 */
export interface DepthMarker {
  /** Which depth category this marker represents. */
  category: DepthMarkerCategory;

  /** The regex or text pattern that identifies this marker. */
  pattern: string;

  /** Human-readable description of what this marker detects. */
  description: string;

  /** Relative importance weight (0.0-1.0) for scoring. */
  weight: number;
}

/**
 * Result of an individual batch detection heuristic.
 * Each of the four heuristics produces one of these.
 */
export interface BatchHeuristicResult {
  /** Whether the heuristic flagged batch production. */
  detected: boolean;

  /** Severity of the detection. */
  severity: 'info' | 'warn' | 'critical';

  /** Human-readable explanation of what was detected. */
  details: string;

  /** File paths of artifacts involved in the detection. */
  artifacts: string[];
}

/**
 * Configuration for the batch detection advisory system.
 * Controls thresholds and markers for all four heuristics.
 */
export interface BatchDetectionConfig {
  /** Window in seconds for timestamp clustering check (default 60). */
  timestampClusteringWindowSeconds: number;

  /** Minimum artifacts in window to flag clustering (default 3). */
  timestampClusteringMinCount: number;

  /** Similarity ratio above which to flag template similarity (default 0.9). */
  templateSimilarityThreshold: number;

  /** Configurable depth markers for content depth scanning. */
  depthMarkers: DepthMarker[];

  /** Whether batch detection is active. */
  enabled: boolean;
}

/**
 * Combined result of all four batch detection heuristics.
 * The overall status reflects the worst status across all heuristics.
 */
export interface BatchDetectionResult {
  /** Timestamp clustering heuristic result. */
  timestampClustering: BatchHeuristicResult;

  /** Session compression heuristic result. */
  sessionCompression: BatchHeuristicResult;

  /** Content depth marker heuristic result. */
  contentDepth: BatchHeuristicResult;

  /** Template similarity heuristic result. */
  templateSimilarity: BatchHeuristicResult;

  /** Worst status across all heuristics. */
  overallStatus: 'pass' | 'warn' | 'critical';

  /** Human-readable advisory messages. */
  advisories: string[];

  /** ISO timestamp of the check. */
  timestamp: string;
}

/**
 * Default batch detection configuration with conservative thresholds.
 * Includes all four depth marker categories with sensible patterns.
 */
export const DEFAULT_BATCH_DETECTION_CONFIG: BatchDetectionConfig = {
  timestampClusteringWindowSeconds: 60,
  timestampClusteringMinCount: 3,
  templateSimilarityThreshold: 0.9,
  depthMarkers: [
    {
      category: 'specific-path',
      pattern: '(src/|lib/|test/)\\S+\\.(ts|js|rs)',
      description: 'References specific file paths',
      weight: 0.8,
    },
    {
      category: 'struggle-note',
      pattern: '(struggled|difficult|confusing|surprised|unexpected)',
      description: 'Contains struggle or surprise language',
      weight: 0.7,
    },
    {
      category: 'genuine-question',
      pattern: '(I wonder|why does|how does|what if|could this)',
      description: 'Contains genuine exploratory questions',
      weight: 0.9,
    },
    {
      category: 'personalized-observation',
      pattern: '(I noticed|I found|in my experience|looking at the)',
      description: 'Contains first-person observations',
      weight: 0.6,
    },
  ],
  enabled: true,
};

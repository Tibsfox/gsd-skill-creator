/**
 * @file Batch detection barrel export
 * @description Re-exports all batch detection types, constants, and functions.
 * @module core/validation/batch-detection
 */
export type { BatchDetectionConfig, BatchDetectionResult, DepthMarker, DepthMarkerCategory, BatchHeuristicResult } from './batch-types.js';
export { DEFAULT_BATCH_DETECTION_CONFIG } from './batch-types.js';
export { detectTimestampClustering, detectSessionCompression, checkContentDepth, detectTemplateSimilarity } from './batch-heuristics.js';
export { runBatchDetection } from './batch-runner.js';
export { formatBatchReport } from './batch-report.js';

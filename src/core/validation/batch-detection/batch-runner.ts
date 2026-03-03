/**
 * @file Combined batch detection runner
 * @description Orchestrates all four heuristic functions into a single
 *              BatchDetectionResult. Used by CLI and review milestone gates.
 * @module core/validation/batch-detection
 */
import type { BatchDetectionConfig, BatchDetectionResult, BatchHeuristicResult } from './batch-types.js';
import type { ArtifactTimestamp } from '../pacing-gate/pacing-types.js';
import {
  detectTimestampClustering,
  detectSessionCompression,
  checkContentDepth,
  detectTemplateSimilarity,
} from './batch-heuristics.js';

/** Parameters for the combined batch detection run. */
interface BatchDetectionParams {
  config: BatchDetectionConfig;
  artifacts: ArtifactTimestamp[];
  completedSubversions: number;
  sessionBudget: number;
  artifactContents: Array<{ path: string; content: string }>;
  templateContent: string;
}

/** Sentinel result for non-evaluated heuristics. */
const NO_DETECTION: BatchHeuristicResult = {
  detected: false,
  severity: 'info',
  details: 'Not evaluated',
  artifacts: [],
};

/**
 * Compute the worst overall status across all heuristic results.
 * Only considers detected=true results for escalation.
 */
function worstSeverity(results: BatchHeuristicResult[]): 'pass' | 'warn' | 'critical' {
  if (results.some((r) => r.severity === 'critical' && r.detected)) return 'critical';
  if (results.some((r) => r.severity === 'warn' && r.detected)) return 'warn';
  return 'pass';
}

/**
 * Run all four batch detection heuristics and compose into a combined result.
 *
 * - Timestamp clustering: checks if artifacts were created suspiciously close together
 * - Session compression: checks if too many subversions completed in one session
 * - Content depth: scans artifact text for engagement markers
 * - Template similarity: compares artifact text against template for near-copies
 *
 * Short-circuits with all-pass when config.enabled is false.
 */
export function runBatchDetection(params: BatchDetectionParams): BatchDetectionResult {
  const { config, artifacts, completedSubversions, sessionBudget, artifactContents, templateContent } = params;

  // Short-circuit when disabled
  if (!config.enabled) {
    return {
      timestampClustering: { ...NO_DETECTION, details: 'Batch detection disabled' },
      sessionCompression: { ...NO_DETECTION, details: 'Batch detection disabled' },
      contentDepth: { ...NO_DETECTION, details: 'Batch detection disabled' },
      templateSimilarity: { ...NO_DETECTION, details: 'Batch detection disabled' },
      overallStatus: 'pass',
      advisories: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Run all four heuristics
  const timestampClustering = detectTimestampClustering(config, artifacts);
  const sessionCompression = detectSessionCompression(completedSubversions, sessionBudget);

  // Content depth: worst result across all artifact contents
  let contentDepth: BatchHeuristicResult;
  if (artifactContents.length === 0) {
    contentDepth = { ...NO_DETECTION, details: 'No artifact content provided for depth analysis' };
  } else {
    const depthResults = artifactContents.map((ac) => checkContentDepth(config, ac.path, ac.content));
    const worstDepth = depthResults.find((r) => r.detected) ?? depthResults[0];
    contentDepth = worstDepth;
  }

  // Template similarity: first artifact content vs template
  let templateSimilarity: BatchHeuristicResult;
  if (artifactContents.length === 0 || templateContent.length === 0) {
    templateSimilarity = { ...NO_DETECTION, details: 'No content available for template comparison' };
  } else {
    templateSimilarity = detectTemplateSimilarity(
      artifactContents[0].content,
      templateContent,
      config.templateSimilarityThreshold
    );
  }

  const allResults = [timestampClustering, sessionCompression, contentDepth, templateSimilarity];
  const overallStatus = worstSeverity(allResults);
  const advisories = allResults.filter((r) => r.detected).map((r) => r.details);

  return {
    timestampClustering,
    sessionCompression,
    contentDepth,
    templateSimilarity,
    overallStatus,
    advisories,
    timestamp: new Date().toISOString(),
  };
}

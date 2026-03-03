/**
 * @file Combined chain validation runner
 * @description Orchestrates chain integrity validation, forward reference
 *              enforcement, catalog building, and pattern detection into a
 *              single combined result for CLI consumption.
 * @module tools/commands/lessons-chain
 */
import type { ChainConfig, ChainIntegrity, ChainStatus, LessonEntry, LessonsCatalog } from './chain-types.js';
import { validateChainIntegrity, validateForwardReference } from './chain-validation.js';
import { buildLessonsCatalog, flagRecurringPatterns } from './chain-catalog.js';

/**
 * Combined result from running all chain validation checks.
 */
export interface ChainValidationResult {
  /** Merged chain integrity result with both prior + forward fields populated. */
  chainIntegrity: ChainIntegrity;

  /** Cumulative catalog with promoted patterns applied. */
  catalog: LessonsCatalog;

  /** Overall chain status: intact, broken, or incomplete. */
  overallStatus: ChainStatus;

  /** Combined errors from all validations. */
  errors: string[];

  /** ISO timestamp of when the validation was run. */
  timestamp: string;
}

/**
 * Parameters for the combined chain validation run.
 */
interface ChainValidationParams {
  config: ChainConfig;
  milestoneId: string;
  priorMilestoneId: string;
  priorLessonsPath: string;
  priorLessonsExists: boolean;
  currentMilestoneContent: string;
  currentLessonsPath: string;
  nextPlanContent: string;
  nextPlanPath: string;
  chainPosition: number;
  totalInSeries: number;
  lessonsByMilestone: Array<{ milestoneId: string; lessons: LessonEntry[] }>;
  milestoneRange: { from: string; to: string };
}

/**
 * Resolves the overall chain status from integrity and forward reference results.
 */
function resolveOverallStatus(
  integrity: ChainIntegrity,
  forward: ChainIntegrity
): ChainStatus {
  if (!integrity.valid || !forward.valid) return 'broken';
  if (integrity.status === 'incomplete' || forward.status === 'incomplete') return 'incomplete';
  return 'intact';
}

/**
 * Runs all chain validation checks and returns a combined result.
 * Orchestrates: chain integrity, forward reference, catalog building, pattern detection.
 *
 * @param params - Combined chain validation parameters
 * @returns ChainValidationResult with merged results
 */
export function runChainValidation(params: ChainValidationParams): ChainValidationResult {
  const {
    config, milestoneId, priorMilestoneId, priorLessonsPath,
    priorLessonsExists, currentMilestoneContent, currentLessonsPath,
    nextPlanContent, nextPlanPath, chainPosition, totalInSeries,
    lessonsByMilestone, milestoneRange,
  } = params;

  // Run chain integrity validation
  const integrity = validateChainIntegrity({
    config, milestoneId, priorMilestoneId, priorLessonsPath,
    priorLessonsExists, currentMilestoneContent, chainPosition, totalInSeries,
  });

  // Run forward reference validation
  const forward = validateForwardReference({
    config, currentMilestoneId: milestoneId, currentLessonsPath,
    nextPlanContent, nextPlanPath, chainPosition, totalInSeries,
  });

  // Build and scan catalog
  const rawCatalog = buildLessonsCatalog({ milestoneRange, lessonsByMilestone });
  const catalog = flagRecurringPatterns(config, rawCatalog);

  // Merge chain integrity results
  const mergedIntegrity: ChainIntegrity = {
    ...integrity,
    forwardReferenceFound: forward.forwardReferenceFound,
    forwardReferencePath: forward.forwardReferencePath,
  };

  const overallStatus = resolveOverallStatus(integrity, forward);
  const errors = [...integrity.errors, ...forward.errors];

  return {
    chainIntegrity: mergedIntegrity,
    catalog,
    overallStatus,
    errors,
    timestamp: new Date().toISOString(),
  };
}

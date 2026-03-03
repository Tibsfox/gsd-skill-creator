/**
 * @file Pacing check functions
 * @description Core enforcement logic for session budget and context depth checks.
 *              Produces PacingResult objects consumed by the report formatter and CLI.
 * @module core/validation/pacing-gate
 */
import type { PacingConfig, PacingResult, PacingStatus } from './pacing-types.js';

/**
 * Check whether the number of subversions completed in a session
 * exceeds the configured budget maximum.
 *
 * @param config - Pacing configuration with budget limits
 * @param sessionId - Identifier for the session being checked
 * @param subversionsCompleted - Number of subversions completed this session
 * @returns PacingResult with 'pass' if within budget, 'warn' if exceeded
 */
export function checkSessionBudget(
  config: PacingConfig,
  sessionId: string,
  subversionsCompleted: number
): PacingResult {
  const exceeded = subversionsCompleted > config.maxSubversionsPerSession;
  const status: PacingStatus = exceeded ? 'warn' : 'pass';
  const advisories: string[] = exceeded
    ? [`Session budget exceeded: ${subversionsCompleted}/${config.maxSubversionsPerSession} subversions completed`]
    : [];

  return {
    status,
    sessionId,
    subversionsCompleted,
    budgetMax: config.maxSubversionsPerSession,
    contextWindowsUsed: 0,
    depthMinimum: config.minContextWindowsPerSubversion,
    advisories,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check whether the number of context windows used for a subversion
 * meets the configured minimum depth requirement.
 *
 * @param config - Pacing configuration with depth limits
 * @param sessionId - Identifier for the session being checked
 * @param subversionId - Identifier for the subversion being checked
 * @param contextWindowsUsed - Number of context windows used for this subversion
 * @returns PacingResult with 'pass' if depth sufficient, 'warn' if insufficient
 */
export function checkContextDepth(
  config: PacingConfig,
  sessionId: string,
  subversionId: string,
  contextWindowsUsed: number
): PacingResult {
  const shallow = contextWindowsUsed < config.minContextWindowsPerSubversion;
  const status: PacingStatus = shallow ? 'warn' : 'pass';
  const advisories: string[] = shallow
    ? [`Context depth insufficient: ${contextWindowsUsed}/${config.minContextWindowsPerSubversion} windows used for subversion ${subversionId}`]
    : [];

  return {
    status,
    sessionId,
    subversionsCompleted: 0,
    budgetMax: config.maxSubversionsPerSession,
    contextWindowsUsed,
    depthMinimum: config.minContextWindowsPerSubversion,
    advisories,
    timestamp: new Date().toISOString(),
  };
}

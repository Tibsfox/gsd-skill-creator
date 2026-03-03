/**
 * @file Pacing gate barrel export
 * @description Re-exports all pacing gate types, constants, and functions.
 * @module core/validation/pacing-gate
 */
export type { PacingConfig, PacingResult, ArtifactTimestamp, PacingStatus } from './pacing-types.js';
export { DEFAULT_PACING_CONFIG } from './pacing-types.js';
export { checkSessionBudget, checkContextDepth } from './pacing-checks.js';
export { formatPacingReport } from './pacing-report.js';

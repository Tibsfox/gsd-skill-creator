/**
 * @file Lessons-learned chain barrel export
 * @description Re-exports all lessons-learned chain types, constants, and functions.
 * @module tools/commands/lessons-chain
 */
export type { ChainConfig, ChainIntegrity, LessonEntry, LessonsCatalog, ChainStatus } from './chain-types.js';
export { DEFAULT_CHAIN_CONFIG } from './chain-types.js';
export { validateChainIntegrity, validateForwardReference } from './chain-validation.js';
export { buildLessonsCatalog, flagRecurringPatterns } from './chain-catalog.js';
export { runChainValidation } from './chain-runner.js';
export type { ChainValidationResult } from './chain-runner.js';
export { formatChainReport } from './chain-report.js';

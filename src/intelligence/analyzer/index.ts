/**
 * Analyzer pipeline barrel.
 *
 * Re-exports public surface of the analyzer module.
 * Downstream consumers (finding engine, integration tests) import from here.
 */

export { AnalyzerCore } from './core.js';
export type {
  AnalyzerInput,
  AnalyzerOutput,
  AnalyzerFinding,
  AnalyzerMetrics,
  Language,
  LanguageAnalyzer,
  ScanOptions,
  ScanResult,
  AnalyzerKB,
} from './types.js';
export { walkProject, isBinary } from './walk.js';
export { detectLanguage } from './detect.js';
export { createPool } from './pool.js';
export { gitMetadata } from './git.js';

/**
 * Discovery module barrel export.
 *
 * Re-exports all public API from the discovery module:
 * - Zod schemas for JSONL entry types and sessions-index format (types.ts)
 * - TypeScript types inferred from Zod schemas
 * - Processed result types for downstream consumers
 * - Scan state persistence with atomic writes (scan-state-store.ts)
 * - Incremental corpus scanning with watermark-based change detection (corpus-scanner.ts)
 * - Tool sequence n-gram extraction (tool-sequence-extractor.ts)
 * - Bash command pattern extraction (bash-pattern-extractor.ts)
 * - Pattern aggregation with noise filtering (pattern-aggregator.ts)
 * - Session pattern processing with subagent discovery (session-pattern-processor.ts)
 * - Multi-factor pattern scoring (pattern-scorer.ts)
 * - Candidate ranking with deduplication (candidate-ranker.ts)
 * - Skill draft generation from candidates (skill-drafter.ts)
 * - Interactive candidate selection UI (candidate-selector.ts)
 * - DBSCAN clustering with cosine distance (dbscan.ts)
 * - Epsilon auto-tuning via k-NN knee method (epsilon-tuner.ts)
 */

export * from './types.js';
export { parseSessionFile, parseJsonlLine } from './session-parser.js';
export { enumerateSessions } from './session-enumerator.js';
export { classifyUserEntry, isRealUserPrompt } from './user-prompt-classifier.js';
export {
  ScanStateStore,
  ScanStateSchema,
  SessionWatermarkSchema,
  ScanStatsSchema,
  SCAN_STATE_VERSION,
  type ScanState,
  type SessionWatermark,
  type ScanStats,
} from './scan-state-store.js';
export { CorpusScanner } from './corpus-scanner.js';
export type { CorpusScannerOptions, SessionProcessor, ScanResult } from './corpus-scanner.js';
export { extractNgrams, buildToolSequence } from './tool-sequence-extractor.js';
export {
  classifyBashCommand,
  normalizeBashCommand,
  extractBashPatterns,
  type BashCategory,
  type BashPattern,
} from './bash-pattern-extractor.js';
export {
  PatternAggregator,
  type PatternOccurrence,
  type SessionPatterns,
} from './pattern-aggregator.js';
export {
  processSession,
  discoverSubagentFiles,
  createPatternSessionProcessor,
} from './session-pattern-processor.js';

// Phase 33: Ranking & Drafting
export {
  scorePattern,
  parsePatternKey,
  generateCandidateName,
  DEFAULT_SCORING_WEIGHTS,
  type ParsedPatternKey,
  type ScoringWeights,
  type ScoreBreakdown,
  type PatternEvidence,
  type RankedCandidate,
} from './pattern-scorer.js';
export {
  rankCandidates,
  assembleEvidence,
  deduplicateAgainstExisting,
  type ExistingSkill,
  type RankingOptions,
} from './candidate-ranker.js';
export {
  generateSkillDraft,
  TOOL_DESCRIPTIONS,
  BASH_DESCRIPTIONS,
} from './skill-drafter.js';
export {
  selectCandidates,
  formatCandidateTable,
} from './candidate-selector.js';

// Phase 35: Semantic Clustering
export {
  dbscan,
  cosineDistance,
  type DbscanResult,
} from './dbscan.js';
export { tuneEpsilon } from './epsilon-tuner.js';

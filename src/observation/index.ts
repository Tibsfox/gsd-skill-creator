// Observation module exports
export { TranscriptParser, parseTranscript } from './transcript-parser.js';
export { PatternSummarizer, summarizeSession } from './pattern-summarizer.js';
export { RetentionManager, prunePatterns } from './retention-manager.js';
export { SessionObserver } from './session-observer.js';
export { EphemeralStore } from './ephemeral-store.js';
export { PromotionEvaluator, DEFAULT_PROMOTION_CRITERIA } from './promotion-evaluator.js';
export { ObservationSquasher } from './observation-squasher.js';
export { ObservationRateLimiter, detectAnomalies, DEFAULT_RATE_LIMIT_CONFIG } from './rate-limiter.js';
export { JsonlCompactor, DEFAULT_COMPACTION_CONFIG } from './jsonl-compactor.js';

// Types
export type { SessionStartData, SessionEndData } from './session-observer.js';
export type { PromotionResult } from './promotion-evaluator.js';
export type { RateLimitConfig, RateLimitResult, AnomalyReport } from './rate-limiter.js';
export type { CompactionConfig, CompactionResult } from './jsonl-compactor.js';
export type { ObservationTier } from '../types/observation.js';
export { normalizeObservationTier } from '../types/observation.js';

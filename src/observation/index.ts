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
export { ExecutionCapture, EXECUTIONS_CATEGORY } from './execution-capture.js';
export { DeterminismAnalyzer } from './determinism-analyzer.js';
export { PromotionDetector } from './promotion-detector.js';
export { ScriptGenerator } from './script-generator.js';
export { PromotionGatekeeper } from './promotion-gatekeeper.js';
export { DriftMonitor } from './drift-monitor.js';
export { FeedbackBridge } from './feedback-bridge.js';
export { LineageTracker } from './lineage-tracker.js';

// Types
export type { SessionStartData, SessionEndData } from './session-observer.js';
export type { PromotionResult } from './promotion-evaluator.js';
export type { RateLimitConfig, RateLimitResult, AnomalyReport } from './rate-limiter.js';
export type { CompactionConfig, CompactionResult } from './jsonl-compactor.js';
export type { ObservationTier, ExecutionContext, ToolExecutionPair, StoredExecutionBatch } from '../types/observation.js';
export type { DeterminismScore, DeterminismConfig, DeterminismClassification, ClassifiedOperation, OperationKey } from '../types/observation.js';
export type { PromotionCandidate, PromotionDetectorConfig, PromotableToolName } from '../types/observation.js';
export type { GeneratedScript, ScriptGeneratorConfig, DryRunResult } from '../types/observation.js';
export type { GatekeeperConfig, GatekeeperDecision, GatekeeperEvidence } from '../types/observation.js';
export type { DriftMonitorConfig, DriftEvent, DemotionDecision } from '../types/observation.js';
export type { LineageEntry, LineageChain, ArtifactType, PipelineStage } from '../types/observation.js';
export { normalizeObservationTier, DEFAULT_DETERMINISM_CONFIG, DEFAULT_PROMOTION_DETECTOR_CONFIG, PROMOTABLE_TOOL_NAMES } from '../types/observation.js';
export { DEFAULT_SCRIPT_GENERATOR_CONFIG, DEFAULT_GATEKEEPER_CONFIG } from '../types/observation.js';
export { DEFAULT_DRIFT_MONITOR_CONFIG } from '../types/observation.js';

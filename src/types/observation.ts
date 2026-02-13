// Observation category extends pattern categories
export type ObservationCategory = 'sessions';

// Tier discriminant for observation storage routing
export type ObservationTier = 'ephemeral' | 'persistent';

// Claude Code transcript entry format
export interface TranscriptEntry {
  uuid: string;
  parentUuid: string | null;
  isSidechain: boolean;
  sessionId: string;
  timestamp: string;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';
  message?: {
    role: 'user' | 'assistant';
    content: string;
  };
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    command?: string;
    content?: string;
    pattern?: string;
    path?: string;
  };
  tool_use_id?: string;   // Present on tool_result entries, references the tool_use
  tool_output?: string;   // The result content from tool execution
}

// Metrics for session summary
export interface SessionMetrics {
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
  uniqueFilesRead: number;
  uniqueFilesWritten: number;
  uniqueCommandsRun: number;
}

// Summarized session observation
export interface SessionObservation {
  sessionId: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  source: 'startup' | 'resume' | 'clear' | 'compact';
  reason: 'clear' | 'logout' | 'prompt_input_exit' | 'bypass_permissions_disabled' | 'other';
  metrics: SessionMetrics;
  topCommands: string[];
  topFiles: string[];
  topTools: string[];

  // Skills that were active during this session (AGENT-01)
  activeSkills: string[];

  // Tier discriminant controlling storage destination (47-01)
  tier?: ObservationTier;

  // Number of observations squashed into this one (47-02)
  squashedFrom?: number;
}

/** Execution context metadata attached to each tool execution pair (CAPT-03) */
export interface ExecutionContext {
  sessionId: string;
  phase?: string;        // Current GSD phase if known
  activeSkill?: string;  // Active skill name if known
}

/** A paired tool_use + tool_result representing one complete tool execution (CAPT-01, CAPT-02) */
export interface ToolExecutionPair {
  /** Unique ID for this pair (the tool_use uuid) */
  id: string;
  /** Tool name (e.g., 'Read', 'Write', 'Bash') */
  toolName: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
  /** Tool output content (string or stringified), null if partial */
  output: string | null;
  /** SHA-256 hash of the output content, null if partial */
  outputHash: string | null;
  /** Whether this pair is complete (has both use and result) or partial */
  status: 'complete' | 'partial';
  /** ISO timestamp of the tool_use entry */
  timestamp: string;
  /** Execution context metadata (CAPT-03) */
  context: ExecutionContext;
}

/** Storage envelope for a batch of tool execution pairs from one session (CAPT-02, CAPT-03) */
export interface StoredExecutionBatch {
  /** Session ID this batch belongs to */
  sessionId: string;
  /** Execution context for this batch */
  context: ExecutionContext;
  /** All tool execution pairs from this session */
  pairs: ToolExecutionPair[];
  /** Count of complete pairs */
  completeCount: number;
  /** Count of partial pairs */
  partialCount: number;
  /** Timestamp when this batch was captured */
  capturedAt: number;
}

// Configuration for retention management
export interface RetentionConfig {
  maxEntries: number;
  maxAgeDays: number;
}

// Default retention configuration
export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  maxEntries: 100,
  maxAgeDays: 30,
};

/**
 * Normalize observation tier field for backward compatibility.
 * Old entries without a tier field default to 'persistent'.
 */
export function normalizeObservationTier(obs: SessionObservation): SessionObservation {
  return { ...obs, tier: obs.tier ?? 'persistent' };
}

/** Configuration for determinism analysis (DTRM-04) */
export interface DeterminismConfig {
  /** Minimum number of observations required before scoring an operation (default: 3) */
  minSampleSize: number;
  /** Determinism score threshold for 'deterministic' classification (default: 0.95) */
  deterministicThreshold?: number;
  /** Determinism score threshold for 'semi-deterministic' classification (default: 0.7) */
  semiDeterministicThreshold?: number;
}

/** Default configuration for determinism analysis */
export const DEFAULT_DETERMINISM_CONFIG: DeterminismConfig = {
  minSampleSize: 3,
  deterministicThreshold: 0.95,
  semiDeterministicThreshold: 0.7,
};

/** Composite key identifying a unique tool operation: toolName + SHA-256 of JSON-serialized input */
export interface OperationKey {
  /** Tool name (e.g., 'Read', 'Write', 'Bash') */
  toolName: string;
  /** SHA-256 hex of the JSON-stringified input parameters */
  inputHash: string;
}

/** Determinism analysis result for one operation (DTRM-02) */
export interface DeterminismScore {
  /** Operation identifier (tool + input hash) */
  operation: OperationKey;
  /** Variance score: 0.0 = always identical output, 1.0 = always different */
  varianceScore: number;
  /** Total number of observations for this operation */
  observationCount: number;
  /** Number of unique output hashes seen */
  uniqueOutputs: number;
  /** Session IDs where this operation was observed */
  sessionIds: string[];
}

/** Classification tiers for determinism (DTRM-03) */
export type DeterminismClassification = 'deterministic' | 'semi-deterministic' | 'non-deterministic';

/** A DeterminismScore with its classification attached (DTRM-03) */
export interface ClassifiedOperation {
  /** The base score data */
  score: DeterminismScore;
  /** Classification based on thresholds */
  classification: DeterminismClassification;
  /** The determinism value used for classification (1 - varianceScore) */
  determinism: number;
}

/** Tool names that qualify as tool-based patterns for promotion (PRMO-04) */
export const PROMOTABLE_TOOL_NAMES = [
  'Read', 'Write', 'Bash', 'Glob', 'Grep', 'Edit', 'WebFetch',
] as const;

/** Type for promotable tool names */
export type PromotableToolName = typeof PROMOTABLE_TOOL_NAMES[number];

/** Configuration for promotion detection */
export interface PromotionDetectorConfig {
  /** Minimum determinism score to qualify as a promotion candidate (default: 0.95) */
  minDeterminism: number;
  /** Minimum confidence threshold for filtering results (default: 0.0 = no filter) */
  minConfidence: number;
  /** Approximate characters per token for savings estimation (default: 4) */
  charsPerToken: number;
}

/** Default configuration for promotion detection */
export const DEFAULT_PROMOTION_DETECTOR_CONFIG: PromotionDetectorConfig = {
  minDeterminism: 0.95,
  minConfidence: 0.0,
  charsPerToken: 4,
};

/** A promotion candidate identified by the detector (PRMO-01, PRMO-02) */
export interface PromotionCandidate {
  /** The classified operation this candidate is based on */
  operation: ClassifiedOperation;
  /** Tool name (must be a promotable tool) */
  toolName: string;
  /** Number of times this operation was invoked across sessions */
  frequency: number;
  /** Estimated token savings per invocation (based on input+output size) */
  estimatedTokenSavings: number;
  /** Composite score combining determinism, frequency, and token savings (0.0-1.0) */
  compositeScore: number;
  /** Whether this candidate passes the minimum confidence threshold */
  meetsConfidence: boolean;
}

/** Evidence collected during a gatekeeper evaluation (GATE-04) */
export interface GatekeeperEvidence {
  /** Determinism score of the candidate (1 - varianceScore) */
  determinism: number;
  /** Composite score from the promotion detector */
  compositeScore: number;
  /** Number of observations for this operation */
  observationCount: number;
  /** Configured threshold for determinism */
  thresholdDeterminism: number;
  /** Configured threshold for confidence (compositeScore) */
  thresholdConfidence: number;
  /** Configured minimum observation count */
  thresholdMinObservations: number;
  /** F1 score from calibration report (if provided) */
  f1Score?: number;
  /** Threshold for F1 score (if configured) */
  thresholdF1?: number;
  /** Accuracy from calibration report (if provided) */
  accuracy?: number;
  /** Threshold for accuracy (if configured) */
  thresholdAccuracy?: number;
  /** MCC from calibration report (if provided) */
  mcc?: number;
  /** Threshold for MCC (if configured) */
  thresholdMCC?: number;
}

/** A gatekeeper decision for a promotion candidate (GATE-01, GATE-04) */
export interface GatekeeperDecision {
  /** Whether the candidate is approved for promotion */
  approved: boolean;
  /** Human-readable reasoning for the decision (one entry per gate check) */
  reasoning: string[];
  /** Evidence: actual scores vs configured thresholds */
  evidence: GatekeeperEvidence;
  /** Reference to the evaluated candidate */
  candidate: PromotionCandidate;
  /** ISO timestamp of the decision */
  timestamp: string;
}

/** Configuration for the promotion gatekeeper (GATE-01, GATE-02) */
export interface GatekeeperConfig {
  /** Minimum determinism score required (default: 0.95) */
  minDeterminism: number;
  /** Minimum composite score (confidence) required (default: 0.85) */
  minConfidence: number;
  /** Minimum number of observations required (default: 5) */
  minObservations: number;
  /** Minimum F1 score from calibration report (optional, skipped if undefined) */
  minF1?: number;
  /** Minimum accuracy from calibration report (optional, skipped if undefined) */
  minAccuracy?: number;
  /** Minimum MCC from calibration report (optional, skipped if undefined) */
  minMCC?: number;
}

/** Default gatekeeper configuration with safe defaults (GATE-02) */
export const DEFAULT_GATEKEEPER_CONFIG: GatekeeperConfig = {
  minDeterminism: 0.95,
  minConfidence: 0.85,
  minObservations: 5,
};

/** Configuration for script generation (SCRP-01) */
export interface ScriptGeneratorConfig {
  /** Default timeout in milliseconds for generated scripts (default: 30000) */
  defaultTimeout: number;
  /** Default working directory for generated scripts (default: '.') */
  defaultWorkingDir: string;
}

/** Default configuration for script generation */
export const DEFAULT_SCRIPT_GENERATOR_CONFIG: ScriptGeneratorConfig = {
  defaultTimeout: 30000,
  defaultWorkingDir: '.',
};

/** A generated script ready for dry-run validation and promotion (SCRP-01, SCRP-02) */
export interface GeneratedScript {
  /** The OffloadOperation-conformant object (SCRP-04) */
  operation: import('../chipset/blitter/types.js').OffloadOperation;
  /** The source promotion candidate this script was generated from */
  sourceCandidate: PromotionCandidate;
  /** The raw script content (same as operation.script, exposed for inspection) */
  scriptContent: string;
  /** Whether the script passed Zod schema validation */
  isValid: boolean;
}

/** Result of a dry-run validation for a generated script (SCRP-03) */
export interface DryRunResult {
  /** The generated script that was validated */
  generatedScript: GeneratedScript;
  /** Whether the dry-run output matches the expected output */
  passed: boolean;
  /** SHA-256 hash of the actual dry-run stdout */
  actualOutputHash: string;
  /** SHA-256 hash of the expected output from stored observations */
  expectedOutputHash: string;
  /** Exit code from the dry-run execution */
  exitCode: number;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Failure reason if passed=false (null if passed=true) */
  failureReason: string | null;
}

/** Configuration for drift monitoring (FEED-03) */
export interface DriftMonitorConfig {
  /** Number of consecutive mismatches before triggering demotion (default: 3) */
  sensitivity: number;
  /** Whether drift monitoring is enabled (default: true) */
  enabled: boolean;
}

/** Default configuration for drift monitoring */
export const DEFAULT_DRIFT_MONITOR_CONFIG: DriftMonitorConfig = {
  sensitivity: 3,
  enabled: true,
};

/** A single drift check event recorded after comparing output hashes (FEED-01) */
export interface DriftEvent {
  /** Operation ID of the promoted script (toolName:inputHash format) */
  operationId: string;
  /** ISO timestamp of this drift check */
  timestamp: string;
  /** Whether the actual output matched the expected output */
  matched: boolean;
  /** SHA-256 hash of the actual execution output */
  actualHash: string;
  /** SHA-256 hash of the expected output from observations */
  expectedHash: string;
  /** Running count of consecutive mismatches (resets to 0 on match) */
  consecutiveMismatches: number;
}

/** Decision returned by the drift monitor when demotion threshold is reached (FEED-02) */
export interface DemotionDecision {
  /** Operation ID of the promoted script */
  operationId: string;
  /** Whether demotion was triggered */
  demoted: boolean;
  /** Human-readable reason for the decision */
  reason: string;
  /** Number of consecutive mismatches at time of decision */
  consecutiveMismatches: number;
  /** All drift events that contributed to this decision (most recent window) */
  events: DriftEvent[];
}

/** Artifact types in the promotion pipeline (LINE-01) */
export type ArtifactType = 'observation' | 'pattern' | 'candidate' | 'script' | 'decision' | 'execution';

/** Pipeline stages that produce artifacts (LINE-02) */
export type PipelineStage = 'capture' | 'analysis' | 'detection' | 'generation' | 'gatekeeping' | 'feedback';

/** A lineage entry recording one artifact's provenance in the pipeline (LINE-01, LINE-02) */
export interface LineageEntry {
  /** Unique artifact ID following the format for its type:
   *  - obs:{sessionId}:{toolName}:{inputHash}
   *  - pat:{toolName}:{inputHash}
   *  - cand:{toolName}:{inputHash}
   *  - script:{operationId}
   *  - gate:{operationId}:{timestamp}
   *  - exec:{operationId}:{timestamp}
   */
  artifactId: string;
  /** The type of artifact */
  artifactType: ArtifactType;
  /** The pipeline stage that produced this artifact */
  stage: PipelineStage;
  /** Artifact IDs of inputs consumed by this stage */
  inputs: string[];
  /** Artifact IDs of outputs produced by this stage */
  outputs: string[];
  /** Stage-specific decision metadata (e.g., scores, thresholds, reasoning) */
  metadata: Record<string, unknown>;
  /** ISO timestamp of when this entry was recorded */
  timestamp: string;
}

/** Full lineage chain for an artifact, with upstream and downstream traces (LINE-03) */
export interface LineageChain {
  /** The central artifact being traced */
  artifact: LineageEntry;
  /** All entries upstream (what produced this artifact, recursively) */
  upstream: LineageEntry[];
  /** All entries downstream (what this artifact produced, recursively) */
  downstream: LineageEntry[];
}

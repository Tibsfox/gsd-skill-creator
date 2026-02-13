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

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

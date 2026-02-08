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

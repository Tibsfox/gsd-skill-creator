/**
 * Magic level definitions and event visibility map.
 *
 * The magic system controls output verbosity across 5 levels.
 * Lower levels show less detail; higher levels show more.
 * Chat messages from Claude are never filtered at any level.
 *
 * @module magic/types
 */

/** 5 magic levels controlling output verbosity. Lower = less output. */
export enum MagicLevel {
  FULL_MAGIC = 1, // Shapes and colors only. No text from commands.
  GUIDED = 2, // Claude narration + summary results.
  ANNOTATED = 3, // Narration + key command output. Errors in full.
  VERBOSE = 4, // All command output + narration.
  NO_MAGIC = 5, // Raw everything. Every log line.
}

export const DEFAULT_MAGIC_LEVEL = MagicLevel.ANNOTATED;

export interface MagicConfig {
  level: MagicLevel;
  updated: string; // ISO timestamp
}

/** Describes how a filtered event should be rendered. */
export interface DisplayEvent {
  type: string;
  payload: Record<string, unknown>;
  renderMode: 'text' | 'visual';
  visual?: VisualIndicator;
  content?: string;
  summary?: string;
  showRaw?: boolean;
}

export interface VisualIndicator {
  type: 'flash' | 'fill' | 'pulse';
  color: string;
  target: string;
}

/**
 * Maps each IPC event type to the MINIMUM magic level at which it becomes visible.
 * If current level >= min level, the event renders.
 *
 * Key invariant: All chat events (chat:*) must be <= GUIDED (2) so they are
 * visible at all levels including FULL_MAGIC. Claude's words are never filtered.
 */
export const EVENT_VISIBILITY: Record<string, MagicLevel> = {
  // Always visible (all levels) -- chat messages and LED updates
  'chat:delta': MagicLevel.FULL_MAGIC,
  'chat:complete': MagicLevel.FULL_MAGIC,
  'chat:error': MagicLevel.FULL_MAGIC,
  'chat:needs_key': MagicLevel.FULL_MAGIC,
  'service:state_change': MagicLevel.FULL_MAGIC, // LED updates

  // Guided and above
  'chat:start': MagicLevel.GUIDED,
  'chat:usage': MagicLevel.GUIDED,
  'chat:retry': MagicLevel.GUIDED,
  'chat:invalid_key': MagicLevel.GUIDED,
  'chat:rate_limited': MagicLevel.GUIDED,
  'chat:interrupted': MagicLevel.GUIDED,
  'chat:server_error': MagicLevel.GUIDED,
  'service:starting': MagicLevel.GUIDED,
  'service:failed': MagicLevel.GUIDED,
  'staging:intake_complete': MagicLevel.GUIDED,

  // Annotated and above
  'service:status': MagicLevel.ANNOTATED,
  'service:command': MagicLevel.ANNOTATED,
  'service:health_check': MagicLevel.ANNOTATED,
  'staging:hygiene_result': MagicLevel.ANNOTATED,
  'staging:intake_new': MagicLevel.ANNOTATED,
  'staging:intake_processing': MagicLevel.ANNOTATED,
  'staging:quarantine': MagicLevel.ANNOTATED,
  'staging:debrief_ready': MagicLevel.ANNOTATED,
  'magic:level_changed': MagicLevel.ANNOTATED,

  // Verbose and above
  'service:stdout': MagicLevel.VERBOSE,
  'service:stderr': MagicLevel.VERBOSE,
  'staging:intake_detail': MagicLevel.VERBOSE,

  // No magic only (raw debug)
  'debug:ipc_raw': MagicLevel.NO_MAGIC,
  'debug:timing': MagicLevel.NO_MAGIC,
};

/**
 * Shared type vocabulary for the Integration layer.
 *
 * Phase 49: Integration + Health Log + Pattern Learning
 */

// ─── EventType ────────────────────────────────────────────────────────────────

/** Which pipeline phase produced this event. */
export type EventType =
  | 'audit'
  | 'diagnosis'
  | 'discovery'
  | 'resolution'
  | 'absorption';

// ─── HealthEvent ──────────────────────────────────────────────────────────────

/** The canonical log entry format for health.jsonl. */
export interface HealthEvent {
  /** Unique event ID (UUID v4). */
  id: string;
  /** ISO 8601 timestamp when the event was recorded. */
  timestamp: string;
  /** Which pipeline phase produced this event. */
  eventType: EventType;
  /** The package this event is about. */
  packageName: string;
  /** Ecosystem the package belongs to. */
  ecosystem: string;
  /** Version of the package at the time of the event. */
  packageVersion: string;
  /** Human-readable explanation of why this event occurred and what was decided. */
  decisionRationale: string;
  /** Structured payload — varies by eventType. Serializable JSON. */
  payload: Record<string, unknown>;
  /** Project identifier — used by PatternLearner for cross-project pattern detection. */
  projectId: string;
}

// ─── HealthGateResult ─────────────────────────────────────────────────────────

export type GateDecision = 'allow' | 'block';

/** Output of StagingHealthGate. */
export interface HealthGateResult {
  decision: GateDecision;
  /** List of blocking findings. Empty when decision='allow'. */
  blockingFindings: string[];
  checkedAt: string; // ISO 8601
}

// ─── PatternMatch ─────────────────────────────────────────────────────────────

/** A recurring failure pattern detected across multiple projects. */
export interface PatternMatch {
  packageName: string;
  /** Number of distinct projects where this failure pattern was observed. */
  projectCount: number;
  /** Summary of the repeated failure pattern. */
  patternSummary: string;
  /** Sorted project IDs that have observed this pattern. */
  evidenceProjectIds: string[];
}

// ─── IntegrationConfig ────────────────────────────────────────────────────────

/** Configuration for the IntegrationOrchestrator. */
export interface IntegrationConfig {
  /** Absolute path to the health.jsonl file. */
  healthLogPath: string;
  /** Threshold for pattern detection — pattern triggers after N projects. Default: 5. */
  patternThreshold?: number;
}

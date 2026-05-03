/**
 * Live Work UI — type definitions.
 * Phase 824 / C09 / T2.
 *
 * DecisionUIState is the UI rendering state (distinct from the planning-meeting
 * DecisionState which covers pending/sent_now/bundled/withdrawn).
 */

// ── DecisionUIState ──────────────────────────────────────────────────────────

export type DecisionUIState =
  | 'queued'
  | 'picked_up'
  | 'expanding'
  | 'wave_0'
  | 'wave_1'
  | 'wave_2'
  | 'wave_n'
  | 'blocked'
  | 'complete'
  | 'failed';

// ── Pill descriptor ──────────────────────────────────────────────────────────

export interface PillDescriptor {
  /** Human-readable pill text */
  label: string;
  /** CSS class applied to the pill element */
  cssClass: 'pill-queued' | 'pill-progress' | 'pill-blocked' | 'pill-complete' | 'pill-failed';
  /** Sub-status template; may contain {block_reason}, {N}, {M}, {summary_line}, {error_summary} */
  sub_status_template: string;
}

/**
 * Returns the display descriptor for a given DecisionUIState.
 * All 10 states are handled; defaults to queued style for unknown values.
 */
export function pillFor(state: DecisionUIState): PillDescriptor {
  switch (state) {
    case 'queued':
      return {
        label: 'queued',
        cssClass: 'pill-queued',
        sub_status_template: 'Awaiting pickup',
      };
    case 'picked_up':
      return {
        label: 'in progress',
        cssClass: 'pill-progress',
        sub_status_template: 'Picked up by gsd-skill-creator',
      };
    case 'expanding':
      return {
        label: 'in progress',
        cssClass: 'pill-progress',
        sub_status_template: 'Skill expanding mission package',
      };
    case 'wave_0':
      return {
        label: 'in progress',
        cssClass: 'pill-progress',
        sub_status_template: 'Wave 0 · scaffolding',
      };
    case 'wave_1':
      return {
        label: 'in progress',
        cssClass: 'pill-progress',
        sub_status_template: 'Wave 1 · {N} of {M} modules',
      };
    case 'wave_2':
      return {
        label: 'in progress',
        cssClass: 'pill-progress',
        sub_status_template: 'Wave 2 · integration',
      };
    case 'wave_n':
      return {
        label: 'in progress',
        cssClass: 'pill-progress',
        sub_status_template: 'Wave N · verification',
      };
    case 'blocked':
      return {
        label: 'blocked',
        cssClass: 'pill-blocked',
        sub_status_template: '{block_reason}',
      };
    case 'complete':
      return {
        label: 'complete',
        cssClass: 'pill-complete',
        sub_status_template: '{summary_line}',
      };
    case 'failed':
      return {
        label: 'failed',
        cssClass: 'pill-failed',
        sub_status_template: '{error_summary}',
      };
    default: {
      // Unknown state — treat as queued
      const _exhaustive: never = state;
      void _exhaustive;
      return { label: 'queued', cssClass: 'pill-queued', sub_status_template: 'Awaiting pickup' };
    }
  }
}

// ── StatusUpdateEvent ────────────────────────────────────────────────────────

/** Payload parsed from `.planning/console/outbox/status/*.json` files */
export interface StatusUpdateEvent {
  /** Links to a decision or analysis run */
  request_id: string;
  /** Present when this update is for a specific decision */
  decision_id?: string;
  /** Present when part of a bundle */
  bundle_id?: string;
  project_id: string;
  state: DecisionUIState;
  /** Freeform text for UI sub-status line */
  sub_status?: string;
  wave_progress?: { current: number; total: number };
  /** Populated when state === 'complete' */
  result_path?: string;
  /** Populated when state === 'blocked' */
  block_reason?: string;
  /** Finding IDs for micro-meeting context (populated when state === 'blocked') */
  block_findings?: string[];
  /** Populated when state === 'failed' */
  error?: string;
  /** ISO-8601 timestamp */
  updated_at: string;
}

// ── InFlightDecision ─────────────────────────────────────────────────────────

export interface InFlightDecision {
  id: string;
  bundle_id: string;
  project_id: string;
  title: string;
  state: DecisionUIState;
  sub_status?: string;
  wave_progress?: { current: number; total: number };
  result_path?: string;
  block_reason?: string;
  block_findings?: string[];
  error?: string;
  updated_at: string;
}

// ── InFlightBundle ───────────────────────────────────────────────────────────

export interface InFlightBundle {
  id: string;
  project_id: string;
  /** ISO-8601 timestamp when the bundle was committed */
  committed_at: string;
  decisions: InFlightDecision[];
  /** Milliseconds since last status update; derived at render time */
  last_update_ms?: number;
}

// ── LiveWorkState ─────────────────────────────────────────────────────────────

export interface LiveWorkState {
  /** Map of projectId → bundles in flight (most recent first) */
  bundlesByProject: Map<string, InFlightBundle[]>;
}

export function createLiveWorkState(): LiveWorkState {
  return {
    bundlesByProject: new Map(),
  };
}

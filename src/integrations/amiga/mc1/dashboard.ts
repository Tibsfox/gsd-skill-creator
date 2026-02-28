/**
 * MC-1 dashboard state manager.
 *
 * Consumes ICD-01 TELEMETRY_UPDATE and ALERT_SURFACE events from the
 * message bus and maintains per-mission state. Produces view model
 * objects (DashboardView, MissionView, TeamStatusView, CheckpointView)
 * for UI rendering.
 *
 * This is a pure state machine -- no I/O, no timers, no side effects.
 * Feed events in via processEvent(), query state via getView() and friends.
 */

import type { EventEnvelope } from '../message-envelope.js';
import type { TelemetryUpdatePayload, AlertSurfacePayload } from '../icd/icd-01.js';
import { TelemetryUpdatePayloadSchema, AlertSurfacePayloadSchema } from '../icd/icd-01.js';
import type { PhaseStatus, AlertLevel } from '../types.js';

// ============================================================================
// View Model Types
// ============================================================================

/** Per-team status indicator in the dashboard. */
export interface TeamStatusView {
  team: string;
  status: 'green' | 'amber' | 'red';
  agent_count: number;
}

/** Checkpoint entry in the dashboard. */
export interface CheckpointView {
  name: string;
  completed: boolean;
  timestamp?: string;
}

/** Per-mission view model for UI rendering. */
export interface MissionView {
  mission_id: string;
  phase: PhaseStatus;
  progress: number;
  elapsed_time: number;
  team_status: TeamStatusView[];
  checkpoints: CheckpointView[];
  alert_level: AlertLevel;
  last_updated: string;
}

/** Top-level dashboard view model. */
export interface DashboardView {
  missions: MissionView[];
  total_missions: number;
  active_missions: number;
}

// ============================================================================
// Internal State
// ============================================================================

interface MissionState {
  mission_id: string;
  first_seen: string;
  last_updated: string;
  phase: PhaseStatus;
  progress: number;
  team_status: Map<string, { status: 'green' | 'amber' | 'red'; agent_count: number }>;
  checkpoints: Map<string, CheckpointView>;
  alert_level: AlertLevel;
}

// ============================================================================
// Dashboard Class
// ============================================================================

/**
 * Dashboard state manager.
 *
 * Processes EventEnvelope objects from the AMIGA message bus and maintains
 * an internal map of mission states. Queries return immutable view model
 * objects suitable for UI rendering.
 */
export class Dashboard {
  private readonly missions: Map<string, MissionState> = new Map();

  /**
   * Process an incoming event envelope.
   *
   * Handles TELEMETRY_UPDATE and ALERT_SURFACE events. All other event
   * types are silently ignored.
   */
  processEvent(envelope: EventEnvelope): void {
    switch (envelope.type) {
      case 'TELEMETRY_UPDATE':
        this.processTelemetry(envelope);
        break;
      case 'ALERT_SURFACE':
        this.processAlert(envelope);
        break;
      default:
        // Silently ignore event types the dashboard doesn't consume
        break;
    }
  }

  /** Get all tracked missions as MissionView objects. */
  getMissions(): MissionView[] {
    return this.buildSortedViews();
  }

  /** Get a single mission by ID, or undefined if not tracked. */
  getMission(missionId: string): MissionView | undefined {
    const state = this.missions.get(missionId);
    if (!state) return undefined;
    return this.toView(state);
  }

  /** Get the checkpoint log for a mission, or empty array if unknown. */
  getCheckpoints(missionId: string): CheckpointView[] {
    const state = this.missions.get(missionId);
    if (!state) return [];
    return [...state.checkpoints.values()];
  }

  /** Build the complete DashboardView for UI rendering. */
  getView(): DashboardView {
    const views = this.buildSortedViews();
    const activePhases = new Set<PhaseStatus>(['BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'HOLD']);
    const activeMissions = views.filter((v) => activePhases.has(v.phase)).length;

    return {
      missions: views,
      total_missions: views.length,
      active_missions: activeMissions,
    };
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private processTelemetry(envelope: EventEnvelope): void {
    const parsed = TelemetryUpdatePayloadSchema.safeParse(envelope.payload);
    if (!parsed.success) return;

    const payload: TelemetryUpdatePayload = parsed.data;
    const missionId = payload.mission_id;
    const timestamp = envelope.timestamp;

    let state = this.missions.get(missionId);
    if (!state) {
      state = {
        mission_id: missionId,
        first_seen: timestamp,
        last_updated: timestamp,
        phase: payload.phase,
        progress: payload.progress,
        team_status: new Map(),
        checkpoints: new Map(),
        alert_level: 'nominal',
      };
      this.missions.set(missionId, state);
    }

    // Update state
    state.last_updated = timestamp;
    state.phase = payload.phase;
    state.progress = payload.progress;

    // Reset alert level on new telemetry (advisory clears when fresh data arrives)
    state.alert_level = 'nominal';

    // Update team status
    state.team_status.clear();
    for (const [team, entry] of Object.entries(payload.team_status)) {
      state.team_status.set(team, {
        status: entry.status,
        agent_count: entry.agent_count,
      });
    }

    // Update checkpoints (deduplicate by name)
    for (const cp of payload.checkpoints) {
      state.checkpoints.set(cp.name, {
        name: cp.name,
        completed: cp.completed,
        timestamp: cp.timestamp,
      });
    }
  }

  private processAlert(envelope: EventEnvelope): void {
    const parsed = AlertSurfacePayloadSchema.safeParse(envelope.payload);
    if (!parsed.success) return;

    const payload: AlertSurfacePayload = parsed.data;

    // AlertSurfacePayload doesn't have mission_id directly.
    // Use correlation if available, otherwise fall back to most recently updated mission.
    let targetMission: MissionState | undefined;

    if (envelope.correlation) {
      // Correlation could be a mission ID
      targetMission = this.missions.get(envelope.correlation);
    }

    if (!targetMission) {
      // Fall back to most recently updated mission
      let latest: MissionState | undefined;
      let latestTime = '';
      for (const state of this.missions.values()) {
        if (state.last_updated >= latestTime) {
          latestTime = state.last_updated;
          latest = state;
        }
      }
      targetMission = latest;
    }

    if (!targetMission) {
      // No missions exist yet -- create a synthetic entry
      // This shouldn't happen in normal operation but handles edge cases
      return;
    }

    targetMission.alert_level = payload.alert_level;
    targetMission.last_updated = envelope.timestamp;
  }

  private toView(state: MissionState): MissionView {
    const elapsedMs = Date.parse(state.last_updated) - Date.parse(state.first_seen);

    return {
      mission_id: state.mission_id,
      phase: state.phase,
      progress: state.progress,
      elapsed_time: Math.max(0, elapsedMs),
      team_status: [...state.team_status.entries()].map(([team, entry]) => ({
        team,
        status: entry.status,
        agent_count: entry.agent_count,
      })),
      checkpoints: [...state.checkpoints.values()],
      alert_level: state.alert_level,
      last_updated: state.last_updated,
    };
  }

  private buildSortedViews(): MissionView[] {
    const views: MissionView[] = [];
    for (const state of this.missions.values()) {
      views.push(this.toView(state));
    }
    // Sort by last_updated descending (most recent first)
    views.sort((a, b) => b.last_updated.localeCompare(a.last_updated));
    return views;
  }
}

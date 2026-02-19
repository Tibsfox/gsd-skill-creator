/**
 * ME-1 phase engine.
 *
 * Manages lifecycle transitions through the 6 canonical mission phases:
 * BRIEFING -> PLANNING -> EXECUTION -> INTEGRATION -> REVIEW_GATE -> COMPLETION
 *
 * The engine:
 * - Enforces the transition graph (no skipping, no backwards)
 * - Checks entry criteria before allowing forward transitions
 * - Emits TELEMETRY_UPDATE on every successful transition
 * - Emits GATE_SIGNAL when entering REVIEW_GATE
 * - Supports HOLD (pause) from any active phase and resume to prior phase
 * - Supports ABORT from any non-terminal phase
 * - Treats COMPLETION and ABORT as terminal (no further transitions)
 * - Updates the manifest with started_at/completed_at timestamps
 */

import { updateManifest } from './manifest.js';
import type { MissionManifest, PhaseEntry } from './manifest.js';
import type { TelemetryEmitter } from './telemetry-emitter.js';

// ============================================================================
// Constants
// ============================================================================

/** Canonical lifecycle phase order (excludes HOLD and ABORT). */
export const PHASE_ORDER: readonly string[] = [
  'BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION',
] as const;

/** Valid transitions from each phase. */
export const VALID_TRANSITIONS: ReadonlyMap<string, readonly string[]> = new Map([
  ['BRIEFING',      ['PLANNING', 'HOLD', 'ABORT']],
  ['PLANNING',      ['EXECUTION', 'HOLD', 'ABORT']],
  ['EXECUTION',     ['INTEGRATION', 'HOLD', 'ABORT']],
  ['INTEGRATION',   ['REVIEW_GATE', 'HOLD', 'ABORT']],
  ['REVIEW_GATE',   ['COMPLETION', 'HOLD', 'ABORT']],
  ['COMPLETION',    []], // terminal
  ['HOLD',          ['ABORT']], // resume handled separately
  ['ABORT',         []], // terminal
]);

// ============================================================================
// Types
// ============================================================================

/** Result of a phase transition attempt. */
export type PhaseTransitionResult =
  | { success: true; from: string; to: string }
  | { success: false; from: string; to: string; error: string };

// ============================================================================
// PhaseEngine
// ============================================================================

/**
 * Manages mission lifecycle transitions with entry criteria enforcement
 * and telemetry emission.
 */
export class PhaseEngine {
  private manifest: MissionManifest;
  private readonly emitter: TelemetryEmitter;
  private currentPhase: string;
  private holdResumePhase: string | null;
  private entryCriteria: Map<string, Array<{ name: string; met: boolean; description?: string }>>;

  constructor(config: { manifest: MissionManifest; emitter: TelemetryEmitter }) {
    this.manifest = config.manifest;
    this.emitter = config.emitter;
    this.currentPhase = 'BRIEFING';
    this.holdResumePhase = null;
    this.entryCriteria = new Map();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /** Get the current mission phase. */
  getCurrentPhase(): string {
    return this.currentPhase;
  }

  /** Get the current manifest state. */
  getManifest(): MissionManifest {
    return this.manifest;
  }

  /**
   * Attempt to transition to a new phase.
   *
   * Validates:
   * 1. Current phase is not terminal (COMPLETION, ABORT)
   * 2. Target phase is in the valid transitions set for current phase
   * 3. Entry criteria for the target phase are all met (lifecycle phases only)
   *
   * On success: updates manifest timestamps, emits telemetry, and returns result.
   * On failure: returns error without side effects.
   */
  transition(targetPhase: string): PhaseTransitionResult {
    const from = this.currentPhase;

    // Check terminal states
    if (from === 'COMPLETION' || from === 'ABORT') {
      return {
        success: false,
        from,
        to: targetPhase,
        error: `Cannot transition from terminal phase ${from}`,
      };
    }

    // Check valid transitions
    const allowed = VALID_TRANSITIONS.get(from) ?? [];
    if (!allowed.includes(targetPhase)) {
      return {
        success: false,
        from,
        to: targetPhase,
        error: `Invalid transition from ${from} to ${targetPhase}. Valid targets: ${allowed.join(', ') || 'none'}`,
      };
    }

    // Check entry criteria for lifecycle phases (not HOLD/ABORT)
    if (targetPhase !== 'HOLD' && targetPhase !== 'ABORT') {
      const criteria = this.entryCriteria.get(targetPhase);
      if (criteria) {
        const unmet = criteria.filter((c) => !c.met);
        if (unmet.length > 0) {
          const names = unmet.map((c) => c.name).join(', ');
          return {
            success: false,
            from,
            to: targetPhase,
            error: `Unmet entry criteria for ${targetPhase}: ${names}`,
          };
        }
      }
    }

    const now = new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z');

    // Mark completed_at on the exiting phase (if it exists in the manifest)
    if (from !== 'HOLD' && this.manifest.phases[from]) {
      const exitingPhase: PhaseEntry = {
        ...this.manifest.phases[from],
        completed_at: now,
      };
      const updatedPhases = { ...this.manifest.phases, [from]: exitingPhase };
      this.manifest = updateManifest(this.manifest, { phases: updatedPhases });
    }

    // Store resume phase for HOLD
    if (targetPhase === 'HOLD') {
      this.holdResumePhase = from;
    }

    // Update current phase
    this.currentPhase = targetPhase;

    // Mark started_at on the entering phase (if it exists in the manifest)
    if (targetPhase !== 'HOLD' && targetPhase !== 'ABORT') {
      if (this.manifest.phases[targetPhase]) {
        const enteringPhase: PhaseEntry = {
          ...this.manifest.phases[targetPhase],
          status: targetPhase as PhaseEntry['status'],
          started_at: now,
        };
        const updatedPhases = { ...this.manifest.phases, [targetPhase]: enteringPhase };
        this.manifest = updateManifest(this.manifest, { phases: updatedPhases });
      }
    }

    // Emit telemetry
    const progress = this.computeProgress();
    this.emitter.emitTelemetry({
      phase: this.resolvePhaseStatus(),
      progress,
      team_status: {},
      checkpoints: [],
      resources: { cpu_percent: 0, memory_mb: 0, active_agents: 0 },
    });

    // Emit gate signal for REVIEW_GATE
    if (targetPhase === 'REVIEW_GATE') {
      const criteria = this.entryCriteria.get('REVIEW_GATE') ?? [];
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .replace(/(\.\d{3})\d*Z/, '$1Z');
      this.emitter.emitGateSignal({
        gate_type: 'phase_transition',
        blocking_phase: 'REVIEW_GATE',
        criteria: criteria.length > 0
          ? criteria.map((c) => ({ name: c.name, met: c.met }))
          : [{ name: 'Review gate reached', met: true }],
        deadline,
      });
    }

    return { success: true, from, to: targetPhase };
  }

  /**
   * Resume from HOLD to the previous active phase.
   *
   * Only valid when current phase is HOLD and a resume phase was stored.
   */
  resume(): PhaseTransitionResult {
    if (this.currentPhase !== 'HOLD') {
      return {
        success: false,
        from: this.currentPhase,
        to: 'unknown',
        error: 'Cannot resume: not currently in HOLD phase',
      };
    }

    if (!this.holdResumePhase) {
      return {
        success: false,
        from: 'HOLD',
        to: 'unknown',
        error: 'Cannot resume: no previous phase stored',
      };
    }

    const resumeTo = this.holdResumePhase;
    this.currentPhase = resumeTo;
    this.holdResumePhase = null;

    // Emit telemetry
    this.emitter.emitTelemetry({
      phase: this.resolvePhaseStatus(),
      progress: this.computeProgress(),
      team_status: {},
      checkpoints: [],
      resources: { cpu_percent: 0, memory_mb: 0, active_agents: 0 },
    });

    return { success: true, from: 'HOLD', to: resumeTo };
  }

  /**
   * Set entry criteria for a phase.
   *
   * These criteria must all be met before a transition to the phase is allowed.
   */
  setEntryCriteria(
    phase: string,
    criteria: Array<{ name: string; met: boolean; description?: string }>,
  ): void {
    this.entryCriteria.set(phase, [...criteria]);
  }

  /**
   * Mark a specific criterion as met for a phase.
   *
   * @param phase - The phase whose criteria to update
   * @param criterionName - The name of the criterion to mark as met
   */
  markCriterionMet(phase: string, criterionName: string): void {
    const criteria = this.entryCriteria.get(phase);
    if (criteria) {
      const criterion = criteria.find((c) => c.name === criterionName);
      if (criterion) {
        criterion.met = true;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /** Compute progress percentage based on current phase position. */
  private computeProgress(): number {
    const idx = PHASE_ORDER.indexOf(this.currentPhase);
    if (idx === -1) {
      // HOLD, ABORT, or unknown
      if (this.currentPhase === 'COMPLETION') return 100;
      if (this.currentPhase === 'ABORT') return 0;
      return 0;
    }
    return Math.round((idx / (PHASE_ORDER.length - 1)) * 100);
  }

  /** Resolve the current phase to a valid PhaseStatus value. */
  private resolvePhaseStatus(): 'BRIEFING' | 'PLANNING' | 'EXECUTION' | 'INTEGRATION' | 'REVIEW_GATE' | 'COMPLETION' | 'HOLD' | 'ABORT' {
    return this.currentPhase as 'BRIEFING' | 'PLANNING' | 'EXECUTION' | 'INTEGRATION' | 'REVIEW_GATE' | 'COMPLETION' | 'HOLD' | 'ABORT';
  }
}

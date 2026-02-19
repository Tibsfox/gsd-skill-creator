/**
 * ME-1 gate controller.
 *
 * Wraps a PhaseEngine to intercept REVIEW_GATE transitions and suspend
 * execution until a user (or MC-1) provides clearance. The controller
 * preserves full engine state during suspension and supports all three
 * gate decisions:
 * - go: advance to COMPLETION
 * - no_go: remain at REVIEW_GATE (still suspended)
 * - redirect: transition to a specified non-terminal phase
 *
 * The GateController is the human-in-the-loop mechanism that makes AMIGA
 * missions interactive. It sits between the PhaseEngine (mechanical state
 * machine) and the decision maker (human or MC-1 agent).
 */

import { PhaseEngine, PHASE_ORDER } from './phase-engine.js';
import type { MissionManifest } from './manifest.js';
import type { TelemetryEmitter } from './telemetry-emitter.js';

// ============================================================================
// Types
// ============================================================================

/** Configuration for creating a GateController. */
export interface GateControllerConfig {
  /** The phase engine to wrap. */
  engine: PhaseEngine;
  /** The telemetry emitter for gate events. */
  emitter: TelemetryEmitter;
}

/** A gate clearance decision provided by a human or agent. */
export interface GateClearance {
  /** The gate decision: go, no_go, or redirect. */
  decision: 'go' | 'no_go' | 'redirect';
  /** Mandatory reasoning for the decision. */
  reasoning: string;
  /** Who made the decision (agent ID or 'human'). */
  responder: string;
  /** Target phase for redirect decisions. Required when decision is 'redirect'. */
  redirectTarget?: string;
}

/** Snapshot of a gate suspension state. */
export interface GateSuspension {
  /** The phase at which the engine is suspended (always 'REVIEW_GATE'). */
  phase: string;
  /** The manifest snapshot at suspension time. */
  manifest: MissionManifest;
  /** ISO 8601 timestamp when suspension occurred. */
  suspendedAt: string;
  /** ID of the GATE_SIGNAL event that triggered the suspension. */
  gateSignalId: string;
}

// ============================================================================
// Terminal phases
// ============================================================================

const TERMINAL_PHASES = new Set(['COMPLETION', 'ABORT']);

// ============================================================================
// GateController
// ============================================================================

/**
 * Manages gate suspension and resume on top of PhaseEngine.
 *
 * Intercepts REVIEW_GATE transitions, parks execution, and exposes a
 * promise-based API for clearance. All gate decisions emit telemetry
 * events for audit trail purposes.
 */
export class GateController {
  private engine: PhaseEngine;
  private readonly emitter: TelemetryEmitter;
  private suspension: GateSuspension | null;
  private clearanceResolve: ((result: { decision: string; from: string; to: string }) => void) | null;

  constructor(config: GateControllerConfig) {
    this.engine = config.engine;
    this.emitter = config.emitter;
    this.suspension = null;
    this.clearanceResolve = null;
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /** Check if the controller is currently suspended at a gate. */
  isSuspended(): boolean {
    return this.suspension !== null;
  }

  /** Get the current gate suspension details, or null if not suspended. */
  getSuspension(): GateSuspension | null {
    return this.suspension;
  }

  /** Get the current phase from the underlying engine. */
  getCurrentPhase(): string {
    return this.engine.getCurrentPhase();
  }

  /** Get the current manifest from the underlying engine. */
  getManifest(): MissionManifest {
    return this.engine.getManifest();
  }

  /**
   * Advance the engine through all lifecycle phases until REVIEW_GATE.
   *
   * Transitions from the current phase forward through the canonical
   * lifecycle order until REVIEW_GATE is reached, then suspends.
   *
   * @throws If engine is at a terminal state (COMPLETION or ABORT)
   */
  advanceToGate(): void {
    const current = this.engine.getCurrentPhase();

    if (TERMINAL_PHASES.has(current)) {
      throw new Error(`Cannot advance to gate: engine is at terminal phase ${current}`);
    }

    // Find current position in PHASE_ORDER and advance to REVIEW_GATE
    const currentIdx = PHASE_ORDER.indexOf(current);
    const gateIdx = PHASE_ORDER.indexOf('REVIEW_GATE');

    if (currentIdx >= gateIdx) {
      throw new Error(`Cannot advance to gate: engine is already at or past REVIEW_GATE (current: ${current})`);
    }

    // Transition through each phase up to and including REVIEW_GATE
    for (let i = currentIdx + 1; i <= gateIdx; i++) {
      const target = PHASE_ORDER[i];
      const result = this.engine.transition(target);
      if (!result.success) {
        throw new Error(`Failed to advance to ${target}: ${(result as { error: string }).error}`);
      }
    }

    // Now at REVIEW_GATE -- capture GATE_SIGNAL event ID
    const eventLog = this.emitter.getEventLog();
    const gateSignals = eventLog.filter(e => e.type === 'GATE_SIGNAL');
    const lastGateSignal = gateSignals[gateSignals.length - 1];

    this.suspension = {
      phase: 'REVIEW_GATE',
      manifest: this.engine.getManifest(),
      suspendedAt: new Date().toISOString(),
      gateSignalId: lastGateSignal?.id ?? `gate-${Date.now()}`,
    };
  }

  /**
   * Returns a promise that resolves when the gate is cleared.
   *
   * The promise resolves with the clearance result containing the
   * decision, source phase, and destination phase.
   *
   * @throws If not currently suspended
   */
  waitForClearance(): Promise<{ decision: string; from: string; to: string }> {
    if (!this.suspension) {
      throw new Error('Cannot wait for clearance: controller is not suspended');
    }

    return new Promise((resolve) => {
      this.clearanceResolve = resolve;
    });
  }

  /**
   * Clear the gate with a decision.
   *
   * - 'go': advance to COMPLETION
   * - 'no_go': remain at REVIEW_GATE (still suspended)
   * - 'redirect': transition to redirectTarget phase
   *
   * All decisions emit a TELEMETRY_UPDATE reflecting the outcome.
   *
   * @throws If not suspended
   * @throws If redirect without redirectTarget
   * @throws If redirect to terminal state
   */
  clearGate(clearance: GateClearance): void {
    if (!this.suspension) {
      throw new Error('Cannot clear gate when not suspended');
    }

    const { decision, reasoning, responder, redirectTarget } = clearance;

    // Validate redirect requirements
    if (decision === 'redirect') {
      if (!redirectTarget) {
        throw new Error('redirectTarget is required for redirect decision');
      }
      if (TERMINAL_PHASES.has(redirectTarget)) {
        throw new Error(`Cannot redirect to terminal phase ${redirectTarget}`);
      }
    }

    switch (decision) {
      case 'go': {
        const result = this.engine.transition('COMPLETION');
        if (!result.success) {
          throw new Error(`Failed to transition to COMPLETION: ${(result as { error: string }).error}`);
        }
        this.suspension = null;
        if (this.clearanceResolve) {
          this.clearanceResolve({ decision: 'go', from: 'REVIEW_GATE', to: 'COMPLETION' });
          this.clearanceResolve = null;
        }
        break;
      }

      case 'no_go': {
        // Stay at REVIEW_GATE, remain suspended
        // Emit telemetry for the no_go hold
        this.emitter.emitTelemetry({
          phase: 'REVIEW_GATE',
          progress: this.computeProgress(),
          team_status: {},
          checkpoints: [],
          resources: { cpu_percent: 0, memory_mb: 0, active_agents: 0 },
        });
        if (this.clearanceResolve) {
          this.clearanceResolve({ decision: 'no_go', from: 'REVIEW_GATE', to: 'REVIEW_GATE' });
          this.clearanceResolve = null;
        }
        break;
      }

      case 'redirect': {
        // Create a new engine at the redirect target phase
        const manifest = this.engine.getManifest();
        const newEngine = new PhaseEngine({ manifest, emitter: this.emitter });

        // Advance the new engine to the redirect target
        const targetIdx = PHASE_ORDER.indexOf(redirectTarget!);
        if (targetIdx > 0) {
          for (let i = 1; i <= targetIdx; i++) {
            newEngine.transition(PHASE_ORDER[i]);
          }
        }

        // Emit telemetry for the redirect
        this.emitter.emitTelemetry({
          phase: newEngine.getCurrentPhase() as 'BRIEFING' | 'PLANNING' | 'EXECUTION' | 'INTEGRATION' | 'REVIEW_GATE' | 'COMPLETION' | 'HOLD' | 'ABORT',
          progress: this.computeProgress(),
          team_status: {},
          checkpoints: [],
          resources: { cpu_percent: 0, memory_mb: 0, active_agents: 0 },
        });

        this.engine = newEngine;
        this.suspension = null;
        if (this.clearanceResolve) {
          this.clearanceResolve({ decision: 'redirect', from: 'REVIEW_GATE', to: redirectTarget! });
          this.clearanceResolve = null;
        }
        break;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /** Compute progress percentage based on current phase position. */
  private computeProgress(): number {
    const idx = PHASE_ORDER.indexOf(this.engine.getCurrentPhase());
    if (idx === -1) return 0;
    return Math.round((idx / (PHASE_ORDER.length - 1)) * 100);
  }
}

// Wonder Warden — The safety system that enforces "wonder before formalism."
//
// Four modes: annotate, gate, redirect, shelter.
// One hard boundary: the understand phase requires wonder + see + touch.
// Everything else is soft guidance. Inter-wing navigation is never gated.
// The Warden is never punitive, never shaming. It is a gentle guide.
//
// Messages never contain: "wrong", "failed", "behind", "slow", "should have".

import type {
  FoundationId,
  PhaseType,
  LearnerState,
  WardenDecision,
  WardenMode,
  ShelterOption,
} from '../types/index';

import { FOUNDATION_ORDER, PHASE_ORDER } from '../types/index';
import { getFoundation } from '../core/registry';
import type { ConnectionGraph } from '../core/connections';

// ─── WonderWarden ──────────────────────────────────────────────

export class WonderWarden {

  constructor(
    private connectionGraph: ConnectionGraph,
  ) {}

  // ── Access Check ───────────────────────────────────────

  /**
   * Checks whether the learner can access a target phase within a foundation.
   *
   * Rules matrix:
   *   wonder     → always allowed
   *   see        → wonder complete (soft) → annotate if not
   *   touch      → see complete (soft) → annotate if not
   *   understand → wonder + see + touch required → gate (HARD boundary)
   *   connect    → understand complete (soft) → annotate if not
   *   create     → touch minimum (soft) → annotate if not
   *
   * Inter-wing navigation is NEVER gated — only intra-wing phase ordering.
   * Bypass persistence: if the learner has previously bypassed this gate,
   * access is allowed without re-prompting.
   */
  checkAccess(
    state: LearnerState,
    targetFoundation: FoundationId,
    targetPhase: PhaseType,
  ): WardenDecision {
    // Wonder is always allowed — the door is always open
    if (targetPhase === 'wonder') {
      return { allowed: true, mode: 'annotate', reason: 'Wonder is always open.' };
    }

    // Check if this gate was previously bypassed
    if (this.hasBypassed(state, targetFoundation, targetPhase)) {
      return { allowed: true, mode: 'annotate', reason: 'Previously explored — welcome back.' };
    }

    const completed = state.completedPhases[targetFoundation] ?? [];

    switch (targetPhase) {
      case 'see': {
        if (!completed.includes('wonder')) {
          return {
            allowed: true,
            mode: 'annotate',
            reason: 'Have you explored the story? The wonder phase sets the scene for what you are about to see.',
            suggestion: 'wonder',
          };
        }
        return { allowed: true, mode: 'annotate', reason: 'Ready to see.' };
      }

      case 'touch': {
        if (!completed.includes('see')) {
          return {
            allowed: true,
            mode: 'annotate',
            reason: 'The pattern is best understood visually first. The See phase shows you the shape before your hands explore it.',
            suggestion: 'see',
          };
        }
        return { allowed: true, mode: 'annotate', reason: 'Ready to touch.' };
      }

      case 'understand': {
        // HARD boundary — the only gate in the system
        const hasWonder = completed.includes('wonder');
        const hasSee = completed.includes('see');
        const hasTouch = completed.includes('touch');

        if (!hasWonder || !hasSee || !hasTouch) {
          const missing: string[] = [];
          if (!hasWonder) missing.push('wonder');
          if (!hasSee) missing.push('see');
          if (!hasTouch) missing.push('touch');

          return {
            allowed: false,
            mode: 'gate',
            reason: `Formal notation builds on what your hands already know. The ${missing.join(', ')} ${missing.length === 1 ? 'phase' : 'phases'} ${missing.length === 1 ? 'helps' : 'help'} build the intuition that makes the math meaningful.`,
            suggestion: missing[0],
          };
        }
        return { allowed: true, mode: 'annotate', reason: 'The intuition is built. Ready for the language.' };
      }

      case 'connect': {
        if (!completed.includes('understand')) {
          return {
            allowed: true,
            mode: 'annotate',
            reason: 'Connections are richer after understanding the math. The patterns become clearer when you have the language for them.',
            suggestion: 'understand',
          };
        }
        return { allowed: true, mode: 'annotate', reason: 'Ready to connect.' };
      }

      case 'create': {
        if (!completed.includes('touch')) {
          return {
            allowed: true,
            mode: 'annotate',
            reason: 'Creating is most fun after you have explored the interactive elements. The Touch phase gives your hands the vocabulary for making.',
            suggestion: 'touch',
          };
        }
        return { allowed: true, mode: 'annotate', reason: 'Ready to create.' };
      }

      default:
        return { allowed: true, mode: 'annotate', reason: 'Access granted.' };
    }
  }

  // ── Mode Query ─────────────────────────────────────────

  /**
   * Returns the Warden mode for a given foundation+phase combination.
   * This is the static rule — it does not consider learner state.
   */
  getMode(_foundation: FoundationId, phase: PhaseType): WardenMode {
    switch (phase) {
      case 'wonder':     return 'annotate';
      case 'see':        return 'annotate';
      case 'touch':      return 'annotate';
      case 'understand': return 'gate';
      case 'connect':    return 'annotate';
      case 'create':     return 'annotate';
      default:           return 'annotate';
    }
  }

  // ── Phase Completion Queries ───────────────────────────

  isWonderComplete(state: LearnerState, foundation: FoundationId): boolean {
    const completed = state.completedPhases[foundation] ?? [];
    return completed.includes('wonder');
  }

  isSeeComplete(state: LearnerState, foundation: FoundationId): boolean {
    const completed = state.completedPhases[foundation] ?? [];
    return completed.includes('see');
  }

  isTouchComplete(state: LearnerState, foundation: FoundationId): boolean {
    const completed = state.completedPhases[foundation] ?? [];
    return completed.includes('touch');
  }

  // ── Bypass Tracking ────────────────────────────────────

  /**
   * Records a bypass for a specific foundation+phase.
   * Returns a new LearnerState with the bypass persisted.
   * The Warden never asks the same question twice.
   */
  recordBypass(state: LearnerState, foundation: FoundationId, phase: PhaseType): LearnerState {
    const existing = state.bypasses[foundation] ?? [];

    // Already recorded — return unchanged
    if (existing.includes(phase)) {
      return state;
    }

    return {
      ...state,
      bypasses: {
        ...state.bypasses,
        [foundation]: [...existing, phase],
      },
    };
  }

  /**
   * Checks whether the learner has previously bypassed a specific gate.
   */
  hasBypassed(state: LearnerState, foundation: FoundationId, phase: PhaseType): boolean {
    const bypassed = state.bypasses[foundation] ?? [];
    return bypassed.includes(phase);
  }

  /**
   * Total bypass count across all foundations and phases.
   */
  getBypassCount(state: LearnerState): number {
    let count = 0;
    for (const id of FOUNDATION_ORDER) {
      const bypassed = state.bypasses[id] ?? [];
      count += bypassed.length;
    }
    return count;
  }

  // ── Shelter Mode ───────────────────────────────────────

  /**
   * Detects when a learner is genuinely stuck in a phase.
   *
   * Stuck = (timeInPhaseMs > 300000) OR (visitCount >= 3)
   * That is: more than 5 minutes without completion, or 3+ visits
   * without advancing.
   *
   * This is separate from the access rules — shelter activates when
   * a learner who IS in the right place still cannot progress.
   */
  detectStuck(
    _state: LearnerState,
    _foundation: FoundationId,
    _phase: PhaseType,
    timeInPhaseMs: number,
    visitCount: number,
  ): boolean {
    return timeInPhaseMs > 300000 || visitCount >= 3;
  }

  /**
   * Returns shelter options for a stuck learner.
   *
   * Four types of shelter, each offering a different door into the same room:
   *   1. alternative-wonder — a different angle on the same phenomenon
   *   2. simpler-interactive — fewer parameters, clearer cause-and-effect
   *   3. connection-from-familiar — bridge from a completed foundation
   *   4. journal-prompt — name the confusion, sometimes that dissolves it
   *
   * Message pattern: "This is a hard room. Here's another way in."
   * Never: "Try something easier."
   *
   * connection-from-familiar only references foundations the learner has
   * already completed.
   */
  getShelterOptions(
    state: LearnerState,
    foundation: FoundationId,
    phase: PhaseType,
  ): ShelterOption[] {
    const foundationData = getFoundation(foundation);
    const options: ShelterOption[] = [];

    // 1. Alternative wonder — a second angle on the same phenomenon
    options.push({
      type: 'alternative-wonder',
      description: `This is a hard room. Here's another way in: ${foundationData.name} also appears in ${this.getAlternativeWonderContext(foundation)}. Sometimes a different starting point reveals the same truth.`,
    });

    // 2. Simpler interactive — reduced parameters
    options.push({
      type: 'simpler-interactive',
      description: `This is a hard room. Here's another way in: a simpler version of this exploration with fewer moving parts. One thing changes at a time, so the pattern is clearer.`,
    });

    // 3. Connection from familiar ground — only from completed foundations
    const completedFoundations = FOUNDATION_ORDER.filter(id => {
      const completed = state.completedPhases[id] ?? [];
      return completed.length >= PHASE_ORDER.length && id !== foundation;
    });

    if (completedFoundations.length > 0) {
      // Find the most strongly connected completed foundation
      let bestConnection: FoundationId | null = null;
      let bestStrength = -1;

      for (const completedId of completedFoundations) {
        const conn = this.connectionGraph.getConnection(completedId, foundation)
          ?? this.connectionGraph.getConnection(foundation, completedId);
        if (conn && conn.strength > bestStrength) {
          bestStrength = conn.strength;
          bestConnection = completedId;
        }
      }

      // If no direct connection, use the first completed foundation
      if (!bestConnection) {
        bestConnection = completedFoundations[0]!;
      }

      const familiarName = getFoundation(bestConnection).name;
      options.push({
        type: 'connection-from-familiar',
        description: `This is a hard room. Here's another way in: you understood ${familiarName}. ${foundationData.name} is what happens when you ask a new question about that same idea.`,
        targetFoundation: bestConnection,
      });
    }

    // 4. Journal prompt — naming the confusion
    options.push({
      type: 'journal-prompt',
      description: `This is a hard room. Here's another way in: write down what feels confusing. Sometimes naming the knot is what loosens it.`,
    });

    return options;
  }

  // ── Private Helpers ────────────────────────────────────

  /**
   * Returns a natural-language context for an alternative wonder story.
   * Uses the foundation's wonder connections to suggest a different angle.
   */
  private getAlternativeWonderContext(foundation: FoundationId): string {
    const data = getFoundation(foundation);
    const connections = data.wonderConnections;

    if (connections.length >= 2) {
      // Use the second wonder connection as the alternative
      return connections[1]!.phenomenon.toLowerCase();
    }
    if (connections.length === 1) {
      return connections[0]!.phenomenon.toLowerCase();
    }

    // Fallback — use the subtitle
    return `the world of ${data.subtitle.toLowerCase()}`;
  }
}

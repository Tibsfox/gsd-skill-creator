/**
 * Chipset initialization state machine -- pure functions for boot sequencing.
 *
 * Advances a BootState through init -> chipset -> ready -> complete phases
 * based on elapsed time. Each chipset (Agnus, Denise, Paula, Gary) has a
 * configurable delay. The state machine is pure: no side effects, no DOM,
 * no timers. The renderer calls advanceSequence() with delta time each frame.
 */
import { CHIPSETS, BOOT_TIMING } from './types.js';
import type { BootState, ChipsetDef } from './types.js';

// Re-export BootState as ChipsetSequence for semantic clarity
export type ChipsetSequence = BootState;

// ---------------------------------------------------------------------------
// State Machine
// ---------------------------------------------------------------------------

/**
 * Advance the boot sequence by deltaMs milliseconds.
 *
 * Pure function: returns a new BootState. Terminal states (complete, skipped)
 * return the original reference unchanged for identity checks.
 */
export function advanceSequence(state: BootState, deltaMs: number): BootState {
  // Terminal states -- no-op, return original reference
  if (state.phase === 'complete' || state.phase === 'skipped') {
    return state;
  }

  let next: BootState = {
    phase: state.phase,
    elapsedMs: state.elapsedMs + deltaMs,
    activeChipsetIndex: state.activeChipsetIndex,
    chipsetStatuses: [...state.chipsetStatuses],
  };

  // Init phase: wait for initDurationMs, then transition to chipset
  if (next.phase === 'init' && next.elapsedMs >= BOOT_TIMING.initDurationMs) {
    next = {
      phase: 'chipset',
      elapsedMs: 0,
      activeChipsetIndex: 0,
      chipsetStatuses: [...next.chipsetStatuses],
    };
  }

  // Chipset phase: advance through chipsets based on cumulative delay
  if (next.phase === 'chipset') {
    // Calculate cumulative threshold for current chipset
    while (next.activeChipsetIndex < CHIPSETS.length) {
      const threshold = CHIPSETS[next.activeChipsetIndex].delayMs;

      if (next.elapsedMs >= threshold) {
        next.chipsetStatuses[next.activeChipsetIndex] = true;

        // Check if this was the last chipset
        if (next.activeChipsetIndex >= CHIPSETS.length - 1) {
          next = {
            phase: 'ready',
            elapsedMs: 0,
            activeChipsetIndex: next.activeChipsetIndex,
            chipsetStatuses: [...next.chipsetStatuses],
          };
          break;
        }

        // Subtract this chipset's delay and move to next
        next.elapsedMs -= threshold;
        next.activeChipsetIndex++;
      } else {
        break;
      }
    }
  }

  // Ready phase: wait for readyDurationMs, then transition to complete
  if (next.phase === 'ready' && next.elapsedMs >= BOOT_TIMING.readyDurationMs) {
    next = {
      ...next,
      phase: 'complete',
    };
  }

  return next;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the chipset currently being initialized, or null if not in
 * chipset phase.
 */
export function getActiveChipset(state: BootState): ChipsetDef | null {
  if (state.phase === 'chipset' && state.activeChipsetIndex >= 0) {
    return CHIPSETS[state.activeChipsetIndex] ?? null;
  }
  return null;
}

/** Returns true if the boot sequence has finished (complete or skipped). */
export function isSequenceComplete(state: BootState): boolean {
  return state.phase === 'complete' || state.phase === 'skipped';
}

/**
 * Returns boot progress as a number from 0.0 to 1.0.
 *
 * Approximate distribution:
 * - init phase:    0.00 - 0.10
 * - chipset phase: 0.10 - 0.75
 * - ready phase:   0.75 - 1.00
 * - complete:      1.00
 * - skipped:       1.00
 */
export function getSequenceProgress(state: BootState): number {
  switch (state.phase) {
    case 'init': {
      // 0 to 0.1 based on elapsed within init
      const ratio = Math.min(state.elapsedMs / BOOT_TIMING.initDurationMs, 1);
      return ratio * 0.1;
    }
    case 'chipset': {
      // 0.1 to 0.75 based on chipset index and elapsed within current chipset
      const totalChipsets = CHIPSETS.length;
      const completedChipsets = state.chipsetStatuses.filter(Boolean).length;
      const currentChipDelay =
        state.activeChipsetIndex < totalChipsets
          ? CHIPSETS[state.activeChipsetIndex].delayMs
          : 1;
      const withinChipRatio = Math.min(state.elapsedMs / currentChipDelay, 1);
      const chipsetProgress = (completedChipsets + withinChipRatio) / totalChipsets;
      return 0.1 + chipsetProgress * 0.65;
    }
    case 'ready': {
      // 0.75 to 1.0 based on elapsed within ready
      const ratio = Math.min(state.elapsedMs / BOOT_TIMING.readyDurationMs, 1);
      return 0.75 + ratio * 0.25;
    }
    case 'complete':
    case 'skipped':
      return 1.0;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Skip the boot sequence immediately. Returns a new state with phase='skipped'.
 * Used when the user clicks or presses a key during boot.
 */
export function skipSequence(state: BootState): BootState {
  return {
    ...state,
    phase: 'skipped',
  };
}

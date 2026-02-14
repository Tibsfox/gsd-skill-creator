import { describe, it, expect } from 'vitest';
import {
  advanceSequence,
  getActiveChipset,
  isSequenceComplete,
  getSequenceProgress,
  skipSequence,
} from './chipset.js';
import { createBootState, CHIPSETS, BOOT_TIMING } from './types.js';
import type { BootState } from './types.js';

describe('advanceSequence', () => {
  it('stays in init phase with insufficient time', () => {
    const state = createBootState();
    const next = advanceSequence(state, 100);
    expect(next.phase).toBe('init');
    expect(next.elapsedMs).toBe(100);
  });

  it('transitions from init to chipset phase after initDurationMs', () => {
    const state = createBootState();
    const next = advanceSequence(state, BOOT_TIMING.initDurationMs);
    expect(next.phase).toBe('chipset');
    expect(next.activeChipsetIndex).toBe(0);
    expect(next.elapsedMs).toBe(0);
  });

  it('initializes first chipset (Agnus) after 600ms in chipset phase', () => {
    const state: BootState = {
      phase: 'chipset',
      elapsedMs: 0,
      activeChipsetIndex: 0,
      chipsetStatuses: [false, false, false, false],
    };
    const next = advanceSequence(state, CHIPSETS[0].delayMs);
    expect(next.chipsetStatuses[0]).toBe(true);
    expect(next.activeChipsetIndex).toBe(1);
  });

  it('initializes second chipset (Denise) after 800ms more', () => {
    const state: BootState = {
      phase: 'chipset',
      elapsedMs: 0,
      activeChipsetIndex: 1,
      chipsetStatuses: [true, false, false, false],
    };
    const next = advanceSequence(state, CHIPSETS[1].delayMs);
    expect(next.chipsetStatuses[1]).toBe(true);
    expect(next.activeChipsetIndex).toBe(2);
  });

  it('processes all 4 chipsets and transitions to ready', () => {
    const state: BootState = {
      phase: 'chipset',
      elapsedMs: 0,
      activeChipsetIndex: 0,
      chipsetStatuses: [false, false, false, false],
    };
    // Sum of all chipset delays
    const totalDelay = CHIPSETS.reduce((sum, c) => sum + c.delayMs, 0);
    const next = advanceSequence(state, totalDelay);
    expect(next.chipsetStatuses).toEqual([true, true, true, true]);
    expect(next.phase).toBe('ready');
    expect(next.elapsedMs).toBe(0);
  });

  it('transitions from ready to complete after readyDurationMs', () => {
    const state: BootState = {
      phase: 'ready',
      elapsedMs: 0,
      activeChipsetIndex: 3,
      chipsetStatuses: [true, true, true, true],
    };
    const next = advanceSequence(state, BOOT_TIMING.readyDurationMs);
    expect(next.phase).toBe('complete');
  });

  it('returns unchanged state when already complete', () => {
    const state: BootState = {
      phase: 'complete',
      elapsedMs: 1000,
      activeChipsetIndex: 3,
      chipsetStatuses: [true, true, true, true],
    };
    const next = advanceSequence(state, 500);
    expect(next).toBe(state);
  });

  it('returns unchanged state when skipped', () => {
    const state: BootState = {
      phase: 'skipped',
      elapsedMs: 200,
      activeChipsetIndex: 1,
      chipsetStatuses: [true, false, false, false],
    };
    const next = advanceSequence(state, 500);
    expect(next).toBe(state);
  });
});

describe('getActiveChipset', () => {
  it('returns Agnus when activeChipsetIndex is 0', () => {
    const state: BootState = {
      phase: 'chipset',
      elapsedMs: 100,
      activeChipsetIndex: 0,
      chipsetStatuses: [false, false, false, false],
    };
    const chip = getActiveChipset(state);
    expect(chip).not.toBeNull();
    expect(chip!.id).toBe('agnus');
    expect(chip!.name).toBe('Agnus');
  });

  it('returns null when phase is init', () => {
    const state = createBootState();
    expect(getActiveChipset(state)).toBeNull();
  });

  it('returns null when phase is complete', () => {
    const state: BootState = {
      phase: 'complete',
      elapsedMs: 0,
      activeChipsetIndex: 3,
      chipsetStatuses: [true, true, true, true],
    };
    expect(getActiveChipset(state)).toBeNull();
  });
});

describe('isSequenceComplete', () => {
  it('returns true for complete', () => {
    const state: BootState = {
      phase: 'complete',
      elapsedMs: 0,
      activeChipsetIndex: 3,
      chipsetStatuses: [true, true, true, true],
    };
    expect(isSequenceComplete(state)).toBe(true);
  });

  it('returns true for skipped', () => {
    const state: BootState = {
      phase: 'skipped',
      elapsedMs: 0,
      activeChipsetIndex: -1,
      chipsetStatuses: [false, false, false, false],
    };
    expect(isSequenceComplete(state)).toBe(true);
  });

  it('returns false for init', () => {
    expect(isSequenceComplete(createBootState())).toBe(false);
  });

  it('returns false for chipset phase', () => {
    const state: BootState = {
      phase: 'chipset',
      elapsedMs: 300,
      activeChipsetIndex: 1,
      chipsetStatuses: [true, false, false, false],
    };
    expect(isSequenceComplete(state)).toBe(false);
  });

  it('returns false for ready phase', () => {
    const state: BootState = {
      phase: 'ready',
      elapsedMs: 0,
      activeChipsetIndex: 3,
      chipsetStatuses: [true, true, true, true],
    };
    expect(isSequenceComplete(state)).toBe(false);
  });
});

describe('getSequenceProgress', () => {
  it('returns 0 at start', () => {
    expect(getSequenceProgress(createBootState())).toBe(0);
  });

  it('returns 1.0 at complete', () => {
    const state: BootState = {
      phase: 'complete',
      elapsedMs: 0,
      activeChipsetIndex: 3,
      chipsetStatuses: [true, true, true, true],
    };
    expect(getSequenceProgress(state)).toBe(1.0);
  });

  it('returns value between 0 and 1 during chipset phase', () => {
    const state: BootState = {
      phase: 'chipset',
      elapsedMs: 300,
      activeChipsetIndex: 1,
      chipsetStatuses: [true, false, false, false],
    };
    const progress = getSequenceProgress(state);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });
});

describe('skipSequence', () => {
  it('sets phase to skipped from init', () => {
    const state = createBootState();
    const skipped = skipSequence(state);
    expect(skipped.phase).toBe('skipped');
  });

  it('sets phase to skipped from chipset phase', () => {
    const state: BootState = {
      phase: 'chipset',
      elapsedMs: 500,
      activeChipsetIndex: 2,
      chipsetStatuses: [true, true, false, false],
    };
    const skipped = skipSequence(state);
    expect(skipped.phase).toBe('skipped');
  });

  it('sets phase to skipped from ready phase', () => {
    const state: BootState = {
      phase: 'ready',
      elapsedMs: 200,
      activeChipsetIndex: 3,
      chipsetStatuses: [true, true, true, true],
    };
    const skipped = skipSequence(state);
    expect(skipped.phase).toBe('skipped');
  });
});

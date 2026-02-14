import { describe, it, expect } from 'vitest';
import {
  CHIPSETS,
  BOOT_TIMING,
  DEFAULT_BOOT_CONFIG,
  shouldSkipBoot,
  createBootState,
} from './types.js';

describe('CHIPSETS', () => {
  it('has exactly 4 entries', () => {
    expect(CHIPSETS).toHaveLength(4);
  });

  it('defines Agnus as first chipset with Graphics DMA role', () => {
    expect(CHIPSETS[0].id).toBe('agnus');
    expect(CHIPSETS[0].name).toBe('Agnus');
    expect(CHIPSETS[0].role).toBe('Graphics DMA');
  });

  it('defines Denise as second chipset with Display Encoder role', () => {
    expect(CHIPSETS[1].id).toBe('denise');
    expect(CHIPSETS[1].name).toBe('Denise');
    expect(CHIPSETS[1].role).toBe('Display Encoder');
  });

  it('defines Paula as third chipset with Audio & I/O role', () => {
    expect(CHIPSETS[2].id).toBe('paula');
    expect(CHIPSETS[2].name).toBe('Paula');
    expect(CHIPSETS[2].role).toBe('Audio & I/O');
  });

  it('defines Gary as fourth chipset with Address Decode role', () => {
    expect(CHIPSETS[3].id).toBe('gary');
    expect(CHIPSETS[3].name).toBe('Gary');
    expect(CHIPSETS[3].role).toBe('Address Decode');
  });

  it('has chipsets ordered 0,1,2,3', () => {
    expect(CHIPSETS.map((c) => c.order)).toEqual([0, 1, 2, 3]);
  });

  it('has total chipset delay under available time budget', () => {
    const totalDelay = CHIPSETS.reduce((sum, c) => sum + c.delayMs, 0);
    const available =
      BOOT_TIMING.totalMaxMs -
      BOOT_TIMING.initDurationMs -
      BOOT_TIMING.readyDurationMs -
      BOOT_TIMING.transitionDurationMs;
    expect(totalDelay).toBeLessThan(available);
  });
});

describe('BOOT_TIMING', () => {
  it('has totalMaxMs of 5000', () => {
    expect(BOOT_TIMING.totalMaxMs).toBe(5000);
  });
});

describe('shouldSkipBoot', () => {
  it('returns true when skip is true', () => {
    expect(shouldSkipBoot({ skip: true, background: 'gradient' })).toBe(true);
  });

  it('returns false when skip is false', () => {
    expect(shouldSkipBoot({ skip: false, background: 'gradient' })).toBe(false);
  });
});

describe('DEFAULT_BOOT_CONFIG', () => {
  it('has skip=false and background=gradient', () => {
    expect(DEFAULT_BOOT_CONFIG.skip).toBe(false);
    expect(DEFAULT_BOOT_CONFIG.background).toBe('gradient');
  });
});

describe('createBootState', () => {
  it('returns init phase with all chipsets uninitialized', () => {
    const state = createBootState();
    expect(state.phase).toBe('init');
    expect(state.elapsedMs).toBe(0);
    expect(state.activeChipsetIndex).toBe(-1);
    expect(state.chipsetStatuses).toEqual([false, false, false, false]);
  });
});

/**
 * Tests for PackSessionDriver — educational pack session tracking.
 *
 * Covers:
 * - completePhase: persists completion records
 * - getProgress: progress calculation and current phase
 * - isPhaseComplete: single phase check
 * - getCheckpoints: checkpoint retrieval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PackSessionDriver } from '../pack-session-driver.js';

// ============================================================================
// Mock PatternStore
// ============================================================================

function mockStore() {
  const records: Array<{ data: Record<string, unknown> }> = [];
  return {
    store: {
      append: vi.fn(async (_category: string, data: Record<string, unknown>) => {
        records.push({ data });
      }),
      read: vi.fn(async () => records),
    },
    records,
  };
}

// ============================================================================
// completePhase
// ============================================================================

describe('PackSessionDriver.completePhase', () => {
  it('persists a phase completion', async () => {
    const { store } = mockStore();
    const driver = new PackSessionDriver(store as any);

    await driver.completePhase('pack-101', 'phase-1', 'fox', ['cp-1', 'cp-2']);

    expect(store.append).toHaveBeenCalledWith('sessions', expect.objectContaining({
      source: 'wasteland',
      kind: 'phase-completion',
      packId: 'pack-101',
      phaseId: 'phase-1',
      handle: 'fox',
      checkpointsPassed: ['cp-1', 'cp-2'],
    }));
  });

  it('defaults to empty checkpoints', async () => {
    const { store } = mockStore();
    const driver = new PackSessionDriver(store as any);

    await driver.completePhase('pack-101', 'phase-1', 'fox');

    expect(store.append).toHaveBeenCalledWith('sessions', expect.objectContaining({
      checkpointsPassed: [],
    }));
  });
});

// ============================================================================
// getProgress
// ============================================================================

describe('PackSessionDriver.getProgress', () => {
  it('computes progress from completions', async () => {
    const { store, records } = mockStore();
    records.push({
      data: { source: 'wasteland', kind: 'phase-completion', packId: 'pack-101', phaseId: 'phase-1', handle: 'fox' },
    });
    records.push({
      data: { source: 'wasteland', kind: 'phase-completion', packId: 'pack-101', phaseId: 'phase-2', handle: 'fox' },
    });

    const driver = new PackSessionDriver(store as any);
    const progress = await driver.getProgress('pack-101', 'fox', ['phase-1', 'phase-2', 'phase-3']);

    expect(progress.completedPhases).toEqual(['phase-1', 'phase-2']);
    expect(progress.currentPhase).toBe('phase-3');
    expect(progress.percentComplete).toBe(67);
    expect(progress.totalPhases).toBe(3);
  });

  it('returns null currentPhase when all done', async () => {
    const { store, records } = mockStore();
    records.push({
      data: { source: 'wasteland', kind: 'phase-completion', packId: 'p', phaseId: 'a', handle: 'fox' },
    });

    const driver = new PackSessionDriver(store as any);
    const progress = await driver.getProgress('p', 'fox', ['a']);

    expect(progress.currentPhase).toBeNull();
    expect(progress.percentComplete).toBe(100);
  });

  it('returns 0% with no completions', async () => {
    const { store } = mockStore();
    const driver = new PackSessionDriver(store as any);
    const progress = await driver.getProgress('p', 'fox', ['a', 'b']);

    expect(progress.completedPhases).toEqual([]);
    expect(progress.currentPhase).toBe('a');
    expect(progress.percentComplete).toBe(0);
  });

  it('ignores completions from other packs/handles', async () => {
    const { store, records } = mockStore();
    records.push({
      data: { source: 'wasteland', kind: 'phase-completion', packId: 'other-pack', phaseId: 'a', handle: 'fox' },
    });
    records.push({
      data: { source: 'wasteland', kind: 'phase-completion', packId: 'p', phaseId: 'a', handle: 'other-rig' },
    });

    const driver = new PackSessionDriver(store as any);
    const progress = await driver.getProgress('p', 'fox', ['a', 'b']);
    expect(progress.completedPhases).toEqual([]);
  });
});

// ============================================================================
// isPhaseComplete
// ============================================================================

describe('PackSessionDriver.isPhaseComplete', () => {
  it('returns true for completed phase', async () => {
    const { store, records } = mockStore();
    records.push({
      data: { source: 'wasteland', kind: 'phase-completion', packId: 'p', phaseId: 'a', handle: 'fox' },
    });

    const driver = new PackSessionDriver(store as any);
    expect(await driver.isPhaseComplete('p', 'a', 'fox')).toBe(true);
  });

  it('returns false for incomplete phase', async () => {
    const { store } = mockStore();
    const driver = new PackSessionDriver(store as any);
    expect(await driver.isPhaseComplete('p', 'a', 'fox')).toBe(false);
  });
});

// ============================================================================
// getCheckpoints
// ============================================================================

describe('PackSessionDriver.getCheckpoints', () => {
  it('returns checkpoints for completed phase', async () => {
    const { store, records } = mockStore();
    records.push({
      data: {
        source: 'wasteland', kind: 'phase-completion',
        packId: 'p', phaseId: 'a', handle: 'fox',
        checkpointsPassed: ['cp-1', 'cp-2'],
      },
    });

    const driver = new PackSessionDriver(store as any);
    expect(await driver.getCheckpoints('p', 'a', 'fox')).toEqual(['cp-1', 'cp-2']);
  });

  it('returns empty for uncompleted phase', async () => {
    const { store } = mockStore();
    const driver = new PackSessionDriver(store as any);
    expect(await driver.getCheckpoints('p', 'a', 'fox')).toEqual([]);
  });
});

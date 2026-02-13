/**
 * Tests for DMA-channel token budget manager.
 *
 * Validates percentage-based allocation with headroom reserve, per-chip
 * spending and remaining tracking, burst mode (BLITHOG) using headroom
 * pool, exceeded callback semantics (fires once per exceedance), and
 * per-chip and global reset.
 */

import { describe, it, expect, vi } from 'vitest';
import { DmaBudgetManager } from './dma-budget.js';
import type { BudgetStatus, DmaBudgetConfig } from './dma-budget.js';

// ============================================================================
// DmaBudgetManager -- initialization
// ============================================================================

describe('DmaBudgetManager -- initialization', () => {
  it('creates with default chip allocations', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000 });
    manager.registerChip('agnus', 60);
    manager.registerChip('denise', 15);
    manager.registerChip('paula', 15);
    manager.registerChip('gary', 10);

    // Default headroom is 5%, so effective budget = 95000
    expect(manager.getAllocation('agnus')).toBe(57000); // 60% of 95000
    expect(manager.getAllocation('denise')).toBe(14250); // 15% of 95000
    expect(manager.getAllocation('gary')).toBe(9500); // 10% of 95000
  });

  it('creates with custom headroom', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerChip('agnus', 60);

    // Headroom = 5000 (5% of 100000), effective = 95000
    expect(manager.getHeadroom()).toBe(5000);
    expect(manager.getAllocation('agnus')).toBe(57000); // 60% of 95000
  });

  it('default headroom is 5%', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000 });
    // Headroom pool = 5% of 100000 = 5000
    expect(manager.getHeadroom()).toBe(5000);
  });
});

// ============================================================================
// DmaBudgetManager -- spending
// ============================================================================

describe('DmaBudgetManager -- spending', () => {
  it('spend deducts from chip budget', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000 });
    manager.registerChip('agnus', 60);
    // allocation = 57000

    manager.spend('agnus', 1000);
    expect(manager.getRemaining('agnus')).toBe(56000);
  });

  it('spend multiple times accumulates', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000 });
    manager.registerChip('agnus', 60);

    manager.spend('agnus', 1000);
    manager.spend('agnus', 1000);
    manager.spend('agnus', 1000);
    expect(manager.getRemaining('agnus')).toBe(54000); // 57000 - 3000
  });

  it('spend exactly to zero succeeds', () => {
    const manager = new DmaBudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerChip('tiny', 100);
    // allocation = 1000

    manager.spend('tiny', 1000);
    expect(manager.getRemaining('tiny')).toBe(0);
  });

  it('spend beyond allocation does NOT hard-fail (soft limit)', () => {
    const manager = new DmaBudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerChip('tiny', 100);
    // allocation = 1000

    const status = manager.spend('tiny', 1500);
    expect(manager.getRemaining('tiny')).toBe(-500);
    expect(status.exceeded).toBe(true);
  });
});

// ============================================================================
// DmaBudgetManager -- BudgetStatus
// ============================================================================

describe('DmaBudgetManager -- BudgetStatus', () => {
  it('getStatus returns current budget state', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000 });
    manager.registerChip('agnus', 60);
    manager.spend('agnus', 1000);

    const status = manager.getStatus('agnus');
    expect(status).toEqual({
      chipName: 'agnus',
      allocation: 57000,
      spent: 1000,
      remaining: 56000,
      exceeded: false,
      burstActive: false,
    });
  });

  it('getStatus shows exceeded when over budget', () => {
    const manager = new DmaBudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerChip('tiny', 100);
    manager.spend('tiny', 1500);

    const status = manager.getStatus('tiny');
    expect(status.exceeded).toBe(true);
    expect(status.remaining).toBe(-500);
  });
});

// ============================================================================
// DmaBudgetManager -- burst mode (BLITHOG)
// ============================================================================

describe('DmaBudgetManager -- burst mode (BLITHOG)', () => {
  it('enableBurst allows temporary overallocation from headroom', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    // headroom = 5000
    manager.registerChip('agnus', 60);
    // allocation = 57000

    manager.spend('agnus', 57000); // at limit
    manager.enableBurst('agnus');
    manager.spend('agnus', 3000); // burst spending from headroom

    const status = manager.getStatus('agnus');
    expect(status.burstActive).toBe(true);
  });

  it('burst spending reduces headroom pool', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerChip('agnus', 60);

    manager.spend('agnus', 57000); // exhaust allocation
    manager.enableBurst('agnus');
    manager.spend('agnus', 3000); // burst spending

    expect(manager.getHeadroom()).toBe(2000); // 5000 - 3000
  });

  it('burst beyond headroom returns exceeded status', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerChip('agnus', 60);

    manager.spend('agnus', 57000);
    manager.enableBurst('agnus');
    manager.spend('agnus', 6000); // 6000 > 5000 headroom

    const status = manager.getStatus('agnus');
    expect(status.exceeded).toBe(true);
  });

  it('disableBurst stops burst mode', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerChip('agnus', 60);
    manager.enableBurst('agnus');
    manager.disableBurst('agnus');

    const status = manager.getStatus('agnus');
    expect(status.burstActive).toBe(false);
  });

  it('burst only available when at or over allocation', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerChip('agnus', 60);
    // allocation = 57000

    manager.enableBurst('agnus');
    manager.spend('agnus', 100); // well under allocation

    // Headroom unchanged -- spending comes from regular allocation
    expect(manager.getHeadroom()).toBe(5000);
    expect(manager.getRemaining('agnus')).toBe(56900);
  });
});

// ============================================================================
// DmaBudgetManager -- exceeded signal
// ============================================================================

describe('DmaBudgetManager -- exceeded signal', () => {
  it('exceeded triggers callback', () => {
    const manager = new DmaBudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerChip('tiny', 100);

    const callback = vi.fn();
    manager.onExceeded(callback);
    manager.spend('tiny', 1500);

    expect(callback).toHaveBeenCalledWith('tiny');
  });

  it('exceeded callback fires only once per exceedance', () => {
    const manager = new DmaBudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerChip('tiny', 100);

    const callback = vi.fn();
    manager.onExceeded(callback);

    manager.spend('tiny', 1500); // first exceed -- callback fires
    manager.spend('tiny', 100);   // already exceeded -- callback does NOT fire

    expect(callback).toHaveBeenCalledTimes(1);

    // Reset and exceed again -- callback fires again
    manager.reset('tiny');
    manager.spend('tiny', 1500);

    expect(callback).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// DmaBudgetManager -- reset
// ============================================================================

describe('DmaBudgetManager -- reset', () => {
  it('reset(chipName) resets spending for one chip', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000 });
    manager.registerChip('agnus', 60);
    manager.registerChip('denise', 15);

    manager.spend('agnus', 5000);
    manager.spend('denise', 2000);
    manager.reset('agnus');

    expect(manager.getRemaining('agnus')).toBe(57000); // full allocation
    expect(manager.getRemaining('denise')).toBe(12250); // unchanged (14250 - 2000)
  });

  it('resetAll() resets all chips and headroom', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerChip('agnus', 60);
    manager.registerChip('denise', 15);

    manager.spend('agnus', 57000);
    manager.enableBurst('agnus');
    manager.spend('agnus', 3000);
    manager.spend('denise', 1000);

    manager.resetAll();

    expect(manager.getRemaining('agnus')).toBe(57000);
    expect(manager.getRemaining('denise')).toBe(14250);
    expect(manager.getHeadroom()).toBe(5000);
  });

  it('unknown chip name throws', () => {
    const manager = new DmaBudgetManager({ totalBudget: 100000 });
    expect(() => manager.getStatus('nonexistent')).toThrow();
  });
});

/**
 * Tests for token budget manager.
 *
 * Validates percentage-based allocation with headroom reserve, per-engine
 * spending and remaining tracking, burst mode using headroom pool,
 * exceeded callback semantics (fires once per exceedance), and
 * per-engine and global reset.
 */

import { describe, it, expect, vi } from 'vitest';
import { BudgetManager } from './dma-budget.js';
import type { BudgetStatus, BudgetConfig } from './dma-budget.js';

// ============================================================================
// BudgetManager -- initialization
// ============================================================================

describe('BudgetManager -- initialization', () => {
  it('creates with default engine allocations', () => {
    const manager = new BudgetManager({ totalBudget: 100000 });
    manager.registerEngine('context-engine', 60);
    manager.registerEngine('render-engine', 15);
    manager.registerEngine('io-engine', 15);
    manager.registerEngine('router-engine', 10);

    // Default headroom is 5%, so effective budget = 95000
    expect(manager.getAllocation('context-engine')).toBe(57000); // 60% of 95000
    expect(manager.getAllocation('render-engine')).toBe(14250); // 15% of 95000
    expect(manager.getAllocation('router-engine')).toBe(9500); // 10% of 95000
  });

  it('creates with custom headroom', () => {
    const manager = new BudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerEngine('context-engine', 60);

    // Headroom = 5000 (5% of 100000), effective = 95000
    expect(manager.getHeadroom()).toBe(5000);
    expect(manager.getAllocation('context-engine')).toBe(57000); // 60% of 95000
  });

  it('default headroom is 5%', () => {
    const manager = new BudgetManager({ totalBudget: 100000 });
    // Headroom pool = 5% of 100000 = 5000
    expect(manager.getHeadroom()).toBe(5000);
  });
});

// ============================================================================
// BudgetManager -- spending
// ============================================================================

describe('BudgetManager -- spending', () => {
  it('spend deducts from engine budget', () => {
    const manager = new BudgetManager({ totalBudget: 100000 });
    manager.registerEngine('context-engine', 60);
    // allocation = 57000

    manager.spend('context-engine', 1000);
    expect(manager.getRemaining('context-engine')).toBe(56000);
  });

  it('spend multiple times accumulates', () => {
    const manager = new BudgetManager({ totalBudget: 100000 });
    manager.registerEngine('context-engine', 60);

    manager.spend('context-engine', 1000);
    manager.spend('context-engine', 1000);
    manager.spend('context-engine', 1000);
    expect(manager.getRemaining('context-engine')).toBe(54000); // 57000 - 3000
  });

  it('spend exactly to zero succeeds', () => {
    const manager = new BudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerEngine('tiny', 100);
    // allocation = 1000

    manager.spend('tiny', 1000);
    expect(manager.getRemaining('tiny')).toBe(0);
  });

  it('spend beyond allocation does NOT hard-fail (soft limit)', () => {
    const manager = new BudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerEngine('tiny', 100);
    // allocation = 1000

    const status = manager.spend('tiny', 1500);
    expect(manager.getRemaining('tiny')).toBe(-500);
    expect(status.exceeded).toBe(true);
  });
});

// ============================================================================
// BudgetManager -- BudgetStatus
// ============================================================================

describe('BudgetManager -- BudgetStatus', () => {
  it('getStatus returns current budget state', () => {
    const manager = new BudgetManager({ totalBudget: 100000 });
    manager.registerEngine('context-engine', 60);
    manager.spend('context-engine', 1000);

    const status = manager.getStatus('context-engine');
    expect(status).toEqual({
      engineName: 'context-engine',
      allocation: 57000,
      spent: 1000,
      remaining: 56000,
      exceeded: false,
      burstActive: false,
    });
  });

  it('getStatus shows exceeded when over budget', () => {
    const manager = new BudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerEngine('tiny', 100);
    manager.spend('tiny', 1500);

    const status = manager.getStatus('tiny');
    expect(status.exceeded).toBe(true);
    expect(status.remaining).toBe(-500);
  });
});

// ============================================================================
// BudgetManager -- burst mode
// ============================================================================

describe('BudgetManager -- burst mode', () => {
  it('enableBurst allows temporary overallocation from headroom', () => {
    const manager = new BudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    // headroom = 5000
    manager.registerEngine('context-engine', 60);
    // allocation = 57000

    manager.spend('context-engine', 57000); // at limit
    manager.enableBurst('context-engine');
    manager.spend('context-engine', 3000); // burst spending from headroom

    const status = manager.getStatus('context-engine');
    expect(status.burstActive).toBe(true);
  });

  it('burst spending reduces headroom pool', () => {
    const manager = new BudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerEngine('context-engine', 60);

    manager.spend('context-engine', 57000); // exhaust allocation
    manager.enableBurst('context-engine');
    manager.spend('context-engine', 3000); // burst spending

    expect(manager.getHeadroom()).toBe(2000); // 5000 - 3000
  });

  it('burst beyond headroom returns exceeded status', () => {
    const manager = new BudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerEngine('context-engine', 60);

    manager.spend('context-engine', 57000);
    manager.enableBurst('context-engine');
    manager.spend('context-engine', 6000); // 6000 > 5000 headroom

    const status = manager.getStatus('context-engine');
    expect(status.exceeded).toBe(true);
  });

  it('disableBurst stops burst mode', () => {
    const manager = new BudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerEngine('context-engine', 60);
    manager.enableBurst('context-engine');
    manager.disableBurst('context-engine');

    const status = manager.getStatus('context-engine');
    expect(status.burstActive).toBe(false);
  });

  it('burst only available when at or over allocation', () => {
    const manager = new BudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerEngine('context-engine', 60);
    // allocation = 57000

    manager.enableBurst('context-engine');
    manager.spend('context-engine', 100); // well under allocation

    // Headroom unchanged -- spending comes from regular allocation
    expect(manager.getHeadroom()).toBe(5000);
    expect(manager.getRemaining('context-engine')).toBe(56900);
  });
});

// ============================================================================
// BudgetManager -- exceeded signal
// ============================================================================

describe('BudgetManager -- exceeded signal', () => {
  it('exceeded triggers callback', () => {
    const manager = new BudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerEngine('tiny', 100);

    const callback = vi.fn();
    manager.onExceeded(callback);
    manager.spend('tiny', 1500);

    expect(callback).toHaveBeenCalledWith('tiny');
  });

  it('exceeded callback fires only once per exceedance', () => {
    const manager = new BudgetManager({ totalBudget: 1000, headroomPercent: 0 });
    manager.registerEngine('tiny', 100);

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
// BudgetManager -- reset
// ============================================================================

describe('BudgetManager -- reset', () => {
  it('reset(engineName) resets spending for one engine', () => {
    const manager = new BudgetManager({ totalBudget: 100000 });
    manager.registerEngine('context-engine', 60);
    manager.registerEngine('render-engine', 15);

    manager.spend('context-engine', 5000);
    manager.spend('render-engine', 2000);
    manager.reset('context-engine');

    expect(manager.getRemaining('context-engine')).toBe(57000); // full allocation
    expect(manager.getRemaining('render-engine')).toBe(12250); // unchanged (14250 - 2000)
  });

  it('resetAll() resets all engines and headroom', () => {
    const manager = new BudgetManager({ totalBudget: 100000, headroomPercent: 5 });
    manager.registerEngine('context-engine', 60);
    manager.registerEngine('render-engine', 15);

    manager.spend('context-engine', 57000);
    manager.enableBurst('context-engine');
    manager.spend('context-engine', 3000);
    manager.spend('render-engine', 1000);

    manager.resetAll();

    expect(manager.getRemaining('context-engine')).toBe(57000);
    expect(manager.getRemaining('render-engine')).toBe(14250);
    expect(manager.getHeadroom()).toBe(5000);
  });

  it('unknown engine name throws', () => {
    const manager = new BudgetManager({ totalBudget: 100000 });
    expect(() => manager.getStatus('nonexistent')).toThrow();
  });
});

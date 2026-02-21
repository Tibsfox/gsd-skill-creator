/**
 * TDD test suite for the Monitor agent (BUDGET position).
 *
 * Tests: alert thresholds, consumption tracking, rate projection,
 * budget checking, JSONL round-trip, Monitor class integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  MonitorConfigSchema,
  BudgetSnapshotSchema,
  AlertLevelSchema,
  ConsumptionRateSchema,
  BudgetAlertSchema,
  MonitorEntrySchema,
  ALERT_THRESHOLDS,
  trackConsumption,
  calculateAlertLevel,
  calculateConsumptionRate,
  checkBudget,
  appendMonitorEntry,
  readMonitorLog,
  Monitor,
  createMonitor,
} from './monitor.js';

// ============================================================================
// ALERT_THRESHOLDS constants
// ============================================================================

describe('ALERT_THRESHOLDS', () => {
  it('exports 5 alert levels', () => {
    const levels = Object.keys(ALERT_THRESHOLDS);
    expect(levels).toEqual(['GREEN', 'YELLOW', 'ORANGE', 'RED', 'CRITICAL']);
  });

  it('GREEN covers 0-50', () => {
    expect(ALERT_THRESHOLDS.GREEN).toEqual({ min: 0, max: 50, action: 'none' });
  });

  it('YELLOW covers 50-70', () => {
    expect(ALERT_THRESHOLDS.YELLOW).toEqual({ min: 50, max: 70, action: 'log' });
  });

  it('ORANGE covers 70-85', () => {
    expect(ALERT_THRESHOLDS.ORANGE).toEqual({ min: 70, max: 85, action: 'alert_coordinator' });
  });

  it('RED covers 85-95', () => {
    expect(ALERT_THRESHOLDS.RED).toEqual({ min: 85, max: 95, action: 'urgent_alert' });
  });

  it('CRITICAL covers 95-Infinity', () => {
    expect(ALERT_THRESHOLDS.CRITICAL).toEqual({ min: 95, max: Infinity, action: 'halt' });
  });
});

// ============================================================================
// Zod schemas
// ============================================================================

describe('Zod schemas', () => {
  it('AlertLevelSchema accepts valid levels', () => {
    expect(AlertLevelSchema.parse('GREEN')).toBe('GREEN');
    expect(AlertLevelSchema.parse('YELLOW')).toBe('YELLOW');
    expect(AlertLevelSchema.parse('ORANGE')).toBe('ORANGE');
    expect(AlertLevelSchema.parse('RED')).toBe('RED');
    expect(AlertLevelSchema.parse('CRITICAL')).toBe('CRITICAL');
  });

  it('AlertLevelSchema rejects invalid level', () => {
    expect(() => AlertLevelSchema.parse('BLUE')).toThrow();
  });

  it('BudgetSnapshotSchema validates correct snapshot', () => {
    const snapshot = BudgetSnapshotSchema.parse({
      agentId: 'executor',
      tokensUsed: 7500,
      budgetLimit: 15000,
      utilizationPct: 50,
    });
    expect(snapshot.agentId).toBe('executor');
    expect(snapshot.utilizationPct).toBe(50);
  });

  it('BudgetSnapshotSchema rejects negative tokensUsed', () => {
    expect(() => BudgetSnapshotSchema.parse({
      agentId: 'executor',
      tokensUsed: -1,
      budgetLimit: 15000,
      utilizationPct: 0,
    })).toThrow();
  });

  it('ConsumptionRateSchema validates correct rate', () => {
    const rate = ConsumptionRateSchema.parse({
      tokensPerPhase: 20000,
      phasesRemaining: 7,
      projectedTotal: 200000,
      projectedOverage: false,
    });
    expect(rate.tokensPerPhase).toBe(20000);
    expect(rate.projectedOverage).toBe(false);
  });

  it('MonitorConfigSchema provides defaults', () => {
    const config = MonitorConfigSchema.parse({
      busConfig: { busDir: '/tmp/bus' },
      totalBudget: 200000,
      agentBudgets: { executor: 50000 },
    });
    expect(config.logPath).toBe('.planning/den/logs/monitor.jsonl');
  });
});

// ============================================================================
// trackConsumption
// ============================================================================

describe('trackConsumption', () => {
  it('calculates utilization percentage for executor at 50%', () => {
    const snapshot = trackConsumption('executor', 7500, 15000);
    expect(snapshot.agentId).toBe('executor');
    expect(snapshot.tokensUsed).toBe(7500);
    expect(snapshot.budgetLimit).toBe(15000);
    expect(snapshot.utilizationPct).toBe(50);
  });

  it('calculates utilization at 0%', () => {
    const snapshot = trackConsumption('planner', 0, 10000);
    expect(snapshot.utilizationPct).toBe(0);
  });

  it('calculates utilization at 100%', () => {
    const snapshot = trackConsumption('verifier', 5000, 5000);
    expect(snapshot.utilizationPct).toBe(100);
  });

  it('handles over-budget utilization', () => {
    const snapshot = trackConsumption('executor', 12000, 10000);
    expect(snapshot.utilizationPct).toBe(120);
  });
});

// ============================================================================
// calculateAlertLevel
// ============================================================================

describe('calculateAlertLevel', () => {
  it('returns GREEN for 0%', () => {
    expect(calculateAlertLevel(0)).toBe('GREEN');
  });

  it('returns GREEN for 49%', () => {
    expect(calculateAlertLevel(49)).toBe('GREEN');
  });

  it('returns YELLOW for 50%', () => {
    expect(calculateAlertLevel(50)).toBe('YELLOW');
  });

  it('returns YELLOW for 69%', () => {
    expect(calculateAlertLevel(69)).toBe('YELLOW');
  });

  it('returns ORANGE for 70%', () => {
    expect(calculateAlertLevel(70)).toBe('ORANGE');
  });

  it('returns ORANGE for 84%', () => {
    expect(calculateAlertLevel(84)).toBe('ORANGE');
  });

  it('returns RED for 85%', () => {
    expect(calculateAlertLevel(85)).toBe('RED');
  });

  it('returns RED for 94%', () => {
    expect(calculateAlertLevel(94)).toBe('RED');
  });

  it('returns CRITICAL for 95%', () => {
    expect(calculateAlertLevel(95)).toBe('CRITICAL');
  });

  it('returns CRITICAL for 100%', () => {
    expect(calculateAlertLevel(100)).toBe('CRITICAL');
  });
});

// ============================================================================
// calculateConsumptionRate
// ============================================================================

describe('calculateConsumptionRate', () => {
  it('calculates nominal rate without overage', () => {
    const rate = calculateConsumptionRate(60000, 3, 10, 200000);
    expect(rate.tokensPerPhase).toBe(20000);
    expect(rate.phasesRemaining).toBe(7);
    expect(rate.projectedTotal).toBe(200000);
    expect(rate.projectedOverage).toBe(false);
  });

  it('detects projected overage', () => {
    const rate = calculateConsumptionRate(100000, 3, 10, 200000);
    // tokensPerPhase = 100000/3 ~ 33333.33
    // phasesRemaining = 7
    // projectedTotal = 100000 + 7 * 33333.33 ~ 333333
    expect(rate.tokensPerPhase).toBeCloseTo(33333.33, 0);
    expect(rate.phasesRemaining).toBe(7);
    expect(rate.projectedTotal).toBeGreaterThan(200000);
    expect(rate.projectedOverage).toBe(true);
  });

  it('handles zero phases completed', () => {
    const rate = calculateConsumptionRate(0, 0, 10, 200000);
    expect(rate.tokensPerPhase).toBe(0);
    expect(rate.phasesRemaining).toBe(10);
    expect(rate.projectedTotal).toBe(0);
    expect(rate.projectedOverage).toBe(false);
  });

  it('handles all phases completed', () => {
    const rate = calculateConsumptionRate(180000, 10, 10, 200000);
    expect(rate.phasesRemaining).toBe(0);
    expect(rate.projectedTotal).toBe(180000);
    expect(rate.projectedOverage).toBe(false);
  });
});

// ============================================================================
// checkBudget
// ============================================================================

describe('checkBudget', () => {
  it('returns GREEN with nominal recommendation for low utilization', () => {
    const snapshots = [
      trackConsumption('executor', 5000, 50000),
      trackConsumption('planner', 3000, 30000),
    ];
    const rate = calculateConsumptionRate(8000, 2, 10, 200000);
    const alert = checkBudget(snapshots, rate, 200000);

    expect(alert.level).toBe('GREEN');
    expect(alert.recommendation).toBe('Budget nominal');
    expect(alert.agentBreakdown).toHaveLength(2);
    expect(alert.utilizationPct).toBe(4); // 8000/200000 * 100
  });

  it('returns YELLOW with monitor recommendation', () => {
    const snapshots = [
      trackConsumption('executor', 50000, 100000),
      trackConsumption('planner', 50000, 100000),
    ];
    const rate = calculateConsumptionRate(100000, 5, 10, 200000);
    const alert = checkBudget(snapshots, rate, 200000);

    expect(alert.level).toBe('YELLOW');
    expect(alert.recommendation).toBe('Monitor consumption trend');
  });

  it('returns ORANGE with simplify recommendation', () => {
    const snapshots = [
      trackConsumption('executor', 140000, 200000),
    ];
    const rate = calculateConsumptionRate(140000, 5, 10, 200000);
    const alert = checkBudget(snapshots, rate, 200000);

    expect(alert.level).toBe('ORANGE');
    expect(alert.recommendation).toContain('Recommend simplifying remaining phases');
  });

  it('returns RED with skip recommendation', () => {
    const snapshots = [
      trackConsumption('executor', 170000, 200000),
    ];
    const rate = calculateConsumptionRate(170000, 5, 10, 200000);
    const alert = checkBudget(snapshots, rate, 200000);

    expect(alert.level).toBe('RED');
    expect(alert.recommendation).toContain('Recommend skipping optional phases');
  });

  it('returns CRITICAL with emergency recommendation', () => {
    const snapshots = [
      trackConsumption('executor', 190000, 200000),
    ];
    const rate = calculateConsumptionRate(190000, 5, 10, 200000);
    const alert = checkBudget(snapshots, rate, 200000);

    expect(alert.level).toBe('CRITICAL');
    expect(alert.recommendation).toContain('Emergency conservation required');
  });

  it('appends projected overage to recommendation', () => {
    const snapshots = [
      trackConsumption('executor', 5000, 50000),
      trackConsumption('planner', 3000, 30000),
    ];
    // Create a rate that projects overage but low current utilization
    const rate: ReturnType<typeof calculateConsumptionRate> = {
      tokensPerPhase: 50000,
      phasesRemaining: 8,
      projectedTotal: 408000,
      projectedOverage: true,
    };
    const alert = checkBudget(snapshots, rate, 200000);

    expect(alert.recommendation).toContain('-- projected overage');
  });
});

// ============================================================================
// JSONL round-trip
// ============================================================================

describe('JSONL round-trip', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'monitor-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('appendMonitorEntry + readMonitorLog round-trips entries', async () => {
    const logPath = join(tmpDir, 'logs', 'monitor.jsonl');

    const entry1 = {
      timestamp: '20260220-133000',
      type: 'budget-check' as const,
      level: 'GREEN' as const,
      detail: { totalUsed: 8000 },
    };

    const entry2 = {
      timestamp: '20260220-133100',
      type: 'alert' as const,
      level: 'YELLOW' as const,
      detail: { totalUsed: 110000 },
    };

    await appendMonitorEntry(logPath, entry1);
    await appendMonitorEntry(logPath, entry2);

    const entries = await readMonitorLog(logPath);
    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe('budget-check');
    expect(entries[0].level).toBe('GREEN');
    expect(entries[1].type).toBe('alert');
    expect(entries[1].level).toBe('YELLOW');
  });

  it('readMonitorLog returns empty array for missing file', async () => {
    const logPath = join(tmpDir, 'nonexistent.jsonl');
    const entries = await readMonitorLog(logPath);
    expect(entries).toEqual([]);
  });
});

// ============================================================================
// Monitor class
// ============================================================================

describe('Monitor class', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'monitor-class-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('recordConsumption creates and updates snapshots', () => {
    const monitor = new Monitor({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'monitor.jsonl'),
      totalBudget: 200000,
      agentBudgets: { executor: 50000, planner: 30000 },
    });

    const snap1 = monitor.recordConsumption('executor', 10000);
    expect(snap1.utilizationPct).toBe(20); // 10000/50000 * 100

    const snap2 = monitor.recordConsumption('planner', 15000);
    expect(snap2.utilizationPct).toBe(50); // 15000/30000 * 100

    const all = monitor.getSnapshots();
    expect(all).toHaveLength(2);
  });

  it('recordConsumption updates existing snapshot for same agent', () => {
    const monitor = new Monitor({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'monitor.jsonl'),
      totalBudget: 200000,
      agentBudgets: { executor: 50000 },
    });

    monitor.recordConsumption('executor', 10000);
    monitor.recordConsumption('executor', 25000);

    const all = monitor.getSnapshots();
    expect(all).toHaveLength(1);
    expect(all[0].tokensUsed).toBe(25000);
    expect(all[0].utilizationPct).toBe(50);
  });

  it('getAlertLevel reflects overall utilization', () => {
    const monitor = new Monitor({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'monitor.jsonl'),
      totalBudget: 200000,
      agentBudgets: { executor: 100000, planner: 100000 },
    });

    monitor.recordConsumption('executor', 50000);
    monitor.recordConsumption('planner', 50000);

    // Overall: 100000/200000 = 50% -> YELLOW
    expect(monitor.getAlertLevel()).toBe('YELLOW');
  });

  it('getAlertLevel returns GREEN with no snapshots', () => {
    const monitor = new Monitor({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'monitor.jsonl'),
      totalBudget: 200000,
      agentBudgets: {},
    });

    expect(monitor.getAlertLevel()).toBe('GREEN');
  });

  it('checkBudget runs full pipeline and logs entry', async () => {
    const logPath = join(tmpDir, 'logs', 'monitor.jsonl');
    const monitor = new Monitor({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath,
      totalBudget: 200000,
      agentBudgets: { executor: 100000, planner: 50000 },
    });

    monitor.recordConsumption('executor', 30000);
    monitor.recordConsumption('planner', 10000);

    const alert = await monitor.checkBudget(3, 10);

    // Overall: 40000/200000 = 20% -> GREEN
    expect(alert.level).toBe('GREEN');
    expect(alert.recommendation).toBe('Budget nominal');
    expect(alert.agentBreakdown).toHaveLength(2);
    expect(alert.rate.tokensPerPhase).toBeCloseTo(13333.33, 0);

    // Verify log entry was written
    const entries = await readMonitorLog(logPath);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].type).toBe('budget-check');
  });

  it('getLog reads the monitor log', async () => {
    const logPath = join(tmpDir, 'logs', 'monitor.jsonl');
    const monitor = new Monitor({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath,
      totalBudget: 200000,
      agentBudgets: { executor: 100000 },
    });

    monitor.recordConsumption('executor', 10000);
    await monitor.checkBudget(1, 5);

    const log = await monitor.getLog();
    expect(log.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// createMonitor factory
// ============================================================================

describe('createMonitor', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'monitor-factory-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates an initialized Monitor instance', async () => {
    const monitor = await createMonitor({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'monitor.jsonl'),
      totalBudget: 200000,
      agentBudgets: { executor: 50000 },
    });

    expect(monitor).toBeInstanceOf(Monitor);

    // Should be able to record and check
    monitor.recordConsumption('executor', 5000);
    const snapshots = monitor.getSnapshots();
    expect(snapshots).toHaveLength(1);
  });
});

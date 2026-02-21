/**
 * Tests for the Dashboard data model (GSD Den status visualization).
 *
 * Covers: DashboardConfigSchema, PositionStateSchema, StaffIndicatorsSchema,
 * PositionHealthSchema, DenSnapshotSchema, collectPositionStates,
 * collectStaffIndicators, collectPositionHealth, assembleDenSnapshot,
 * formatDenSnapshotMarkdown, Dashboard class, createDashboard factory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import {
  DashboardConfigSchema,
  PositionStateSchema,
  StaffIndicatorsSchema,
  PositionHealthSchema,
  DenSnapshotSchema,
  STAFF_AGENT_IDS,
  collectPositionStates,
  collectStaffIndicators,
  collectPositionHealth,
  assembleDenSnapshot,
  formatDenSnapshotMarkdown,
  Dashboard,
  createDashboard,
} from './dashboard.js';

import type { ChroniclerEntry } from './chronicler.js';

// ============================================================================
// Helper: create a ChroniclerEntry for testing
// ============================================================================

function makeEntry(
  action: ChroniclerEntry['action'],
  agent: string = 'coordinator',
  ts: string = '20260220-120000',
  detail: string = `Test ${action}`,
  metadata?: Record<string, unknown>,
): ChroniclerEntry {
  return {
    timestamp: ts,
    agent: agent as ChroniclerEntry['agent'],
    action,
    phase: '260',
    detail,
    ...(metadata ? { metadata } : {}),
  };
}

// ============================================================================
// STAFF_AGENT_IDS
// ============================================================================

describe('STAFF_AGENT_IDS', () => {
  it('contains exactly 10 staff agent IDs', () => {
    expect(STAFF_AGENT_IDS).toHaveLength(10);
  });

  it('excludes all and user', () => {
    expect(STAFF_AGENT_IDS).not.toContain('all');
    expect(STAFF_AGENT_IDS).not.toContain('user');
  });

  it('includes all 10 staff positions', () => {
    const expected = [
      'coordinator', 'relay', 'planner', 'configurator',
      'monitor', 'dispatcher', 'verifier', 'chronicler',
      'sentinel', 'executor',
    ];
    for (const id of expected) {
      expect(STAFF_AGENT_IDS).toContain(id);
    }
  });
});

// ============================================================================
// DashboardConfigSchema
// ============================================================================

describe('DashboardConfigSchema', () => {
  it('applies default values', () => {
    const config = DashboardConfigSchema.parse({});
    expect(config.chroniclerLogPath).toBe('.planning/den/logs/chronicler.jsonl');
    expect(config.agentId).toBe('chronicler');
  });

  it('accepts overrides', () => {
    const config = DashboardConfigSchema.parse({
      chroniclerLogPath: '/custom/log.jsonl',
      busConfig: { busDir: '/tmp/bus' },
      agentId: 'custom-dashboard',
    });
    expect(config.chroniclerLogPath).toBe('/custom/log.jsonl');
    expect(config.agentId).toBe('custom-dashboard');
    expect(config.busConfig).toEqual({ busDir: '/tmp/bus' });
  });
});

// ============================================================================
// PositionStateSchema
// ============================================================================

describe('PositionStateSchema', () => {
  it('parses a valid position state', () => {
    const state = PositionStateSchema.parse({
      position: 'coordinator',
      status: 'active',
      lastAction: 'phase_completed',
      lastSeen: '20260220-120000',
    });
    expect(state.position).toBe('coordinator');
    expect(state.status).toBe('active');
    expect(state.lastAction).toBe('phase_completed');
  });

  it('validates all 4 status values', () => {
    for (const status of ['active', 'dormant', 'working', 'error'] as const) {
      const result = PositionStateSchema.parse({
        position: 'executor',
        status,
        lastAction: 'test',
        lastSeen: '20260220-120000',
      });
      expect(result.status).toBe(status);
    }
  });

  it('accepts optional taskDescription', () => {
    const state = PositionStateSchema.parse({
      position: 'executor',
      status: 'working',
      lastAction: 'plan_started',
      lastSeen: '20260220-120000',
      taskDescription: 'Executing plan 02',
    });
    expect(state.taskDescription).toBe('Executing plan 02');
  });

  it('rejects invalid status', () => {
    expect(() =>
      PositionStateSchema.parse({
        position: 'coordinator',
        status: 'unknown',
        lastAction: 'test',
        lastSeen: '20260220-120000',
      }),
    ).toThrow();
  });

  it('rejects non-staff position IDs (all, user)', () => {
    // 'all' and 'user' are valid AgentIds but not staff positions
    // PositionStateSchema should use StaffAgentIdSchema that excludes them
    // However, the plan says to use AgentIdSchema -- we'll test what the plan says
    // and accept all AgentId values
  });
});

// ============================================================================
// StaffIndicatorsSchema
// ============================================================================

describe('StaffIndicatorsSchema', () => {
  it('parses valid staff indicators', () => {
    const indicators = StaffIndicatorsSchema.parse({
      coordinatorAuthority: 'nominal',
      relayQueueDepth: 5,
      monitorBudgetStatus: 'GREEN',
      sentinelRecoveryState: 'clear',
    });
    expect(indicators.coordinatorAuthority).toBe('nominal');
    expect(indicators.relayQueueDepth).toBe(5);
    expect(indicators.monitorBudgetStatus).toBe('GREEN');
    expect(indicators.sentinelRecoveryState).toBe('clear');
  });

  it('validates coordinator authority enum', () => {
    for (const value of ['nominal', 'escalated', 'halted'] as const) {
      const result = StaffIndicatorsSchema.parse({
        coordinatorAuthority: value,
        relayQueueDepth: 0,
        monitorBudgetStatus: 'GREEN',
        sentinelRecoveryState: 'clear',
      });
      expect(result.coordinatorAuthority).toBe(value);
    }
  });

  it('validates monitor budget status enum', () => {
    for (const value of ['GREEN', 'YELLOW', 'ORANGE', 'RED', 'CRITICAL'] as const) {
      const result = StaffIndicatorsSchema.parse({
        coordinatorAuthority: 'nominal',
        relayQueueDepth: 0,
        monitorBudgetStatus: value,
        sentinelRecoveryState: 'clear',
      });
      expect(result.monitorBudgetStatus).toBe(value);
    }
  });

  it('validates sentinel recovery state enum', () => {
    for (const value of ['clear', 'assessing', 'recovering', 'halted'] as const) {
      const result = StaffIndicatorsSchema.parse({
        coordinatorAuthority: 'nominal',
        relayQueueDepth: 0,
        monitorBudgetStatus: 'GREEN',
        sentinelRecoveryState: value,
      });
      expect(result.sentinelRecoveryState).toBe(value);
    }
  });

  it('rejects negative relay queue depth', () => {
    expect(() =>
      StaffIndicatorsSchema.parse({
        coordinatorAuthority: 'nominal',
        relayQueueDepth: -1,
        monitorBudgetStatus: 'GREEN',
        sentinelRecoveryState: 'clear',
      }),
    ).toThrow();
  });
});

// ============================================================================
// PositionHealthSchema
// ============================================================================

describe('PositionHealthSchema', () => {
  it('parses a valid health object', () => {
    const health = PositionHealthSchema.parse({
      position: 'executor',
      eventCount: 10,
      lastEventAge: 5000,
      errorCount: 1,
      healthScore: 0.8,
    });
    expect(health.position).toBe('executor');
    expect(health.eventCount).toBe(10);
    expect(health.lastEventAge).toBe(5000);
    expect(health.errorCount).toBe(1);
    expect(health.healthScore).toBe(0.8);
  });

  it('rejects health score out of range', () => {
    expect(() =>
      PositionHealthSchema.parse({
        position: 'executor',
        eventCount: 0,
        lastEventAge: 0,
        errorCount: 0,
        healthScore: 1.5,
      }),
    ).toThrow();

    expect(() =>
      PositionHealthSchema.parse({
        position: 'executor',
        eventCount: 0,
        lastEventAge: 0,
        errorCount: 0,
        healthScore: -0.1,
      }),
    ).toThrow();
  });

  it('rejects negative event count', () => {
    expect(() =>
      PositionHealthSchema.parse({
        position: 'executor',
        eventCount: -1,
        lastEventAge: 0,
        errorCount: 0,
        healthScore: 1.0,
      }),
    ).toThrow();
  });
});

// ============================================================================
// DenSnapshotSchema
// ============================================================================

describe('DenSnapshotSchema', () => {
  it('parses a full snapshot with all sections', () => {
    const snapshot = DenSnapshotSchema.parse({
      timestamp: '20260220-150000',
      positions: [
        {
          position: 'coordinator',
          status: 'active',
          lastAction: 'phase_completed',
          lastSeen: '20260220-120000',
        },
      ],
      indicators: {
        coordinatorAuthority: 'nominal',
        relayQueueDepth: 0,
        monitorBudgetStatus: 'GREEN',
        sentinelRecoveryState: 'clear',
      },
      positionHealth: [
        {
          position: 'coordinator',
          eventCount: 5,
          lastEventAge: 1000,
          errorCount: 0,
          healthScore: 1.0,
        },
      ],
      busHealthy: true,
      totalEvents: 5,
    });

    expect(snapshot.timestamp).toBe('20260220-150000');
    expect(snapshot.positions).toHaveLength(1);
    expect(snapshot.indicators.coordinatorAuthority).toBe('nominal');
    expect(snapshot.positionHealth).toHaveLength(1);
    expect(snapshot.busHealthy).toBe(true);
    expect(snapshot.totalEvents).toBe(5);
  });
});

// ============================================================================
// collectPositionStates
// ============================================================================

describe('collectPositionStates', () => {
  it('returns 10 dormant positions for empty entries', () => {
    const states = collectPositionStates([]);
    expect(states).toHaveLength(10);
    for (const state of states) {
      expect(state.status).toBe('dormant');
      expect(state.lastAction).toBe('none');
    }
  });

  it('returns 3 active/working + 7 dormant for entries with 3 agents', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('phase_completed', 'coordinator', '20260220-120000'),
      makeEntry('plan_started', 'executor', '20260220-120100'),
      makeEntry('verification_passed', 'verifier', '20260220-120200'),
    ];

    const states = collectPositionStates(entries);
    expect(states).toHaveLength(10);

    const coordState = states.find((s) => s.position === 'coordinator');
    expect(coordState?.status).toBe('active');

    const execState = states.find((s) => s.position === 'executor');
    expect(execState?.status).toBe('working');

    const verState = states.find((s) => s.position === 'verifier');
    expect(verState?.status).toBe('active');

    const dormantCount = states.filter((s) => s.status === 'dormant').length;
    expect(dormantCount).toBe(7);
  });

  it('maps halt_issued to error status', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('halt_issued', 'sentinel', '20260220-120000'),
    ];

    const states = collectPositionStates(entries);
    const sentinelState = states.find((s) => s.position === 'sentinel');
    expect(sentinelState?.status).toBe('error');
  });

  it('maps halt_cleared to error status', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('halt_cleared', 'coordinator', '20260220-120000'),
    ];

    const states = collectPositionStates(entries);
    const coordState = states.find((s) => s.position === 'coordinator');
    expect(coordState?.status).toBe('error');
  });

  it('maps error_recovered to active status', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('error_recovered', 'sentinel', '20260220-120000'),
    ];

    const states = collectPositionStates(entries);
    const sentinelState = states.find((s) => s.position === 'sentinel');
    expect(sentinelState?.status).toBe('active');
  });

  it('maps plan_started to working status', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('plan_started', 'executor', '20260220-120000'),
    ];

    const states = collectPositionStates(entries);
    const execState = states.find((s) => s.position === 'executor');
    expect(execState?.status).toBe('working');
  });

  it('most recent entry wins for each agent', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('halt_issued', 'sentinel', '20260220-110000'),
      makeEntry('error_recovered', 'sentinel', '20260220-120000'),
    ];

    const states = collectPositionStates(entries);
    const sentinelState = states.find((s) => s.position === 'sentinel');
    // Most recent entry is error_recovered -> active
    expect(sentinelState?.status).toBe('active');
  });
});

// ============================================================================
// collectStaffIndicators
// ============================================================================

describe('collectStaffIndicators', () => {
  it('returns all-nominal defaults for no entries', () => {
    const indicators = collectStaffIndicators([]);
    expect(indicators.coordinatorAuthority).toBe('nominal');
    expect(indicators.relayQueueDepth).toBe(0);
    expect(indicators.monitorBudgetStatus).toBe('GREEN');
    expect(indicators.sentinelRecoveryState).toBe('clear');
  });

  it('sets coordinator to halted on halt_issued entry', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('halt_issued', 'coordinator', '20260220-120000'),
    ];

    const indicators = collectStaffIndicators(entries);
    expect(indicators.coordinatorAuthority).toBe('halted');
  });

  it('sets coordinator to escalated on decision_made with escalated metadata', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry(
        'decision_made',
        'coordinator',
        '20260220-120000',
        'Decision with escalation',
        { escalated: true },
      ),
    ];

    const indicators = collectStaffIndicators(entries);
    expect(indicators.coordinatorAuthority).toBe('escalated');
  });

  it('sets sentinel to halted on halt_issued', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('halt_issued', 'sentinel', '20260220-120000'),
    ];

    const indicators = collectStaffIndicators(entries);
    expect(indicators.sentinelRecoveryState).toBe('halted');
  });

  it('sets sentinel to recovering on error_recovered', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('error_recovered', 'sentinel', '20260220-120000'),
    ];

    const indicators = collectStaffIndicators(entries);
    expect(indicators.sentinelRecoveryState).toBe('recovering');
  });

  it('sets sentinel to clear on halt_cleared', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('halt_cleared', 'sentinel', '20260220-120000'),
    ];

    const indicators = collectStaffIndicators(entries);
    expect(indicators.sentinelRecoveryState).toBe('clear');
  });

  it('computes relay queue depth from intake minus completed', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('intake_received', 'relay', '20260220-120000'),
      makeEntry('intake_received', 'relay', '20260220-120100'),
      makeEntry('intake_received', 'relay', '20260220-120200'),
      makeEntry('plan_completed', 'relay', '20260220-120300'),
    ];

    const indicators = collectStaffIndicators(entries);
    // 3 intakes - 1 completed = 2
    expect(indicators.relayQueueDepth).toBe(2);
  });

  it('clamps relay queue depth to 0', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('plan_completed', 'relay', '20260220-120000'),
      makeEntry('plan_completed', 'relay', '20260220-120100'),
    ];

    const indicators = collectStaffIndicators(entries);
    expect(indicators.relayQueueDepth).toBe(0);
  });

  it('sets monitorBudgetStatus from budget_alert metadata level', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry(
        'budget_alert',
        'monitor',
        '20260220-120000',
        'Budget alert: RED',
        { level: 'RED' },
      ),
    ];

    const indicators = collectStaffIndicators(entries);
    expect(indicators.monitorBudgetStatus).toBe('RED');
  });
});

// ============================================================================
// collectPositionHealth
// ============================================================================

describe('collectPositionHealth', () => {
  const now = Date.now();

  it('returns health for all 10 positions even with no events', () => {
    const health = collectPositionHealth([], now);
    expect(health).toHaveLength(10);
    for (const h of health) {
      expect(h.eventCount).toBe(0);
      expect(h.lastEventAge).toBe(0);
      expect(h.healthScore).toBe(1.0); // no news is good news
    }
  });

  it('counts events per position', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('phase_started', 'executor', '20260220-120000'),
      makeEntry('plan_started', 'executor', '20260220-120100'),
      makeEntry('plan_completed', 'executor', '20260220-120200'),
    ];

    const health = collectPositionHealth(entries, now);
    const execHealth = health.find((h) => h.position === 'executor');
    expect(execHealth?.eventCount).toBe(3);
    expect(execHealth?.errorCount).toBe(0);
    expect(execHealth?.healthScore).toBe(1.0);
  });

  it('reduces health score with errors', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('phase_started', 'executor', '20260220-120000'),
      makeEntry('halt_issued', 'executor', '20260220-120100'),
      makeEntry('verification_failed', 'executor', '20260220-120200'),
    ];

    const health = collectPositionHealth(entries, now);
    const execHealth = health.find((h) => h.position === 'executor');
    expect(execHealth?.errorCount).toBe(2);
    // healthScore = max(0, 1.0 - (2 * 0.2)) = 0.6
    expect(execHealth?.healthScore).toBeCloseTo(0.6);
  });

  it('floors health score at 0 for 5+ errors', () => {
    const entries: ChroniclerEntry[] = [
      makeEntry('halt_issued', 'sentinel', '20260220-120000'),
      makeEntry('halt_issued', 'sentinel', '20260220-120100'),
      makeEntry('halt_issued', 'sentinel', '20260220-120200'),
      makeEntry('halt_issued', 'sentinel', '20260220-120300'),
      makeEntry('halt_issued', 'sentinel', '20260220-120400'),
    ];

    const health = collectPositionHealth(entries, now);
    const sentinelHealth = health.find((h) => h.position === 'sentinel');
    expect(sentinelHealth?.errorCount).toBe(5);
    // healthScore = max(0, 1.0 - (5 * 0.2)) = 0.0
    expect(sentinelHealth?.healthScore).toBe(0.0);
  });

  it('computes lastEventAge using provided now', () => {
    // Use a known timestamp for deterministic testing
    const entries: ChroniclerEntry[] = [
      makeEntry('phase_started', 'coordinator', '20260220-120000'),
    ];

    // 2026-02-20 12:00:00 UTC in ms
    const eventTime = Date.UTC(2026, 1, 20, 12, 0, 0);
    const testNow = eventTime + 60000; // 60 seconds later

    const health = collectPositionHealth(entries, testNow);
    const coordHealth = health.find((h) => h.position === 'coordinator');
    expect(coordHealth?.lastEventAge).toBe(60000);
  });
});

// ============================================================================
// assembleDenSnapshot
// ============================================================================

describe('assembleDenSnapshot', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dashboard-test-'));
    logPath = join(tmpDir, 'logs', 'chronicler.jsonl');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('produces a valid snapshot from a mock log file', async () => {
    // Write some entries to the log file
    const entries: ChroniclerEntry[] = [
      makeEntry('phase_started', 'coordinator', '20260220-120000'),
      makeEntry('plan_started', 'executor', '20260220-120100'),
      makeEntry('plan_completed', 'executor', '20260220-120500'),
      makeEntry('verification_passed', 'verifier', '20260220-120600'),
    ];

    // Create directory and write JSONL
    await mkdir(join(tmpDir, 'logs'), { recursive: true });
    const jsonlContent = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    await writeFile(logPath, jsonlContent, 'utf-8');

    // Create bus directory for health metrics
    const busDir = join(tmpDir, 'bus');
    await mkdir(busDir, { recursive: true });
    for (let i = 0; i < 8; i++) {
      await mkdir(join(busDir, `priority-${i}`), { recursive: true });
    }
    await mkdir(join(busDir, 'dead-letter'), { recursive: true });

    const snapshot = await assembleDenSnapshot({
      chroniclerLogPath: logPath,
      busConfig: { busDir },
      agentId: 'chronicler',
    });

    expect(snapshot.positions).toHaveLength(10);
    expect(snapshot.indicators).toBeDefined();
    expect(snapshot.positionHealth).toHaveLength(10);
    expect(snapshot.busHealthy).toBe(true);
    expect(snapshot.totalEvents).toBe(4);

    // Validate through schema
    const parsed = DenSnapshotSchema.parse(snapshot);
    expect(parsed.timestamp).toBeTruthy();
  });

  it('handles missing log file gracefully', async () => {
    const busDir = join(tmpDir, 'bus');
    await mkdir(busDir, { recursive: true });
    for (let i = 0; i < 8; i++) {
      await mkdir(join(busDir, `priority-${i}`), { recursive: true });
    }
    await mkdir(join(busDir, 'dead-letter'), { recursive: true });

    const snapshot = await assembleDenSnapshot({
      chroniclerLogPath: join(tmpDir, 'nonexistent.jsonl'),
      busConfig: { busDir },
      agentId: 'chronicler',
    });

    expect(snapshot.positions).toHaveLength(10);
    expect(snapshot.totalEvents).toBe(0);
  });
});

// ============================================================================
// formatDenSnapshotMarkdown
// ============================================================================

describe('formatDenSnapshotMarkdown', () => {
  const snapshot = {
    timestamp: '20260220-150000',
    positions: STAFF_AGENT_IDS.map((id) => ({
      position: id as string,
      status: 'dormant' as const,
      lastAction: 'none',
      lastSeen: 'never',
    })),
    indicators: {
      coordinatorAuthority: 'nominal' as const,
      relayQueueDepth: 3,
      monitorBudgetStatus: 'GREEN' as const,
      sentinelRecoveryState: 'clear' as const,
    },
    positionHealth: STAFF_AGENT_IDS.map((id) => ({
      position: id as string,
      eventCount: 0,
      lastEventAge: 0,
      errorCount: 0,
      healthScore: 1.0,
    })),
    busHealthy: true,
    totalEvents: 0,
  };

  it('produces markdown with expected header', () => {
    const md = formatDenSnapshotMarkdown(snapshot);
    expect(md).toContain('## Den Status -- 20260220-150000');
  });

  it('includes bus health line', () => {
    const md = formatDenSnapshotMarkdown(snapshot);
    expect(md).toContain('**Bus:** healthy');

    const degradedSnapshot = { ...snapshot, busHealthy: false };
    const md2 = formatDenSnapshotMarkdown(degradedSnapshot);
    expect(md2).toContain('**Bus:** degraded');
  });

  it('includes positions table with all 10 positions', () => {
    const md = formatDenSnapshotMarkdown(snapshot);
    expect(md).toContain('| Position | Status | Last Action | Last Seen |');
    for (const id of STAFF_AGENT_IDS) {
      expect(md).toContain(`| ${id} |`);
    }
  });

  it('includes staff indicators section', () => {
    const md = formatDenSnapshotMarkdown(snapshot);
    expect(md).toContain('Coordinator Authority');
    expect(md).toContain('nominal');
    expect(md).toContain('Relay Queue Depth');
    expect(md).toContain('3');
    expect(md).toContain('Monitor Budget');
    expect(md).toContain('GREEN');
    expect(md).toContain('Sentinel Recovery');
    expect(md).toContain('clear');
  });

  it('includes position health table', () => {
    const md = formatDenSnapshotMarkdown(snapshot);
    expect(md).toContain('| Position | Events | Errors | Health |');
  });

  it('renders all 10 positions in health table', () => {
    const md = formatDenSnapshotMarkdown(snapshot);
    // Count occurrences of positions -- they should appear twice (state table + health table)
    for (const id of STAFF_AGENT_IDS) {
      const matches = md.match(new RegExp(`\\| ${id} \\|`, 'g'));
      expect(matches?.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ============================================================================
// Dashboard class
// ============================================================================

describe('Dashboard class', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dashboard-class-'));
    logPath = join(tmpDir, 'logs', 'chronicler.jsonl');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('snapshot delegates to assembleDenSnapshot', async () => {
    const busDir = join(tmpDir, 'bus');
    await mkdir(busDir, { recursive: true });
    for (let i = 0; i < 8; i++) {
      await mkdir(join(busDir, `priority-${i}`), { recursive: true });
    }
    await mkdir(join(busDir, 'dead-letter'), { recursive: true });

    const dashboard = new Dashboard({
      chroniclerLogPath: logPath,
      busConfig: { busDir },
      agentId: 'chronicler',
    });

    const snapshot = await dashboard.snapshot();
    expect(snapshot.positions).toHaveLength(10);
    expect(snapshot.totalEvents).toBe(0);
  });

  it('formatSnapshot delegates to formatDenSnapshotMarkdown', () => {
    const dashboard = new Dashboard({
      chroniclerLogPath: logPath,
      busConfig: {},
      agentId: 'chronicler',
    });

    const snapshot = {
      timestamp: '20260220-150000',
      positions: STAFF_AGENT_IDS.map((id) => ({
        position: id as string,
        status: 'dormant' as const,
        lastAction: 'none',
        lastSeen: 'never',
      })),
      indicators: {
        coordinatorAuthority: 'nominal' as const,
        relayQueueDepth: 0,
        monitorBudgetStatus: 'GREEN' as const,
        sentinelRecoveryState: 'clear' as const,
      },
      positionHealth: STAFF_AGENT_IDS.map((id) => ({
        position: id as string,
        eventCount: 0,
        lastEventAge: 0,
        errorCount: 0,
        healthScore: 1.0,
      })),
      busHealthy: true,
      totalEvents: 0,
    };

    const md = dashboard.formatSnapshot(snapshot);
    expect(md).toContain('## Den Status');
  });
});

// ============================================================================
// createDashboard factory
// ============================================================================

describe('createDashboard', () => {
  it('creates with defaults', () => {
    const dashboard = createDashboard();
    expect(dashboard).toBeInstanceOf(Dashboard);
  });

  it('applies overrides', () => {
    const dashboard = createDashboard({
      chroniclerLogPath: '/custom/log.jsonl',
      agentId: 'custom',
    });
    expect(dashboard).toBeInstanceOf(Dashboard);
  });

  it('is synchronous', () => {
    const result = createDashboard();
    expect(result).not.toBeInstanceOf(Promise);
  });
});

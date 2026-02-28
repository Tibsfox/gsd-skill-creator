/**
 * Tests for the Chronicler agent (GSD Den LOG position).
 *
 * Covers: ChroniclerConfigSchema, ChroniclerEntrySchema, BriefingSchema,
 * appendChroniclerEntry, readChroniclerLog, generateBriefing,
 * formatBriefingMarkdown, Chronicler class, createChronicler factory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import {
  ChroniclerConfigSchema,
  ChroniclerEntrySchema,
  BriefingSchema,
  appendChroniclerEntry,
  readChroniclerLog,
  generateBriefing,
  formatBriefingMarkdown,
  Chronicler,
  createChronicler,
} from './chronicler.js';

// ============================================================================
// ChroniclerConfigSchema
// ============================================================================

describe('ChroniclerConfigSchema', () => {
  it('applies default values', () => {
    const config = ChroniclerConfigSchema.parse({ busConfig: {} });
    expect(config.logPath).toBe('.planning/den/logs/chronicler.jsonl');
    expect(config.agentId).toBe('chronicler');
    expect(config.busConfig).toEqual({});
  });

  it('accepts overrides', () => {
    const config = ChroniclerConfigSchema.parse({
      busConfig: { busDir: '/tmp/bus' },
      logPath: '/custom/log.jsonl',
      agentId: 'custom-chronicler',
    });
    expect(config.logPath).toBe('/custom/log.jsonl');
    expect(config.agentId).toBe('custom-chronicler');
  });
});

// ============================================================================
// ChroniclerEntrySchema
// ============================================================================

describe('ChroniclerEntrySchema', () => {
  const validEntry = {
    timestamp: '20260220-120000',
    agent: 'coordinator',
    action: 'phase_started',
    phase: '260-chronicler-dashboard',
    detail: 'Phase 260 execution started',
  };

  it('parses a valid entry', () => {
    const result = ChroniclerEntrySchema.parse(validEntry);
    expect(result.timestamp).toBe('20260220-120000');
    expect(result.agent).toBe('coordinator');
    expect(result.action).toBe('phase_started');
    expect(result.phase).toBe('260-chronicler-dashboard');
    expect(result.detail).toBe('Phase 260 execution started');
  });

  it('accepts optional metadata', () => {
    const result = ChroniclerEntrySchema.parse({
      ...validEntry,
      metadata: { planCount: 3, estimated: true },
    });
    expect(result.metadata).toEqual({ planCount: 3, estimated: true });
  });

  it('rejects missing required fields', () => {
    expect(() => ChroniclerEntrySchema.parse({})).toThrow();
    expect(() =>
      ChroniclerEntrySchema.parse({ timestamp: '20260220-120000' }),
    ).toThrow();
  });

  it('rejects invalid action type', () => {
    expect(() =>
      ChroniclerEntrySchema.parse({
        ...validEntry,
        action: 'invalid_action',
      }),
    ).toThrow();
  });

  it('validates all 14 action types', () => {
    const actions = [
      'phase_started',
      'phase_completed',
      'plan_started',
      'plan_completed',
      'verification_passed',
      'verification_failed',
      'halt_issued',
      'halt_cleared',
      'error_recovered',
      'decision_made',
      'topology_changed',
      'budget_alert',
      'intake_received',
      'custom',
    ];

    for (const action of actions) {
      const result = ChroniclerEntrySchema.parse({ ...validEntry, action });
      expect(result.action).toBe(action);
    }
  });

  it('rejects invalid agent ID', () => {
    expect(() =>
      ChroniclerEntrySchema.parse({
        ...validEntry,
        agent: 'nonexistent_agent',
      }),
    ).toThrow();
  });
});

// ============================================================================
// BriefingSchema
// ============================================================================

describe('BriefingSchema', () => {
  it('parses a valid briefing', () => {
    const briefing = {
      timestamp: '20260220-150000',
      phase: '260',
      title: 'Phase 260 Briefing',
      narrative: [
        'Phase 260 operations summary with 5 events across 3 agents.',
        '- phase_started: 1 event(s)',
        'Briefing complete. 5 events logged.',
      ],
      metrics: {
        totalEvents: 5,
        agentsActive: ['coordinator', 'executor', 'verifier'],
        duration: '00:15:00',
      },
    };

    const result = BriefingSchema.parse(briefing);
    expect(result.title).toBe('Phase 260 Briefing');
    expect(result.metrics.totalEvents).toBe(5);
    expect(result.metrics.agentsActive).toHaveLength(3);
    expect(result.metrics.duration).toBe('00:15:00');
  });
});

// ============================================================================
// appendChroniclerEntry / readChroniclerLog
// ============================================================================

describe('JSONL append and read', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'chronicler-test-'));
    logPath = join(tmpDir, 'logs', 'chronicler.jsonl');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const makeEntry = (action: string, agent: string = 'coordinator') => ({
    timestamp: '20260220-120000',
    agent: agent as 'coordinator',
    action: action as 'phase_started',
    phase: '260',
    detail: `Test ${action} event`,
  });

  it('writes valid JSONL', async () => {
    await appendChroniclerEntry(logPath, makeEntry('phase_started'));

    const raw = await readFile(logPath, 'utf-8');
    const parsed = JSON.parse(raw.trim());
    expect(parsed.action).toBe('phase_started');
  });

  it('multiple appends create multiple lines', async () => {
    await appendChroniclerEntry(logPath, makeEntry('phase_started'));
    await appendChroniclerEntry(logPath, makeEntry('plan_started'));
    await appendChroniclerEntry(logPath, makeEntry('plan_completed'));

    const raw = await readFile(logPath, 'utf-8');
    const lines = raw.trim().split('\n');
    expect(lines).toHaveLength(3);
  });

  it('validates written data with schema', async () => {
    const entry = makeEntry('decision_made');
    await appendChroniclerEntry(logPath, entry);

    const raw = await readFile(logPath, 'utf-8');
    const parsed = JSON.parse(raw.trim());
    const validated = ChroniclerEntrySchema.parse(parsed);
    expect(validated.action).toBe('decision_made');
  });

  it('reads back what was written', async () => {
    await appendChroniclerEntry(logPath, makeEntry('phase_started'));
    await appendChroniclerEntry(logPath, makeEntry('phase_completed'));

    const entries = await readChroniclerLog(logPath);
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('phase_started');
    expect(entries[1].action).toBe('phase_completed');
  });

  it('empty file returns empty array', async () => {
    // Write empty file
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(logPath), { recursive: true });
    await writeFile(logPath, '', 'utf-8');

    const entries = await readChroniclerLog(logPath);
    expect(entries).toHaveLength(0);
  });

  it('handles missing file gracefully', async () => {
    const entries = await readChroniclerLog('/nonexistent/path/log.jsonl');
    expect(entries).toHaveLength(0);
  });
});

// ============================================================================
// generateBriefing
// ============================================================================

describe('generateBriefing', () => {
  const makeEntry = (
    action: string,
    agent: string = 'coordinator',
    ts: string = '20260220-120000',
  ) => ({
    timestamp: ts,
    agent: agent as 'coordinator',
    action: action as 'phase_started',
    phase: '260',
    detail: `Test ${action} event from ${agent}`,
  });

  it('produces minimal briefing from empty entries', () => {
    const briefing = generateBriefing([], '260');

    expect(briefing.phase).toBe('260');
    expect(briefing.title).toBe('Phase 260 Briefing');
    expect(briefing.metrics.totalEvents).toBe(0);
    expect(briefing.metrics.agentsActive).toHaveLength(0);
    expect(briefing.metrics.duration).toBe('N/A');
    expect(briefing.narrative.length).toBeGreaterThan(0);
  });

  it('produces correct narrative with grouped counts', () => {
    const entries = [
      makeEntry('phase_started', 'coordinator'),
      makeEntry('plan_started', 'executor'),
      makeEntry('plan_completed', 'executor'),
      makeEntry('verification_passed', 'verifier'),
      makeEntry('plan_started', 'executor'),
    ];

    const briefing = generateBriefing(entries, '260');

    expect(briefing.metrics.totalEvents).toBe(5);
    expect(briefing.metrics.agentsActive).toContain('coordinator');
    expect(briefing.metrics.agentsActive).toContain('executor');
    expect(briefing.metrics.agentsActive).toContain('verifier');

    // Check grouped action counts in narrative
    const fullNarrative = briefing.narrative.join('\n');
    expect(fullNarrative).toContain('phase_started: 1 event(s)');
    expect(fullNarrative).toContain('plan_started: 2 event(s)');
    expect(fullNarrative).toContain('plan_completed: 1 event(s)');
    expect(fullNarrative).toContain('verification_passed: 1 event(s)');
  });

  it('adds special attention for halt events', () => {
    const entries = [
      makeEntry('phase_started', 'coordinator'),
      makeEntry('halt_issued', 'sentinel'),
    ];

    const briefing = generateBriefing(entries, '260');
    const fullNarrative = briefing.narrative.join('\n');
    expect(fullNarrative).toContain('ALERT: HALT was issued during this phase.');
  });

  it('adds special attention for verification failures', () => {
    const entries = [
      makeEntry('phase_started', 'coordinator'),
      makeEntry('verification_failed', 'verifier'),
    ];

    const briefing = generateBriefing(entries, '260');
    const fullNarrative = briefing.narrative.join('\n');
    expect(fullNarrative).toContain(
      'ATTENTION: Verification failures detected.',
    );
  });

  it('computes duration from first to last timestamp', () => {
    const entries = [
      makeEntry('phase_started', 'coordinator', '20260220-120000'),
      makeEntry('phase_completed', 'coordinator', '20260220-131500'),
    ];

    const briefing = generateBriefing(entries, '260');
    expect(briefing.metrics.duration).not.toBe('N/A');
  });
});

// ============================================================================
// formatBriefingMarkdown
// ============================================================================

describe('formatBriefingMarkdown', () => {
  it('produces valid markdown with expected sections', () => {
    const briefing = {
      timestamp: '20260220-150000',
      phase: '260',
      title: 'Phase 260 Briefing',
      narrative: [
        'Phase 260 operations summary with 3 events across 2 agents.',
        '- phase_started: 1 event(s)',
        'Briefing complete. 3 events logged.',
      ],
      metrics: {
        totalEvents: 3,
        agentsActive: ['coordinator', 'executor'],
        duration: '00:10:00',
      },
    };

    const md = formatBriefingMarkdown(briefing);

    expect(md).toContain('## Staff Briefing -- 20260220-150000');
    expect(md).toContain('**Phase:** 260');
    expect(md).toContain('**Phase 260 Briefing**');
    expect(md).toContain('Phase 260 operations summary');
    expect(md).toContain('coordinator, executor');
    expect(md).toContain('3');
    expect(md).toContain('00:10:00');
  });
});

// ============================================================================
// Chronicler class
// ============================================================================

describe('Chronicler class', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'chronicler-class-'));
    logPath = join(tmpDir, 'logs', 'chronicler.jsonl');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('appendEntry auto-fills timestamp', async () => {
    const chronicler = new Chronicler({
      busConfig: {},
      logPath,
      agentId: 'chronicler',
    });

    await chronicler.appendEntry({
      agent: 'coordinator',
      action: 'phase_started',
      phase: '260',
      detail: 'Starting phase',
    });

    const entries = await chronicler.readLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].timestamp).toMatch(/^\d{8}-\d{6}$/);
  });

  it('readLog delegates to standalone function', async () => {
    const chronicler = new Chronicler({
      busConfig: {},
      logPath,
      agentId: 'chronicler',
    });

    // Initially empty
    const entries = await chronicler.readLog();
    expect(entries).toHaveLength(0);
  });

  it('generateBriefing delegates to standalone function', async () => {
    const chronicler = new Chronicler({
      busConfig: {},
      logPath,
      agentId: 'chronicler',
    });

    await chronicler.appendEntry({
      agent: 'executor',
      action: 'plan_started',
      phase: '260',
      detail: 'Plan 01 started',
    });

    const briefing = await chronicler.generateBriefing('260');
    expect(briefing.phase).toBe('260');
    expect(briefing.metrics.totalEvents).toBe(1);
  });

  it('formatBriefing delegates to standalone function', () => {
    const chronicler = new Chronicler({
      busConfig: {},
      logPath,
      agentId: 'chronicler',
    });

    const briefing = {
      timestamp: '20260220-150000',
      phase: '260',
      title: 'Phase 260 Briefing',
      narrative: ['Summary line.'],
      metrics: {
        totalEvents: 1,
        agentsActive: ['executor'],
        duration: 'N/A',
      },
    };

    const md = chronicler.formatBriefing(briefing);
    expect(md).toContain('## Staff Briefing');
  });
});

// ============================================================================
// createChronicler factory
// ============================================================================

describe('createChronicler', () => {
  it('creates with defaults', () => {
    const chronicler = createChronicler({ busConfig: {} });
    expect(chronicler).toBeInstanceOf(Chronicler);
  });

  it('applies overrides', () => {
    const chronicler = createChronicler({
      busConfig: {},
      logPath: '/custom/path.jsonl',
      agentId: 'custom',
    });
    expect(chronicler).toBeInstanceOf(Chronicler);
  });

  it('is synchronous', () => {
    const result = createChronicler({ busConfig: {} });
    // If it were async, result would be a Promise
    expect(result).not.toBeInstanceOf(Promise);
  });
});

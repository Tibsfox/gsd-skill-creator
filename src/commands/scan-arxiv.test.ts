// === scan-arxiv CLI tests ===
//
// Tests parseArgv, previousCompletedMonth, and resolveOptions.
// The bridge is mocked via vi.mock so these tests run without Wave 2A's
// bridge.ts being present.

import { describe, it, expect, vi } from 'vitest';

// Mock bridge.ts — Wave 2A may not exist when this test file runs.
vi.mock('../scan-arxiv/bridge.js', () => ({
  buildBridge: vi.fn().mockResolvedValue({
    queueJsonPath: '/tmp/queue.json',
    reportMdPath: '/tmp/report.md',
    shellScriptPath: '/tmp/run-ingestion.sh',
    seenIdsPath: '/tmp/seen-ids.json',
  }),
}));

import { parseArgv, resolveOptions, previousCompletedMonth } from '../scan-arxiv/options.js';

describe('parseArgv', () => {
  it('parses --month into options.month', () => {
    const { options, errors } = parseArgv(['--month', '2026-05']);
    expect(options.month).toBe('2026-05');
    expect(errors).toHaveLength(0);
  });

  it('reports validation error mentioning --month for invalid month value', () => {
    const { errors } = parseArgv(['--month', '2026-13']);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/--month/);
    expect(errors[0]).toMatch(/2026-13/);
  });

  it('parses --top and --dry-run together', () => {
    const { options, errors } = parseArgv(['--top', '50', '--dry-run']);
    expect(options.top).toBe(50);
    expect(options.dryRun).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('collects unknown flags in unknownFlags array', () => {
    const { unknownFlags } = parseArgv(['--unknown']);
    expect(unknownFlags).toContain('--unknown');
  });

  it('parses --categories into an array of length 2', () => {
    const { options, errors } = parseArgv(['--categories', 'cs.AI,cs.CL']);
    expect(errors).toHaveLength(0);
    expect(Array.isArray(options.categories)).toBe(true);
    expect(options.categories).toHaveLength(2);
    expect(options.categories).toContain('cs.AI');
    expect(options.categories).toContain('cs.CL');
  });
});

describe('previousCompletedMonth', () => {
  it('returns "2026-04" for a date in May 2026', () => {
    expect(previousCompletedMonth(new Date('2026-05-16'))).toBe('2026-04');
  });

  it('wraps around year boundary: Jan → Dec of prior year', () => {
    expect(previousCompletedMonth(new Date('2026-01-15'))).toBe('2025-12');
  });
});

describe('resolveOptions', () => {
  it('fills in all defaults when called with empty options', () => {
    const resolved = resolveOptions({});
    expect(resolved.top).toBe(30);
    expect(resolved.dryRun).toBe(false);
    expect(resolved.minScore).toBe(0.5);
    expect(resolved.noCache).toBe(false);
    expect(resolved.outputDir).toBe('.planning/arxiv-may-funnel/runs');
    expect(resolved.categories).toHaveLength(5);
  });

  it('respects provided values over defaults', () => {
    const resolved = resolveOptions({
      month: '2026-03',
      top: 10,
      dryRun: true,
      categories: ['cs.AI'],
      minScore: 0.7,
      noCache: true,
      outputDir: '/tmp/out',
    });
    expect(resolved.month).toBe('2026-03');
    expect(resolved.top).toBe(10);
    expect(resolved.dryRun).toBe(true);
    expect(resolved.categories).toEqual(['cs.AI']);
    expect(resolved.minScore).toBe(0.7);
    expect(resolved.noCache).toBe(true);
    expect(resolved.outputDir).toBe('/tmp/out');
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  appendAuditLogEntry,
  buildAuditLogEntry,
  readAuditLog,
  type AuditLogEntry,
} from '../audit-log.js';
import type { CalibrationRecommendation } from '../types.js';

function makeRecommendation(
  overrides: Partial<CalibrationRecommendation> = {},
): CalibrationRecommendation {
  return {
    threshold: 'suggestions.min_occurrences',
    currentValue: 3,
    proposedValue: 2,
    direction: 'decrease',
    rejected: true,
    evidence: 41.2,
    rejectionThreshold: 40,
    observations: 10,
    meanObservation: 1,
    alpha: 0.05,
    reason: 'test',
    ...overrides,
  };
}

describe('buildAuditLogEntry — derives entry from recommendation (v1.49.799)', () => {
  it('captures all recommendation fields + observationSource metadata + timestamp', () => {
    const rec = makeRecommendation();
    const entry = buildAuditLogEntry(rec, 'dry-run', {
      now: () => new Date('2026-05-27T02:00:00.000Z'),
    });
    expect(entry.timestamp).toBe('2026-05-27T02:00:00.000Z');
    expect(entry.threshold).toBe('suggestions.min_occurrences');
    expect(entry.currentValue).toBe(3);
    expect(entry.proposedValue).toBe(2);
    expect(entry.direction).toBe('decrease');
    expect(entry.rejected).toBe(true);
    expect(entry.observations).toBe(10);
    expect(entry.evidence).toBe(41.2);
    expect(entry.alpha).toBe(0.05);
    expect(entry.applied).toBe('dry-run');
    expect(entry.observationSource.sourceId).toBe('suggestions.json');
    expect(entry.observationSource.wired).toBe(true);
  });

  it('reflects wired source for token_budget.warn_at_percent (v1.49.803)', () => {
    const rec = makeRecommendation({ threshold: 'token_budget.warn_at_percent' });
    const entry = buildAuditLogEntry(rec, 'noop');
    expect(entry.observationSource.sourceId).toBe('token-budget-events');
    expect(entry.observationSource.wired).toBe(true);
  });

  it('reflects WIRED source for token_budget.max_percent (v1.49.888 read-side wire)', () => {
    const rec = makeRecommendation({ threshold: 'token_budget.max_percent' });
    const entry = buildAuditLogEntry(rec, 'noop');
    expect(entry.observationSource.sourceId).toBe('token-budget-max-events');
    expect(entry.observationSource.wired).toBe(true);
  });

  it('preserves proposedValue=null for hold direction', () => {
    const rec = makeRecommendation({ direction: 'hold', proposedValue: null });
    const entry = buildAuditLogEntry(rec, 'noop');
    expect(entry.proposedValue).toBeNull();
    expect(entry.direction).toBe('hold');
  });
});

describe('appendAuditLogEntry — atomic append to JSONL (v1.49.799)', () => {
  let workDir: string;
  let logPath: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-audit-log-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    logPath = join(workDir, 'patterns', 'bounded-learning-log.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('creates parent directory if missing and writes a single JSON line', async () => {
    const entry = buildAuditLogEntry(makeRecommendation(), 'dry-run', {
      now: () => new Date('2026-05-27T02:00:00.000Z'),
    });
    const written = await appendAuditLogEntry(entry, { path: logPath });
    expect(written).toBe(logPath);
    const raw = readFileSync(logPath, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(raw.trim());
    expect(parsed.timestamp).toBe('2026-05-27T02:00:00.000Z');
  });

  it('appends a second entry below the first without truncating', async () => {
    mkdirSync(join(workDir, 'patterns'), { recursive: true });
    const e1 = buildAuditLogEntry(makeRecommendation(), 'dry-run', {
      now: () => new Date('2026-05-27T02:00:00.000Z'),
    });
    const e2 = buildAuditLogEntry(makeRecommendation({ proposedValue: 4 }), 'applied', {
      now: () => new Date('2026-05-27T02:01:00.000Z'),
    });
    await appendAuditLogEntry(e1, { path: logPath });
    await appendAuditLogEntry(e2, { path: logPath });
    const raw = readFileSync(logPath, 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).timestamp).toBe('2026-05-27T02:00:00.000Z');
    expect(JSON.parse(lines[1]!).timestamp).toBe('2026-05-27T02:01:00.000Z');
    expect(JSON.parse(lines[1]!).applied).toBe('applied');
  });
});

describe('readAuditLog — tolerant reader (v1.49.799)', () => {
  let workDir: string;
  let logPath: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-audit-read-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    logPath = join(workDir, 'bounded-learning-log.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('returns empty array when file is missing', async () => {
    const entries = await readAuditLog(join(workDir, 'does-not-exist.jsonl'));
    expect(entries).toEqual([]);
  });

  it('returns parsed entries in file order', async () => {
    const e1 = buildAuditLogEntry(makeRecommendation(), 'dry-run', {
      now: () => new Date('2026-05-27T02:00:00.000Z'),
    });
    const e2 = buildAuditLogEntry(makeRecommendation({ direction: 'hold', proposedValue: null }), 'noop', {
      now: () => new Date('2026-05-27T02:05:00.000Z'),
    });
    writeFileSync(logPath, JSON.stringify(e1) + '\n' + JSON.stringify(e2) + '\n', 'utf8');
    const entries = await readAuditLog(logPath);
    expect(entries).toHaveLength(2);
    expect(entries[0]!.timestamp).toBe('2026-05-27T02:00:00.000Z');
    expect(entries[1]!.direction).toBe('hold');
  });

  it('skips malformed lines without crashing', async () => {
    const valid = buildAuditLogEntry(makeRecommendation(), 'dry-run');
    writeFileSync(
      logPath,
      `${JSON.stringify(valid)}\n<<<not json>>>\n{"partial":"missing-fields"}\n${JSON.stringify(valid)}\n`,
      'utf8',
    );
    const entries = await readAuditLog(logPath);
    expect(entries).toHaveLength(2);
  });

  it('handles blank lines and trailing whitespace', async () => {
    const valid = buildAuditLogEntry(makeRecommendation(), 'dry-run');
    appendFileSync(logPath, '\n\n' + JSON.stringify(valid) + '\n\n', 'utf8');
    const entries = await readAuditLog(logPath);
    expect(entries).toHaveLength(1);
  });

  it('returns empty array for empty file', async () => {
    writeFileSync(logPath, '', 'utf8');
    const entries = await readAuditLog(logPath);
    expect(entries).toEqual([]);
  });
});

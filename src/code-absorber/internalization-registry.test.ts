import { describe, it, expect } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  appendRecord,
  readAllRecords,
  computeObservationStatus,
  InternalizationRegistry,
} from './internalization-registry.js';
import type { AbsorptionRecord } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniqueRegistryPath(): string {
  return join(tmpdir(), `registry-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
}

function makeRecord(overrides: Partial<AbsorptionRecord> = {}): AbsorptionRecord {
  return {
    id: 'test-uuid-1234',
    packageName: 'tiny-math',
    ecosystem: 'npm',
    algorithmName: 'clamp',
    sourcePackage: 'tiny-math',
    criteriaVerdict: {
      candidatePackage: 'tiny-math',
      status: 'approved',
      rejectionReasons: [],
      isHardBlocked: false,
      checkedAt: '2026-03-03T00:00:00.000Z',
    },
    oracleResult: {
      packageName: 'tiny-math',
      totalCases: 10_000,
      failures: 0,
      isDeterministic: true,
      passedAt: '2026-03-03T00:01:00.000Z',
    },
    callSiteCycles: [],
    dateAbsorbed: '2026-03-03T00:00:00.000Z',
    observationPeriodDays: 30,
    observationPeriodComplete: false,
    status: 'complete',
    ...overrides,
  };
}

// ─── appendRecord + readAllRecords ────────────────────────────────────────────

describe('appendRecord + readAllRecords', () => {
  it('appendRecord creates file when it does not exist', async () => {
    const path = uniqueRegistryPath();
    await appendRecord(path, makeRecord());
    const content = await readFile(path, 'utf-8');
    expect(content.trim()).toBeTruthy();
  });

  it('appendRecord creates parent directory when missing', async () => {
    const path = join(tmpdir(), `nested-${Date.now()}`, 'sub', 'registry.jsonl');
    await appendRecord(path, makeRecord());
    const content = await readFile(path, 'utf-8');
    expect(content.trim()).toBeTruthy();
  });

  it('readAllRecords returns [] when file does not exist', async () => {
    const path = uniqueRegistryPath();
    const records = await readAllRecords(path);
    expect(records).toEqual([]);
  });

  it('readAllRecords returns all appended records', async () => {
    const path = uniqueRegistryPath();
    await appendRecord(path, makeRecord({ id: 'a' }));
    await appendRecord(path, makeRecord({ id: 'b' }));
    const records = await readAllRecords(path);
    expect(records).toHaveLength(2);
  });

  it('append + readAll round-trips a complete AbsorptionRecord', async () => {
    const path = uniqueRegistryPath();
    const original = makeRecord();
    await appendRecord(path, original);
    const records = await readAllRecords(path);
    expect(records[0]).toEqual(original);
  });

  it('multiple appends produce multiple records in order', async () => {
    const path = uniqueRegistryPath();
    await appendRecord(path, makeRecord({ id: 'first' }));
    await appendRecord(path, makeRecord({ id: 'second' }));
    await appendRecord(path, makeRecord({ id: 'third' }));
    const records = await readAllRecords(path);
    expect(records.map(r => r.id)).toEqual(['first', 'second', 'third']);
  });

  it('readAllRecords skips corrupt lines without throwing', async () => {
    const path = uniqueRegistryPath();
    await appendRecord(path, makeRecord({ id: 'good' }));
    // Inject corrupt line manually
    const { appendFile } = await import('node:fs/promises');
    await appendFile(path, 'not-valid-json\n', 'utf-8');
    await appendRecord(path, makeRecord({ id: 'also-good' }));
    const records = await readAllRecords(path);
    // Should have 2 valid records, corrupt line skipped
    expect(records).toHaveLength(2);
    expect(records.map(r => r.id)).toEqual(['good', 'also-good']);
  });

  it('existing records are never modified (append-only — reading twice returns same initial record)', async () => {
    const path = uniqueRegistryPath();
    const first = makeRecord({ id: 'immutable' });
    await appendRecord(path, first);
    const beforeAppend = await readAllRecords(path);

    // Append another record
    await appendRecord(path, makeRecord({ id: 'second' }));
    const afterAppend = await readAllRecords(path);

    // First record unchanged
    expect(afterAppend[0]).toEqual(beforeAppend[0]);
    expect(afterAppend).toHaveLength(2);
  });
});

// ─── computeObservationStatus ─────────────────────────────────────────────────

describe('computeObservationStatus', () => {
  const baseRecord = makeRecord({
    dateAbsorbed: '2026-01-01T00:00:00.000Z',
    observationPeriodDays: 30,
  });

  it('elapsedDays=0 when absorbed just now', () => {
    const { elapsedDays } = computeObservationStatus(
      baseRecord,
      '2026-01-01T00:00:00.000Z',
    );
    expect(elapsedDays).toBe(0);
  });

  it('elapsedDays=30 when absorbed 30 days ago', () => {
    const { elapsedDays } = computeObservationStatus(
      baseRecord,
      '2026-01-31T00:00:00.000Z',
    );
    expect(elapsedDays).toBe(30);
  });

  it('isComplete=true when elapsed >= observationPeriodDays', () => {
    const { isComplete } = computeObservationStatus(
      baseRecord,
      '2026-01-31T00:00:00.000Z', // exactly 30 days
    );
    expect(isComplete).toBe(true);
  });

  it('isComplete=false when elapsed < observationPeriodDays', () => {
    const { isComplete } = computeObservationStatus(
      baseRecord,
      '2026-01-15T00:00:00.000Z', // 14 days
    );
    expect(isComplete).toBe(false);
  });

  it('accepts nowIso parameter for deterministic testing', () => {
    const result1 = computeObservationStatus(baseRecord, '2026-01-10T00:00:00.000Z');
    const result2 = computeObservationStatus(baseRecord, '2026-01-20T00:00:00.000Z');
    expect(result1.elapsedDays).toBe(9);
    expect(result2.elapsedDays).toBe(19);
  });
});

// ─── Class wrapper ────────────────────────────────────────────────────────────

describe('InternalizationRegistry class', () => {
  it('append() and readAll() round-trip via class API', async () => {
    const path = uniqueRegistryPath();
    const registry = new InternalizationRegistry(path);
    const record = makeRecord({ id: 'class-test' });
    await registry.append(record);
    const records = await registry.readAll();
    expect(records[0].id).toBe('class-test');
  });

  it('computeObservationStatus() delegates to core function', () => {
    const registry = new InternalizationRegistry('/unused/path');
    const record = makeRecord({
      dateAbsorbed: '2026-01-01T00:00:00.000Z',
      observationPeriodDays: 30,
    });
    const { elapsedDays } = registry.computeObservationStatus(
      record,
      '2026-01-16T00:00:00.000Z',
    );
    expect(elapsedDays).toBe(15);
  });
});

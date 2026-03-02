/**
 * TDD tests for DeltaStore -- JSON file persistence for CalibrationDelta records.
 *
 * Tests cover:
 * - Persistence survival across instances (CAL-03)
 * - Date serialization roundtrip
 * - Domain isolation
 * - Insertion ordering
 * - Empty history
 * - Multi-user isolation
 */

import { describe, it, expect, afterEach } from 'vitest';
import { DeltaStore } from './delta-store.js';
import type { CalibrationDelta } from '../rosetta-core/types.js';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/** Create a unique temp directory for each test */
function createTempDir(): string {
  return path.join(os.tmpdir(), 'delta-store-test-' + crypto.randomUUID());
}

/** Create a sample CalibrationDelta */
function createDelta(overrides: Partial<CalibrationDelta> = {}): CalibrationDelta {
  return {
    observedResult: 'overdone',
    expectedResult: 'medium',
    adjustment: { temperature: -15 },
    confidence: 0.7,
    domainModel: 'cooking',
    timestamp: new Date('2026-03-01T12:00:00Z'),
    ...overrides,
  };
}

let tempDirs: string[] = [];

afterEach(async () => {
  for (const dir of tempDirs) {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
  tempDirs = [];
});

describe('DeltaStore', () => {
  it('persists deltas across separate store instances (CAL-03)', async () => {
    const tmpDir = createTempDir();
    tempDirs.push(tmpDir);

    const store1 = new DeltaStore({ baseDir: tmpDir, userId: 'user1', domain: 'cooking' });
    const delta = createDelta();
    await store1.save(delta);

    // Create a fresh instance pointing to the same storage
    const store2 = new DeltaStore({ baseDir: tmpDir, userId: 'user1', domain: 'cooking' });
    const history = await store2.getHistory();

    expect(history).toHaveLength(1);
    expect(history[0].observedResult).toBe('overdone');
    expect(history[0].expectedResult).toBe('medium');
    expect(history[0].adjustment.temperature).toBe(-15);
    expect(history[0].confidence).toBe(0.7);
    expect(history[0].domainModel).toBe('cooking');
  });

  it('roundtrips Date objects correctly through JSON serialization', async () => {
    const tmpDir = createTempDir();
    tempDirs.push(tmpDir);

    const store = new DeltaStore({ baseDir: tmpDir, userId: 'user1', domain: 'cooking' });
    const delta = createDelta({ timestamp: new Date('2026-03-01T12:00:00Z') });
    await store.save(delta);

    const history = await store.getHistory();
    expect(history[0].timestamp).toBeInstanceOf(Date);
    expect(history[0].timestamp.toISOString()).toBe('2026-03-01T12:00:00.000Z');
  });

  it('isolates deltas by domain for the same user', async () => {
    const tmpDir = createTempDir();
    tempDirs.push(tmpDir);

    const cookingStore = new DeltaStore({ baseDir: tmpDir, userId: 'user1', domain: 'cooking' });
    const mathStore = new DeltaStore({ baseDir: tmpDir, userId: 'user1', domain: 'mathematics' });

    const deltaA = createDelta({ domainModel: 'cooking', observedResult: 'burnt' });
    const deltaB = createDelta({ domainModel: 'mathematics', observedResult: 'imprecise' });

    await cookingStore.save(deltaA);
    await mathStore.save(deltaB);

    const cookingHistory = await cookingStore.getHistory();
    const mathHistory = await mathStore.getHistory();

    expect(cookingHistory).toHaveLength(1);
    expect(cookingHistory[0].observedResult).toBe('burnt');

    expect(mathHistory).toHaveLength(1);
    expect(mathHistory[0].observedResult).toBe('imprecise');
  });

  it('returns deltas in insertion order', async () => {
    const tmpDir = createTempDir();
    tempDirs.push(tmpDir);

    const store = new DeltaStore({ baseDir: tmpDir, userId: 'user1', domain: 'cooking' });

    const delta1 = createDelta({ observedResult: 'first', timestamp: new Date('2026-01-01T00:00:00Z') });
    const delta2 = createDelta({ observedResult: 'second', timestamp: new Date('2026-02-01T00:00:00Z') });
    const delta3 = createDelta({ observedResult: 'third', timestamp: new Date('2026-03-01T00:00:00Z') });

    await store.save(delta1);
    await store.save(delta2);
    await store.save(delta3);

    const history = await store.getHistory();
    expect(history).toHaveLength(3);
    expect(history[0].observedResult).toBe('first');
    expect(history[1].observedResult).toBe('second');
    expect(history[2].observedResult).toBe('third');
  });

  it('returns empty array for store with no written deltas', async () => {
    const tmpDir = createTempDir();
    tempDirs.push(tmpDir);

    const store = new DeltaStore({ baseDir: tmpDir, userId: 'user1', domain: 'cooking' });
    const history = await store.getHistory();

    expect(history).toEqual([]);
  });

  it('isolates deltas across different users', async () => {
    const tmpDir = createTempDir();
    tempDirs.push(tmpDir);

    const aliceStore = new DeltaStore({ baseDir: tmpDir, userId: 'alice', domain: 'cooking' });
    const bobStore = new DeltaStore({ baseDir: tmpDir, userId: 'bob', domain: 'cooking' });

    const aliceDelta = createDelta({ observedResult: 'alice-result' });
    const bobDelta = createDelta({ observedResult: 'bob-result' });

    await aliceStore.save(aliceDelta);
    await bobStore.save(bobDelta);

    const aliceHistory = await aliceStore.getHistory();
    const bobHistory = await bobStore.getHistory();

    expect(aliceHistory).toHaveLength(1);
    expect(aliceHistory[0].observedResult).toBe('alice-result');

    expect(bobHistory).toHaveLength(1);
    expect(bobHistory[0].observedResult).toBe('bob-result');
  });
});

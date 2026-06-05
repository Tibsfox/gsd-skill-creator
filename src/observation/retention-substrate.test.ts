import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runObservationRetentionSweep, deriveAgePressureKind, DEFAULT_AGE_PRESSURE_BAND } from './retention-substrate.js';
import type { PruneStats } from './retention-manager.js';
import { readObservationRetentionEvents } from '../bounded-learning/observation-retention-events.js';

describe('runObservationRetentionSweep (v1.49.891 substrate auto-emit)', () => {
  let workDir: string;
  let jsonlPath: string;
  let eventsPath: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `obs-retention-substrate-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    jsonlPath = join(workDir, 'patterns.jsonl');
    eventsPath = join(workDir, 'observation-retention-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  /**
   * Wait for the fire-and-forget auto-emit Promise to complete its async
   * fs operations (mkdir + appendFile). We don't await the
   * `appendObservationRetentionEvent` promise inside the substrate (per
   * #10437); tests need a delay to allow real I/O to settle.
   */
  async function waitForAutoEmit(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  it('reads observation.retention_days from config and applies as maxAgeDays', async () => {
    // Write entries: 10 days old + 100 days old
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const hundredDaysAgo = Date.now() - 100 * 24 * 60 * 60 * 1000;
    writeFileSync(
      jsonlPath,
      [
        JSON.stringify({ timestamp: tenDaysAgo, content: 'recent' }),
        JSON.stringify({ timestamp: hundredDaysAgo, content: 'old' }),
      ].join('\n') + '\n',
      'utf8',
    );

    // With retention_days = 30, only the 100-day-old entry should be pruned
    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      jsonlPath,
      { eventsPath, autoEmit: false }, // disable auto-emit for this assertion-focused test
    );

    expect(result.prunedCount).toBe(1);
    expect(result.retentionDays).toBe(30);
  });

  it('derives too_aggressive when the sweep drops the entire corpus (v982)', async () => {
    // One entry, 100 days old, retention_days 30 → it is pruned and nothing is
    // retained. retainedCount 0 + prunedCount > 0 ⇒ the window dropped everything.
    writeFileSync(
      jsonlPath,
      JSON.stringify({ timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000, content: 'old' }) + '\n',
      'utf8',
    );

    await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      jsonlPath,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('too_aggressive');
    expect(events[0].droppedCount).toBe(1);
    expect(events[0].retainedCount).toBe(0);
    expect(events[0].retentionDays).toBe(30);
  });

  it('emits NOTHING on an empty corpus (neutral / no basis — v982)', async () => {
    // Empty file → 0 pruned, 0 retained → no age basis → in-band/neutral.
    // (Pre-v982 this emitted a degenerate too_aggressive unconditionally.)
    writeFileSync(jsonlPath, '', 'utf8');

    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 90 } },
      jsonlPath,
      { eventsPath },
    );

    await waitForAutoEmit();

    expect(result.emittedKind).toBeNull();
    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toEqual([]);
  });

  it('derives too_lax when the surviving corpus is far younger than the window (v982)', async () => {
    // Three entries all ~5 days old, retention_days 90 → all retained, none
    // pruned. R = 5/90 ≈ 0.056 < band.low (0.5) ⇒ window over-generous.
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    writeFileSync(
      jsonlPath,
      [
        JSON.stringify({ timestamp: fiveDaysAgo, content: 'a' }),
        JSON.stringify({ timestamp: fiveDaysAgo, content: 'b' }),
        JSON.stringify({ timestamp: fiveDaysAgo, content: 'c' }),
      ].join('\n') + '\n',
      'utf8',
    );

    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 90 } },
      jsonlPath,
      { eventsPath },
    );

    await waitForAutoEmit();

    expect(result.emittedKind).toBe('too_lax');
    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('too_lax');
    expect(events[0].droppedCount).toBe(0);
    expect(events[0].retainedCount).toBe(3);
  });

  it('derives too_aggressive when dropping at a packed window edge (v982)', async () => {
    // One entry 85 days old (retained), one 100 days old (dropped), retention 90.
    // oldest retained ≈ 85 → R ≈ 0.944 ≥ band.high (0.9) AND prunedCount > 0.
    writeFileSync(
      jsonlPath,
      [
        JSON.stringify({ timestamp: Date.now() - 85 * 24 * 60 * 60 * 1000, content: 'edge' }),
        JSON.stringify({ timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000, content: 'old' }),
      ].join('\n') + '\n',
      'utf8',
    );

    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 90 } },
      jsonlPath,
      { eventsPath },
    );

    await waitForAutoEmit();

    expect(result.emittedKind).toBe('too_aggressive');
    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('too_aggressive');
    expect(events[0].droppedCount).toBe(1);
    expect(events[0].retainedCount).toBe(1);
  });

  it('emits NOTHING for an in-band sweep (R between low and high — v982)', async () => {
    // One entry 60 days old, retention 90 → R = 0.667 ∈ [0.5, 0.9), no drops.
    writeFileSync(
      jsonlPath,
      JSON.stringify({ timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000, content: 'mid' }) + '\n',
      'utf8',
    );

    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 90 } },
      jsonlPath,
      { eventsPath },
    );

    await waitForAutoEmit();

    expect(result.emittedKind).toBeNull();
    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toEqual([]);
  });

  it('respects autoEmit: false (no event written)', async () => {
    writeFileSync(
      jsonlPath,
      JSON.stringify({ timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000, content: 'old' }) + '\n',
      'utf8',
    );

    await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      jsonlPath,
      { eventsPath, autoEmit: false },
    );

    await waitForAutoEmit();

    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toEqual([]);
  });

  it('respects defaultKind override (too_lax bias toward dropping more)', async () => {
    writeFileSync(jsonlPath, '', 'utf8');

    await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      jsonlPath,
      { eventsPath, defaultKind: 'too_lax' },
    );

    await waitForAutoEmit();

    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('too_lax');
  });

  it('does not propagate auto-emit failures (fire-and-forget per #10437)', async () => {
    writeFileSync(jsonlPath, '', 'utf8');

    // eventsPath points to an unwritable location (a directory, not a file path).
    // The auto-emit should fail silently without breaking the sweep return.
    const undirectedPath = join(workDir, 'no', 'such', 'nested', 'path.jsonl');

    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      jsonlPath,
      { eventsPath: undirectedPath },
    );

    expect(result.prunedCount).toBe(0);
    expect(result.retentionDays).toBe(30);
  });

  it('returns 0 prunedCount when sweep file is missing (RetentionManager tolerates ENOENT)', async () => {
    const missingPath = join(workDir, 'never-written.jsonl');
    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      missingPath,
      { eventsPath, autoEmit: false },
    );
    expect(result.prunedCount).toBe(0);
  });

  // v1.49.946: the sweep now honors `observation.max_entries` as the count cap
  // (previously the RetentionManager hardcoded default of 100 always applied).
  it('applies observation.max_entries as the count cap (keeps newest)', async () => {
    // 5 recent entries (all within the age window) — only the count cap prunes.
    const now = Date.now();
    const lines: string[] = [];
    for (let i = 0; i < 5; i++) {
      lines.push(JSON.stringify({ timestamp: now - i * 1000, content: `entry-${i}` }));
    }
    writeFileSync(jsonlPath, lines.join('\n') + '\n', 'utf8');

    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 90, max_entries: 2 } },
      jsonlPath,
      { eventsPath, autoEmit: false },
    );

    // 5 entries, cap 2 → 3 pruned (newest 2 kept). Mutation guard: dropping the
    // max_entries threading reverts to the default cap (100) → prunedCount 0.
    expect(result.prunedCount).toBe(3);
    expect(result.maxEntries).toBe(2);
  });

  it('defaults the count cap to 100 when max_entries is omitted (backward-compat)', async () => {
    writeFileSync(
      jsonlPath,
      JSON.stringify({ timestamp: Date.now(), content: 'recent' }) + '\n',
      'utf8',
    );

    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 90 } },
      jsonlPath,
      { eventsPath, autoEmit: false },
    );

    // One recent entry, no threaded cap → nothing pruned; effective cap is 100.
    expect(result.prunedCount).toBe(0);
    expect(result.maxEntries).toBe(100);
  });
});

describe('deriveAgePressureKind (v1.49.982 — outcome-driven band)', () => {
  const stats = (over: Partial<PruneStats>): PruneStats => ({
    prunedCount: 0,
    retainedCount: 0,
    oldestRetainedAgeDays: null,
    ...over,
  });

  it('empty corpus (0 retained, 0 pruned) → null (neutral)', () => {
    expect(deriveAgePressureKind(stats({}), 90)).toBeNull();
  });

  it('dropped the entire corpus (0 retained, >0 pruned) → too_aggressive', () => {
    expect(deriveAgePressureKind(stats({ prunedCount: 3 }), 90)).toBe('too_aggressive');
  });

  it('packed edge (R ≥ high) with drops → too_aggressive', () => {
    // 85/90 ≈ 0.944 ≥ 0.9
    expect(
      deriveAgePressureKind(stats({ prunedCount: 1, retainedCount: 2, oldestRetainedAgeDays: 85 }), 90),
    ).toBe('too_aggressive');
  });

  it('packed edge (R ≥ high) but NO drops → null (perfect fit, not aggressive)', () => {
    expect(
      deriveAgePressureKind(stats({ prunedCount: 0, retainedCount: 2, oldestRetainedAgeDays: 88 }), 90),
    ).toBeNull();
  });

  it('young corpus (R < low) → too_lax', () => {
    // 5/90 ≈ 0.056 < 0.5
    expect(
      deriveAgePressureKind(stats({ prunedCount: 0, retainedCount: 3, oldestRetainedAgeDays: 5 }), 90),
    ).toBe('too_lax');
  });

  it('in-band (low ≤ R < high) → null (neutral)', () => {
    // 60/90 ≈ 0.667 ∈ [0.5, 0.9)
    expect(
      deriveAgePressureKind(stats({ prunedCount: 0, retainedCount: 1, oldestRetainedAgeDays: 60 }), 90),
    ).toBeNull();
  });

  it('non-positive retention_days → null (no denominator)', () => {
    expect(
      deriveAgePressureKind(stats({ retainedCount: 1, oldestRetainedAgeDays: 5 }), 0),
    ).toBeNull();
  });

  it('honors a custom band', () => {
    const s = stats({ prunedCount: 0, retainedCount: 2, oldestRetainedAgeDays: 30 });
    // 30/90 ≈ 0.333: too_lax under default low 0.5, neutral under low 0.2.
    expect(deriveAgePressureKind(s, 90, DEFAULT_AGE_PRESSURE_BAND)).toBe('too_lax');
    expect(deriveAgePressureKind(s, 90, { low: 0.2, high: 0.9 })).toBeNull();
  });
});

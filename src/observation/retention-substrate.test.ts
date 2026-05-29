import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runObservationRetentionSweep } from './retention-substrate.js';
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

  it('auto-emits an observation-retention event after prune (default kind too_aggressive)', async () => {
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
    expect(events[0].retentionDays).toBe(30);
  });

  it('auto-emit defaults to too_aggressive (conservative bias toward keeping more data)', async () => {
    writeFileSync(jsonlPath, '', 'utf8'); // empty file → 0 pruned

    await runObservationRetentionSweep(
      { observation: { retention_days: 90 } },
      jsonlPath,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('too_aggressive');
    expect(events[0].droppedCount).toBe(0);
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
});

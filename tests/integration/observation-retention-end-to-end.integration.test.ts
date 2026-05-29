/**
 * Verify ship — v1.49.894 (under #10428 verify-axis trigger).
 *
 * The v891 ship wired the substrate auto-emit half of `observation.retention_days`:
 * `src/observation/retention-substrate.ts::runObservationRetentionSweep` reads
 * the threshold from config, runs `RetentionManager.prune()`, and auto-emits
 * an `ObservationRetentionEvent` per #10437 fire-and-forget.
 *
 * The v884 ship wired the calibration-loop read side:
 * `loadObservationsForThreshold('observation.retention_days', ...)` reads from
 * the same JSONL.
 *
 * Both halves have unit tests against mocks. Per #10438 unit tests against
 * mocks prove the wire's signature; integration tests against real
 * collaborators prove the wire's behavior.
 *
 * This test proves the substrate-write → calibration-read wire works
 * end-to-end against a REAL JSONL file (in a temp dir). It:
 *
 *   1. Creates temp paths for the patterns JSONL (the sweep target) and the
 *      observation-retention events JSONL (the auto-emit sink).
 *   2. Writes entries to the patterns JSONL with mixed ages.
 *   3. Calls `runObservationRetentionSweep` which prunes old entries AND
 *      fire-and-forgets an `ObservationRetentionEvent`.
 *   4. Calls `loadObservationsForThreshold('observation.retention_days', ...)`
 *      and asserts the loop sees the auto-emitted observation with the
 *      correct polarity.
 *
 * Also: missing-file case (calibration loop returns empty array without
 * throwing) and malformed-line tolerance (per the writer's contract).
 *
 * Closes the v891 substrate-auto-emit verify-overdue gap. v891 was 3 ships
 * back at v894 (within the 10-ship-from-substrate budget per #10428); ships
 * EARLY within budget rather than waiting until the canonical trigger.
 *
 * Mirrors the v1.49.856 predictive-low-confidence integration test pattern
 * (second instance of "substrate→calibration end-to-end test" — promotion-
 * eligible at 2nd instance for the codify pipeline).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runObservationRetentionSweep } from '../../src/observation/retention-substrate.js';
import {
  appendObservationRetentionEvent,
  readObservationRetentionEvents,
  type ObservationRetentionEvent,
} from '../../src/bounded-learning/observation-retention-events.js';
import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';

describe('verify v891 substrate-auto-emit → calibration-loop read wire end-to-end (v1.49.894)', () => {
  let tempDir: string;
  let patternsPath: string;
  let eventsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'obs-retention-verify-'));
    patternsPath = join(tempDir, 'patterns.jsonl');
    eventsPath = join(tempDir, 'observation-retention-events.jsonl');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  /**
   * Wait for the fire-and-forget auto-emit Promise to complete its async
   * fs operations. Mirrors v891 unit-test pattern (50ms is enough for the
   * mkdir + appendFile chain to settle on real disk).
   */
  async function waitForAutoEmit(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  it('substrate sweep auto-emits an event that the calibration loop reads', async () => {
    // Write a single old entry to the patterns JSONL (will be pruned)
    const hundredDaysAgo = Date.now() - 100 * 24 * 60 * 60 * 1000;
    writeFileSync(
      patternsPath,
      JSON.stringify({ timestamp: hundredDaysAgo, content: 'old' }) + '\n',
      'utf8',
    );

    // Substrate-side: run the sweep with retention_days = 30
    const result = await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      patternsPath,
      { eventsPath },
    );

    expect(result.prunedCount).toBe(1);
    expect(result.retentionDays).toBe(30);

    // Wait for fire-and-forget auto-emit to settle
    await waitForAutoEmit();

    // Calibration-loop read side
    const observations = await loadObservationsForThreshold(
      'observation.retention_days',
      { observationRetentionEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    // Default kind is 'too_aggressive' → polarity -1 (favor RAISING retention)
    expect(observations[0]?.value).toBe(-1);
  });

  it('substrate writes accumulate across multiple sweeps; calibration loop sees all', async () => {
    // Three sweeps with the same threshold (each fire-and-forget emits one event)
    writeFileSync(patternsPath, '', 'utf8');

    await runObservationRetentionSweep(
      { observation: { retention_days: 30 } },
      patternsPath,
      { eventsPath },
    );
    await runObservationRetentionSweep(
      { observation: { retention_days: 60 } },
      patternsPath,
      { eventsPath },
    );
    await runObservationRetentionSweep(
      { observation: { retention_days: 90 } },
      patternsPath,
      { eventsPath, defaultKind: 'too_lax' },
    );

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'observation.retention_days',
      { observationRetentionEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(3);
    // First two are too_aggressive (-1), third is too_lax (+1)
    const values = observations.map((o) => o.value);
    expect(values).toEqual([-1, -1, 1]);

    // Net polarity: -1 (more too_aggressive → raise threshold signal)
    const net = values.reduce((s, v) => s + v, 0);
    expect(net).toBe(-1);
  });

  it('calibration loop returns empty when JSONL does not exist (missing-file tolerance)', async () => {
    const observations = await loadObservationsForThreshold(
      'observation.retention_days',
      { observationRetentionEventsPath: join(tempDir, 'never-written.jsonl') },
    );
    expect(observations).toEqual([]);
  });

  it('calibration loop tolerates malformed JSONL lines (writer contract)', async () => {
    // Pre-seed with a malformed line
    writeFileSync(eventsPath, '{not valid json\n', 'utf8');

    // Then a valid event via the substrate
    const event: ObservationRetentionEvent = {
      kind: 'too_aggressive',
      timestamp: new Date().toISOString(),
      droppedCount: 5,
      retentionDays: 30,
    };
    await appendObservationRetentionEvent(event, { path: eventsPath });

    // Cross-check that the reader sees 1 valid event (silent-skip malformed)
    const events = await readObservationRetentionEvents(eventsPath);
    expect(events).toHaveLength(1);

    // Calibration loop returns observations only for valid events
    const observations = await loadObservationsForThreshold(
      'observation.retention_days',
      { observationRetentionEventsPath: eventsPath },
    );
    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1); // too_aggressive
  });
});

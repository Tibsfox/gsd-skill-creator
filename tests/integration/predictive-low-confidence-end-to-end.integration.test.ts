/**
 * Verify ship — v1.49.856 (under #10438 verify-axis).
 *
 * The v846 ship wired the substrate auto-emit half of the v803 manual+auto
 * duality pattern: `copper/activation.ts` (PipelineActivationDispatch) and
 * `orchestration/selector.ts` (ActivationSelector) now call
 * `appendPredictiveLowConfidenceEvent` whenever a low-confidence prediction
 * triggers. The v837 ship wired the calibration-loop read side:
 * `loadObservationsForThreshold('predictive.low_confidence_threshold', ...)`
 * reads from the same JSONL.
 *
 * Both halves have unit tests against mocks — `vi.mock` is used in the unit
 * test suites to avoid writing to the operator's real JSONL. Per #10438 unit
 * tests against mocks prove the wire's signature; integration tests against
 * real collaborators prove the wire's behavior.
 *
 * This test proves the substrate-write → calibration-read wire works
 * end-to-end against a REAL JSONL file (in a temp dir). It:
 *
 *   1. Creates a temp JSONL path.
 *   2. Calls `appendPredictiveLowConfidenceEvent({kind: 'useful', ...})` for
 *      a 'useful' event (operator found fallback useful → polarity -1 →
 *      "raise threshold").
 *   3. Calls `appendPredictiveLowConfidenceEvent({kind: 'not_useful', ...})`
 *      for two 'not_useful' events (fallback fired but operator did NOT
 *      want it → polarity +1 → "lower threshold").
 *   4. Calls `loadObservationsForThreshold('predictive.low_confidence_threshold',
 *      {predictiveLowConfidenceEventsPath: tempJsonl})` and asserts the
 *      loop sees 3 observations with the correct polarity each.
 *   5. Sanity-checks the polarity sum: -1 + 1 + 1 = +1 (net "lower threshold"
 *      signal — operator sees more not_useful than useful in this window).
 *
 * Also: missing-file case (calibration loop returns empty array without
 * throwing) and malformed-line tolerance (per the writer's contract).
 *
 * Closes the v846 substrate-auto-emit verify-overdue gap. v846 was 10 ships
 * back at v856 (canonical 10-ship-from-substrate threshold per #10438);
 * lands exactly at the canonical trigger.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendPredictiveLowConfidenceEvent,
  readPredictiveLowConfidenceEvents,
  type PredictiveLowConfidenceEvent,
} from '../../src/bounded-learning/predictive-low-confidence-events.js';
import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';

describe('verify v846 substrate-auto-emit → calibration-loop read wire end-to-end (v1.49.856)', () => {
  let tempDir: string;
  let eventsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'predict-verify-'));
    eventsPath = join(tempDir, 'events.jsonl');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('substrate writes flow through to calibration loop reads (single event)', async () => {
    const event: PredictiveLowConfidenceEvent = {
      kind: 'not_useful',
      timestamp: new Date().toISOString(),
      skill: 'gsd-debug',
      maxScore: 0.42,
      threshold: 0.6,
    };

    // Substrate-side write
    await appendPredictiveLowConfidenceEvent(event, { path: eventsPath });

    // Calibration-loop read side
    const observations = await loadObservationsForThreshold(
      'predictive.low_confidence_threshold',
      { predictiveLowConfidenceEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    // not_useful → polarity +1 (fallback fired but operator did not want it
    // → recommend "lower the threshold so the fallback fires less often")
    expect(observations[0]?.value).toBe(1);
  });

  it('substrate writes accumulate; calibration loop sees ordered observations', async () => {
    // Three substrate-emitted events with mixed polarity
    await appendPredictiveLowConfidenceEvent({
      kind: 'useful',
      timestamp: '2026-05-28T20:00:00.000Z',
      skill: 'gsd-discuss',
      maxScore: 0.30,
      threshold: 0.6,
    }, { path: eventsPath });

    await appendPredictiveLowConfidenceEvent({
      kind: 'not_useful',
      timestamp: '2026-05-28T20:01:00.000Z',
      skill: 'gsd-explore',
      maxScore: 0.42,
      threshold: 0.6,
    }, { path: eventsPath });

    await appendPredictiveLowConfidenceEvent({
      kind: 'not_useful',
      timestamp: '2026-05-28T20:02:00.000Z',
      skill: 'gsd-spike',
      maxScore: 0.55,
      threshold: 0.6,
    }, { path: eventsPath });

    const observations = await loadObservationsForThreshold(
      'predictive.low_confidence_threshold',
      { predictiveLowConfidenceEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(3);
    // useful → -1 (raise threshold), not_useful → +1 (lower threshold)
    const values = observations.map((o) => o.value);
    expect(values).toEqual([-1, 1, 1]);

    // Net polarity: +1 (more not_useful than useful → lower-threshold signal)
    const net = values.reduce((s, v) => s + v, 0);
    expect(net).toBe(1);
  });

  it('calibration loop returns empty when JSONL does not exist (missing-file tolerance)', async () => {
    // Path points to a file that never existed
    const observations = await loadObservationsForThreshold(
      'predictive.low_confidence_threshold',
      { predictiveLowConfidenceEventsPath: join(tempDir, 'never-written.jsonl') },
    );
    expect(observations).toEqual([]);
  });

  it('calibration loop tolerates malformed JSONL lines (writer contract)', async () => {
    // Write a malformed line followed by a valid event
    writeFileSync(eventsPath, '{not valid json\n', 'utf8');
    await appendPredictiveLowConfidenceEvent({
      kind: 'useful',
      timestamp: '2026-05-28T20:03:00.000Z',
      skill: 'gsd-plan',
      maxScore: 0.20,
      threshold: 0.6,
    }, { path: eventsPath });

    // Cross-check that the reader sees 1 valid event (silent-skip malformed)
    const events = await readPredictiveLowConfidenceEvents(eventsPath);
    expect(events).toHaveLength(1);

    // Calibration loop returns observations only for valid events
    const observations = await loadObservationsForThreshold(
      'predictive.low_confidence_threshold',
      { predictiveLowConfidenceEventsPath: eventsPath },
    );
    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1); // useful
  });
});

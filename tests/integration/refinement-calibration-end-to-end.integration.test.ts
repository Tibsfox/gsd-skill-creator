/**
 * Verify ship — v1.49.1054 (#10453 substrate -> calibration end-to-end pattern).
 *
 * Closes the verify-axis coverage for the three `refinement.*` thresholds
 * introduced at v1.49.1054, which bring `RefinementEngine`'s live-learning
 * tuning knobs (`minConfidence`, `minCorrectionsForRefinement`, `cooldownDays`)
 * under the same anytime-valid two-gate e-process that already self-tunes
 * `suggestions.*`, `token_budget.*`, and `observation.retention_days`.
 *
 * Like `suggestions.*`, all three `refinement.*` thresholds read the SAME
 * source — the operator's terminal accept/dismiss decision on a surfaced
 * RefinementEngine suggestion (/sc:suggest) or a correction-quarantine
 * candidate (feedback quarantine accept/dismiss). The substrate write end is
 * the append-only JSONL at `.planning/patterns/refinement-events.jsonl`
 * (`appendRefinementEvent`); the calibration read end is
 * `loadObservationsForThreshold('refinement.<x>', { refinementEventsPath })`.
 *
 * Each threshold gets its own explicit `it()` with a literal threshold
 * argument to `loadObservationsForThreshold(` so the AST wire detector in
 * `skill-creator cadence` recognizes all three as covered.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { appendRefinementEvent } from '../../src/bounded-learning/refinement-events.js';
import type { RefinementEventKind } from '../../src/bounded-learning/refinement-events.js';
import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';

describe('verify refinement.* events -> calibration-loop read wire end-to-end (v1.49.1054)', () => {
  let tempDir: string;
  let refinementEventsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'refinement-verify-'));
    refinementEventsPath = join(tempDir, 'refinement-events.jsonl');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  /** Substrate write: append a terminal operator decision. */
  async function record(kind: RefinementEventKind, offsetMin: number): Promise<void> {
    await appendRefinementEvent(
      { timestamp: `2026-07-12T00:${String(offsetMin).padStart(2, '0')}:00.000Z`, kind },
      { path: refinementEventsPath },
    );
  }

  it('refinement.min_confidence: accepted -> +1, dismissed -> -1', async () => {
    await record('accepted', 0);
    await record('dismissed', 1);

    const observations = await loadObservationsForThreshold('refinement.min_confidence', {
      refinementEventsPath,
    });

    expect(observations).toHaveLength(2);
    const values = observations.map((o) => o.value);
    expect(values.filter((v) => v === 1)).toHaveLength(1); // accepted
    expect(values.filter((v) => v === -1)).toHaveLength(1); // dismissed
    expect(values.reduce((s, v) => s + v, 0)).toBe(0); // net neutral
  });

  it('refinement.min_corrections: accepted decision reads as +1 (favors loosening the gate)', async () => {
    await record('accepted', 0);

    const observations = await loadObservationsForThreshold('refinement.min_corrections', {
      refinementEventsPath,
    });

    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(1);
  });

  it('refinement.cooldown_days: dismissed decision reads as -1 (favors tightening the gate)', async () => {
    await record('dismissed', 0);

    const observations = await loadObservationsForThreshold('refinement.cooldown_days', {
      refinementEventsPath,
    });

    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1);
  });

  it('multiple decisions accumulate; calibration read sees correct counts + net polarity', async () => {
    await record('accepted', 0);
    await record('accepted', 1);
    await record('accepted', 2);
    await record('dismissed', 3);
    await record('dismissed', 4);

    const observations = await loadObservationsForThreshold('refinement.min_confidence', {
      refinementEventsPath,
    });

    expect(observations).toHaveLength(5);
    const values = observations.map((o) => o.value);
    expect(values.filter((v) => v === 1)).toHaveLength(3);
    expect(values.filter((v) => v === -1)).toHaveLength(2);
    expect(values.reduce((s, v) => s + v, 0)).toBe(1);
  });

  it('calibration read returns empty when the events file does not exist (missing-file tolerance)', async () => {
    const observations = await loadObservationsForThreshold('refinement.min_corrections', {
      refinementEventsPath: join(tempDir, 'never-written.jsonl'),
    });
    expect(observations).toEqual([]);
  });

  it('calibration read tolerates malformed JSONL lines (reader contract)', async () => {
    writeFileSync(
      refinementEventsPath,
      '{not valid json\n' +
        JSON.stringify({ timestamp: '2026-07-12T00:05:00.000Z', kind: 'accepted' }) +
        '\n',
      'utf8',
    );

    const observations = await loadObservationsForThreshold('refinement.cooldown_days', {
      refinementEventsPath,
    });
    // Malformed line skipped; the one valid accepted event survives.
    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(1);
  });
});

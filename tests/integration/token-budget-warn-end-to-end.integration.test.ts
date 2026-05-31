/**
 * Verify ship — v1.49.926 (under #10428/#10438 verify-axis trigger; #10453 pattern).
 *
 * Closes the LAST bounded-learning verify-axis gap, masked for ~122 ships.
 *
 * `token_budget.warn_at_percent` was the FIRST #10439 CLI+substrate-duality
 * threshold (read side + CLI manual recorder both shipped v803), yet it was
 * the ONLY one of its `token_budget.*` family never given the canonical
 * substrate→calibration end-to-end test, while all three siblings were:
 *   - predictive.low_confidence_threshold → v856
 *   - observation.retention_days          → v894
 *   - token_budget.max_percent            → v898
 * (and warn's substrate auto-emit half itself was missing until v926, this ship).
 *
 * The `tools/calibratable/verify-overdue-scan.mjs` scanner reported warn as
 * COVERED only because of a stale ground-truth entry pointing at v799 — a
 * unit-test/audit-log ship that predates the canonical #10453 pattern by 100
 * ships AND predates warn's substrate-auto-emit by 0 (substrate landed v926).
 * This test is the real coverage; the scanner ground-truth is updated to v926.
 *
 * It proves the substrate-write → calibration-read wire works end-to-end
 * against a REAL JSONL file (in a temp dir). It:
 *   1. Creates a temp path for the token-budget (warn) events JSONL.
 *   2. Calls `runTokenBudgetWarnCheck` with mixed follow-up readings —
 *      responded cases (followUp < warn → `responsive` +1) and
 *      not-responded cases (followUp >= warn → `ignored` -1).
 *   3. Waits for the fire-and-forget auto-emit Promise to settle (#10454).
 *   4. Calls `loadObservationsForThreshold('token_budget.warn_at_percent', ...)`
 *      and asserts the loop sees the auto-emitted observations with the
 *      correct outcome-driven polarities.
 *   Also: missing-file tolerance + malformed-line tolerance (writer contract).
 *
 * FOURTH instance of the "substrate→calibration end-to-end test" pattern
 * (ESTABLISHED at v898 per the 3-instance bar). Like v893→v898 (ceiling),
 * warn's substrate is OUTCOME-DRIVEN (the kind falls out of the inequality)
 * rather than default-fixed (v891 retention); this test asserts both
 * polarities from a single substrate-API surface.
 *
 * Distinct subtlety vs v898: warn is a TWO-reading concept. The substrate's
 * input is the FOLLOW-UP reading (reading 2 after a warn fired), not the
 * triggering reading. There is no `runX()` mirror at warn-fire time — that
 * would misclassify the fire as `ignored`. See warn-substrate.ts.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runTokenBudgetWarnCheck } from '../../src/token-budget/warn-substrate.js';
import {
  appendTokenBudgetEvent,
  readTokenBudgetEvents,
  type TokenBudgetEvent,
} from '../../src/bounded-learning/token-budget-events.js';
import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';

describe('verify warn substrate-auto-emit → calibration-loop read wire end-to-end (v1.49.926)', () => {
  let tempDir: string;
  let eventsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'token-budget-warn-verify-'));
    eventsPath = join(tempDir, 'token-budget-events.jsonl');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  /**
   * Wait for the fire-and-forget auto-emit Promise to complete its async fs
   * operations. Mirrors v891/v894/v898 (50ms is enough for the mkdir +
   * appendFile chain to settle on real disk, per #10454).
   */
  async function waitForAutoEmit(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  it('responsive follow-up auto-emits an event the calibration loop reads as +1', async () => {
    // followUp 40, warn 80 → dropped below → `responsive` → +1
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      40,
      { eventsPath },
    );

    expect(result.responded).toBe(true);
    expect(result.emittedKind).toBe('responsive');

    await waitForAutoEmit();

    // Independently pin the WRITER output (kind + count) before reading through
    // the calibration loop — so a reader-side count bug can't masquerade as a
    // writer success (review nit; the sibling v898 e2e pins this only on the
    // malformed path).
    const written = await readTokenBudgetEvents(eventsPath);
    expect(written).toHaveLength(1);
    expect(written[0].kind).toBe('responsive');

    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    // responsive → +1 (favors LOWER threshold so warns fire earlier).
    expect(observations[0]?.value).toBe(1);
  });

  it('ignored follow-up auto-emits an event the calibration loop reads as -1', async () => {
    // followUp 95, warn 80 → stayed above → `ignored` → -1
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      95,
      { eventsPath },
    );

    expect(result.responded).toBe(false);
    expect(result.emittedKind).toBe('ignored');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    // ignored → -1 (favors RAISING threshold so warns fire less often).
    expect(observations[0]?.value).toBe(-1);
  });

  it('substrate writes accumulate across checks; loop sees correct counts + net polarity', async () => {
    // Three responsive (+1) + two ignored (-1) = net +1.
    //
    // Order-independent assertion: the substrate is fire-and-forget per
    // #10437, so spawned-Promise completion order is not part of the
    // contract. Assert COUNTS + NET POLARITY, not file-write sequence
    // (#10453).
    runTokenBudgetWarnCheck({ token_budget: { warn_at_percent: 80 } }, 20, { eventsPath });
    runTokenBudgetWarnCheck({ token_budget: { warn_at_percent: 80 } }, 35, { eventsPath });
    runTokenBudgetWarnCheck({ token_budget: { warn_at_percent: 80 } }, 60, { eventsPath });
    runTokenBudgetWarnCheck({ token_budget: { warn_at_percent: 80 } }, 85, { eventsPath });
    runTokenBudgetWarnCheck({ token_budget: { warn_at_percent: 80 } }, 99, { eventsPath });

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(5);
    const values = observations.map((o) => o.value);
    expect(values.filter((v) => v === 1).length).toBe(3);
    expect(values.filter((v) => v === -1).length).toBe(2);

    // Net polarity: +1 (more responsive → warn could fire earlier signal).
    expect(values.reduce((s, v) => s + v, 0)).toBe(1);
  });

  it('boundary equality (followUp === warn) classifies as ignored (-1)', async () => {
    // responded iff followUp < warn (strict-less-than). followUp == warn →
    // NOT responded → kind `ignored` → -1.
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      80,
      { eventsPath },
    );

    expect(result.responded).toBe(false);
    expect(result.emittedKind).toBe('ignored');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1);
  });

  it('defaultKind override forces a specific polarity regardless of outcome', async () => {
    // followUp 20, warn 80 → would emit `responsive` (+1) by default, but
    // the operator forces `ignored` (-1) via defaultKind.
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      20,
      { eventsPath, defaultKind: 'ignored' },
    );

    // responded result is still outcome-driven (true), but emittedKind is overridden.
    expect(result.responded).toBe(true);
    expect(result.emittedKind).toBe('ignored');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1);
  });

  it('calibration loop returns empty when JSONL does not exist (missing-file tolerance)', async () => {
    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: join(tempDir, 'never-written.jsonl') },
    );
    expect(observations).toEqual([]);
  });

  it('calibration loop tolerates malformed JSONL lines (writer contract)', async () => {
    // Pre-seed with a malformed line.
    writeFileSync(eventsPath, '{not valid json\n', 'utf8');

    // Then a valid event via the events writer.
    const event: TokenBudgetEvent = {
      kind: 'responsive',
      timestamp: new Date().toISOString(),
      usagePercent: 40,
      warnAtPercent: 80,
    };
    await appendTokenBudgetEvent(event, { path: eventsPath });

    // Cross-check that the reader sees 1 valid event (silent-skip malformed).
    const events = await readTokenBudgetEvents(eventsPath);
    expect(events).toHaveLength(1);

    // Calibration loop returns observations only for valid events.
    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: eventsPath },
    );
    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(1); // responsive
  });

  it('autoEmit: false suppresses the event (no observation reaches the loop)', async () => {
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      40,
      { eventsPath, autoEmit: false },
    );

    expect(result.responded).toBe(true);
    expect(result.emittedKind).toBe('responsive');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.warn_at_percent',
      { tokenBudgetEventsPath: eventsPath },
    );

    expect(observations).toEqual([]);
  });
});

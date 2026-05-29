/**
 * Verify ship — v1.49.898 (under #10428 verify-axis trigger).
 *
 * The v893 ship wired the substrate auto-emit half of `token_budget.max_percent`:
 * `src/token-budget/ceiling-substrate.ts::runTokenBudgetCeilingCheck` reads
 * the threshold from config, compares against a usagePercent reading, and
 * fire-and-forget auto-emits a `TokenBudgetMaxEvent` per #10437.
 *
 * The v888 ship wired the calibration-loop read side:
 * `loadObservationsForThreshold('token_budget.max_percent', ...)` reads from
 * the same JSONL.
 *
 * Both halves have unit tests against mocks. Per #10438 unit tests against
 * mocks prove the wire's signature; integration tests against real
 * collaborators prove the wire's behavior.
 *
 * This test proves the substrate-write → calibration-read wire works
 * end-to-end against a REAL JSONL file (in a temp dir). It:
 *
 *   1. Creates a temp path for the token-budget MAX events JSONL.
 *   2. Calls `runTokenBudgetCeilingCheck` with mixed (usagePercent, max_percent)
 *      pairs — under-budget cases (emit `under_budget` +1) and ceiling-hit
 *      cases (emit `blocked` -1).
 *   3. Waits for the fire-and-forget auto-emit Promise to settle.
 *   4. Calls `loadObservationsForThreshold('token_budget.max_percent', ...)`
 *      and asserts the loop sees the auto-emitted observations with the
 *      correct outcome-driven polarities.
 *
 * Also: missing-file case (calibration loop returns empty without throwing)
 * and malformed-line tolerance (per the writer's contract).
 *
 * Closes the v893 substrate-auto-emit verify-overdue gap. v893 was 4 ships
 * back at v898 (still within the 10-ship-from-substrate budget per #10428);
 * ships within budget rather than waiting until the canonical trigger.
 *
 * Mirrors the v1.49.894 observation-retention-end-to-end integration test
 * (third instance of the "substrate→calibration end-to-end test" pattern;
 * v856 predictive-low-confidence was the first, v894 observation-retention
 * second — promotion to ESTABLISHED triggered at this instance per the
 * 3-instance bar).
 *
 * Distinct subtlety from v894: v893's substrate is OUTCOME-DRIVEN (the kind
 * falls out of the inequality being checked) rather than default-fixed
 * (v891 retention). The test asserts both polarities from a single
 * substrate-API surface — under-budget AND blocked cases — proving the
 * outcome-driven kind selection threads correctly through to the calibration
 * loop's polarity reading.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runTokenBudgetCeilingCheck } from '../../src/token-budget/ceiling-substrate.js';
import {
  appendTokenBudgetMaxEvent,
  readTokenBudgetMaxEvents,
  type TokenBudgetMaxEvent,
} from '../../src/bounded-learning/token-budget-max-events.js';
import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';

describe('verify v893 substrate-auto-emit → calibration-loop read wire end-to-end (v1.49.898)', () => {
  let tempDir: string;
  let eventsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'token-budget-max-verify-'));
    eventsPath = join(tempDir, 'token-budget-max-events.jsonl');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  /**
   * Wait for the fire-and-forget auto-emit Promise to complete its async
   * fs operations. Mirrors v891/v894 (50ms is enough for the mkdir +
   * appendFile chain to settle on real disk, per #10454).
   */
  async function waitForAutoEmit(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  it('under-budget substrate check auto-emits an event the calibration loop reads as +1', async () => {
    // usagePercent 50, max_percent 80 → under-budget → kind `under_budget` → +1
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 80 } },
      50,
      { eventsPath },
    );

    expect(result.underBudget).toBe(true);
    expect(result.emittedKind).toBe('under_budget');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    // under_budget → +1 (favors LOWER ceiling per #10451 inverse polarity).
    expect(observations[0]?.value).toBe(1);
  });

  it('ceiling-hit substrate check auto-emits an event the calibration loop reads as -1', async () => {
    // usagePercent 95, max_percent 80 → blocked → kind `blocked` → -1
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 80 } },
      95,
      { eventsPath },
    );

    expect(result.underBudget).toBe(false);
    expect(result.emittedKind).toBe('blocked');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    // blocked → -1 (favors RAISING ceiling).
    expect(observations[0]?.value).toBe(-1);
  });

  it('substrate writes accumulate across multiple checks; calibration loop sees correct counts + net polarity', async () => {
    // Five checks: three under-budget (+1 each) + two ceiling-hit (-1 each)
    // = net +1 (the under-budget signal wins by one event).
    //
    // Order-independent assertion: the substrate is fire-and-forget per
    // #10437, so the spawned-Promise completion order is not part of the
    // contract. The integration test asserts COUNTS + NET POLARITY, not
    // file-write sequence. Operators reading the calibration loop care
    // about the aggregate signal, not interleaved order.
    runTokenBudgetCeilingCheck({ token_budget: { max_percent: 80 } }, 30, { eventsPath });
    runTokenBudgetCeilingCheck({ token_budget: { max_percent: 80 } }, 45, { eventsPath });
    runTokenBudgetCeilingCheck({ token_budget: { max_percent: 80 } }, 60, { eventsPath });
    runTokenBudgetCeilingCheck({ token_budget: { max_percent: 80 } }, 85, { eventsPath });
    runTokenBudgetCeilingCheck({ token_budget: { max_percent: 80 } }, 92, { eventsPath });

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(5);
    const values = observations.map((o) => o.value);
    const positive = values.filter((v) => v === 1).length;
    const negative = values.filter((v) => v === -1).length;
    expect(positive).toBe(3);
    expect(negative).toBe(2);

    // Net polarity: +1 (more under_budget → ceiling could be LOWERED signal)
    const net = values.reduce((s, v) => s + v, 0);
    expect(net).toBe(1);
  });

  it('boundary equality (usagePercent === max_percent) classifies as blocked (-1)', async () => {
    // The ceiling check is strict-less-than: underBudget iff usagePercent < maxPercent.
    // usagePercent == max_percent → NOT under-budget → kind `blocked` → -1.
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 80 } },
      80,
      { eventsPath },
    );

    expect(result.underBudget).toBe(false);
    expect(result.emittedKind).toBe('blocked');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1);
  });

  it('defaultKind override forces a specific polarity regardless of outcome', async () => {
    // usagePercent 30, max_percent 80 → would emit `under_budget` (+1) by default,
    // but the operator forces `blocked` (-1) via defaultKind.
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 80 } },
      30,
      { eventsPath, defaultKind: 'blocked' },
    );

    // underBudget result is still outcome-driven (true), but emittedKind is overridden
    expect(result.underBudget).toBe(true);
    expect(result.emittedKind).toBe('blocked');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: eventsPath },
    );

    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1);
  });

  it('calibration loop returns empty when JSONL does not exist (missing-file tolerance)', async () => {
    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: join(tempDir, 'never-written.jsonl') },
    );
    expect(observations).toEqual([]);
  });

  it('calibration loop tolerates malformed JSONL lines (writer contract)', async () => {
    // Pre-seed with a malformed line
    writeFileSync(eventsPath, '{not valid json\n', 'utf8');

    // Then a valid event via the substrate writer
    const event: TokenBudgetMaxEvent = {
      kind: 'under_budget',
      timestamp: new Date().toISOString(),
      usagePercent: 50,
      maxPercent: 80,
    };
    await appendTokenBudgetMaxEvent(event, { path: eventsPath });

    // Cross-check that the reader sees 1 valid event (silent-skip malformed)
    const events = await readTokenBudgetMaxEvents(eventsPath);
    expect(events).toHaveLength(1);

    // Calibration loop returns observations only for valid events
    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: eventsPath },
    );
    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(1); // under_budget
  });

  it('autoEmit: false suppresses the event (no observation reaches the calibration loop)', async () => {
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 80 } },
      50,
      { eventsPath, autoEmit: false },
    );

    expect(result.underBudget).toBe(true);
    expect(result.emittedKind).toBe('under_budget');

    await waitForAutoEmit();

    const observations = await loadObservationsForThreshold(
      'token_budget.max_percent',
      { tokenBudgetMaxEventsPath: eventsPath },
    );

    expect(observations).toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runTokenBudgetCeilingCheck } from './ceiling-substrate.js';
import { readTokenBudgetMaxEvents } from '../bounded-learning/token-budget-max-events.js';

describe('runTokenBudgetCeilingCheck (v1.49.893 substrate auto-emit)', () => {
  let workDir: string;
  let eventsPath: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `tb-ceiling-substrate-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    eventsPath = join(workDir, 'token-budget-max-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  /**
   * Wait for the fire-and-forget auto-emit Promise to complete its async
   * fs operations (mkdir + appendFile). Second instance of the 50ms timeout
   * pattern from v891 — promotes the test-side wait recipe to 2-instance.
   */
  async function waitForAutoEmit(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  it('reads token_budget.max_percent from config and returns underBudget true when usage < max', () => {
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      5,
      { eventsPath, autoEmit: false },
    );

    expect(result.underBudget).toBe(true);
    expect(result.usagePercent).toBe(5);
    expect(result.maxPercent).toBe(10);
    expect(result.emittedKind).toBe('under_budget');
  });

  it('returns underBudget false when usage >= max', () => {
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      10,
      { eventsPath, autoEmit: false },
    );

    expect(result.underBudget).toBe(false);
    expect(result.emittedKind).toBe('blocked');
  });

  it('auto-emits an under_budget event when usage is below ceiling', async () => {
    runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      3,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetMaxEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('under_budget');
    expect(events[0].usagePercent).toBe(3);
    expect(events[0].maxPercent).toBe(10);
  });

  it('auto-emits a blocked event when usage is at or above ceiling', async () => {
    runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      15,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetMaxEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('blocked');
    expect(events[0].usagePercent).toBe(15);
  });

  it('outcome-driven kind differs from v891 default-fixed pattern (both kinds reachable)', async () => {
    runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      4,
      { eventsPath },
    );
    runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      20,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetMaxEvents(eventsPath);
    const kinds = events.map((e) => e.kind).sort();
    expect(kinds).toEqual(['blocked', 'under_budget']);
  });

  it('respects autoEmit: false (no event written)', async () => {
    runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      5,
      { eventsPath, autoEmit: false },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetMaxEvents(eventsPath);
    expect(events).toEqual([]);
  });

  it('respects defaultKind override (force under_budget even when blocked)', async () => {
    runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      15,
      { eventsPath, defaultKind: 'under_budget' },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetMaxEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('under_budget');
  });

  it('records optional reason field when provided', async () => {
    runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      15,
      { eventsPath, reason: 'blocked while loading sc-dev-team' },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetMaxEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].reason).toBe('blocked while loading sc-dev-team');
  });

  it('does not propagate auto-emit failures (fire-and-forget per #10437)', async () => {
    // eventsPath points to a deeply nested location.
    // The auto-emit's mkdir would actually create it, but the failure mode
    // we want to assert is that even IF appendFile fails, the function returns.
    // We can't reliably trigger appendFile failure in tests, but the .catch
    // ensures any failure mode is swallowed. Verify the function returns a
    // valid result regardless.
    const result = runTokenBudgetCeilingCheck(
      { token_budget: { max_percent: 10 } },
      5,
      { eventsPath: join(workDir, 'deeply', 'nested', 'path.jsonl') },
    );

    expect(result.underBudget).toBe(true);
    expect(result.maxPercent).toBe(10);
  });
});

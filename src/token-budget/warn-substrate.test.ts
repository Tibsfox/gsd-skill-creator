import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runTokenBudgetWarnCheck } from './warn-substrate.js';
import { readTokenBudgetEvents } from '../bounded-learning/token-budget-events.js';

describe('runTokenBudgetWarnCheck (v1.49.926 substrate auto-emit)', () => {
  let workDir: string;
  let eventsPath: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `tb-warn-substrate-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    eventsPath = join(workDir, 'token-budget-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  /**
   * Wait for the fire-and-forget auto-emit Promise to complete its async fs
   * operations (mkdir + appendFile). 50ms is enough on real disk per #10454
   * (setImmediate/nextTick advance only the event loop, not OS-level fs).
   */
  async function waitForAutoEmit(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  it('reads token_budget.warn_at_percent from config and returns responded true when follow-up < warn', () => {
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      50,
      { eventsPath, autoEmit: false },
    );

    expect(result.responded).toBe(true);
    expect(result.followUpUsagePercent).toBe(50);
    expect(result.warnAtPercent).toBe(80);
    expect(result.emittedKind).toBe('responsive');
  });

  it('returns responded false when follow-up >= warn (equality is ignored)', () => {
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      80,
      { eventsPath, autoEmit: false },
    );

    expect(result.responded).toBe(false);
    expect(result.emittedKind).toBe('ignored');
  });

  it('auto-emits a responsive event when the follow-up dropped below warn', async () => {
    runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      30,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('responsive');
    expect(events[0].usagePercent).toBe(30);
    expect(events[0].warnAtPercent).toBe(80);
  });

  it('auto-emits an ignored event when the follow-up stayed at or above warn', async () => {
    runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      90,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('ignored');
    expect(events[0].usagePercent).toBe(90);
  });

  it('outcome-driven kind reaches both polarities across calls', async () => {
    runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      40,
      { eventsPath },
    );
    runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      95,
      { eventsPath },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetEvents(eventsPath);
    const kinds = events.map((e) => e.kind).sort();
    expect(kinds).toEqual(['ignored', 'responsive']);
  });

  it('respects autoEmit: false (no event written)', async () => {
    runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      50,
      { eventsPath, autoEmit: false },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetEvents(eventsPath);
    expect(events).toEqual([]);
  });

  it('respects defaultKind override (force ignored even when responded)', async () => {
    runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      30,
      { eventsPath, defaultKind: 'ignored' },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('ignored');
  });

  it('records optional reason field when provided', async () => {
    runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      90,
      { eventsPath, reason: 'stayed above warn while loading sc-dev-team' },
    );

    await waitForAutoEmit();

    const events = await readTokenBudgetEvents(eventsPath);
    expect(events).toHaveLength(1);
    expect(events[0].reason).toBe('stayed above warn while loading sc-dev-team');
  });

  it('does not propagate auto-emit failures (fire-and-forget per #10437)', async () => {
    // eventsPath points to a deeply nested location. The auto-emit's mkdir
    // would actually create it; the failure mode we assert is that even IF
    // appendFile failed, the .catch swallows it and the function returns a
    // valid result. We can't reliably trigger appendFile failure in tests.
    const result = runTokenBudgetWarnCheck(
      { token_budget: { warn_at_percent: 80 } },
      50,
      { eventsPath: join(workDir, 'deeply', 'nested', 'path.jsonl') },
    );

    expect(result.responded).toBe(true);
    expect(result.warnAtPercent).toBe(80);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  appendTokenBudgetMaxEvent,
  eventKindToValue,
  eventsToObservations,
  eventToObservation,
  readTokenBudgetMaxEvents,
} from '../token-budget-max-events.js';
import type { TokenBudgetMaxEvent } from '../token-budget-max-events.js';

describe('eventKindToValue (v1.49.888 — same polarity shape as warn-events + observation-retention)', () => {
  it('maps under_budget → +1 (favors LOWERING the ceiling; operator had headroom)', () => {
    expect(eventKindToValue('under_budget')).toBe(1);
  });

  it('maps blocked → -1 (favors RAISING the ceiling; operator was blocked)', () => {
    expect(eventKindToValue('blocked')).toBe(-1);
  });
});

describe('eventToObservation (v1.49.888)', () => {
  it('lifts an under_budget event into an accepted-decision +1 observation', () => {
    const ev: TokenBudgetMaxEvent = { timestamp: '2026-05-28T00:00:00.000Z', kind: 'under_budget' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('accepted');
    expect(obs.value).toBe(1);
    expect(obs.observedAt).toBe('2026-05-28T00:00:00.000Z');
    expect(obs.suggestionId).toBe('2026-05-28T00:00:00.000Z');
  });

  it('lifts a blocked event into a dismissed-decision -1 observation', () => {
    const ev: TokenBudgetMaxEvent = { timestamp: '2026-05-28T00:01:00.000Z', kind: 'blocked' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('dismissed');
    expect(obs.value).toBe(-1);
  });

  it('preserves optional usagePercent / maxPercent / reason on the source event', () => {
    const ev: TokenBudgetMaxEvent = {
      timestamp: '2026-05-28T00:02:00.000Z',
      kind: 'blocked',
      usagePercent: 5.4,
      maxPercent: 5.0,
      reason: 'blocked while loading sc-dev-team',
    };
    const obs = eventToObservation(ev);
    expect(obs.value).toBe(-1);
    // The observation type drops the metadata; the JSONL event preserves it.
    expect(ev.usagePercent).toBe(5.4);
    expect(ev.maxPercent).toBe(5.0);
    expect(ev.reason).toBe('blocked while loading sc-dev-team');
  });
});

describe('eventsToObservations (v1.49.888)', () => {
  it('does NOT filter — every recorded event is a terminal outcome', () => {
    const events: TokenBudgetMaxEvent[] = [
      { timestamp: '2026-05-28T00:00:00.000Z', kind: 'under_budget' },
      { timestamp: '2026-05-28T00:01:00.000Z', kind: 'blocked' },
      { timestamp: '2026-05-28T00:02:00.000Z', kind: 'under_budget' },
    ];
    const obs = eventsToObservations(events);
    expect(obs).toHaveLength(3);
    expect(obs.map((o) => o.value)).toEqual([1, -1, 1]);
  });

  it('returns empty array for empty input', () => {
    expect(eventsToObservations([])).toEqual([]);
  });
});

describe('appendTokenBudgetMaxEvent + readTokenBudgetMaxEvents (v1.49.888)', () => {
  let workDir: string;
  let path: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-tbmax-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    path = join(workDir, 'nested', 'token-budget-max-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('creates parent directory lazily on first append', async () => {
    const event: TokenBudgetMaxEvent = { timestamp: '2026-05-28T00:00:00.000Z', kind: 'under_budget' };
    await appendTokenBudgetMaxEvent(event, { path });
    const raw = await readFile(path, 'utf8');
    expect(raw.trim()).toBe(JSON.stringify(event));
  });

  it('appends one JSON line per call (preserves order)', async () => {
    await appendTokenBudgetMaxEvent({ timestamp: 't1', kind: 'under_budget' }, { path });
    await appendTokenBudgetMaxEvent({ timestamp: 't2', kind: 'blocked' }, { path });
    await appendTokenBudgetMaxEvent({ timestamp: 't3', kind: 'under_budget' }, { path });
    const events = await readTokenBudgetMaxEvents(path);
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't2', 't3']);
    expect(events.map((e) => e.kind)).toEqual(['under_budget', 'blocked', 'under_budget']);
  });

  it('returns empty array on missing file', async () => {
    const events = await readTokenBudgetMaxEvents(join(workDir, 'never-written.jsonl'));
    expect(events).toEqual([]);
  });

  it('tolerates malformed lines (skips silently)', async () => {
    writeFileSync(
      join(workDir, 'mixed.jsonl'),
      [
        JSON.stringify({ timestamp: '2026-05-28T00:00:00.000Z', kind: 'under_budget' }),
        '<<not json>>',
        JSON.stringify({ timestamp: '2026-05-28T00:01:00.000Z', kind: 'blocked' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readTokenBudgetMaxEvents(join(workDir, 'mixed.jsonl'));
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.kind)).toEqual(['under_budget', 'blocked']);
  });

  it('skips entries with unknown kind (only under_budget/blocked accepted)', async () => {
    writeFileSync(
      join(workDir, 'unknown-kind.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'under_budget' }),
        JSON.stringify({ timestamp: 't2', kind: 'maybe' }),
        JSON.stringify({ timestamp: 't3', kind: 'responsive' }), // warn-events kind doesn't belong here
        JSON.stringify({ timestamp: 't4', kind: 'blocked' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readTokenBudgetMaxEvents(join(workDir, 'unknown-kind.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't4']);
  });

  it('skips lines missing required fields', async () => {
    writeFileSync(
      join(workDir, 'incomplete.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'under_budget' }),
        JSON.stringify({ kind: 'blocked' }), // missing timestamp
        JSON.stringify({ timestamp: 't3' }), // missing kind
        JSON.stringify({ timestamp: 't4', kind: 'under_budget' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readTokenBudgetMaxEvents(join(workDir, 'incomplete.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't4']);
  });
});

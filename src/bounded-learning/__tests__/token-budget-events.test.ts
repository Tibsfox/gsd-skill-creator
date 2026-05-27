import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  appendTokenBudgetEvent,
  eventKindToValue,
  eventsToObservations,
  eventToObservation,
  readTokenBudgetEvents,
} from '../token-budget-events.js';
import type { TokenBudgetEvent } from '../token-budget-events.js';

describe('eventKindToValue (v1.49.803)', () => {
  it('maps responsive → +1', () => {
    expect(eventKindToValue('responsive')).toBe(1);
  });

  it('maps ignored → -1', () => {
    expect(eventKindToValue('ignored')).toBe(-1);
  });
});

describe('eventToObservation (v1.49.803)', () => {
  it('lifts a responsive event into an accepted-decision +1 observation', () => {
    const ev: TokenBudgetEvent = { timestamp: '2026-05-27T00:00:00.000Z', kind: 'responsive' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('accepted');
    expect(obs.value).toBe(1);
    expect(obs.observedAt).toBe('2026-05-27T00:00:00.000Z');
    expect(obs.suggestionId).toBe('2026-05-27T00:00:00.000Z');
  });

  it('lifts an ignored event into a dismissed-decision -1 observation', () => {
    const ev: TokenBudgetEvent = { timestamp: '2026-05-27T00:01:00.000Z', kind: 'ignored' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('dismissed');
    expect(obs.value).toBe(-1);
  });

  it('preserves optional usagePercent / warnAtPercent / reason on the source event', () => {
    const ev: TokenBudgetEvent = {
      timestamp: '2026-05-27T00:02:00.000Z',
      kind: 'responsive',
      usagePercent: 8,
      warnAtPercent: 4,
      reason: 'pruned grove-orchestration',
    };
    const obs = eventToObservation(ev);
    expect(obs.value).toBe(1);
    // Observation type drops the metadata; that's intentional (the
    // calibration loop reads only value+decision+observedAt). The event
    // remains intact in the JSONL log for forensic inspection.
    expect(ev.usagePercent).toBe(8);
    expect(ev.warnAtPercent).toBe(4);
    expect(ev.reason).toBe('pruned grove-orchestration');
  });
});

describe('eventsToObservations (v1.49.803)', () => {
  it('does NOT filter (every recorded event is a terminal outcome — no pending/deferred for this source)', () => {
    const events: TokenBudgetEvent[] = [
      { timestamp: '2026-05-27T00:00:00.000Z', kind: 'responsive' },
      { timestamp: '2026-05-27T00:01:00.000Z', kind: 'ignored' },
      { timestamp: '2026-05-27T00:02:00.000Z', kind: 'responsive' },
    ];
    const obs = eventsToObservations(events);
    expect(obs).toHaveLength(3);
    expect(obs.map((o) => o.value)).toEqual([1, -1, 1]);
  });

  it('returns empty array for empty input', () => {
    expect(eventsToObservations([])).toEqual([]);
  });
});

describe('appendTokenBudgetEvent + readTokenBudgetEvents (v1.49.803)', () => {
  let workDir: string;
  let path: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-tbe-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    path = join(workDir, 'nested', 'token-budget-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('creates parent directory lazily on first append', async () => {
    const event: TokenBudgetEvent = { timestamp: '2026-05-27T00:00:00.000Z', kind: 'responsive' };
    await appendTokenBudgetEvent(event, { path });
    const raw = await readFile(path, 'utf8');
    expect(raw.trim()).toBe(JSON.stringify(event));
  });

  it('appends one JSON line per call (preserves order)', async () => {
    await appendTokenBudgetEvent({ timestamp: 't1', kind: 'responsive' }, { path });
    await appendTokenBudgetEvent({ timestamp: 't2', kind: 'ignored' }, { path });
    await appendTokenBudgetEvent({ timestamp: 't3', kind: 'responsive' }, { path });
    const events = await readTokenBudgetEvents(path);
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't2', 't3']);
    expect(events.map((e) => e.kind)).toEqual(['responsive', 'ignored', 'responsive']);
  });

  it('returns empty array on missing file', async () => {
    const events = await readTokenBudgetEvents(join(workDir, 'never-written.jsonl'));
    expect(events).toEqual([]);
  });

  it('tolerates malformed lines (skips silently)', async () => {
    writeFileSync(
      join(workDir, 'mixed.jsonl'),
      [
        JSON.stringify({ timestamp: '2026-05-27T00:00:00.000Z', kind: 'responsive' }),
        '<<not json>>',
        JSON.stringify({ timestamp: '2026-05-27T00:01:00.000Z', kind: 'ignored' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readTokenBudgetEvents(join(workDir, 'mixed.jsonl'));
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.kind)).toEqual(['responsive', 'ignored']);
  });

  it('skips entries with unknown kind (only responsive/ignored accepted)', async () => {
    writeFileSync(
      join(workDir, 'unknown-kind.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'responsive' }),
        JSON.stringify({ timestamp: 't2', kind: 'maybe' }),
        JSON.stringify({ timestamp: 't3', kind: 'ignored' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readTokenBudgetEvents(join(workDir, 'unknown-kind.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't3']);
  });

  it('skips lines missing required fields', async () => {
    writeFileSync(
      join(workDir, 'incomplete.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'responsive' }),
        JSON.stringify({ kind: 'ignored' }), // missing timestamp
        JSON.stringify({ timestamp: 't3' }), // missing kind
        JSON.stringify({ timestamp: 't4', kind: 'responsive' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readTokenBudgetEvents(join(workDir, 'incomplete.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't4']);
  });
});

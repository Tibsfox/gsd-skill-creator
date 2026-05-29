import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  appendObservationRetentionEvent,
  eventKindToValue,
  eventsToObservations,
  eventToObservation,
  readObservationRetentionEvents,
} from '../observation-retention-events.js';
import type { ObservationRetentionEvent } from '../observation-retention-events.js';

describe('eventKindToValue (v1.49.884 — same polarity shape as token-budget)', () => {
  it('maps too_aggressive → -1 (favors raising the threshold, keep entries longer)', () => {
    expect(eventKindToValue('too_aggressive')).toBe(-1);
  });

  it('maps too_lax → +1 (favors lowering the threshold, drop entries sooner)', () => {
    expect(eventKindToValue('too_lax')).toBe(1);
  });
});

describe('eventToObservation (v1.49.884)', () => {
  it('lifts a too_aggressive event into a dismissed-decision -1 observation', () => {
    const ev: ObservationRetentionEvent = { timestamp: '2026-05-28T00:00:00.000Z', kind: 'too_aggressive' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('dismissed');
    expect(obs.value).toBe(-1);
    expect(obs.observedAt).toBe('2026-05-28T00:00:00.000Z');
    expect(obs.suggestionId).toBe('2026-05-28T00:00:00.000Z');
  });

  it('lifts a too_lax event into an accepted-decision +1 observation', () => {
    const ev: ObservationRetentionEvent = { timestamp: '2026-05-28T00:01:00.000Z', kind: 'too_lax' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('accepted');
    expect(obs.value).toBe(1);
  });

  it('preserves optional droppedCount / retainedCount / retentionDays / reason on the source event', () => {
    const ev: ObservationRetentionEvent = {
      timestamp: '2026-05-28T00:02:00.000Z',
      kind: 'too_aggressive',
      droppedCount: 42,
      retainedCount: 1024,
      retentionDays: 90,
      reason: 'lost analytics from week-old pattern cluster',
    };
    const obs = eventToObservation(ev);
    expect(obs.value).toBe(-1);
    // The observation type drops the metadata; the JSONL event preserves it.
    expect(ev.droppedCount).toBe(42);
    expect(ev.retainedCount).toBe(1024);
    expect(ev.retentionDays).toBe(90);
    expect(ev.reason).toBe('lost analytics from week-old pattern cluster');
  });
});

describe('eventsToObservations (v1.49.884)', () => {
  it('does NOT filter — every recorded event is a terminal outcome', () => {
    const events: ObservationRetentionEvent[] = [
      { timestamp: '2026-05-28T00:00:00.000Z', kind: 'too_aggressive' },
      { timestamp: '2026-05-28T00:01:00.000Z', kind: 'too_lax' },
      { timestamp: '2026-05-28T00:02:00.000Z', kind: 'too_aggressive' },
    ];
    const obs = eventsToObservations(events);
    expect(obs).toHaveLength(3);
    expect(obs.map((o) => o.value)).toEqual([-1, 1, -1]);
  });

  it('returns empty array for empty input', () => {
    expect(eventsToObservations([])).toEqual([]);
  });
});

describe('appendObservationRetentionEvent + readObservationRetentionEvents (v1.49.884)', () => {
  let workDir: string;
  let path: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-ore-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    path = join(workDir, 'nested', 'observation-retention-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('creates parent directory lazily on first append', async () => {
    const event: ObservationRetentionEvent = { timestamp: '2026-05-28T00:00:00.000Z', kind: 'too_aggressive' };
    await appendObservationRetentionEvent(event, { path });
    const raw = await readFile(path, 'utf8');
    expect(raw.trim()).toBe(JSON.stringify(event));
  });

  it('appends one JSON line per call (preserves order)', async () => {
    await appendObservationRetentionEvent({ timestamp: 't1', kind: 'too_aggressive' }, { path });
    await appendObservationRetentionEvent({ timestamp: 't2', kind: 'too_lax' }, { path });
    await appendObservationRetentionEvent({ timestamp: 't3', kind: 'too_aggressive' }, { path });
    const events = await readObservationRetentionEvents(path);
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't2', 't3']);
    expect(events.map((e) => e.kind)).toEqual(['too_aggressive', 'too_lax', 'too_aggressive']);
  });

  it('returns empty array on missing file', async () => {
    const events = await readObservationRetentionEvents(join(workDir, 'never-written.jsonl'));
    expect(events).toEqual([]);
  });

  it('tolerates malformed lines (skips silently)', async () => {
    writeFileSync(
      join(workDir, 'mixed.jsonl'),
      [
        JSON.stringify({ timestamp: '2026-05-28T00:00:00.000Z', kind: 'too_aggressive' }),
        '<<not json>>',
        JSON.stringify({ timestamp: '2026-05-28T00:01:00.000Z', kind: 'too_lax' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readObservationRetentionEvents(join(workDir, 'mixed.jsonl'));
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.kind)).toEqual(['too_aggressive', 'too_lax']);
  });

  it('skips entries with unknown kind (only too_aggressive/too_lax accepted)', async () => {
    writeFileSync(
      join(workDir, 'unknown-kind.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'too_aggressive' }),
        JSON.stringify({ timestamp: 't2', kind: 'maybe' }),
        JSON.stringify({ timestamp: 't3', kind: 'useful' }), // predictive kind doesn't belong here
        JSON.stringify({ timestamp: 't4', kind: 'too_lax' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readObservationRetentionEvents(join(workDir, 'unknown-kind.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't4']);
  });

  it('skips lines missing required fields', async () => {
    writeFileSync(
      join(workDir, 'incomplete.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'too_aggressive' }),
        JSON.stringify({ kind: 'too_lax' }), // missing timestamp
        JSON.stringify({ timestamp: 't3' }), // missing kind
        JSON.stringify({ timestamp: 't4', kind: 'too_aggressive' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readObservationRetentionEvents(join(workDir, 'incomplete.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't4']);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  appendPredictiveLowConfidenceEvent,
  eventKindToValue,
  eventsToObservations,
  eventToObservation,
  readPredictiveLowConfidenceEvents,
} from '../predictive-low-confidence-events.js';
import type { PredictiveLowConfidenceEvent } from '../predictive-low-confidence-events.js';

describe('eventKindToValue (v1.49.837 — polarity inverted vs token-budget)', () => {
  it('maps useful → -1 (favors raising the threshold, fire more often)', () => {
    expect(eventKindToValue('useful')).toBe(-1);
  });

  it('maps not_useful → +1 (favors lowering the threshold, fire less often)', () => {
    expect(eventKindToValue('not_useful')).toBe(1);
  });
});

describe('eventToObservation (v1.49.837)', () => {
  it('lifts a useful event into a dismissed-decision -1 observation (polarity-inverted analog)', () => {
    const ev: PredictiveLowConfidenceEvent = { timestamp: '2026-05-27T00:00:00.000Z', kind: 'useful' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('dismissed');
    expect(obs.value).toBe(-1);
    expect(obs.observedAt).toBe('2026-05-27T00:00:00.000Z');
    expect(obs.suggestionId).toBe('2026-05-27T00:00:00.000Z');
  });

  it('lifts a not_useful event into an accepted-decision +1 observation (polarity-inverted analog)', () => {
    const ev: PredictiveLowConfidenceEvent = { timestamp: '2026-05-27T00:01:00.000Z', kind: 'not_useful' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('accepted');
    expect(obs.value).toBe(1);
  });

  it('preserves optional currentSkill / maxScore / thresholdValue / reason on the source event', () => {
    const ev: PredictiveLowConfidenceEvent = {
      timestamp: '2026-05-27T00:02:00.000Z',
      kind: 'useful',
      currentSkill: 'gsd-workflow',
      maxScore: 0.22,
      thresholdValue: 0.30,
      reason: 'rosetta-analogy hit relevant cross-domain concept',
    };
    const obs = eventToObservation(ev);
    expect(obs.value).toBe(-1);
    // The observation type drops the metadata; the JSONL event preserves it.
    expect(ev.currentSkill).toBe('gsd-workflow');
    expect(ev.maxScore).toBe(0.22);
    expect(ev.thresholdValue).toBe(0.30);
    expect(ev.reason).toBe('rosetta-analogy hit relevant cross-domain concept');
  });
});

describe('eventsToObservations (v1.49.837)', () => {
  it('does NOT filter — every recorded event is a terminal outcome', () => {
    const events: PredictiveLowConfidenceEvent[] = [
      { timestamp: '2026-05-27T00:00:00.000Z', kind: 'useful' },
      { timestamp: '2026-05-27T00:01:00.000Z', kind: 'not_useful' },
      { timestamp: '2026-05-27T00:02:00.000Z', kind: 'useful' },
    ];
    const obs = eventsToObservations(events);
    expect(obs).toHaveLength(3);
    expect(obs.map((o) => o.value)).toEqual([-1, 1, -1]);
  });

  it('returns empty array for empty input', () => {
    expect(eventsToObservations([])).toEqual([]);
  });
});

describe('appendPredictiveLowConfidenceEvent + readPredictiveLowConfidenceEvents (v1.49.837)', () => {
  let workDir: string;
  let path: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-plce-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    path = join(workDir, 'nested', 'predictive-low-confidence-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('creates parent directory lazily on first append', async () => {
    const event: PredictiveLowConfidenceEvent = { timestamp: '2026-05-27T00:00:00.000Z', kind: 'useful' };
    await appendPredictiveLowConfidenceEvent(event, { path });
    const raw = await readFile(path, 'utf8');
    expect(raw.trim()).toBe(JSON.stringify(event));
  });

  it('appends one JSON line per call (preserves order)', async () => {
    await appendPredictiveLowConfidenceEvent({ timestamp: 't1', kind: 'useful' }, { path });
    await appendPredictiveLowConfidenceEvent({ timestamp: 't2', kind: 'not_useful' }, { path });
    await appendPredictiveLowConfidenceEvent({ timestamp: 't3', kind: 'useful' }, { path });
    const events = await readPredictiveLowConfidenceEvents(path);
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't2', 't3']);
    expect(events.map((e) => e.kind)).toEqual(['useful', 'not_useful', 'useful']);
  });

  it('returns empty array on missing file', async () => {
    const events = await readPredictiveLowConfidenceEvents(join(workDir, 'never-written.jsonl'));
    expect(events).toEqual([]);
  });

  it('tolerates malformed lines (skips silently)', async () => {
    writeFileSync(
      join(workDir, 'mixed.jsonl'),
      [
        JSON.stringify({ timestamp: '2026-05-27T00:00:00.000Z', kind: 'useful' }),
        '<<not json>>',
        JSON.stringify({ timestamp: '2026-05-27T00:01:00.000Z', kind: 'not_useful' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readPredictiveLowConfidenceEvents(join(workDir, 'mixed.jsonl'));
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.kind)).toEqual(['useful', 'not_useful']);
  });

  it('skips entries with unknown kind (only useful/not_useful accepted)', async () => {
    writeFileSync(
      join(workDir, 'unknown-kind.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'useful' }),
        JSON.stringify({ timestamp: 't2', kind: 'maybe' }),
        JSON.stringify({ timestamp: 't3', kind: 'responsive' }), // token-budget kind doesn't belong here
        JSON.stringify({ timestamp: 't4', kind: 'not_useful' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readPredictiveLowConfidenceEvents(join(workDir, 'unknown-kind.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't4']);
  });

  it('skips lines missing required fields', async () => {
    writeFileSync(
      join(workDir, 'incomplete.jsonl'),
      [
        JSON.stringify({ timestamp: 't1', kind: 'useful' }),
        JSON.stringify({ kind: 'not_useful' }), // missing timestamp
        JSON.stringify({ timestamp: 't3' }), // missing kind
        JSON.stringify({ timestamp: 't4', kind: 'useful' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readPredictiveLowConfidenceEvents(join(workDir, 'incomplete.jsonl'));
    expect(events.map((e) => e.timestamp)).toEqual(['t1', 't4']);
  });
});

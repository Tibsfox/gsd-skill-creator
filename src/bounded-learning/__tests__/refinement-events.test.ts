import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  appendRefinementEvent,
  eventKindToValue,
  eventsToObservations,
  eventToObservation,
  readRefinementEvents,
} from '../refinement-events.js';
import type { RefinementEvent } from '../refinement-events.js';
import {
  loadObservationsForThreshold,
  observationSourceFor,
} from '../observation-sources.js';
import { runCalibrationLoop } from '../calibration-loop.js';

describe('refinement-events mapper (v1.49.1054)', () => {
  it('maps accepted → +1 and dismissed → -1', () => {
    expect(eventKindToValue('accepted')).toBe(1);
    expect(eventKindToValue('dismissed')).toBe(-1);
  });

  it('lifts an accepted event into an accepted-decision +1 observation', () => {
    const ev: RefinementEvent = { timestamp: '2026-07-12T00:00:00.000Z', kind: 'accepted' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('accepted');
    expect(obs.value).toBe(1);
    expect(obs.observedAt).toBe('2026-07-12T00:00:00.000Z');
    expect(obs.suggestionId).toBe('2026-07-12T00:00:00.000Z');
  });

  it('lifts a dismissed event into a dismissed-decision -1 observation', () => {
    const ev: RefinementEvent = { timestamp: '2026-07-12T00:01:00.000Z', kind: 'dismissed' };
    const obs = eventToObservation(ev);
    expect(obs.decision).toBe('dismissed');
    expect(obs.value).toBe(-1);
  });

  it('does NOT filter — every recorded event is a terminal outcome', () => {
    const events: RefinementEvent[] = [
      { timestamp: '2026-07-12T00:00:00.000Z', kind: 'accepted', source: 'suggest' },
      { timestamp: '2026-07-12T00:01:00.000Z', kind: 'dismissed', source: 'quarantine' },
      { timestamp: '2026-07-12T00:02:00.000Z', kind: 'accepted' },
    ];
    const obs = eventsToObservations(events);
    expect(obs).toHaveLength(3);
    expect(obs.map((o) => o.value)).toEqual([1, -1, 1]);
  });

  it('returns empty array for empty input', () => {
    expect(eventsToObservations([])).toEqual([]);
  });
});

describe('appendRefinementEvent + readRefinementEvents (v1.49.1054)', () => {
  let workDir: string;
  let eventsPath: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-refine-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    eventsPath = join(workDir, 'refinement-events.jsonl');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('round-trips appended events preserving optional metadata', async () => {
    await appendRefinementEvent(
      { timestamp: '2026-07-12T00:00:00.000Z', kind: 'accepted', source: 'suggest', skillName: 'foo' },
      { path: eventsPath },
    );
    await appendRefinementEvent(
      { timestamp: '2026-07-12T00:01:00.000Z', kind: 'dismissed', source: 'quarantine', reason: 'noise' },
      { path: eventsPath },
    );
    const events = await readRefinementEvents(eventsPath);
    expect(events).toHaveLength(2);
    expect(events[0]?.skillName).toBe('foo');
    expect(events[1]?.reason).toBe('noise');
    // Sanity: the file is genuine JSONL.
    const raw = await readFile(eventsPath, 'utf8');
    expect(raw.trim().split('\n')).toHaveLength(2);
  });

  it('tolerates malformed lines (skips silently)', async () => {
    writeFileSync(
      eventsPath,
      [
        JSON.stringify({ timestamp: '2026-07-12T00:00:00.000Z', kind: 'accepted' }),
        '<<<not json>>>',
        JSON.stringify({ timestamp: '2026-07-12T00:02:00.000Z', kind: 'dismissed' }),
      ].join('\n') + '\n',
      'utf8',
    );
    const events = await readRefinementEvents(eventsPath);
    expect(events).toHaveLength(2);
  });

  it('returns empty array for a missing file', async () => {
    const events = await readRefinementEvents(join(workDir, 'never-written.jsonl'));
    expect(events).toEqual([]);
  });
});

describe('observation-sources — refinement.* class registration (v1.49.1054)', () => {
  let workDir: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-refine-src-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('classifies all three refinement.* thresholds as WIRED refinement-events source', () => {
    for (const t of [
      'refinement.min_confidence',
      'refinement.min_corrections',
      'refinement.cooldown_days',
    ] as const) {
      const info = observationSourceFor(t);
      expect(info.sourceId).toBe('refinement-events');
      expect(info.wired).toBe(true);
      expect(info.description).toMatch(/v1\.49\.1054 wire/);
    }
  });

  it('reads refinement-events JSONL for every refinement.* threshold', async () => {
    const eventsPath = join(workDir, 'refinement-events.jsonl');
    writeFileSync(
      eventsPath,
      [
        JSON.stringify({ timestamp: '2026-07-12T00:00:00.000Z', kind: 'accepted' }),
        JSON.stringify({ timestamp: '2026-07-12T00:01:00.000Z', kind: 'dismissed' }),
        JSON.stringify({ timestamp: '2026-07-12T00:02:00.000Z', kind: 'accepted' }),
      ].join('\n') + '\n',
      'utf8',
    );
    for (const t of [
      'refinement.min_confidence',
      'refinement.min_corrections',
      'refinement.cooldown_days',
    ] as const) {
      const obs = await loadObservationsForThreshold(t, { refinementEventsPath: eventsPath });
      expect(obs).toHaveLength(3);
      // accepted → +1, dismissed → -1.
      expect(obs.map((o) => o.value)).toEqual([1, -1, 1]);
    }
  });

  it('returns empty array when the events file is missing (honest no-data baseline)', async () => {
    const obs = await loadObservationsForThreshold('refinement.cooldown_days', {
      refinementEventsPath: join(workDir, 'does-not-exist.jsonl'),
    });
    expect(obs).toEqual([]);
  });
});

describe('calibration nudge — accept/dismiss stream moves a refinement threshold within e-process bounds (v1.49.1054)', () => {
  it('a strong accept stream drives DECREASE (loosen the gate) and stays within Ville bounds', async () => {
    const events = Array.from({ length: 30 }, (_, i) => ({
      timestamp: `2026-07-12T00:${String(i).padStart(2, '0')}:00.000Z`,
      kind: 'accepted' as const,
    }));
    const obs = eventsToObservations(events);
    const rec = runCalibrationLoop('refinement.min_corrections', 3, obs);
    expect(rec.direction).toBe('decrease');
    expect(rec.rejected).toBe(true);
    expect(rec.proposedValue).toBe(2);
    // Anytime-valid Type-I bound: evidence crosses the rejection threshold but
    // the process is a genuine e-value (finite, positive).
    expect(rec.evidence).toBeGreaterThanOrEqual(rec.rejectionThreshold);
    expect(Number.isFinite(rec.evidence)).toBe(true);
  });

  it('a strong dismiss stream drives INCREASE (tighten the gate)', async () => {
    const events = Array.from({ length: 30 }, (_, i) => ({
      timestamp: `2026-07-12T01:${String(i).padStart(2, '0')}:00.000Z`,
      kind: 'dismissed' as const,
    }));
    const obs = eventsToObservations(events);
    const rec = runCalibrationLoop('refinement.cooldown_days', 7, obs);
    expect(rec.direction).toBe('increase');
    expect(rec.rejected).toBe(true);
    expect(rec.proposedValue).toBe(8);
  });

  it('a balanced stream HOLDS (insufficient directional evidence)', async () => {
    const events = Array.from({ length: 20 }, (_, i) => ({
      timestamp: `2026-07-12T02:${String(i).padStart(2, '0')}:00.000Z`,
      kind: (i % 2 === 0 ? 'accepted' : 'dismissed') as 'accepted' | 'dismissed',
    }));
    const obs = eventsToObservations(events);
    const rec = runCalibrationLoop('refinement.min_confidence', 1, obs);
    expect(rec.direction).toBe('hold');
    expect(rec.rejected).toBe(false);
    expect(rec.proposedValue).toBeNull();
  });
});

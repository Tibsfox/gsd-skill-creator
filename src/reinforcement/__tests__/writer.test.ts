/**
 * MA-6: writer tests — EXTEND posture, redaction, append-only, round-trip.
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import {
  writeReinforcementEvent,
  writeReinforcementEvents,
  readReinforcementEvents,
  redactReinforcementEvent,
  validateReinforcementEvent,
  ReinforcementWriter,
} from '../writer.js';
import { emitExplicitCorrection, emitOutcomeObserved } from '../emitters.js';
import type { ReinforcementEvent } from '../../types/reinforcement.js';

function tempPath(): string {
  return join(tmpdir(), `reinforcement-writer-test-${randomUUID()}.jsonl`);
}

describe('writeReinforcementEvent', () => {
  it('writes an event and it reads back', async () => {
    const logPath = tempPath();
    const event = emitExplicitCorrection({
      actor: 'test',
      metadata: { teachEntryId: 't1' },
    });
    const written = await writeReinforcementEvent(event, logPath);
    expect(written.id).toBe(event.id);

    const read = await readReinforcementEvents(logPath);
    expect(read).toHaveLength(1);
    expect(read[0].id).toBe(event.id);
    expect(read[0].channel).toBe('explicit_correction');
  });

  it('creates parent directories', async () => {
    const logPath = join(tmpdir(), `nested-${randomUUID()}`, 'sub', 'reinforcement.jsonl');
    const event = emitExplicitCorrection({ actor: 'test', metadata: {} });
    await expect(writeReinforcementEvent(event, logPath)).resolves.toBeDefined();
  });

  it('normalises magnitude and direction', async () => {
    const logPath = tempPath();
    const event: ReinforcementEvent = {
      id: 'e1',
      ts: 0,
      channel: 'outcome_observed',
      value: { magnitude: 5, direction: 'negative' }, // inconsistent on purpose
      actor: 'test',
      metadata: { outcomeKind: 'x' },
    };
    const written = await writeReinforcementEvent(event, logPath);
    expect(written.value.magnitude).toBe(1);
    expect(written.value.direction).toBe('positive');
  });

  it('rejects invalid events', async () => {
    const logPath = tempPath();
    await expect(
      writeReinforcementEvent({} as unknown as ReinforcementEvent, logPath),
    ).rejects.toThrow(/invalid ReinforcementEvent/);
  });
});

describe('writeReinforcementEvents (batch)', () => {
  it('writes every event in order', async () => {
    const logPath = tempPath();
    const events = [
      emitExplicitCorrection({ actor: 'a', metadata: {}, id: 'e1', ts: 1 }),
      emitOutcomeObserved({ actor: 'b', metadata: { outcomeKind: 'test-pass' }, magnitude: 1, id: 'e2', ts: 2 }),
      emitOutcomeObserved({ actor: 'c', metadata: { outcomeKind: 'test-fail' }, magnitude: -1, id: 'e3', ts: 3 }),
    ];
    await writeReinforcementEvents(events, logPath);
    const read = await readReinforcementEvents(logPath);
    expect(read.map((e) => e.id)).toEqual(['e1', 'e2', 'e3']);
  });
});

describe('redactReinforcementEvent', () => {
  it('redacts api-key / token in actor and metadata', () => {
    const event: ReinforcementEvent = {
      id: 'x',
      ts: 0,
      channel: 'explicit_correction',
      value: { magnitude: -1, direction: 'negative' },
      actor: 'user[api_key=sk-ABC]',
      metadata: {
        teachEntryId: 't1',
        category: 'correction',
        skillId: 'password=hunter2',
      },
    };
    const r = redactReinforcementEvent(event);
    expect(r.actor).not.toContain('sk-ABC');
    expect(r.actor).toContain('[redacted]');
    if (r.channel === 'explicit_correction') {
      expect(r.metadata.skillId).toContain('[redacted]');
    }
  });
});

describe('append-only invariant (SC-M3-APPEND inherited)', () => {
  it('multiple writes only grow the file', async () => {
    const logPath = tempPath();
    await writeReinforcementEvent(
      emitExplicitCorrection({ actor: 'a', metadata: {}, id: 'e1', ts: 1 }),
      logPath,
    );
    const size1 = (await fs.stat(logPath)).size;
    await writeReinforcementEvent(
      emitExplicitCorrection({ actor: 'b', metadata: {}, id: 'e2', ts: 2 }),
      logPath,
    );
    const size2 = (await fs.stat(logPath)).size;
    expect(size2).toBeGreaterThan(size1);
  });
});

describe('validateReinforcementEvent', () => {
  it('returns [] on a valid event', () => {
    const e = emitExplicitCorrection({ actor: 'a', metadata: {} });
    expect(validateReinforcementEvent(e)).toEqual([]);
  });
  it('flags missing fields', () => {
    const errs = validateReinforcementEvent({});
    expect(errs.length).toBeGreaterThan(0);
  });
  it('flags magnitude out of range', () => {
    const errs = validateReinforcementEvent({
      id: 'x',
      ts: 0,
      channel: 'explicit_correction',
      actor: 'a',
      metadata: {},
      value: { magnitude: 5, direction: 'positive' },
    });
    expect(errs.some((e) => e.includes('magnitude'))).toBe(true);
  });
});

describe('ReinforcementWriter class', () => {
  it('wraps write + read for a single log path', async () => {
    const logPath = tempPath();
    const w = new ReinforcementWriter(logPath);
    const event = emitExplicitCorrection({ actor: 'test', metadata: {} });
    await w.write(event);
    const read = await w.readAll();
    expect(read).toHaveLength(1);
    expect(read[0].id).toBe(event.id);
  });
});

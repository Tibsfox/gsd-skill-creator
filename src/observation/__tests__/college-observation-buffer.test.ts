import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  recordCollegeEvent,
  drainCollegeEvents,
  eventsToSessionObservation,
  pumpCollegeObservations,
  type CollegeObservationEventLike,
} from '../college-observation-buffer.js';
import type {
  CollegeBridgeLike,
  CollegeConnectorLike,
} from '../college-observation-adapter.js';

function ev(overrides: Partial<CollegeObservationEventLike>): CollegeObservationEventLike {
  return {
    id: 'e1',
    type: 'exploration',
    conceptId: 'derivative',
    departmentId: 'mathematics',
    path: 'mathematics/calculus/derivative',
    timestamp: 1_000_000,
    ...overrides,
  };
}

/** Fake connector mirroring the .college one: forwards flush()→toSessionObservation→sink when enabled. */
class FakeConnector implements CollegeConnectorLike {
  private enabled: boolean;
  constructor(
    private readonly bridge: CollegeBridgeLike,
    private readonly sink: (o: Record<string, unknown>) => void | Promise<void>,
    config: { enabled?: boolean },
  ) {
    this.enabled = config.enabled ?? false;
  }
  isEnabled(): boolean {
    return this.enabled;
  }
  setEnabled(e: boolean): void {
    this.enabled = e;
  }
  async pump(): Promise<number> {
    if (!this.enabled) return 0;
    const events = this.bridge.flush();
    if (!events.length) return 0;
    await this.sink(this.bridge.toSessionObservation(events));
    return 1;
  }
}

describe('recordCollegeEvent + drainCollegeEvents', () => {
  let dir: string;
  let storePath: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'college-obs-'));
    storePath = join(dir, 'nested', 'observations.jsonl');
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('appends events (creating parent dirs) and drains + clears', async () => {
    await recordCollegeEvent(storePath, ev({ id: 'e1' }));
    await recordCollegeEvent(storePath, ev({ id: 'e2', type: 'translation', conceptId: 'integral' }));
    const drained = await drainCollegeEvents(storePath);
    expect(drained.map((e) => e.id)).toEqual(['e1', 'e2']);
    // Drain clears the buffer.
    expect(await drainCollegeEvents(storePath)).toEqual([]);
  });

  it('skips corrupt lines and returns [] for a missing buffer', async () => {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(storePath.replace('/nested', ''), '{bad\n' + JSON.stringify(ev({ id: 'ok' })) + '\n');
    const drained = await drainCollegeEvents(storePath.replace('/nested', ''));
    expect(drained.map((e) => e.id)).toEqual(['ok']);
    expect(await drainCollegeEvents(join(dir, 'absent.jsonl'))).toEqual([]);
  });
});

describe('eventsToSessionObservation', () => {
  it('collapses events into a college-tagged SessionObservation record', () => {
    const obs = eventsToSessionObservation(
      [ev({ conceptId: 'derivative' }), ev({ id: 'e2', conceptId: 'integral', timestamp: 1_060_000 })],
      'sess-1',
    );
    expect(obs.source).toBe('college');
    expect(obs.activeSkills).toEqual(['college']);
    expect(obs.collegeConcepts).toEqual(['derivative', 'integral']);
    expect(obs.collegeEventCount).toBe(2);
    expect(obs.durationMinutes).toBe(1);
  });
});

describe('pumpCollegeObservations', () => {
  let dir: string;
  let storePath: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'college-pump-'));
    storePath = join(dir, 'observations.jsonl');
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('forwards a drained batch to the sink when enabled', async () => {
    await recordCollegeEvent(storePath, ev({ id: 'e1' }));
    await recordCollegeEvent(storePath, ev({ id: 'e2', conceptId: 'integral' }));
    const appended: Array<{ collection: string; data: Record<string, unknown> }> = [];
    const sink = { append: (collection: string, data: Record<string, unknown>) => { appended.push({ collection, data }); } };

    const count = await pumpCollegeObservations(storePath, sink, {
      sessionId: 'sess-1',
      enabled: true,
      deps: { loadConnectorCtor: async () => FakeConnector },
    });

    expect(count).toBe(1);
    expect(appended).toHaveLength(1);
    expect(appended[0]!.collection).toBe('sessions');
    expect(appended[0]!.data.collegeEventCount).toBe(2);
    // Buffer was drained.
    expect(await drainCollegeEvents(storePath)).toEqual([]);
  });

  it('is a no-op that PRESERVES the buffer when disabled (default)', async () => {
    await recordCollegeEvent(storePath, ev({ id: 'e1' }));
    const appended: unknown[] = [];
    const sink = { append: (_c: string, d: Record<string, unknown>) => { appended.push(d); } };

    const count = await pumpCollegeObservations(storePath, sink, {
      deps: { loadConnectorCtor: async () => FakeConnector },
    });

    expect(count).toBe(0);
    expect(appended).toHaveLength(0);
    // Buffer preserved for a later (enabled) pump.
    expect((await drainCollegeEvents(storePath)).map((e) => e.id)).toEqual(['e1']);
  });
});

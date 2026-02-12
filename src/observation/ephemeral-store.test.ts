import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { EphemeralStore } from './ephemeral-store.js';
import type { SessionObservation } from '../types/observation.js';

function makeObservation(overrides: Partial<SessionObservation> = {}): SessionObservation {
  return {
    sessionId: 'test-session',
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    durationMinutes: 1,
    source: 'startup',
    reason: 'logout',
    metrics: {
      userMessages: 0,
      assistantMessages: 0,
      toolCalls: 0,
      uniqueFilesRead: 0,
      uniqueFilesWritten: 0,
      uniqueCommandsRun: 0,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills: [],
    ...overrides,
  };
}

describe('EphemeralStore', () => {
  let testDir: string;
  let patternsDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ephemeral-store-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    patternsDir = join(testDir, 'patterns');
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('append() creates .ephemeral.jsonl and writes pattern envelope', async () => {
    const store = new EphemeralStore(patternsDir);
    const obs = makeObservation({ sessionId: 'append-test', tier: 'ephemeral' });

    await store.append(obs);

    const filePath = join(patternsDir, '.ephemeral.jsonl');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(1);

    const envelope = JSON.parse(lines[0]);
    expect(envelope.category).toBe('sessions');
    expect(envelope.timestamp).toBeTypeOf('number');
    expect(envelope.data.sessionId).toBe('append-test');
  });

  it('readAll() returns all observations from ephemeral file', async () => {
    const store = new EphemeralStore(patternsDir);

    await store.append(makeObservation({ sessionId: 'read-1', tier: 'ephemeral' }));
    await store.append(makeObservation({ sessionId: 'read-2', tier: 'ephemeral' }));

    const results = await store.readAll();
    expect(results).toHaveLength(2);
    expect(results[0].sessionId).toBe('read-1');
    expect(results[1].sessionId).toBe('read-2');
  });

  it('readAll() returns empty array when file does not exist', async () => {
    const store = new EphemeralStore(patternsDir);
    const results = await store.readAll();
    expect(results).toEqual([]);
  });

  it('clear() truncates the ephemeral file to empty', async () => {
    const store = new EphemeralStore(patternsDir);

    await store.append(makeObservation({ tier: 'ephemeral' }));
    await store.clear();

    const content = await readFile(join(patternsDir, '.ephemeral.jsonl'), 'utf-8');
    expect(content).toBe('');
  });

  it('clear() does not throw when file does not exist', async () => {
    const store = new EphemeralStore(patternsDir);
    await expect(store.clear()).resolves.not.toThrow();
  });

  it('getSize() returns number of entries in the ephemeral buffer', async () => {
    const store = new EphemeralStore(patternsDir);

    await store.append(makeObservation({ tier: 'ephemeral' }));
    await store.append(makeObservation({ tier: 'ephemeral' }));

    const size = await store.getSize();
    expect(size).toBe(2);
  });

  it('getSize() returns 0 when file does not exist', async () => {
    const store = new EphemeralStore(patternsDir);
    const size = await store.getSize();
    expect(size).toBe(0);
  });

  it('multiple appends accumulate in the file', async () => {
    const store = new EphemeralStore(patternsDir);

    await store.append(makeObservation({ sessionId: 'multi-1', tier: 'ephemeral' }));
    await store.append(makeObservation({ sessionId: 'multi-2', tier: 'ephemeral' }));
    await store.append(makeObservation({ sessionId: 'multi-3', tier: 'ephemeral' }));

    const results = await store.readAll();
    expect(results).toHaveLength(3);
    expect(results.map(r => r.sessionId)).toEqual(['multi-1', 'multi-2', 'multi-3']);
  });

  describe('cross-session tracking', () => {
    it('append() with sessionId stores session_id in envelope', async () => {
      const store = new EphemeralStore(patternsDir);
      const obs = makeObservation({ sessionId: 'cs-test', tier: 'ephemeral' });

      await store.append(obs, 'session-1');

      const filePath = join(patternsDir, '.ephemeral.jsonl');
      const content = await readFile(filePath, 'utf-8');
      const envelope = JSON.parse(content.trim());
      expect(envelope.session_id).toBe('session-1');
    });

    it('append() same observation pattern in different sessions tracks both session_ids', async () => {
      const store = new EphemeralStore(patternsDir);
      const obs1 = makeObservation({ sessionId: 's1', tier: 'ephemeral', topCommands: ['npm test'], topTools: ['Bash'] });
      const obs2 = makeObservation({ sessionId: 's2', tier: 'ephemeral', topCommands: ['npm test'], topTools: ['Bash'] });

      await store.append(obs1, 'session-1');
      await store.append(obs2, 'session-2');

      const counts = await store.getSessionCounts();
      // Both observations share the same pattern key (same topCommands + topTools)
      // So the pattern should have 2 distinct sessions
      const values = [...counts.values()];
      expect(values.some(v => v === 2)).toBe(true);
    });

    it('append() same session does NOT duplicate session_id in counts', async () => {
      const store = new EphemeralStore(patternsDir);
      const obs1 = makeObservation({ sessionId: 's1', tier: 'ephemeral', topCommands: ['npm test'], topTools: ['Bash'] });
      const obs2 = makeObservation({ sessionId: 's2', tier: 'ephemeral', topCommands: ['npm test'], topTools: ['Bash'] });

      await store.append(obs1, 'session-1');
      await store.append(obs2, 'session-1'); // same session

      const counts = await store.getSessionCounts();
      const values = [...counts.values()];
      // Same session_id should only count once
      expect(values.every(v => v === 1)).toBe(true);
    });

    it('getSessionCounts() returns distinct session count per pattern', async () => {
      const store = new EphemeralStore(patternsDir);
      // 3 observations with same pattern across 3 different sessions
      for (let i = 1; i <= 3; i++) {
        const obs = makeObservation({
          sessionId: `s${i}`,
          tier: 'ephemeral',
          topCommands: ['git status'],
          topTools: ['Read'],
        });
        await store.append(obs, `session-${i}`);
      }

      const counts = await store.getSessionCounts();
      const values = [...counts.values()];
      expect(values).toContain(3);
    });

    it('readAll() still returns valid observations with session tracking (backward compat)', async () => {
      const store = new EphemeralStore(patternsDir);
      const obs = makeObservation({ sessionId: 'compat-test', tier: 'ephemeral', topCommands: ['npm test'] });

      await store.append(obs, 'session-1');

      const results = await store.readAll();
      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('compat-test');
      expect(results[0].topCommands).toEqual(['npm test']);
    });
  });

  it('readAll() defaults missing tier to persistent (backward compat)', async () => {
    const store = new EphemeralStore(patternsDir);

    // Simulate old data by writing raw JSON without a tier field
    await mkdir(patternsDir, { recursive: true });
    const oldObs = {
      sessionId: 'old-data',
      startTime: Date.now() - 60000,
      endTime: Date.now(),
      durationMinutes: 1,
      source: 'startup',
      reason: 'logout',
      metrics: {
        userMessages: 1,
        assistantMessages: 1,
        toolCalls: 0,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
      topCommands: [],
      topFiles: [],
      topTools: [],
      activeSkills: [],
      // NOTE: no tier field
    };
    const envelope = { timestamp: Date.now(), category: 'sessions', data: oldObs };
    await writeFile(join(patternsDir, '.ephemeral.jsonl'), JSON.stringify(envelope) + '\n', 'utf-8');

    const results = await store.readAll();
    expect(results).toHaveLength(1);
    expect(results[0].tier).toBe('persistent');
  });
});

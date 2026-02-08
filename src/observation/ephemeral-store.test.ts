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

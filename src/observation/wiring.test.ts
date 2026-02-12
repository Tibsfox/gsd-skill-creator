import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { PatternStore } from '../storage/pattern-store.js';
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
      userMessages: 5,
      assistantMessages: 5,
      toolCalls: 3,
      uniqueFilesRead: 2,
      uniqueFilesWritten: 1,
      uniqueCommandsRun: 1,
    },
    topCommands: ['git status'],
    topFiles: ['src/index.ts'],
    topTools: ['Read'],
    activeSkills: [],
    ...overrides,
  };
}

describe('PatternStore checksum wiring', () => {
  let tmpDir: string;
  let patternsDir: string;

  beforeEach(async () => {
    tmpDir = await mkdir(join(tmpdir(), `wiring-ps-${Date.now()}-${Math.random().toString(36).slice(2)}`), { recursive: true }) as string;
    patternsDir = tmpDir;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('append() writes entries with _checksum field', async () => {
    const store = new PatternStore(patternsDir);
    await store.append('sessions', { command: 'test' });

    const filePath = join(patternsDir, 'sessions.jsonl');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(1);

    const entry = JSON.parse(lines[0]);
    expect(entry._checksum).toBeDefined();
    expect(typeof entry._checksum).toBe('string');
    expect(entry._checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('read() returns entries with valid checksums', async () => {
    const store = new PatternStore(patternsDir);
    await store.append('sessions', { command: 'test-1' });
    await store.append('sessions', { command: 'test-2' });

    const patterns = await store.read('sessions');
    expect(patterns.length).toBe(2);
  });

  it('read() skips tampered entries and logs warning', async () => {
    const store = new PatternStore(patternsDir);
    await store.append('sessions', { command: 'valid' });
    await store.append('sessions', { command: 'will-tamper' });

    // Tamper with the second entry
    const filePath = join(patternsDir, 'sessions.jsonl');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    const secondEntry = JSON.parse(lines[1]);
    secondEntry.data.command = 'tampered!';
    lines[1] = JSON.stringify(secondEntry);
    await writeFile(filePath, lines.join('\n') + '\n', 'utf-8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const patterns = await store.read('sessions');
    expect(patterns.length).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('read() skips entries with missing required fields', async () => {
    const store = new PatternStore(patternsDir);
    await store.append('sessions', { command: 'valid' });

    // Append a malformed line (missing timestamp)
    const filePath = join(patternsDir, 'sessions.jsonl');
    const malformedLine = JSON.stringify({ category: 'sessions', data: {} }) + '\n';
    await writeFile(filePath, (await readFile(filePath, 'utf-8')) + malformedLine, 'utf-8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const patterns = await store.read('sessions');
    expect(patterns.length).toBe(1);
    warnSpy.mockRestore();
  });
});

describe('EphemeralStore checksum wiring', () => {
  let tmpDir: string;
  let patternsDir: string;

  beforeEach(async () => {
    tmpDir = await mkdir(join(tmpdir(), `wiring-es-${Date.now()}-${Math.random().toString(36).slice(2)}`), { recursive: true }) as string;
    patternsDir = tmpDir;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('append() writes entries with _checksum field', async () => {
    const store = new EphemeralStore(patternsDir);
    const obs = makeObservation({ sessionId: 'checksum-test', tier: 'ephemeral' });
    await store.append(obs);

    const filePath = join(patternsDir, '.ephemeral.jsonl');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(1);

    const entry = JSON.parse(lines[0]);
    expect(entry._checksum).toBeDefined();
    expect(typeof entry._checksum).toBe('string');
    expect(entry._checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('readAll() skips tampered entries', async () => {
    const store = new EphemeralStore(patternsDir);
    await store.append(makeObservation({ sessionId: 'valid', tier: 'ephemeral' }));
    await store.append(makeObservation({ sessionId: 'will-tamper', tier: 'ephemeral' }));

    // Tamper with the second entry
    const filePath = join(patternsDir, '.ephemeral.jsonl');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    const secondEntry = JSON.parse(lines[1]);
    secondEntry.data.sessionId = 'tampered!';
    lines[1] = JSON.stringify(secondEntry);
    await writeFile(filePath, lines.join('\n') + '\n', 'utf-8');

    const results = await store.readAll();
    expect(results.length).toBe(1);
    expect(results[0].sessionId).toBe('valid');
  });
});

describe('SessionObserver rate limiting wiring', () => {
  let tmpDir: string;
  let patternsDir: string;
  let transcriptPath: string;

  beforeEach(async () => {
    tmpDir = await mkdir(join(tmpdir(), `wiring-so-${Date.now()}-${Math.random().toString(36).slice(2)}`), { recursive: true }) as string;
    patternsDir = join(tmpDir, 'patterns');
    transcriptPath = join(tmpDir, 'transcript.jsonl');
    await mkdir(patternsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('3rd onSessionEnd with same sessionId returns null when maxPerSession=2', async () => {
    // Dynamic import to test the modified constructor signature
    const { SessionObserver } = await import('./session-observer.js');
    const observer = new SessionObserver(patternsDir, undefined, { maxPerSession: 2, maxPerHour: 100 });

    // Create a non-trivial transcript for the session
    const transcriptEntries = [
      { uuid: '1', parentUuid: null, isSidechain: false, sessionId: 'rate-test', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg' } },
      { uuid: '2', parentUuid: '1', isSidechain: false, sessionId: 'rate-test', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/test.ts' } },
    ];
    await writeFile(transcriptPath, transcriptEntries.map(e => JSON.stringify(e)).join('\n') + '\n');

    const makeEndData = () => ({
      sessionId: 'rate-test',
      transcriptPath,
      cwd: tmpDir,
      reason: 'clear' as const,
    });

    // Cache start data for consistency
    await observer.onSessionStart({
      sessionId: 'rate-test',
      transcriptPath,
      cwd: tmpDir,
      source: 'startup',
      model: 'claude',
      startTime: Date.now() - 60000,
    });

    const result1 = await observer.onSessionEnd(makeEndData());
    expect(result1).not.toBeNull();

    // Need to re-create transcript and session cache for 2nd call
    await writeFile(transcriptPath, transcriptEntries.map(e => JSON.stringify(e)).join('\n') + '\n');
    await observer.onSessionStart({
      sessionId: 'rate-test',
      transcriptPath,
      cwd: tmpDir,
      source: 'startup',
      model: 'claude',
      startTime: Date.now() - 60000,
    });

    const result2 = await observer.onSessionEnd(makeEndData());
    expect(result2).not.toBeNull();

    // 3rd call should be rate limited
    await writeFile(transcriptPath, transcriptEntries.map(e => JSON.stringify(e)).join('\n') + '\n');
    await observer.onSessionStart({
      sessionId: 'rate-test',
      transcriptPath,
      cwd: tmpDir,
      source: 'startup',
      model: 'claude',
      startTime: Date.now() - 60000,
    });

    const result3 = await observer.onSessionEnd(makeEndData());
    expect(result3).toBeNull();
  });
});

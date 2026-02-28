/**
 * Tests for PopStackAwareness -- session-aware pop operations.
 *
 * Validates three awareness behaviors:
 * 1. Pause respect: refuse to pop when session is paused/stopped/saved
 * 2. Heartbeat touch: update heartbeat mtime on every check()
 * 3. Recording marker: append marker to stream.jsonl after successful pop
 *
 * Uses real filesystem via temporary directories for test isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  PopStackAwareness,
  type PopStackConfig,
  type PopStackResult,
} from '../../../src/chipset/integration/pop-stack-awareness.js';

// ============================================================================
// Test Setup -- temporary filesystem
// ============================================================================

let stackDir: string;
let awareness: PopStackAwareness;

beforeEach(async () => {
  stackDir = await mkdtemp(join(tmpdir(), 'pop-stack-test-'));
  await mkdir(join(stackDir, 'sessions'), { recursive: true });
  await mkdir(join(stackDir, 'recordings'), { recursive: true });
});

afterEach(async () => {
  await rm(stackDir, { recursive: true, force: true });
});

// ============================================================================
// Helper functions
// ============================================================================

async function createSession(
  name: string,
  status: string,
  includeHeartbeat = true,
): Promise<string> {
  const sessionDir = join(stackDir, 'sessions', name);
  await mkdir(sessionDir, { recursive: true });
  await writeFile(
    join(sessionDir, 'meta.json'),
    JSON.stringify({ name, status, started: Date.now() }),
  );
  if (includeHeartbeat) {
    await writeFile(join(sessionDir, 'heartbeat'), '');
  }
  return sessionDir;
}

async function createRecording(
  name: string,
  status: string,
): Promise<string> {
  const recordingDir = join(stackDir, 'recordings', name);
  await mkdir(recordingDir, { recursive: true });
  await writeFile(
    join(recordingDir, 'meta.json'),
    JSON.stringify({ name, status }),
  );
  // Create empty stream.jsonl
  await writeFile(join(recordingDir, 'stream.jsonl'), '');
  return recordingDir;
}

// ============================================================================
// PopStackAwareness -- pause respect
// ============================================================================

describe('PopStackAwareness -- pause respect', () => {
  it('refuses pop when session is paused', async () => {
    await createSession('my-session', 'paused');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('paused');
    expect(result.reason).toContain('Resume');
  });

  it('refuses pop when session is stopped', async () => {
    await createSession('my-session', 'stopped');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('stopped');
  });

  it('refuses pop when session is saved', async () => {
    await createSession('my-session', 'saved');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('saved');
  });

  it('allows pop when session is active', async () => {
    await createSession('my-session', 'active');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('allows pop when session is stalled', async () => {
    await createSession('my-session', 'stalled');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
  });

  it('allows pop when no session directory exists', async () => {
    awareness = new PopStackAwareness({ stackDir, sessionName: 'nonexistent' });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
    expect(result.heartbeatTouched).toBe(false);
  });

  it('allows pop when meta.json is missing', async () => {
    const sessionDir = join(stackDir, 'sessions', 'my-session');
    await mkdir(sessionDir, { recursive: true });
    // No meta.json written
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
  });

  it('allows pop when meta.json has invalid JSON', async () => {
    const sessionDir = join(stackDir, 'sessions', 'my-session');
    await mkdir(sessionDir, { recursive: true });
    await writeFile(join(sessionDir, 'meta.json'), 'not-json{{{');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    // Fail-open: invalid meta.json -> allow pop
    expect(result.allowed).toBe(true);
  });
});

// ============================================================================
// PopStackAwareness -- auto-detect session
// ============================================================================

describe('PopStackAwareness -- auto-detect session', () => {
  it('auto-detects active session when sessionName not provided', async () => {
    await createSession('detected-session', 'active');
    awareness = new PopStackAwareness({ stackDir });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
    expect(result.heartbeatTouched).toBe(true);
  });

  it('auto-detects paused session and refuses pop', async () => {
    await createSession('paused-session', 'paused');
    awareness = new PopStackAwareness({ stackDir });

    const result = await awareness.check();

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('paused');
  });

  it('allows pop when no sessions exist at all', async () => {
    awareness = new PopStackAwareness({ stackDir });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
    expect(result.heartbeatTouched).toBe(false);
  });
});

// ============================================================================
// PopStackAwareness -- heartbeat touch
// ============================================================================

describe('PopStackAwareness -- heartbeat touch', () => {
  it('touches heartbeat file on check (updates mtime)', async () => {
    await createSession('my-session', 'active');
    const heartbeatPath = join(stackDir, 'sessions', 'my-session', 'heartbeat');

    // Set heartbeat to an old timestamp
    const oldTime = new Date('2020-01-01');
    const { utimes } = await import('node:fs/promises');
    await utimes(heartbeatPath, oldTime, oldTime);

    const before = (await stat(heartbeatPath)).mtimeMs;

    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });
    const result = await awareness.check();

    const after = (await stat(heartbeatPath)).mtimeMs;

    expect(result.heartbeatTouched).toBe(true);
    expect(after).toBeGreaterThan(before);
  });

  it('touches heartbeat even when pop is refused (paused)', async () => {
    await createSession('my-session', 'paused');
    const heartbeatPath = join(stackDir, 'sessions', 'my-session', 'heartbeat');

    const oldTime = new Date('2020-01-01');
    const { utimes } = await import('node:fs/promises');
    await utimes(heartbeatPath, oldTime, oldTime);

    const before = (await stat(heartbeatPath)).mtimeMs;

    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });
    const result = await awareness.check();

    const after = (await stat(heartbeatPath)).mtimeMs;

    expect(result.allowed).toBe(false);
    expect(result.heartbeatTouched).toBe(true);
    expect(after).toBeGreaterThan(before);
  });

  it('skips heartbeat when heartbeat file does not exist', async () => {
    await createSession('my-session', 'active', false); // no heartbeat file
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
    expect(result.heartbeatTouched).toBe(false);
  });

  it('skips heartbeat when session directory does not exist', async () => {
    awareness = new PopStackAwareness({ stackDir, sessionName: 'nonexistent' });

    const result = await awareness.check();

    expect(result.heartbeatTouched).toBe(false);
  });
});

// ============================================================================
// PopStackAwareness -- recording marker
// ============================================================================

describe('PopStackAwareness -- recording marker', () => {
  it('writes marker to stream.jsonl when recording is active', async () => {
    const recordingDir = await createRecording('rec-001', 'recording');
    awareness = new PopStackAwareness({ stackDir });

    const written = await awareness.recordPop('This is my test message for the recording');

    expect(written).toBe(true);

    const stream = await readFile(join(recordingDir, 'stream.jsonl'), 'utf-8');
    const lines = stream.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);

    const marker = JSON.parse(lines[0]);
    expect(marker.type).toBe('marker');
    expect(marker.label).toContain('pop-stack:');
    expect(marker.label).toContain('This is my test message');
    expect(marker.ts).toBeDefined();
  });

  it('truncates message to 50 chars in marker label', async () => {
    await createRecording('rec-002', 'recording');
    awareness = new PopStackAwareness({ stackDir });

    const longMessage = 'A'.repeat(100);
    await awareness.recordPop(longMessage);

    const recordingDir = join(stackDir, 'recordings', 'rec-002');
    const stream = await readFile(join(recordingDir, 'stream.jsonl'), 'utf-8');
    const marker = JSON.parse(stream.trim());

    // Label should be "pop-stack: " + first 50 chars
    expect(marker.label.length).toBeLessThanOrEqual('pop-stack: '.length + 50);
  });

  it('returns false when no recording is active', async () => {
    await createRecording('rec-003', 'stopped');
    awareness = new PopStackAwareness({ stackDir });

    const written = await awareness.recordPop('Some message');

    expect(written).toBe(false);
  });

  it('returns false when no recordings directory content exists', async () => {
    awareness = new PopStackAwareness({ stackDir });

    const written = await awareness.recordPop('Some message');

    expect(written).toBe(false);
  });

  it('returns false when stream.jsonl is missing', async () => {
    const recordingDir = join(stackDir, 'recordings', 'rec-004');
    await mkdir(recordingDir, { recursive: true });
    await writeFile(
      join(recordingDir, 'meta.json'),
      JSON.stringify({ name: 'rec-004', status: 'recording' }),
    );
    // No stream.jsonl created
    awareness = new PopStackAwareness({ stackDir });

    // Should still write (appendFile creates if missing) or handle gracefully
    const written = await awareness.recordPop('Some message');

    // appendFile creates the file if it doesn't exist, so this should succeed
    expect(written).toBe(true);
  });
});

// ============================================================================
// PopStackAwareness -- getSessionState
// ============================================================================

describe('PopStackAwareness -- getSessionState', () => {
  it('returns session status when session exists', async () => {
    await createSession('my-session', 'active');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const state = await awareness.getSessionState();

    expect(state).toBe('active');
  });

  it('returns null when session does not exist', async () => {
    awareness = new PopStackAwareness({ stackDir, sessionName: 'nonexistent' });

    const state = await awareness.getSessionState();

    expect(state).toBeNull();
  });

  it('returns null when meta.json is invalid', async () => {
    const sessionDir = join(stackDir, 'sessions', 'my-session');
    await mkdir(sessionDir, { recursive: true });
    await writeFile(join(sessionDir, 'meta.json'), '{{invalid}}');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const state = await awareness.getSessionState();

    expect(state).toBeNull();
  });
});

// ============================================================================
// PopStackAwareness -- combined scenarios
// ============================================================================

describe('PopStackAwareness -- combined scenarios', () => {
  it('active session + active recording: allowed, heartbeat, marker', async () => {
    await createSession('my-session', 'active');
    const recordingDir = await createRecording('rec-combined', 'recording');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const checkResult = await awareness.check();
    expect(checkResult.allowed).toBe(true);
    expect(checkResult.heartbeatTouched).toBe(true);
    expect(checkResult.markerWritten).toBe(false); // check() doesn't write markers

    const popResult = await awareness.recordPop('Combined test message');
    expect(popResult).toBe(true);

    const stream = await readFile(join(recordingDir, 'stream.jsonl'), 'utf-8');
    expect(stream.trim()).not.toBe('');
  });

  it('active session + no recording: allowed, heartbeat, no marker', async () => {
    await createSession('my-session', 'active');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const checkResult = await awareness.check();
    expect(checkResult.allowed).toBe(true);
    expect(checkResult.heartbeatTouched).toBe(true);

    const popResult = await awareness.recordPop('No recording active');
    expect(popResult).toBe(false);
  });

  it('paused session: refused, heartbeat touched, no marker attempt', async () => {
    await createSession('my-session', 'paused');
    awareness = new PopStackAwareness({ stackDir, sessionName: 'my-session' });

    const checkResult = await awareness.check();
    expect(checkResult.allowed).toBe(false);
    expect(checkResult.heartbeatTouched).toBe(true);
    expect(checkResult.markerWritten).toBe(false);
  });
});

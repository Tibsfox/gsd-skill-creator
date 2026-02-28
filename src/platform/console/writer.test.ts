/**
 * Tests for MessageWriter -- validates envelope writing to filesystem.
 *
 * Uses temp directories for isolation. Each test gets a fresh directory
 * with the full console directory structure created by ensureConsoleDirectory.
 *
 * @module console/writer.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MessageWriter } from './writer.js';
import { ensureConsoleDirectory } from './directory.js';
import { CONSOLE_DIRS } from './types.js';
import type { MessageEnvelope } from './types.js';

describe('MessageWriter', () => {
  let tmpDir: string;
  let writer: MessageWriter;

  const validEnvelope: MessageEnvelope = {
    id: 'msg-20260213-001',
    type: 'milestone-submit',
    timestamp: '2026-02-13T14:30:00Z',
    source: 'dashboard',
    payload: { name: 'v2.0' },
  };

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'writer-test-'));
    await ensureConsoleDirectory(tmpDir);
    writer = new MessageWriter(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a valid message to inbox/pending/', async () => {
    await writer.write(validEnvelope);

    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const files = readdirSync(pendingDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.json$/);

    const content = JSON.parse(readFileSync(join(pendingDir, files[0]), 'utf-8'));
    expect(content.id).toBe('msg-20260213-001');
    expect(content.type).toBe('milestone-submit');
    expect(content.timestamp).toBe('2026-02-13T14:30:00Z');
    expect(content.source).toBe('dashboard');
    expect(content.payload).toEqual({ name: 'v2.0' });
  });

  it('file name follows timestamp-type pattern', async () => {
    const envelope: MessageEnvelope = {
      ...validEnvelope,
      type: 'config-update',
    };
    await writer.write(envelope);

    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const files = readdirSync(pendingDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^\d+-config-update\.json$/);
  });

  it('rejects invalid envelope', async () => {
    await expect(writer.write({ id: 'bad' })).rejects.toThrow();

    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const files = readdirSync(pendingDir);
    expect(files).toHaveLength(0);
  });

  it('rejects envelope with missing fields', async () => {
    await expect(writer.write({})).rejects.toThrow();
    await expect(writer.write({ id: 'msg-20260213-001' })).rejects.toThrow();
  });

  it('writes to outbox when source is session', async () => {
    const sessionEnvelope: MessageEnvelope = {
      id: 'msg-20260213-002',
      type: 'question-response',
      timestamp: '2026-02-13T14:31:00Z',
      source: 'session',
      payload: { answer: 'yes' },
    };
    await writer.write(sessionEnvelope);

    // Should NOT be in inbox/pending
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const pendingFiles = readdirSync(pendingDir);
    expect(pendingFiles).toHaveLength(0);

    // Should be in outbox/questions (question-response type)
    const questionsDir = join(tmpDir, CONSOLE_DIRS.outboxQuestions);
    const questionFiles = readdirSync(questionsDir);
    expect(questionFiles).toHaveLength(1);
    expect(questionFiles[0]).toMatch(/\.json$/);
  });

  it('creates directory if not exists', async () => {
    // Remove the pending directory
    rmSync(join(tmpDir, CONSOLE_DIRS.inboxPending), { recursive: true, force: true });

    // Should still succeed (writer ensures directory exists)
    const filePath = await writer.write(validEnvelope);
    expect(filePath).toBeTruthy();

    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const files = readdirSync(pendingDir);
    expect(files).toHaveLength(1);
  });

  it('returns the written file path', async () => {
    const filePath = await writer.write(validEnvelope);

    expect(filePath).toBeTruthy();
    expect(typeof filePath).toBe('string');
    // Should be an absolute path
    expect(filePath.startsWith('/')).toBe(true);
    // Should be a JSON file
    expect(filePath).toMatch(/\.json$/);
    // File should exist and contain valid JSON
    const content = readFileSync(filePath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });
});

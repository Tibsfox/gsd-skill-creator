/**
 * Tests for MessageReader -- validates reading and acknowledging messages.
 *
 * Uses temp directories for isolation. Each test gets a fresh directory
 * with the full console directory structure created by ensureConsoleDirectory.
 *
 * @module console/reader.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MessageReader } from './reader.js';
import { MessageWriter } from './writer.js';
import { ensureConsoleDirectory } from './directory.js';
import { CONSOLE_DIRS } from './types.js';
import type { MessageEnvelope } from './types.js';

describe('MessageReader', () => {
  let tmpDir: string;
  let reader: MessageReader;

  const makeEnvelope = (seq: number, overrides: Partial<MessageEnvelope> = {}): MessageEnvelope => ({
    id: `msg-20260213-${String(seq).padStart(3, '0')}`,
    type: 'milestone-submit',
    timestamp: '2026-02-13T14:30:00Z',
    source: 'dashboard',
    payload: { seq },
    ...overrides,
  });

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'reader-test-'));
    await ensureConsoleDirectory(tmpDir);
    reader = new MessageReader(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads pending messages', async () => {
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    writeFileSync(
      join(pendingDir, '1000-milestone-submit.json'),
      JSON.stringify(makeEnvelope(1)),
    );
    writeFileSync(
      join(pendingDir, '2000-config-update.json'),
      JSON.stringify(makeEnvelope(2, { type: 'config-update' })),
    );

    const messages = await reader.readPending();
    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe('msg-20260213-001');
    expect(messages[1].id).toBe('msg-20260213-002');
  });

  it('returns empty array when no pending messages', async () => {
    const messages = await reader.readPending();
    expect(messages).toEqual([]);
  });

  it('moves messages from pending to acknowledged', async () => {
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const ackDir = join(tmpDir, CONSOLE_DIRS.inboxAcknowledged);
    const filename = '1000-milestone-submit.json';

    writeFileSync(
      join(pendingDir, filename),
      JSON.stringify(makeEnvelope(1)),
    );

    await reader.readPending();

    // No longer in pending
    expect(existsSync(join(pendingDir, filename))).toBe(false);
    // Now in acknowledged
    expect(existsSync(join(ackDir, filename))).toBe(true);
  });

  it('acknowledged message has same content', async () => {
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const ackDir = join(tmpDir, CONSOLE_DIRS.inboxAcknowledged);
    const filename = '1000-milestone-submit.json';
    const envelope = makeEnvelope(1);

    writeFileSync(join(pendingDir, filename), JSON.stringify(envelope));

    await reader.readPending();

    const ackContent = JSON.parse(readFileSync(join(ackDir, filename), 'utf-8'));
    expect(ackContent).toEqual(envelope);
  });

  it('does not re-read acknowledged messages', async () => {
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    writeFileSync(
      join(pendingDir, '1000-milestone-submit.json'),
      JSON.stringify(makeEnvelope(1)),
    );

    const first = await reader.readPending();
    expect(first).toHaveLength(1);

    const second = await reader.readPending();
    expect(second).toHaveLength(0);
  });

  it('skips malformed JSON files', async () => {
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    const ackDir = join(tmpDir, CONSOLE_DIRS.inboxAcknowledged);
    const filename = '1000-bad-data.json';

    writeFileSync(join(pendingDir, filename), 'this is not valid JSON {{{{');

    const messages = await reader.readPending();
    expect(messages).toEqual([]);

    // Malformed file should be moved to acknowledged to prevent retry loops
    expect(existsSync(join(ackDir, filename))).toBe(true);
    expect(existsSync(join(pendingDir, filename))).toBe(false);
  });

  it('skips non-JSON files', async () => {
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);
    writeFileSync(join(pendingDir, 'notes.txt'), 'some text file');

    const messages = await reader.readPending();
    expect(messages).toEqual([]);
  });

  it('roundtrip: writer -> reader preserves all fields', async () => {
    const writer = new MessageWriter(tmpDir);
    const envelope = makeEnvelope(42, {
      type: 'config-update',
      timestamp: '2026-02-13T15:00:00Z',
      payload: { key: 'theme', value: 'dark', nested: { deep: true } },
    });

    await writer.write(envelope);
    const messages = await reader.readPending();

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(envelope);
  });

  it('reads messages in chronological order', async () => {
    const pendingDir = join(tmpDir, CONSOLE_DIRS.inboxPending);

    // Write in reverse order to verify sorting
    writeFileSync(
      join(pendingDir, '3000-milestone-submit.json'),
      JSON.stringify(makeEnvelope(3)),
    );
    writeFileSync(
      join(pendingDir, '1000-milestone-submit.json'),
      JSON.stringify(makeEnvelope(1)),
    );
    writeFileSync(
      join(pendingDir, '2000-milestone-submit.json'),
      JSON.stringify(makeEnvelope(2)),
    );

    const messages = await reader.readPending();
    expect(messages).toHaveLength(3);
    expect(messages[0].payload).toEqual({ seq: 1 });
    expect(messages[1].payload).toEqual({ seq: 2 });
    expect(messages[2].payload).toEqual({ seq: 3 });
  });
});

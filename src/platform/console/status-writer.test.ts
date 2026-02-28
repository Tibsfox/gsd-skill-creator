/**
 * Tests for StatusWriter -- writes session status to outbox.
 *
 * Uses temp directories for filesystem isolation. Each test gets a
 * fresh directory to avoid cross-test contamination.
 *
 * @module console/status-writer.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StatusWriter } from './status-writer.js';
import { CONSOLE_DIRS } from './types.js';

describe('StatusWriter', () => {
  let tmpDir: string;
  let writer: StatusWriter;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'status-writer-test-'));
    writer = new StatusWriter(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writeStatus creates outbox/status/current.json', async () => {
    await writer.writeStatus('130', '03', 'executing', 0.5);

    const statusPath = join(tmpDir, CONSOLE_DIRS.outboxStatus, 'current.json');
    expect(existsSync(statusPath)).toBe(true);
  });

  it('current.json contains phase, plan, status, progress, and updated_at fields', async () => {
    await writer.writeStatus('130', '03', 'executing', 0.75);

    const statusPath = join(tmpDir, CONSOLE_DIRS.outboxStatus, 'current.json');
    const data = JSON.parse(readFileSync(statusPath, 'utf-8'));

    expect(data).toHaveProperty('phase', '130');
    expect(data).toHaveProperty('plan', '03');
    expect(data).toHaveProperty('status', 'executing');
    expect(data).toHaveProperty('progress', 0.75);
    expect(data).toHaveProperty('updated_at');
  });

  it('progress is a number type in JSON', async () => {
    await writer.writeStatus('130', '03', 'executing', 0.42);

    const statusPath = join(tmpDir, CONSOLE_DIRS.outboxStatus, 'current.json');
    const data = JSON.parse(readFileSync(statusPath, 'utf-8'));

    expect(typeof data.progress).toBe('number');
    expect(data.progress).toBe(0.42);
  });

  it('overwrites existing current.json (not append)', async () => {
    await writer.writeStatus('130', '01', 'planning', 0.1);
    await writer.writeStatus('130', '03', 'executing', 0.9);

    const statusPath = join(tmpDir, CONSOLE_DIRS.outboxStatus, 'current.json');
    const data = JSON.parse(readFileSync(statusPath, 'utf-8'));

    // Should contain second write, not first
    expect(data.plan).toBe('03');
    expect(data.status).toBe('executing');
    expect(data.progress).toBe(0.9);
  });

  it('creates outbox/status/ directory if missing', async () => {
    const statusDir = join(tmpDir, CONSOLE_DIRS.outboxStatus);
    expect(existsSync(statusDir)).toBe(false);

    await writer.writeStatus('130', '03', 'executing', 0.5);

    expect(existsSync(statusDir)).toBe(true);
  });

  it('updated_at is a valid ISO 8601 timestamp', async () => {
    await writer.writeStatus('130', '03', 'executing', 0.5);

    const statusPath = join(tmpDir, CONSOLE_DIRS.outboxStatus, 'current.json');
    const data = JSON.parse(readFileSync(statusPath, 'utf-8'));

    // Should be parseable as a date
    const parsed = Date.parse(data.updated_at);
    expect(isNaN(parsed)).toBe(false);

    // Should match ISO format pattern
    expect(data.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('status field matches the input exactly', async () => {
    await writer.writeStatus('130', '03', 'complete', 1.0);

    const statusPath = join(tmpDir, CONSOLE_DIRS.outboxStatus, 'current.json');
    const data = JSON.parse(readFileSync(statusPath, 'utf-8'));

    expect(data.status).toBe('complete');
  });

  it('constructor accepts basePath string', () => {
    const w = new StatusWriter('/some/path');
    expect(w).toBeInstanceOf(StatusWriter);
  });
});

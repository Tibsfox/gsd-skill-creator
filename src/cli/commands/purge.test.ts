import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { purgeCommand } from './purge.js';
import { createChecksummedEntry } from '../../validation/jsonl-safety.js';

function makeEntry(overrides: { timestamp?: number; category?: string; data?: Record<string, unknown> } = {}) {
  return createChecksummedEntry({
    timestamp: overrides.timestamp ?? Date.now(),
    category: overrides.category ?? 'sessions',
    data: overrides.data ?? { sessionId: 's1', command: 'test' },
  });
}

describe('purgeCommand', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdir(join(tmpdir(), `purge-test-${Date.now()}-${Math.random().toString(36).slice(2)}`), { recursive: true }) as string;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('--help prints help text and returns 0', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await purgeCommand(['--help']);
    expect(exitCode).toBe(0);
    const output = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('purge');
    expect(output).toContain('--dry-run');
    logSpy.mockRestore();
  });

  it('compacts all known JSONL files and returns 0', async () => {
    // Create a sessions.jsonl with 2 valid entries
    const entries = [
      makeEntry({ timestamp: Date.now() - 1000 }),
      makeEntry({ timestamp: Date.now() - 2000 }),
    ];
    await writeFile(
      join(tmpDir, 'sessions.jsonl'),
      entries.map(e => JSON.stringify(e)).join('\n') + '\n',
      'utf-8',
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await purgeCommand([`--patterns-dir=${tmpDir}`]);
    expect(exitCode).toBe(0);

    // Parse JSON output
    const output = logSpy.mock.calls.map(c => c[0]).join('');
    const result = JSON.parse(output);
    expect(result.totals).toBeDefined();
    expect(result.totals.retained).toBeGreaterThanOrEqual(2);
    logSpy.mockRestore();
  });

  it('--dry-run reports what would be cleaned without modifying files', async () => {
    const now = Date.now();
    const oldTimestamp = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago

    const entries = [
      makeEntry({ timestamp: now - 1000 }),
      makeEntry({ timestamp: now - 2000 }),
      makeEntry({ timestamp: oldTimestamp }),
    ];
    await writeFile(
      join(tmpDir, 'sessions.jsonl'),
      entries.map(e => JSON.stringify(e)).join('\n') + '\n',
      'utf-8',
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await purgeCommand([`--patterns-dir=${tmpDir}`, '--dry-run', '--max-age=1']);
    expect(exitCode).toBe(0);

    // File should be unchanged (still 3 entries)
    const afterContent = await readFile(join(tmpDir, 'sessions.jsonl'), 'utf-8');
    const afterLines = afterContent.trim().split('\n');
    expect(afterLines.length).toBe(3);

    // Output should indicate dry_run: true
    const output = logSpy.mock.calls.map(c => c[0]).join('');
    const result = JSON.parse(output);
    expect(result.dry_run).toBe(true);
    logSpy.mockRestore();
  });

  it('--max-age=1 removes entries older than 1 day', async () => {
    const now = Date.now();
    const oldTimestamp = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago

    const entries = [
      makeEntry({ timestamp: now - 1000 }),
      makeEntry({ timestamp: now - 2000 }),
      makeEntry({ timestamp: oldTimestamp }),
    ];
    await writeFile(
      join(tmpDir, 'sessions.jsonl'),
      entries.map(e => JSON.stringify(e)).join('\n') + '\n',
      'utf-8',
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await purgeCommand([`--patterns-dir=${tmpDir}`, '--max-age=1']);
    expect(exitCode).toBe(0);

    // File should have 2 entries (1 expired removed)
    const afterContent = await readFile(join(tmpDir, 'sessions.jsonl'), 'utf-8');
    const afterLines = afterContent.trim().split('\n');
    expect(afterLines.length).toBe(2);

    const output = logSpy.mock.calls.map(c => c[0]).join('');
    const result = JSON.parse(output);
    expect(result.totals.removed).toBe(1);
    expect(result.totals.retained).toBe(2);
    logSpy.mockRestore();
  });

  it('--patterns-dir targets the specified directory', async () => {
    const customDir = join(tmpDir, 'custom-patterns');
    await mkdir(customDir, { recursive: true });
    await writeFile(
      join(customDir, 'sessions.jsonl'),
      JSON.stringify(makeEntry()) + '\n',
      'utf-8',
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await purgeCommand([`--patterns-dir=${customDir}`]);
    expect(exitCode).toBe(0);

    const output = logSpy.mock.calls.map(c => c[0]).join('');
    const result = JSON.parse(output);
    expect(result.files.some((f: { path: string }) => f.path === 'sessions.jsonl')).toBe(true);
    logSpy.mockRestore();
  });

  it('output has correct JSON structure with files and totals', async () => {
    await writeFile(
      join(tmpDir, 'sessions.jsonl'),
      JSON.stringify(makeEntry()) + '\n',
      'utf-8',
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await purgeCommand([`--patterns-dir=${tmpDir}`]);
    expect(exitCode).toBe(0);

    const output = logSpy.mock.calls.map(c => c[0]).join('');
    const result = JSON.parse(output);

    // Validate structure
    expect(result.files).toBeInstanceOf(Array);
    expect(result.totals).toHaveProperty('retained');
    expect(result.totals).toHaveProperty('removed');
    expect(result.totals).toHaveProperty('malformed');
    expect(result.totals).toHaveProperty('tampered');
    expect(typeof result.dry_run).toBe('boolean');
    logSpy.mockRestore();
  });
});

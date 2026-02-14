/**
 * Tests for the queue audit logger.
 *
 * Verifies append-only JSONL writing, reading with error resilience,
 * directory auto-creation, and DI interface.
 *
 * @module staging/queue/audit-logger.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appendAuditEntry, readAuditLog, _resetDirCache } from './audit-logger.js';
import type { AuditLoggerDeps } from './audit-logger.js';
import type { QueueAuditEntry } from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeAuditEntry(overrides: Partial<QueueAuditEntry> = {}): QueueAuditEntry {
  return {
    id: 'audit-20240101-120000-001',
    entryId: 'q-20240101-001',
    action: 'transition',
    fromState: 'uploaded',
    toState: 'checking',
    actor: 'system',
    rationale: 'Auto-transition after upload',
    timestamp: '2024-01-01T12:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Mock deps
// ============================================================================

function makeMockDeps(fileContents: string = ''): AuditLoggerDeps & {
  written: string[];
} {
  const written: string[] = [];
  return {
    written,
    appendFile: vi.fn(async (_path: string, data: string) => {
      written.push(data);
    }),
    readFile: vi.fn(async () => fileContents),
    mkdir: vi.fn(async () => undefined),
  };
}

// ============================================================================
// appendAuditEntry
// ============================================================================

describe('appendAuditEntry', () => {
  beforeEach(() => {
    _resetDirCache();
  });

  it('appends one JSON line to queue.jsonl', async () => {
    const deps = makeMockDeps();
    const entry = makeAuditEntry();

    await appendAuditEntry(entry, { basePath: '/project' }, deps);

    expect(deps.appendFile).toHaveBeenCalledTimes(1);
    const writtenData = deps.written[0];
    expect(writtenData).toContain('"audit-20240101-120000-001"');
    expect(writtenData.endsWith('\n')).toBe(true);
  });

  it('writes valid JSON per line', async () => {
    const deps = makeMockDeps();
    const entry = makeAuditEntry();

    await appendAuditEntry(entry, { basePath: '/project' }, deps);

    const line = deps.written[0].trim();
    const parsed = JSON.parse(line);
    expect(parsed.id).toBe('audit-20240101-120000-001');
    expect(parsed.entryId).toBe('q-20240101-001');
  });

  it('multiple appends produce multiple lines', async () => {
    const deps = makeMockDeps();
    const entry1 = makeAuditEntry({ id: 'audit-20240101-120000-001' });
    const entry2 = makeAuditEntry({ id: 'audit-20240101-120000-002' });

    await appendAuditEntry(entry1, { basePath: '/project' }, deps);
    await appendAuditEntry(entry2, { basePath: '/project' }, deps);

    expect(deps.appendFile).toHaveBeenCalledTimes(2);
    expect(deps.written).toHaveLength(2);
  });

  it('auto-creates directory if it does not exist', async () => {
    const deps = makeMockDeps();
    const entry = makeAuditEntry();

    await appendAuditEntry(entry, { basePath: '/project' }, deps);

    expect(deps.mkdir).toHaveBeenCalled();
  });

  it('caches directory creation (only calls mkdir once)', async () => {
    const deps = makeMockDeps();
    const entry1 = makeAuditEntry({ id: 'audit-20240101-120000-001' });
    const entry2 = makeAuditEntry({ id: 'audit-20240101-120000-002' });

    await appendAuditEntry(entry1, { basePath: '/project' }, deps);
    await appendAuditEntry(entry2, { basePath: '/project' }, deps);

    // mkdir called only once due to caching
    expect(deps.mkdir).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// readAuditLog
// ============================================================================

describe('readAuditLog', () => {
  it('reads all entries from queue.jsonl', async () => {
    const entry1 = makeAuditEntry({ id: 'audit-20240101-120000-001' });
    const entry2 = makeAuditEntry({ id: 'audit-20240101-120000-002' });
    const fileContent =
      JSON.stringify(entry1) + '\n' + JSON.stringify(entry2) + '\n';
    const deps = makeMockDeps(fileContent);

    const result = await readAuditLog({ basePath: '/project' }, deps);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('audit-20240101-120000-001');
    expect(result[1].id).toBe('audit-20240101-120000-002');
  });

  it('returns QueueAuditEntry[] that round-trips through JSON', async () => {
    const entry = makeAuditEntry();
    const fileContent = JSON.stringify(entry) + '\n';
    const deps = makeMockDeps(fileContent);

    const result = await readAuditLog({ basePath: '/project' }, deps);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(entry);
  });

  it('returns empty array for nonexistent file (ENOENT)', async () => {
    const deps = makeMockDeps();
    deps.readFile = vi.fn(async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      throw error;
    });

    const result = await readAuditLog({ basePath: '/project' }, deps);

    expect(result).toEqual([]);
  });

  it('returns empty array for empty file', async () => {
    const deps = makeMockDeps('');

    const result = await readAuditLog({ basePath: '/project' }, deps);

    expect(result).toEqual([]);
  });

  it('skips malformed lines and calls onError callback', async () => {
    const goodEntry = makeAuditEntry({ id: 'audit-good' });
    const fileContent =
      JSON.stringify(goodEntry) + '\n' + 'NOT-VALID-JSON\n' + '\n';
    const deps = makeMockDeps(fileContent);
    const onError = vi.fn();

    const result = await readAuditLog(
      { basePath: '/project', onError },
      deps,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('audit-good');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('NOT-VALID-JSON', expect.any(Error));
  });

  it('skips malformed lines without throwing when no onError provided', async () => {
    const goodEntry = makeAuditEntry({ id: 'audit-good' });
    const fileContent =
      JSON.stringify(goodEntry) + '\n' + '{bad json\n';
    const deps = makeMockDeps(fileContent);

    const result = await readAuditLog({ basePath: '/project' }, deps);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('audit-good');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock node:fs/promises before importing module under test
// ---------------------------------------------------------------------------

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}));

// Import after mocks are set up
import { collectStagingQueue } from './staging-collector.js';
import type { QueueEntry } from '../../staging/queue/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a valid QueueEntry for testing. */
function buildEntry(id: string, overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id,
    filename: `${id}.md`,
    state: 'ready',
    milestoneName: `Milestone ${id}`,
    domain: 'testing',
    tags: ['test'],
    resourceManifestPath: `.planning/staging/ready/${id}.manifest.json`,
    createdAt: '2026-02-14T00:00:00Z',
    updatedAt: '2026-02-14T00:00:00Z',
    ...overrides,
  };
}

/** Create an ENOENT error. */
function makeEnoent(path: string): NodeJS.ErrnoException {
  const err = new Error(
    `ENOENT: no such file or directory, open '${path}'`,
  ) as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('collectStagingQueue', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. No queue-state.json file -> empty result
  // -------------------------------------------------------------------------
  it('returns empty result when queue-state.json does not exist', async () => {
    mockReadFile.mockRejectedValue(makeEnoent('queue-state.json'));

    const result = await collectStagingQueue();

    expect(result.entries).toEqual([]);
    expect(result.dependencies).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 2. Empty JSON array -> empty result
  // -------------------------------------------------------------------------
  it('returns empty result for empty JSON array', async () => {
    mockReadFile.mockResolvedValue('[]');

    const result = await collectStagingQueue();

    expect(result.entries).toEqual([]);
    expect(result.dependencies).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 3. Valid QueueEntry[] -> populated entries, empty dependencies
  // -------------------------------------------------------------------------
  it('returns entries from valid queue-state.json', async () => {
    const entries = [
      buildEntry('q-20260214-001', { state: 'uploaded' }),
      buildEntry('q-20260214-002', { state: 'ready' }),
    ];
    mockReadFile.mockResolvedValue(JSON.stringify(entries));

    const result = await collectStagingQueue();

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].id).toBe('q-20260214-001');
    expect(result.entries[0].state).toBe('uploaded');
    expect(result.entries[1].id).toBe('q-20260214-002');
    expect(result.entries[1].state).toBe('ready');
    expect(result.dependencies).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 4. Malformed JSON -> empty result (graceful)
  // -------------------------------------------------------------------------
  it('returns empty result for malformed JSON', async () => {
    mockReadFile.mockResolvedValue('{ not valid json !!!');

    const result = await collectStagingQueue();

    expect(result.entries).toEqual([]);
    expect(result.dependencies).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 5. Custom basePath -> reads from {basePath}/.planning/staging/queue-state.json
  // -------------------------------------------------------------------------
  it('reads from custom basePath', async () => {
    const entries = [buildEntry('q-20260214-003')];
    mockReadFile.mockResolvedValue(JSON.stringify(entries));

    const result = await collectStagingQueue({
      basePath: '/custom/project',
    });

    expect(mockReadFile).toHaveBeenCalledWith(
      '/custom/project/.planning/staging/queue-state.json',
      'utf-8',
    );
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe('q-20260214-003');
  });

  // -------------------------------------------------------------------------
  // 6. Non-array JSON -> empty result (graceful)
  // -------------------------------------------------------------------------
  it('returns empty result when JSON is not an array', async () => {
    mockReadFile.mockResolvedValue('{"entries": []}');

    const result = await collectStagingQueue();

    expect(result.entries).toEqual([]);
    expect(result.dependencies).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 7. Default basePath uses process.cwd()
  // -------------------------------------------------------------------------
  it('uses process.cwd() as default basePath', async () => {
    mockReadFile.mockRejectedValue(makeEnoent('queue-state.json'));

    await collectStagingQueue();

    const expectedPath = `${process.cwd()}/.planning/staging/queue-state.json`;
    expect(mockReadFile).toHaveBeenCalledWith(expectedPath, 'utf-8');
  });
});

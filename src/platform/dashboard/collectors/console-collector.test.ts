import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock node:fs/promises before importing module under test
// ---------------------------------------------------------------------------

const { mockReadFile, mockReaddir } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockReaddir: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  readdir: mockReaddir,
}));

// Import after mocks are set up
import { collectConsoleData } from './console-collector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an ENOENT error. */
function makeEnoent(path: string): NodeJS.ErrnoException {
  const err = new Error(
    `ENOENT: no such file or directory, open '${path}'`,
  ) as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
}

/** Valid SessionStatus object. */
const VALID_STATUS = {
  phase: 'Phase 10',
  plan: '10-02',
  status: 'executing',
  progress: 0.65,
  updated_at: '2026-02-14T12:00:00Z',
};

/** Valid MilestoneConfig object. */
const VALID_CONFIG = {
  milestone: {
    name: 'Test Milestone',
    submitted_at: '2026-02-14T12:00:00Z',
    submitted_by: 'dashboard',
  },
};

/** Valid BridgeLogEntry line. */
const VALID_LOG_ENTRY = {
  timestamp: '2026-02-14T12:00:00Z',
  filename: 'milestone-submit-001.json',
  subdirectory: 'inbox/pending',
  contentSize: 256,
  status: 'success',
};

/** Valid pending question file content. */
const VALID_QUESTION = {
  question_id: 'q-001',
  text: 'Do you want to proceed?',
  type: 'binary',
  status: 'pending',
  urgency: 'medium',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('collectConsoleData', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
    mockReaddir.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. Returns safe defaults when .planning/console/ does not exist
  // -------------------------------------------------------------------------
  it('returns safe defaults when .planning/console/ does not exist', async () => {
    // All reads fail with ENOENT
    mockReadFile.mockRejectedValue(makeEnoent('current.json'));
    mockReaddir.mockRejectedValue(makeEnoent('outbox/questions'));

    const result = await collectConsoleData({ basePath: '/tmp/nonexistent' });

    expect(result.status).toBeNull();
    expect(result.questions).toEqual([]);
    expect(result.helperUrl).toBe('/api/console/message');
    expect(result.config).toBeNull();
    expect(result.activityEntries).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 2. Reads session status from outbox/status/current.json
  // -------------------------------------------------------------------------
  it('reads session status from current.json', async () => {
    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('current.json')) {
        return Promise.resolve(JSON.stringify(VALID_STATUS));
      }
      return Promise.reject(makeEnoent(path));
    });
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.status).toEqual(VALID_STATUS);
  });

  // -------------------------------------------------------------------------
  // 3. Returns null status when current.json is missing
  // -------------------------------------------------------------------------
  it('returns null status when current.json is missing', async () => {
    mockReadFile.mockRejectedValue(makeEnoent('current.json'));
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.status).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 4. Returns null status when current.json is malformed JSON
  // -------------------------------------------------------------------------
  it('returns null status when current.json is malformed', async () => {
    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('current.json')) {
        return Promise.resolve('{ not valid json !!!');
      }
      return Promise.reject(makeEnoent(path));
    });
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.status).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 5. Polls pending questions from outbox/questions/
  // -------------------------------------------------------------------------
  it('polls pending questions from outbox/questions/', async () => {
    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('current.json')) {
        return Promise.reject(makeEnoent(path));
      }
      if (path.includes('milestone-config.json')) {
        return Promise.reject(makeEnoent(path));
      }
      if (path.includes('bridge.jsonl')) {
        return Promise.reject(makeEnoent(path));
      }
      // Question file
      if (path.endsWith('.json')) {
        return Promise.resolve(JSON.stringify(VALID_QUESTION));
      }
      return Promise.reject(makeEnoent(path));
    });
    mockReaddir.mockImplementation((path: string) => {
      if (path.includes('questions')) {
        return Promise.resolve(['q-001.json']);
      }
      return Promise.reject(makeEnoent(path));
    });

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].question_id).toBe('q-001');
  });

  // -------------------------------------------------------------------------
  // 6. Returns empty questions when directory is missing
  // -------------------------------------------------------------------------
  it('returns empty questions when directory is missing', async () => {
    mockReadFile.mockRejectedValue(makeEnoent('any'));
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.questions).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 7. Reads milestone config from config/milestone-config.json
  // -------------------------------------------------------------------------
  it('reads milestone config from config/milestone-config.json', async () => {
    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('milestone-config.json')) {
        return Promise.resolve(JSON.stringify(VALID_CONFIG));
      }
      return Promise.reject(makeEnoent(path));
    });
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.config).not.toBeNull();
    expect(result.config!.milestone.name).toBe('Test Milestone');
  });

  // -------------------------------------------------------------------------
  // 8. Returns null config when config file is missing
  // -------------------------------------------------------------------------
  it('returns null config when config file is missing', async () => {
    mockReadFile.mockRejectedValue(makeEnoent('milestone-config.json'));
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.config).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 9. Returns null config when config file has invalid schema
  // -------------------------------------------------------------------------
  it('returns null config when config file has invalid schema', async () => {
    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('milestone-config.json')) {
        // Valid JSON but missing required milestone.name
        return Promise.resolve(JSON.stringify({ execution: { mode: 'yolo' } }));
      }
      return Promise.reject(makeEnoent(path));
    });
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.config).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 10. Reads bridge.jsonl and classifies entries
  // -------------------------------------------------------------------------
  it('reads bridge.jsonl and classifies entries into ActivityEntry[]', async () => {
    const logLines = [
      JSON.stringify(VALID_LOG_ENTRY),
      JSON.stringify({
        ...VALID_LOG_ENTRY,
        filename: 'config-update.json',
        status: 'error',
        error: 'Write failed',
      }),
    ].join('\n');

    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('bridge.jsonl')) {
        return Promise.resolve(logLines);
      }
      return Promise.reject(makeEnoent(path));
    });
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.activityEntries).toHaveLength(2);
    // First entry: milestone-submit based on filename
    expect(result.activityEntries[0].type).toBe('milestone-submit');
    // Second entry: error status takes priority
    expect(result.activityEntries[1].type).toBe('error');
  });

  // -------------------------------------------------------------------------
  // 11. Returns empty activity entries when bridge.jsonl is missing
  // -------------------------------------------------------------------------
  it('returns empty activity entries when bridge.jsonl is missing', async () => {
    mockReadFile.mockRejectedValue(makeEnoent('bridge.jsonl'));
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({ basePath: '/tmp/test' });

    expect(result.activityEntries).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 12. Passes custom helperUrl through to result
  // -------------------------------------------------------------------------
  it('passes custom helperUrl through to result', async () => {
    mockReadFile.mockRejectedValue(makeEnoent('any'));
    mockReaddir.mockRejectedValue(makeEnoent('questions'));

    const result = await collectConsoleData({
      basePath: '/tmp/test',
      helperUrl: 'http://localhost:3000/api/console/message',
    });

    expect(result.helperUrl).toBe('http://localhost:3000/api/console/message');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '../dolthub-client.js';
import type { DoltHubClientConfig } from '../dolthub-client.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const config: DoltHubClientConfig = {
  upstream: 'hop/wl-commons',
  fork: 'testuser/wl-commons',
  localDir: '/tmp/wl-commons',
  branch: 'main',
};

function makeFetchSuccess(rows: Record<string, string>[]): typeof global.fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({ query_execution_status: 'Success', rows }),
  }) as unknown as typeof global.fetch;
}

function makeFetchRowLimit(): typeof global.fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({ query_execution_status: 'RowLimit', rows: [] }),
  }) as unknown as typeof global.fetch;
}

function makeFetchNetworkError(): typeof global.fetch {
  return vi.fn().mockRejectedValue(new Error('network error')) as unknown as typeof global.fetch;
}

function makeFetchNotOk(): typeof global.fetch {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json: () => Promise.resolve({}),
  }) as unknown as typeof global.fetch;
}

// ---------------------------------------------------------------------------
// query() — REST path
// ---------------------------------------------------------------------------

describe('query() REST path', () => {
  it('returns rows and source:rest on successful fetch', async () => {
    global.fetch = makeFetchSuccess([{ id: 'r1' }]);
    const client = createClient(config);
    const result = await client.query('SELECT * FROM rigs');
    expect(result.rows).toEqual([{ id: 'r1' }]);
    expect(result.source).toBe('rest');
  });

  it('throws with RowLimit in message when status is RowLimit', async () => {
    global.fetch = makeFetchRowLimit();
    const client = createClient(config);
    await expect(client.query('SELECT * FROM rigs')).rejects.toThrow('RowLimit');
  });

  it('falls back to local when fetch rejects (network error)', async () => {
    const { execFile } = await import('node:child_process');
    const mockExecFile = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: object, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: JSON.stringify({ rows: [{ id: 'local1' }] }), stderr: '' });
      },
    );

    global.fetch = makeFetchNetworkError();
    const client = createClient(config);
    const result = await client.query('SELECT * FROM rigs');
    expect(result.source).toBe('local');
  });

  it('falls back to local when fetch returns non-ok status (404)', async () => {
    const { execFile } = await import('node:child_process');
    const mockExecFile = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: object, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: JSON.stringify({ rows: [] }), stderr: '' });
      },
    );

    global.fetch = makeFetchNotOk();
    const client = createClient(config);
    const result = await client.query('SELECT * FROM rigs');
    expect(result.source).toBe('local');
  });
});

// ---------------------------------------------------------------------------
// localQuery()
// ---------------------------------------------------------------------------

describe('localQuery()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls execFile with dolt sql -q sql -r json and array args', async () => {
    const { execFile } = await import('node:child_process');
    const mockExecFile = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation(
      (cmd: string, args: string[], _opts: object, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        expect(cmd).toBe('dolt');
        expect(args).toEqual(['sql', '-q', 'SELECT 1', '-r', 'json']);
        cb(null, { stdout: JSON.stringify({ rows: [{ val: '1' }] }), stderr: '' });
      },
    );

    const client = createClient(config);
    await client.localQuery('SELECT 1');
    expect(mockExecFile).toHaveBeenCalled();
  });

  it('returns rows and source:local', async () => {
    const { execFile } = await import('node:child_process');
    const mockExecFile = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: object, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: JSON.stringify({ rows: [{ id: 'abc' }] }), stderr: '' });
      },
    );

    const client = createClient(config);
    const result = await client.localQuery('SELECT * FROM rigs');
    expect(result.rows).toEqual([{ id: 'abc' }]);
    expect(result.source).toBe('local');
  });
});

// ---------------------------------------------------------------------------
// execute()
// ---------------------------------------------------------------------------

describe('execute()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls execFile with dolt sql -q and array args', async () => {
    const { execFile } = await import('node:child_process');
    const mockExecFile = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation(
      (cmd: string, args: string[], _opts: object, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        expect(cmd).toBe('dolt');
        expect(args).toEqual(['sql', '-q', 'INSERT INTO rigs (handle) VALUES (\'fox\')']);
        cb(null, { stdout: 'ok', stderr: '' });
      },
    );

    const client = createClient(config);
    await client.execute("INSERT INTO rigs (handle) VALUES ('fox')");
    expect(mockExecFile).toHaveBeenCalled();
  });

  it('returns stdout and stderr from execFile', async () => {
    const { execFile } = await import('node:child_process');
    const mockExecFile = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: object, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: 'query ok', stderr: 'warn: none' });
      },
    );

    const client = createClient(config);
    const result = await client.execute('INSERT INTO test VALUES (1)');
    expect(result.stdout).toBe('query ok');
    expect(result.stderr).toBe('warn: none');
  });
});

// ---------------------------------------------------------------------------
// generateSQL()
// ---------------------------------------------------------------------------

describe('generateSQL()', () => {
  it("escapes single quotes via sqlEscape (O'Brien becomes O''Brien)", () => {
    const client = createClient(config);
    const sql = client.generateSQL('INSERT INTO rigs (handle) VALUES (?)', ["O'Brien"]);
    expect(sql).toContain("O''Brien");
  });

  it('escapes backslashes via sqlEscape', () => {
    const client = createClient(config);
    const sql = client.generateSQL('INSERT INTO rigs (path) VALUES (?)', ['back\\slash']);
    expect(sql).toContain('back\\\\slash');
  });
});

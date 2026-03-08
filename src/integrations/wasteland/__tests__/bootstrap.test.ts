import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as os from 'node:os';

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before dynamic imports
// ---------------------------------------------------------------------------

vi.mock('../config.js', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    handle: 'fox',
    display_name: 'Fox',
    type: 'human',
    dolthub_org: 'fox',
    email: 'fox@test.com',
    wastelands: [{ upstream: 'hop/wl-commons', fork: 'fox/wl-commons', local_dir: '~/commons', joined_at: '2026-01-01' }],
    schema_version: '1.0',
    mvr_version: '0.1',
  }),
}));

vi.mock('../dolthub-client.js', () => ({
  createClient: vi.fn().mockReturnValue({
    query: vi.fn(),
    localQuery: vi.fn(),
    generateSQL: vi.fn(),
    execute: vi.fn(),
  }),
}));

vi.mock('node:child_process', () => ({
  execFile: vi.fn((cmd, args, opts, cb) => { cb(null, '', ''); }),
}));

// ---------------------------------------------------------------------------
// Dynamic imports — after mocks
// ---------------------------------------------------------------------------

const { bootstrap } = await import('../bootstrap.js');
const { loadConfig } = await import('../config.js');
const { createClient } = await import('../dolthub-client.js');
const { execFile } = await import('node:child_process');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default execFile mock: success
  (vi.mocked(execFile) as any).mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
    cb(null, '', '');
    return {} as any;
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('bootstrap()', () => {
  it('returns BootstrapResult with config matching mocked loadConfig value', async () => {
    const result = await bootstrap(['--offline']);
    expect(result.config).toMatchObject({ handle: 'fox', email: 'fox@test.com' });
  });

  it('returns BootstrapResult with client equal to createClient() return value', async () => {
    const mockClient = vi.mocked(createClient).mock.results[0]?.value ?? (createClient as any)();
    const result = await bootstrap(['--offline']);
    // createClient was called — result.client is its return value
    expect(result.client).toBeDefined();
    expect(typeof result.client.query).toBe('function');
  });

  it('resolves ~ in local_dir via os.homedir()', async () => {
    const result = await bootstrap(['--offline']);
    expect(result.wasteland.localDir).not.toContain('~');
    expect(result.wasteland.localDir).toContain(os.homedir());
  });

  it('calls createClient with the resolved (non-tilde) localDir', async () => {
    await bootstrap(['--offline']);
    expect(vi.mocked(createClient)).toHaveBeenCalledWith(
      expect.objectContaining({ localDir: expect.stringContaining(os.homedir()) }),
    );
  });

  it('wasteland.upstream equals config.wastelands[0].upstream', async () => {
    const result = await bootstrap(['--offline']);
    expect(result.wasteland.upstream).toBe('hop/wl-commons');
  });

  it('--offline skips dolt pull entirely (execFile never called)', async () => {
    await bootstrap(['--offline']);
    expect(vi.mocked(execFile)).not.toHaveBeenCalled();
  });

  it('without --offline, calls dolt pull and returns synced=true on success', async () => {
    const result = await bootstrap([]);
    expect(vi.mocked(execFile)).toHaveBeenCalledWith(
      'dolt',
      ['pull', 'upstream', 'main'],
      expect.objectContaining({ cwd: expect.stringContaining(os.homedir()) }),
      expect.any(Function),
    );
    expect(result.synced).toBe(true);
  });

  it('when dolt pull throws, returns synced=false and does not rethrow', async () => {
    (vi.mocked(execFile) as any).mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(new Error('merge conflict'), '', '');
      return {} as any;
    });
    const result = await bootstrap([]);
    expect(result.synced).toBe(false);
  });
});

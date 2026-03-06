import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../integrations/wasteland/bootstrap.js', () => ({
  bootstrap: vi.fn().mockResolvedValue({
    config: {
      handle: 'fox',
      display_name: 'Fox',
      type: 'human',
      dolthub_org: 'fox',
      email: 'fox@test.com',
      wastelands: [{ upstream: 'hop/wl-commons', fork: 'fox/wl-commons', local_dir: '/tmp/commons', joined_at: '2026-01-01' }],
      schema_version: '1.0',
      mvr_version: '0.1',
    },
    client: {
      query: vi.fn().mockResolvedValue({ rows: [{ id: 'w-001', title: 'Fix readme', status: 'open', claimed_by: '' }], source: 'rest' }),
      execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
      generateSQL: vi.fn().mockImplementation((template: string, values: string[]) => {
        let i = 0;
        return template.replace(/\?/g, () => `'${values[i++] ?? ''}'`);
      }),
      localQuery: vi.fn(),
    },
    wasteland: { upstream: 'hop/wl-commons', fork: 'fox/wl-commons', localDir: '/tmp/commons' },
    synced: true,
  }),
}));

vi.mock('@clack/prompts', () => ({
  text: vi.fn().mockResolvedValue('PR #42 merged'),
  select: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
}));

vi.mock('../../../../integrations/wasteland/sql-escape.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../integrations/wasteland/sql-escape.js')>();
  return { ...actual, screenForInjection: vi.fn().mockReturnValue({ safe: true, threats: [] }) };
});

import { wlDoneCommand } from '../wl-done.js';
import { bootstrap } from '../../../../integrations/wasteland/bootstrap.js';
import { screenForInjection } from '../../../../integrations/wasteland/sql-escape.js';

const ALL_FLAGS = ['--wanted-id', 'w-001', '--evidence', 'PR #42 merged'];

beforeEach(() => {
  vi.clearAllMocks();
  // Reset bootstrap mock to default (item found, open status)
  vi.mocked(bootstrap).mockResolvedValue({
    config: {
      handle: 'fox',
      display_name: 'Fox',
      type: 'human',
      dolthub_org: 'fox',
      email: 'fox@test.com',
      wastelands: [{ upstream: 'hop/wl-commons', fork: 'fox/wl-commons', local_dir: '/tmp/commons', joined_at: '2026-01-01' }],
      schema_version: '1.0',
      mvr_version: '0.1',
    },
    client: {
      query: vi.fn().mockResolvedValue({ rows: [{ id: 'w-001', title: 'Fix readme', status: 'open', claimed_by: '' }], source: 'rest' }),
      execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
      generateSQL: vi.fn().mockImplementation((template: string, values: string[]) => {
        let i = 0;
        return template.replace(/\?/g, () => `'${values[i++] ?? ''}'`);
      }),
      localQuery: vi.fn(),
    },
    wasteland: { upstream: 'hop/wl-commons', fork: 'fox/wl-commons', localDir: '/tmp/commons' },
    synced: true,
  });
  vi.mocked(screenForInjection).mockReturnValue({ safe: true, threats: [] });
});

describe('wlDoneCommand --help', () => {
  it('returns 0 for --help without calling bootstrap()', async () => {
    const result = await wlDoneCommand(['--help']);
    expect(result).toBe(0);
    expect(vi.mocked(bootstrap)).not.toHaveBeenCalled();
  });
});

describe('wlDoneCommand dry-run (no --execute)', () => {
  it('returns 0 without --execute when all flags provided', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await wlDoneCommand(ALL_FLAGS);
    consoleSpy.mockRestore();
    expect(result).toBe(0);
  });

  it('does NOT call client.execute() without --execute flag', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { client } = await vi.mocked(bootstrap).mock.results[0]?.value ?? {};
    await wlDoneCommand(ALL_FLAGS);
    consoleSpy.mockRestore();
    // Get the bootstrapped client from the actual call
    const bootstrapResult = await vi.mocked(bootstrap).mock.results[0]?.value;
    expect(bootstrapResult?.client.execute).not.toHaveBeenCalled();
  });

  it('console output contains INSERT INTO completions', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlDoneCommand(ALL_FLAGS);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(output).toMatch(/INSERT INTO completions/i);
  });

  it('console output contains UPDATE wanted SET status', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlDoneCommand(ALL_FLAGS);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(output).toMatch(/UPDATE wanted SET status/i);
  });
});

describe('wlDoneCommand --execute', () => {
  it('calls client.execute() once with --execute', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlDoneCommand([...ALL_FLAGS, '--execute']);
    consoleSpy.mockRestore();
    // bootstrap was called; get the client from the mock result
    const bootstrapResult = vi.mocked(bootstrap).mock.results[0]?.value as Promise<{ client: { execute: ReturnType<typeof vi.fn> } }>;
    const resolved = await bootstrapResult;
    expect(resolved.client.execute).toHaveBeenCalledTimes(1);
  });

  it('returns 0 on successful --execute', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await wlDoneCommand([...ALL_FLAGS, '--execute']);
    consoleSpy.mockRestore();
    expect(result).toBe(0);
  });

  it('execute() is called with SQL containing both INSERT and UPDATE', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlDoneCommand([...ALL_FLAGS, '--execute']);
    consoleSpy.mockRestore();
    const bootstrapResult = vi.mocked(bootstrap).mock.results[0]?.value as Promise<{ client: { execute: ReturnType<typeof vi.fn> } }>;
    const resolved = await bootstrapResult;
    const sqlArg: string = vi.mocked(resolved.client.execute).mock.calls[0]?.[0] ?? '';
    expect(sqlArg).toMatch(/INSERT INTO completions/i);
    expect(sqlArg).toMatch(/UPDATE wanted SET status/i);
  });
});

describe('wlDoneCommand completion ID format', () => {
  it('completion ID matches c-{handle}-{10hex} pattern', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlDoneCommand(ALL_FLAGS);
    consoleSpy.mockRestore();
    // generateSQL is called; check that the first argument to first generateSQL call has a matching ID
    const bootstrapResult = vi.mocked(bootstrap).mock.results[0]?.value as Promise<{ client: { generateSQL: ReturnType<typeof vi.fn> } }>;
    const resolved = await bootstrapResult;
    // The first value passed to generateSQL for the INSERT should be the completion ID
    const firstCallValues: string[] = vi.mocked(resolved.client.generateSQL).mock.calls[0]?.[1] ?? [];
    expect(firstCallValues[0]).toMatch(/^c-fox-[0-9a-f]{10}$/);
  });
});

describe('wlDoneCommand pre-check', () => {
  it('returns 1 and prints error when wanted item not found', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Override bootstrap to return empty rows for query
    vi.mocked(bootstrap).mockResolvedValue({
      config: {
        handle: 'fox',
        display_name: 'Fox',
        type: 'human',
        dolthub_org: 'fox',
        email: 'fox@test.com',
        wastelands: [{ upstream: 'hop/wl-commons', fork: 'fox/wl-commons', local_dir: '/tmp/commons', joined_at: '2026-01-01' }],
        schema_version: '1.0',
        mvr_version: '0.1',
      },
      client: {
        query: vi.fn().mockResolvedValue({ rows: [], source: 'rest' }),
        execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
        generateSQL: vi.fn().mockImplementation((template: string, values: string[]) => {
          let i = 0;
          return template.replace(/\?/g, () => `'${values[i++] ?? ''}'`);
        }),
        localQuery: vi.fn(),
      },
      wasteland: { upstream: 'hop/wl-commons', fork: 'fox/wl-commons', localDir: '/tmp/commons' },
      synced: true,
    });

    const result = await wlDoneCommand(ALL_FLAGS);
    consoleSpy.mockRestore();
    expect(result).toBe(1);
  });
});

describe('wlDoneCommand evidence handling', () => {
  it('--evidence flag value appears in the INSERT SQL evidence column', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlDoneCommand(['--wanted-id', 'w-001', '--evidence', 'https://github.com/pr/99']);
    consoleSpy.mockRestore();
    const bootstrapResult = vi.mocked(bootstrap).mock.results[0]?.value as Promise<{ client: { generateSQL: ReturnType<typeof vi.fn> } }>;
    const resolved = await bootstrapResult;
    // Evidence is the 4th value (index 3) in the INSERT values array
    const firstCallValues: string[] = vi.mocked(resolved.client.generateSQL).mock.calls[0]?.[1] ?? [];
    expect(firstCallValues[3]).toBe('https://github.com/pr/99');
  });
});

describe('wlDoneCommand screenForInjection', () => {
  it('screenForInjection is called with evidence string only, not with SQL containing UPDATE', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlDoneCommand(ALL_FLAGS);
    consoleSpy.mockRestore();
    // screenForInjection must have been called
    expect(vi.mocked(screenForInjection)).toHaveBeenCalled();
    // Every call arg must NOT contain UPDATE (it should only be called with the evidence string)
    for (const call of vi.mocked(screenForInjection).mock.calls) {
      const arg: string = call[0] ?? '';
      expect(arg).not.toMatch(/UPDATE/i);
    }
  });
});

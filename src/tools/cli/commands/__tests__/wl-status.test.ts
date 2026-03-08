import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mock client — defined at module level so tests can configure it
// ---------------------------------------------------------------------------

const mockQuery = vi.fn();
const mockGenerateSQL = vi.fn().mockImplementation((template: string, values: string[]) => {
  let i = 0;
  return template.replace(/\?/g, () => `'${values[i++] ?? ''}'`);
});

const mockClient = {
  query: mockQuery,
  localQuery: vi.fn(),
  generateSQL: mockGenerateSQL,
  execute: vi.fn(),
};

// ---------------------------------------------------------------------------
// Mocks — hoisted before dynamic imports
// ---------------------------------------------------------------------------

vi.mock('../../../../integrations/wasteland/bootstrap.js', () => ({
  bootstrap: vi.fn(),
}));

vi.mock('../../../../integrations/wasteland/formatters.js', () => ({
  renderTable: vi.fn().mockReturnValue('table'),
  renderBadge: vi.fn().mockImplementation((s: string) => `[${s}]`),
  smartFit: vi.fn().mockImplementation((t: string) => t),
}));

// ---------------------------------------------------------------------------
// Dynamic imports — after mocks
// ---------------------------------------------------------------------------

const { wlStatusCommand } = await import('../wl-status.js');
const { bootstrap } = await import('../../../../integrations/wasteland/bootstrap.js');
const { renderTable } = await import('../../../../integrations/wasteland/formatters.js');

// ---------------------------------------------------------------------------
// Default bootstrap return value builder
// ---------------------------------------------------------------------------

function makeBootstrapResult(overrides: { synced?: boolean } = {}) {
  return {
    config: {
      handle: 'fox',
      display_name: 'Fox',
      type: 'human' as const,
      dolthub_org: 'fox',
      email: 'fox@test.com',
      wastelands: [{ upstream: 'hop/wl-commons', fork: 'fox/wl-commons', local_dir: '/tmp/commons', joined_at: '2026-01-01' }],
      schema_version: '1.0' as const,
      mvr_version: '0.1' as const,
    },
    client: mockClient,
    wasteland: { upstream: 'hop/wl-commons', fork: 'fox/wl-commons', localDir: '/tmp/commons' },
    synced: overrides.synced ?? true,
  };
}

/** Configure mockQuery with the standard three-query sequence. */
function setupDefaultQueries(rigRowsOverride?: object[]) {
  const rigRows = rigRowsOverride ?? [
    { handle: 'fox', display_name: 'Fox', trust_level: 'newcomer', rig_type: 'human', registered_at: '2026-01-01', last_seen: '2026-03-06' },
  ];
  mockQuery
    .mockResolvedValueOnce({ rows: rigRows, source: 'rest' })
    .mockResolvedValueOnce({ rows: [{ id: 'c-fox-abc123', wanted_id: 'w-001', title: 'Fix readme', completed_at: '2026-03-01' }], source: 'rest' })
    .mockResolvedValueOnce({ rows: [{ id: 's-001', author: 'hop', valence: '{"quality":4,"reliability":5,"creativity":3}', confidence: '0.9', severity: 'low', created_at: '2026-03-02' }], source: 'rest' });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Re-establish generateSQL after clearAllMocks
  mockGenerateSQL.mockImplementation((template: string, values: string[]) => {
    let i = 0;
    return template.replace(/\?/g, () => `'${values[i++] ?? ''}'`);
  });
  vi.mocked(renderTable).mockReturnValue('table');
  vi.mocked(bootstrap).mockResolvedValue(makeBootstrapResult());
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('wlStatusCommand --help', () => {
  it('returns 0 for --help without calling bootstrap()', async () => {
    const result = await wlStatusCommand(['--help']);
    expect(result).toBe(0);
    expect(vi.mocked(bootstrap)).not.toHaveBeenCalled();
  });
});

describe('wlStatusCommand default (summary card)', () => {
  it('returns 0 and prints the handle from config in output', async () => {
    setupDefaultQueries();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await wlStatusCommand([]);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(result).toBe(0);
    expect(output).toContain('fox');
  });

  it('executes three separate query() calls (rigs, completions, stamps)', async () => {
    setupDefaultQueries();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlStatusCommand([]);
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it('shows "Last synced" when bootstrap returns synced=true', async () => {
    setupDefaultQueries();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlStatusCommand([]);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(output).toContain('Last synced');
  });
});

describe('wlStatusCommand positional arg', () => {
  it('uses positional arg as target handle instead of config.handle', async () => {
    setupDefaultQueries([{ handle: 'MapleFoxyBells', display_name: 'Maple', trust_level: 'trusted', rig_type: 'human', registered_at: '2025-01-01', last_seen: '2026-03-05' }]);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlStatusCommand(['MapleFoxyBells']);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(output).toContain('MapleFoxyBells');
  });
});

describe('wlStatusCommand flags', () => {
  it('--completions flag causes renderTable() to be called', async () => {
    setupDefaultQueries();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlStatusCommand(['--completions']);
    expect(vi.mocked(renderTable)).toHaveBeenCalled();
  });

  it('--stamps flag causes renderTable() to be called', async () => {
    setupDefaultQueries();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlStatusCommand(['--stamps']);
    expect(vi.mocked(renderTable)).toHaveBeenCalled();
  });

  it('--full flag causes renderTable() to be called at least once', async () => {
    setupDefaultQueries();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlStatusCommand(['--full']);
    expect(vi.mocked(renderTable)).toHaveBeenCalled();
  });
});

describe('wlStatusCommand synced=false', () => {
  it('shows stale data warning when bootstrap returns synced=false', async () => {
    vi.mocked(bootstrap).mockResolvedValueOnce(makeBootstrapResult({ synced: false }));
    setupDefaultQueries();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlStatusCommand([]);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(output).toContain('local data');
  });
});

describe('wlStatusCommand --json', () => {
  it('--json outputs parseable JSON containing rig, completions, and stamps properties', async () => {
    setupDefaultQueries();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await wlStatusCommand(['--json']);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(result).toBe(0);
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed).toHaveProperty('rig');
    expect(parsed).toHaveProperty('completions');
    expect(parsed).toHaveProperty('stamps');
  });
});

describe('wlStatusCommand rig not found', () => {
  it('returns 1 and prints error when rigs query returns 0 rows', async () => {
    setupDefaultQueries([]);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await wlStatusCommand([]);
    consoleSpy.mockRestore();
    expect(result).toBe(1);
  });
});

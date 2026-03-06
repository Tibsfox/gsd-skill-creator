import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../integrations/wasteland/bootstrap.js', () => ({
  bootstrap: vi.fn().mockResolvedValue({
    config: {
      handle: 'fox',
      wastelands: [{ upstream: 'hop/wl-commons', fork: 'fox/wl-commons', local_dir: '/tmp/commons', joined_at: '2026-01-01' }],
      schema_version: '1.0',
      mvr_version: '0.1',
      display_name: 'Fox',
      type: 'human',
      dolthub_org: 'fox',
      email: 'fox@test.com',
    },
    client: {
      query: vi.fn().mockResolvedValue({
        rows: [{ id: 'w-001', title: 'Fix readme', status: 'open', effort_level: 'small', posted_by: 'hop', claimed_by: '', tags: '["docs"]', created_at: '2026-01-01' }],
        source: 'rest',
      }),
      localQuery: vi.fn(),
      generateSQL: vi.fn(),
      execute: vi.fn(),
    },
    wasteland: { upstream: 'hop/wl-commons', fork: 'fox/wl-commons', localDir: '/tmp/commons' },
    synced: true,
  }),
}));

vi.mock('../../../../integrations/wasteland/formatters.js', () => ({
  renderTable: vi.fn().mockReturnValue('table output'),
  renderBadge: vi.fn().mockImplementation((s: string) => `[${s}]`),
  smartFit: vi.fn().mockImplementation((t: string) => t),
}));

import { wlBrowseCommand } from '../wl-browse.js';
import { bootstrap } from '../../../../integrations/wasteland/bootstrap.js';
import { renderTable } from '../../../../integrations/wasteland/formatters.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

describe('wlBrowseCommand --help', () => {
  it('returns 0 and does not call bootstrap', async () => {
    const result = await wlBrowseCommand(['--help']);
    expect(result).toBe(0);
    expect(vi.mocked(bootstrap)).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Baseline — no filters
// ---------------------------------------------------------------------------

describe('wlBrowseCommand no filters', () => {
  it('calls bootstrap once and queries FROM wanted', async () => {
    await wlBrowseCommand([]);
    expect(vi.mocked(bootstrap)).toHaveBeenCalledTimes(1);
    const bootstrapResult = await vi.mocked(bootstrap).mock.results[0].value;
    const queryMock = bootstrapResult.client.query;
    expect(queryMock).toHaveBeenCalledTimes(1);
    const sql: string = queryMock.mock.calls[0][0];
    expect(sql).toMatch(/FROM wanted/i);
  });
});

// ---------------------------------------------------------------------------
// Status filter
// ---------------------------------------------------------------------------

describe('wlBrowseCommand --status open', () => {
  it('includes status filter in query SQL', async () => {
    await wlBrowseCommand(['--status', 'open']);
    const bootstrapResult = await vi.mocked(bootstrap).mock.results[0].value;
    const queryMock = bootstrapResult.client.query;
    const sql: string = queryMock.mock.calls[0][0];
    expect(sql).toMatch(/open/i);
  });
});

describe('wlBrowseCommand positional status', () => {
  it("'wl browse open' produces the same query as --status open", async () => {
    // Run with flag
    await wlBrowseCommand(['--status', 'open']);
    const bootstrapResult1 = await vi.mocked(bootstrap).mock.results[0].value;
    const sqlWithFlag: string = bootstrapResult1.client.query.mock.calls[0][0];

    vi.clearAllMocks();

    // Run with positional
    await wlBrowseCommand(['open']);
    const bootstrapResult2 = await vi.mocked(bootstrap).mock.results[0].value;
    const sqlPositional: string = bootstrapResult2.client.query.mock.calls[0][0];

    expect(sqlWithFlag).toBe(sqlPositional);
  });
});

// ---------------------------------------------------------------------------
// Effort filter
// ---------------------------------------------------------------------------

describe('wlBrowseCommand --effort medium', () => {
  it('includes effort filter in query SQL', async () => {
    await wlBrowseCommand(['--effort', 'medium']);
    const bootstrapResult = await vi.mocked(bootstrap).mock.results[0].value;
    const queryMock = bootstrapResult.client.query;
    const sql: string = queryMock.mock.calls[0][0];
    expect(sql).toMatch(/medium/i);
  });
});

describe('wlBrowseCommand positional effort', () => {
  it("'wl browse medium' produces the same query as --effort medium", async () => {
    await wlBrowseCommand(['--effort', 'medium']);
    const bootstrapResult1 = await vi.mocked(bootstrap).mock.results[0].value;
    const sqlWithFlag: string = bootstrapResult1.client.query.mock.calls[0][0];

    vi.clearAllMocks();

    await wlBrowseCommand(['medium']);
    const bootstrapResult2 = await vi.mocked(bootstrap).mock.results[0].value;
    const sqlPositional: string = bootstrapResult2.client.query.mock.calls[0][0];

    expect(sqlWithFlag).toBe(sqlPositional);
  });
});

// ---------------------------------------------------------------------------
// Tag filter
// ---------------------------------------------------------------------------

describe('wlBrowseCommand --tag rust', () => {
  it('includes tag filter in query SQL', async () => {
    await wlBrowseCommand(['--tag', 'rust']);
    const bootstrapResult = await vi.mocked(bootstrap).mock.results[0].value;
    const queryMock = bootstrapResult.client.query;
    const sql: string = queryMock.mock.calls[0][0];
    expect(sql).toMatch(/rust/i);
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('wlBrowseCommand empty state', () => {
  it('shows "No items found" when query returns zero rows', async () => {
    vi.mocked(bootstrap).mockResolvedValueOnce({
      config: {
        handle: 'fox',
        wastelands: [{ upstream: 'hop/wl-commons', fork: 'fox/wl-commons', local_dir: '/tmp/commons', joined_at: '2026-01-01' }],
        schema_version: '1.0',
        mvr_version: '0.1',
        display_name: 'Fox',
        type: 'human',
        dolthub_org: 'fox',
        email: 'fox@test.com',
      },
      client: {
        query: vi.fn().mockResolvedValue({ rows: [], source: 'rest' }),
        localQuery: vi.fn(),
        generateSQL: vi.fn(),
        execute: vi.fn(),
      },
      wasteland: { upstream: 'hop/wl-commons', fork: 'fox/wl-commons', localDir: '/tmp/commons' },
      synced: true,
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlBrowseCommand([]);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();

    expect(output).toMatch(/No items found/i);
  });
});

// ---------------------------------------------------------------------------
// Verbose
// ---------------------------------------------------------------------------

describe('wlBrowseCommand --verbose', () => {
  it('passes posted_by data to renderTable', async () => {
    await wlBrowseCommand(['--verbose']);
    expect(vi.mocked(renderTable)).toHaveBeenCalledTimes(1);
    const [headers] = vi.mocked(renderTable).mock.calls[0];
    const headerStr = headers.join(' ');
    expect(headerStr).toMatch(/Posted By/i);
  });
});

// ---------------------------------------------------------------------------
// JSON output
// ---------------------------------------------------------------------------

describe('wlBrowseCommand --json', () => {
  it('outputs parseable JSON with a rows property', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await wlBrowseCommand(['--json']);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();

    expect(result).toBe(0);
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed).toHaveProperty('rows');
  });
});

// ---------------------------------------------------------------------------
// --offline passthrough
// ---------------------------------------------------------------------------

describe('wlBrowseCommand --offline', () => {
  it('forwards --offline to bootstrap args', async () => {
    await wlBrowseCommand(['--offline']);
    expect(vi.mocked(bootstrap).mock.calls[0][0]).toContain('--offline');
  });
});

/**
 * Tests for wl stamp — completion validation and stamp issuance.
 *
 * Covers:
 * - Help flag
 * - List mode (unstamped completions)
 * - Self-stamp prevention
 * - Already-stamped prevention
 * - Completion not found
 * - SQL generation with correct valence
 * - Flag parsing (quality, reliability, creativity, message)
 * - Injection screening on message
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

const mockQuery = vi.fn();
const mockClient = { query: mockQuery };
const mockConfig = { handle: 'MapleFoxyBells' };

vi.mock('../../../../integrations/wasteland/bootstrap.js', () => ({
  bootstrap: vi.fn().mockResolvedValue({
    client: { query: (...args: unknown[]) => mockQuery(...args) },
    config: { handle: 'MapleFoxyBells' },
  }),
}));

vi.mock('../../../../integrations/wasteland/wasteland-events.js', () => ({
  emitStampIssued: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@clack/prompts', () => ({
  log: { info: vi.fn(), error: vi.fn(), warning: vi.fn(), success: vi.fn() },
  text: vi.fn().mockResolvedValue('4'),
  isCancel: vi.fn().mockReturnValue(false),
}));

import { wlStampCommand } from '../wl-stamp.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery.mockResolvedValue({ rows: [] });
});

// ============================================================================
// Help
// ============================================================================

describe('wl stamp --help', () => {
  it('prints help and returns 0', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await wlStampCommand(['--help']);
    expect(code).toBe(0);
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('wl stamp');
    spy.mockRestore();
  });
});

// ============================================================================
// List mode
// ============================================================================

describe('wl stamp --list', () => {
  it('shows unstamped completions', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'c-001', wanted_id: 'w-001', completed_by: 'alice', evidence: 'docs/guide.md', title: 'Write guide' },
      ],
    });

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await wlStampCommand(['--list', '--offline']);
    expect(code).toBe(0);
    spy.mockRestore();
  });

  it('shows message when none available', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const code = await wlStampCommand(['--list', '--offline']);
    expect(code).toBe(0);
  });

  it('outputs JSON when --json', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'c-001', completed_by: 'bob' }] });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await wlStampCommand(['--list', '--json', '--offline']);
    expect(code).toBe(0);
    const output = spy.mock.calls[0][0];
    expect(JSON.parse(output)).toBeInstanceOf(Array);
    spy.mockRestore();
  });
});

// ============================================================================
// Self-stamp prevention
// ============================================================================

describe('self-stamp prevention', () => {
  it('refuses to stamp own completion', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'c-mine', completed_by: 'MapleFoxyBells', validated_by: null, evidence: 'test', title: 'My work' }],
    });

    const code = await wlStampCommand(['c-mine', '--quality', '5', '--reliability', '5', '--creativity', '5', '--offline']);
    expect(code).toBe(1);
  });
});

// ============================================================================
// Already stamped
// ============================================================================

describe('already stamped', () => {
  it('refuses to re-stamp', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'c-done', completed_by: 'bob', validated_by: 'alice', evidence: 'test', title: 'Done' }],
    });

    const code = await wlStampCommand(['c-done', '--quality', '5', '--reliability', '5', '--creativity', '5', '--offline']);
    expect(code).toBe(1);
  });
});

// ============================================================================
// Completion not found
// ============================================================================

describe('completion not found', () => {
  it('returns error for unknown ID', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const code = await wlStampCommand(['c-nonexistent', '--quality', '4', '--reliability', '4', '--creativity', '4', '--offline']);
    expect(code).toBe(1);
  });
});

// ============================================================================
// Missing completion ID
// ============================================================================

describe('missing arguments', () => {
  it('returns error when no completion ID given', async () => {
    const code = await wlStampCommand(['--offline']);
    expect(code).toBe(1);
  });
});

// ============================================================================
// Dry run SQL generation
// ============================================================================

describe('dry run', () => {
  it('generates stamp SQL without executing', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'c-abc', completed_by: 'alice', validated_by: null, evidence: 'PR #123', title: 'Feature', wanted_id: 'w-001' }],
    });

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await wlStampCommand(['c-abc', '--quality', '4', '--reliability', '4', '--creativity', '3', '--message', 'Looks good', '--offline']);
    expect(code).toBe(0);
    const output = spy.mock.calls.map(c => String(c[0])).join('\n');
    expect(output).toContain('INSERT INTO stamps');
    expect(output).toContain('UPDATE completions');
    expect(output).toContain('"quality":4');
    spy.mockRestore();
  });
});

// ============================================================================
// JSON output
// ============================================================================

describe('JSON mode', () => {
  it('outputs structured JSON', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'c-abc', completed_by: 'bob', validated_by: null, evidence: 'test', title: 'T', wanted_id: 'w-1' }],
    });

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await wlStampCommand(['c-abc', '--quality', '5', '--reliability', '4', '--creativity', '4', '--json', '--offline']);
    expect(code).toBe(0);
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.stampId).toBeDefined();
    expect(parsed.stamp.quality).toBe(5);
    expect(parsed.dryRun).toBe(true);
    spy.mockRestore();
  });
});

// ============================================================================
// Injection screening
// ============================================================================

describe('injection screening', () => {
  it('rejects message with SQL injection attempt', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'c-abc', completed_by: 'bob', validated_by: null, evidence: 'test', title: 'T', wanted_id: 'w-1' }],
    });

    const code = await wlStampCommand([
      'c-abc', '--quality', '4', '--reliability', '4', '--creativity', '4',
      '--message', "good'; DROP TABLE stamps; --",
      '--offline',
    ]);
    expect(code).toBe(1);
  });
});

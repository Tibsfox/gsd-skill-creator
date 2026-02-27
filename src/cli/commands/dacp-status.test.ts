/**
 * Tests for DACP status CLI command.
 *
 * Mocks filesystem reads to isolate CLI logic.
 * Verifies exit codes, output formatting, and empty-state handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions so they are available when vi.mock factories run
const { mockLog, mockReadFile, mockReaddir, mockAccess } = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockReadFile: vi.fn(),
  mockReaddir: vi.fn(),
  mockAccess: vi.fn(),
}));

// Mock @clack/prompts to capture output
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: mockLog,
}));

// Mock picocolors to pass-through strings
vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  readdir: mockReaddir,
  access: mockAccess,
}));

// Mock node:os to return a stable home dir
vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}));

import { dacpStatusCommand } from './dacp-status.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const mockStatusJson = JSON.stringify({
  total_handoffs: 47,
  bundled_handoffs: 24,
  avg_drift_score: 0.08,
  last_retrospective: '2026-02-27T10:00:00.000Z',
});

const mockDriftScoresJsonl = [
  '{"pattern":"planner->executor:schema-task","score":0.45,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T10:00:00.000Z"}',
  '{"pattern":"executor->verifier:test-handoff","score":0.12,"fidelity_level":1,"recommendation":"maintain","timestamp":"2026-02-27T09:50:00.000Z"}',
  '{"pattern":"planner->executor:schema-task","score":0.38,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T09:40:00.000Z"}',
  '{"pattern":"executor->verifier:test-handoff","score":0.04,"fidelity_level":1,"recommendation":"maintain","timestamp":"2026-02-27T09:30:00.000Z"}',
].join('\n');

const mockRecommendationsJson = JSON.stringify([
  {
    pattern: 'planner->executor:schema-task',
    action: 'promote',
    from: 2,
    to: 3,
    reason: '3 high-drift handoffs',
  },
]);

const mockRegistryJson = JSON.stringify([
  { id: 'skill-handoff', name: 'Skill Handoff' },
  { id: 'phase-transition', name: 'Phase Transition' },
]);

const mockScriptsJson = JSON.stringify([
  { id: 'validate-skill', function_type: 'validator' },
  { id: 'parse-context', function_type: 'parser' },
  { id: 'transform-data', function_type: 'transformer' },
]);

const mockSchemasJson = JSON.stringify([
  { id: 'skill-context', data_type: 'context' },
  { id: 'plan-summary', data_type: 'summary' },
]);

/**
 * Helper to set up mock filesystem with all DACP data files.
 */
function setupFullState(): void {
  mockReadFile.mockImplementation(async (filePath: string) => {
    const path = String(filePath);
    if (path.includes('status.json')) return mockStatusJson;
    if (path.includes('drift-scores.jsonl')) return mockDriftScoresJsonl;
    if (path.includes('recommendations.json')) return mockRecommendationsJson;
    if (path.includes('registry.json')) return mockRegistryJson;
    if (path.includes('scripts.json')) return mockScriptsJson;
    if (path.includes('schemas.json')) return mockSchemasJson;
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  });
  mockAccess.mockResolvedValue(undefined);
}

/**
 * Helper to set up mock filesystem with no DACP data (all ENOENT).
 */
function setupEmptyState(): void {
  mockReadFile.mockRejectedValue(
    Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
  );
  mockAccess.mockRejectedValue(
    Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe('dacpStatusCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 and prints usage for --help', async () => {
    const result = await dacpStatusCommand(['--help']);
    expect(result).toBe(0);
  });

  it('returns 0 and prints usage for -h', async () => {
    const result = await dacpStatusCommand(['-h']);
    expect(result).toBe(0);
  });

  it('prints DACP Communication Status with valid data', async () => {
    setupFullState();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpStatusCommand([]);

    expect(result).toBe(0);
    // Should have output containing key status information
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toContain('DACP');
    expect(allCalls).toMatch(/47/); // total handoffs
    expect(allCalls).toMatch(/0\.08/); // avg drift

    consoleSpy.mockRestore();
  });

  it('shows fidelity distribution with valid data', async () => {
    setupFullState();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await dacpStatusCommand([]);

    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    // Should show fidelity distribution levels
    expect(allCalls).toMatch(/L[0-3]/);

    consoleSpy.mockRestore();
  });

  it('outputs valid JSON with --json flag', async () => {
    setupFullState();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpStatusCommand(['--json']);

    expect(result).toBe(0);
    // Find the JSON output call
    const jsonCalls = consoleSpy.mock.calls.filter((c: unknown[]) => {
      try {
        JSON.parse(String(c[0]));
        return true;
      } catch {
        return false;
      }
    });
    expect(jsonCalls.length).toBeGreaterThanOrEqual(1);

    const output = JSON.parse(String(jsonCalls[0][0]));
    expect(output).toHaveProperty('handoffs');
    expect(output).toHaveProperty('avgDrift');
    expect(output).toHaveProperty('fidelityDistribution');
    expect(output).toHaveProperty('catalog');
    expect(output).toHaveProperty('pendingActions');

    consoleSpy.mockRestore();
  });

  it('outputs single CSV line with --quiet flag', async () => {
    setupFullState();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpStatusCommand(['--quiet']);

    expect(result).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    const output = String(consoleSpy.mock.calls[0][0]);
    // Should be a comma-separated summary
    expect(output).toContain(',');

    consoleSpy.mockRestore();
  });

  it('returns 0 with "No DACP data" message for empty state', async () => {
    setupEmptyState();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpStatusCommand([]);

    expect(result).toBe(0);
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Nn]o DACP data/);

    consoleSpy.mockRestore();
  });

  it('handles partial state gracefully (some files missing)', async () => {
    // Only status.json exists, other files are missing
    mockReadFile.mockImplementation(async (filePath: string) => {
      const path = String(filePath);
      if (path.includes('status.json')) return mockStatusJson;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockAccess.mockResolvedValue(undefined);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpStatusCommand([]);

    // Should not crash, should still return 0
    expect(result).toBe(0);

    consoleSpy.mockRestore();
  });
});

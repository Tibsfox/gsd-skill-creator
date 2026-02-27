/**
 * Tests for DACP history CLI command.
 *
 * Mocks filesystem reads to isolate CLI logic.
 * Verifies exit codes, pattern filtering, --last limit, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions
const { mockLog, mockReadFile } = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockReadFile: vi.fn(),
}));

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: mockLog,
}));

// Mock picocolors pass-through
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
}));

// Mock node:os
vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}));

import { dacpHistoryCommand } from './dacp-history.js';

// ── Fixtures ─────────────────────────────────────────────────────────

/**
 * Six entries for the same pattern to test --last filtering,
 * plus two entries for a different pattern.
 */
const mockDriftScoresJsonl = [
  '{"bundle_id":"b-001","pattern":"planner->executor:schema-task","score":0.45,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T10:00:00.000Z","intent_alignment":0.55,"rework_required":true,"tokens_spent_interpreting":1200,"code_modifications":3,"verification_pass":true}',
  '{"bundle_id":"b-002","pattern":"planner->executor:schema-task","score":0.38,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T09:50:00.000Z","intent_alignment":0.62,"rework_required":true,"tokens_spent_interpreting":1100,"code_modifications":2,"verification_pass":true}',
  '{"bundle_id":"b-003","pattern":"executor->verifier:test-handoff","score":0.12,"fidelity_level":1,"recommendation":"maintain","timestamp":"2026-02-27T09:40:00.000Z","intent_alignment":0.88,"rework_required":false,"tokens_spent_interpreting":400,"code_modifications":0,"verification_pass":true}',
  '{"bundle_id":"b-004","pattern":"planner->executor:schema-task","score":0.52,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T09:30:00.000Z","intent_alignment":0.48,"rework_required":true,"tokens_spent_interpreting":1400,"code_modifications":4,"verification_pass":false}',
  '{"bundle_id":"b-005","pattern":"planner->executor:schema-task","score":0.31,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T09:20:00.000Z","intent_alignment":0.69,"rework_required":false,"tokens_spent_interpreting":900,"code_modifications":1,"verification_pass":true}',
  '{"bundle_id":"b-006","pattern":"planner->executor:schema-task","score":0.41,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T09:10:00.000Z","intent_alignment":0.59,"rework_required":true,"tokens_spent_interpreting":1050,"code_modifications":2,"verification_pass":true}',
  '{"bundle_id":"b-007","pattern":"planner->executor:schema-task","score":0.35,"fidelity_level":2,"recommendation":"promote","timestamp":"2026-02-27T09:00:00.000Z","intent_alignment":0.65,"rework_required":false,"tokens_spent_interpreting":800,"code_modifications":1,"verification_pass":true}',
  '{"bundle_id":"b-008","pattern":"executor->verifier:test-handoff","score":0.04,"fidelity_level":1,"recommendation":"maintain","timestamp":"2026-02-27T08:50:00.000Z","intent_alignment":0.96,"rework_required":false,"tokens_spent_interpreting":200,"code_modifications":0,"verification_pass":true}',
].join('\n');

function setupValidData(): void {
  mockReadFile.mockResolvedValue(mockDriftScoresJsonl);
}

function setupEmptyFile(): void {
  mockReadFile.mockResolvedValue('');
}

function setupMissingFile(): void {
  mockReadFile.mockRejectedValue(
    Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe('dacpHistoryCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 and prints usage for --help', async () => {
    const result = await dacpHistoryCommand(['--help']);
    expect(result).toBe(0);
  });

  it('returns 1 with usage message when no pattern argument', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await dacpHistoryCommand([]);

    expect(result).toBe(1);

    consoleSpy.mockRestore();
  });

  it('filters entries matching the pattern', async () => {
    setupValidData();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpHistoryCommand(['planner->executor:schema-task']);

    expect(result).toBe(0);
    // Should have output with matching entries
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    // Should show drift scores from the matching pattern
    expect(allCalls).toMatch(/0\.\d/);

    consoleSpy.mockRestore();
  });

  it('limits results with --last flag', async () => {
    setupValidData();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpHistoryCommand([
      'planner->executor:schema-task',
      '--last',
      '3',
    ]);

    expect(result).toBe(0);

    consoleSpy.mockRestore();
  });

  it('outputs JSON array with --json flag', async () => {
    setupValidData();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpHistoryCommand([
      'planner->executor:schema-task',
      '--json',
    ]);

    expect(result).toBe(0);
    // Find the JSON output
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
    expect(Array.isArray(output)).toBe(true);
    expect(output.length).toBeGreaterThan(0);
    // All entries should match the pattern
    for (const entry of output) {
      expect(entry.pattern).toBe('planner->executor:schema-task');
    }

    consoleSpy.mockRestore();
  });

  it('prints "No handoffs found" for non-matching pattern', async () => {
    setupValidData();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpHistoryCommand(['nonexistent-pattern']);

    expect(result).toBe(0);
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Nn]o handoffs found/i);

    consoleSpy.mockRestore();
  });

  it('prints "No handoff history" for empty JSONL file', async () => {
    setupEmptyFile();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpHistoryCommand(['planner->executor:schema-task']);

    expect(result).toBe(0);
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Nn]o handoff history/i);

    consoleSpy.mockRestore();
  });

  it('prints "No handoff history" for missing JSONL file', async () => {
    setupMissingFile();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpHistoryCommand(['planner->executor:schema-task']);

    expect(result).toBe(0);
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Nn]o handoff history/i);

    consoleSpy.mockRestore();
  });
});

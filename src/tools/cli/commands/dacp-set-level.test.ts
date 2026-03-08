/**
 * Tests for DACP set-level CLI command.
 *
 * Mocks filesystem to isolate CLI logic from disk.
 * Verifies exit codes, validation, read-merge-write cycle, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions
const { mockLog, mockReadFile, mockWriteFile, mockMkdir } = vi.hoisted(
  () => ({
    mockLog: {
      error: vi.fn(),
      message: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
    },
    mockReadFile: vi.fn(),
    mockWriteFile: vi.fn(),
    mockMkdir: vi.fn(),
  }),
);

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
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

// Mock node:os
vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}));

import { dacpSetLevelCommand } from './dacp-set-level.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const existingOverrides = {
  'other-pattern': { level: 1, assembled_at: '2026-02-26T12:00:00.000Z' },
};

// ── Tests ────────────────────────────────────────────────────────────

describe('dacpSetLevelCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it('returns 0 and prints usage for --help', async () => {
    const result = await dacpSetLevelCommand(['--help']);
    expect(result).toBe(0);
  });

  it('returns 1 with usage when no arguments', async () => {
    const result = await dacpSetLevelCommand([]);
    expect(result).toBe(1);
  });

  it('returns 1 with usage when only pattern (missing level)', async () => {
    const result = await dacpSetLevelCommand(['planner->executor:task']);
    expect(result).toBe(1);
  });

  it('sets fidelity level 3 and writes overrides file', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpSetLevelCommand([
      'planner->executor:task-assignment',
      '3',
    ]);

    expect(result).toBe(0);
    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining('config'),
      { recursive: true },
    );
    expect(mockWriteFile).toHaveBeenCalled();

    // Verify the written content includes the override
    const writtenContent = JSON.parse(
      String(mockWriteFile.mock.calls[0][1]),
    );
    expect(writtenContent['planner->executor:task-assignment']).toBeDefined();
    expect(writtenContent['planner->executor:task-assignment'].level).toBe(3);
    expect(
      writtenContent['planner->executor:task-assignment'].assembled_at,
    ).toBeDefined();

    // Verify confirmation message
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.success.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toContain('planner->executor:task-assignment');
    expect(allCalls).toContain('Level 3');

    consoleSpy.mockRestore();
  });

  it('sets fidelity level 0 correctly', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );

    const result = await dacpSetLevelCommand([
      'planner->executor:task-assignment',
      '0',
    ]);

    expect(result).toBe(0);
    const writtenContent = JSON.parse(
      String(mockWriteFile.mock.calls[0][1]),
    );
    expect(writtenContent['planner->executor:task-assignment'].level).toBe(0);
  });

  it('rejects invalid level > 3', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpSetLevelCommand(['pattern', '5']);

    expect(result).toBe(1);
    const allCalls = [
      ...mockLog.error.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Ii]nvalid fidelity level/);

    consoleSpy.mockRestore();
  });

  it('rejects negative level', async () => {
    const result = await dacpSetLevelCommand(['pattern', '-1']);
    expect(result).toBe(1);
  });

  it('rejects non-numeric level', async () => {
    const result = await dacpSetLevelCommand(['pattern', 'abc']);
    expect(result).toBe(1);
  });

  it('creates config directory if it does not exist', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );

    await dacpSetLevelCommand(['pattern', '2']);

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining('config'),
      { recursive: true },
    );
  });

  it('starts from empty object when no overrides file exists', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );

    await dacpSetLevelCommand(['new-pattern', '1']);

    const writtenContent = JSON.parse(
      String(mockWriteFile.mock.calls[0][1]),
    );
    // Should contain only the new pattern
    expect(Object.keys(writtenContent)).toEqual(['new-pattern']);
  });

  it('outputs JSON with --json flag', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpSetLevelCommand([
      'planner->executor:task',
      '2',
      '--json',
    ]);

    expect(result).toBe(0);
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
    expect(output).toHaveProperty('pattern');
    expect(output).toHaveProperty('level');
    expect(output).toHaveProperty('assembled_at');

    consoleSpy.mockRestore();
  });

  it('preserves existing overrides when adding new one', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(existingOverrides));

    await dacpSetLevelCommand(['new-pattern', '3']);

    const writtenContent = JSON.parse(
      String(mockWriteFile.mock.calls[0][1]),
    );
    // Should have both the existing and the new override
    expect(writtenContent['other-pattern']).toBeDefined();
    expect(writtenContent['other-pattern'].level).toBe(1);
    expect(writtenContent['new-pattern']).toBeDefined();
    expect(writtenContent['new-pattern'].level).toBe(3);
  });
});

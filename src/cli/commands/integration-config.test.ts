/**
 * Tests for the integration config CLI command.
 *
 * Covers:
 * - Missing config file (exit 0 with defaults message)
 * - Empty config object (exit 0)
 * - Invalid config values (exit 1)
 * - Invalid JSON in config file (exit 1)
 * - JSON output mode (--json flag, valid and invalid)
 * - Show subcommand (with and without file)
 * - Help flag (--help / -h)
 * - Custom config path (--config flag)
 * - Default subcommand is validate
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { integrationConfigCommand } from './integration-config.js';

// Mock fs/promises for controlled file reading + writing (migrate --apply)
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock @clack/prompts to suppress output during tests
vi.mock('@clack/prompts', () => ({
  log: {
    message: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
  intro: vi.fn(),
  outro: vi.fn(),
}));

import { readFile, writeFile } from 'fs/promises';

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);

/** Find the JSON object emitted to stdout (helper for migrate --json assertions). */
function parseJsonOutput(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  const call = spy.mock.calls.find((c: unknown[]) => {
    try { JSON.parse(c[0] as string); return true; } catch { return false; }
  });
  if (!call) throw new Error('no JSON output found');
  return JSON.parse(call[0] as string);
}

describe('integrationConfigCommand', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // ============================================================================
  // Missing config file — validate exits 0
  // ============================================================================

  describe('missing config file', () => {
    it('returns exit 0 when config file does not exist (validate)', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const exitCode = await integrationConfigCommand(['validate']);
      expect(exitCode).toBe(0);
    });

    it('reads from .planning/skill-creator.json by default', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      await integrationConfigCommand(['validate']);
      expect(mockReadFile).toHaveBeenCalledWith(
        '.planning/skill-creator.json',
        'utf-8',
      );
    });
  });

  // ============================================================================
  // Empty config — validate exits 0
  // ============================================================================

  describe('empty config', () => {
    it('returns exit 0 for empty config object', async () => {
      mockReadFile.mockResolvedValue('{}');

      const exitCode = await integrationConfigCommand(['validate']);
      expect(exitCode).toBe(0);
    });
  });

  // ============================================================================
  // Invalid config — validate exits 1
  // ============================================================================

  describe('invalid config', () => {
    it('returns exit 1 for out-of-range values', async () => {
      mockReadFile.mockResolvedValue('{ "token_budget": { "max_percent": -5 } }');

      const exitCode = await integrationConfigCommand(['validate']);
      expect(exitCode).toBe(1);
    });

    it('returns exit 1 for wrong type values', async () => {
      mockReadFile.mockResolvedValue('{ "token_budget": { "max_percent": "high" } }');

      const exitCode = await integrationConfigCommand(['validate']);
      expect(exitCode).toBe(1);
    });
  });

  // ============================================================================
  // Invalid JSON — validate exits 1
  // ============================================================================

  describe('invalid JSON', () => {
    it('returns exit 1 for unparseable JSON', async () => {
      mockReadFile.mockResolvedValue('{bad');

      const exitCode = await integrationConfigCommand(['validate']);
      expect(exitCode).toBe(1);
    });
  });

  // ============================================================================
  // JSON mode — outputs valid JSON
  // ============================================================================

  describe('JSON output mode (--json)', () => {
    it('outputs valid JSON with valid: true for clean config', async () => {
      mockReadFile.mockResolvedValue('{}');

      const exitCode = await integrationConfigCommand(['validate', '--json']);
      expect(exitCode).toBe(0);

      const jsonCall = consoleLogSpy.mock.calls.find((call: unknown[]) => {
        try {
          JSON.parse(call[0] as string);
          return true;
        } catch {
          return false;
        }
      });
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed.valid).toBe(true);
      expect(parsed.errors).toEqual([]);
    });

    it('outputs valid JSON with valid: false for invalid config', async () => {
      mockReadFile.mockResolvedValue('{ "token_budget": { "max_percent": "high" } }');

      const exitCode = await integrationConfigCommand(['validate', '--json']);
      expect(exitCode).toBe(1);

      const jsonCall = consoleLogSpy.mock.calls.find((call: unknown[]) => {
        try {
          JSON.parse(call[0] as string);
          return true;
        } catch {
          return false;
        }
      });
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed.valid).toBe(false);
      expect(parsed.errors.length).toBeGreaterThan(0);
    });

    it('outputs valid JSON for missing config file', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const exitCode = await integrationConfigCommand(['validate', '--json']);
      expect(exitCode).toBe(0);

      const jsonCall = consoleLogSpy.mock.calls.find((call: unknown[]) => {
        try {
          JSON.parse(call[0] as string);
          return true;
        } catch {
          return false;
        }
      });
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed.valid).toBe(true);
    });
  });

  // ============================================================================
  // Show subcommand
  // ============================================================================

  describe('show subcommand', () => {
    it('exits 0 with effective config when file exists', async () => {
      mockReadFile.mockResolvedValue('{ "integration": { "wrapper_commands": false } }');

      const exitCode = await integrationConfigCommand(['show']);
      expect(exitCode).toBe(0);
    });

    it('exits 0 with defaults when file is missing', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const exitCode = await integrationConfigCommand(['show']);
      expect(exitCode).toBe(0);
    });

    it('exits 1 when file has invalid JSON', async () => {
      mockReadFile.mockResolvedValue('{bad');

      const exitCode = await integrationConfigCommand(['show']);
      expect(exitCode).toBe(1);
    });

    it('outputs raw JSON in --json mode', async () => {
      mockReadFile.mockResolvedValue('{}');

      const exitCode = await integrationConfigCommand(['show', '--json']);
      expect(exitCode).toBe(0);

      const jsonCall = consoleLogSpy.mock.calls.find((call: unknown[]) => {
        try {
          const parsed = JSON.parse(call[0] as string);
          // The show --json output is the config itself (has integration key)
          return parsed.integration !== undefined;
        } catch {
          return false;
        }
      });
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed.integration.auto_load_skills).toBe(true);
      expect(parsed.token_budget.max_percent).toBe(5);
    });
  });

  // ============================================================================
  // Help flag
  // ============================================================================

  describe('help flag', () => {
    it('returns exit 0 for --help', async () => {
      const exitCode = await integrationConfigCommand(['--help']);
      expect(exitCode).toBe(0);
    });

    it('returns exit 0 for -h', async () => {
      const exitCode = await integrationConfigCommand(['-h']);
      expect(exitCode).toBe(0);
    });

    it('does not read config file when --help is passed', async () => {
      await integrationConfigCommand(['--help']);
      expect(mockReadFile).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Custom config path
  // ============================================================================

  describe('custom config path (--config)', () => {
    it('reads from custom path when --config flag is used', async () => {
      mockReadFile.mockResolvedValue('{}');

      await integrationConfigCommand(['validate', '--config=/custom/path.json']);
      expect(mockReadFile).toHaveBeenCalledWith('/custom/path.json', 'utf-8');
    });
  });

  // ============================================================================
  // Default subcommand is validate
  // ============================================================================

  describe('default subcommand', () => {
    it('defaults to validate when no subcommand given', async () => {
      mockReadFile.mockResolvedValue('{}');

      const exitCode = await integrationConfigCommand([]);
      expect(exitCode).toBe(0);

      // Verify it actually called readFile (validate behavior)
      expect(mockReadFile).toHaveBeenCalled();
    });

    it('empty args behaves same as explicit validate', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const exitCode1 = await integrationConfigCommand([]);
      vi.clearAllMocks();
      mockReadFile.mockRejectedValue(err);
      const exitCode2 = await integrationConfigCommand(['validate']);

      expect(exitCode1).toBe(exitCode2);
    });
  });

  // ============================================================================
  // migrate subcommand (v1.49.984 — delete explicit mine_active_skills:false)
  // ============================================================================

  describe('migrate subcommand', () => {
    it('dry-run (no --apply) on explicit-false: exit 0, delete-key, NO write', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ observation: { mine_active_skills: false, retention_days: 90 } }, null, 2),
      );

      const exitCode = await integrationConfigCommand(['migrate', '--json']);
      expect(exitCode).toBe(0);
      expect(mockWriteFile).not.toHaveBeenCalled();

      const out = parseJsonOutput(consoleLogSpy);
      expect(out.action).toBe('delete-key');
      expect(out.applied).toBe(false);
    });

    it('--apply on explicit-false: deletes the key, backs up the original, sibling fields preserved', async () => {
      const original = JSON.stringify(
        { observation: { mine_active_skills: false, retention_days: 90, max_entries: 1000 } },
        null, 2,
      );
      mockReadFile.mockResolvedValue(original);
      mockWriteFile.mockResolvedValue(undefined);

      const exitCode = await integrationConfigCommand(['migrate', '--apply', '--json']);
      expect(exitCode).toBe(0);

      // Two writes: backup first (original content), then the migrated config.
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      const [backupPath, backupContent] = mockWriteFile.mock.calls[0] as [string, string];
      expect(backupPath).toMatch(/^\.planning\/skill-creator\.json\.bak\.\d+$/);
      expect(backupContent).toBe(original);

      const [cfgPath, cfgContent] = mockWriteFile.mock.calls[1] as [string, string];
      expect(cfgPath).toBe('.planning/skill-creator.json');
      const written = JSON.parse(cfgContent);
      expect(written.observation.mine_active_skills).toBeUndefined(); // key removed
      expect(written.observation.retention_days).toBe(90);            // sibling preserved
      expect(written.observation.max_entries).toBe(1000);             // sibling preserved
      expect(cfgContent.endsWith('\n')).toBe(true);                   // trailing newline

      const out = parseJsonOutput(consoleLogSpy);
      expect(out.action).toBe('delete-key');
      expect(out.applied).toBe(true);
      expect(out.backup).toMatch(/\.bak\.\d+$/);
    });

    it('no-op when the key is absent (already inherits the default)', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ observation: { retention_days: 90 } }, null, 2));

      const exitCode = await integrationConfigCommand(['migrate', '--apply', '--json']);
      expect(exitCode).toBe(0);
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(parseJsonOutput(consoleLogSpy).action).toBe('none');
    });

    it('no-op when the key is already true', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ observation: { mine_active_skills: true } }, null, 2));

      const exitCode = await integrationConfigCommand(['migrate', '--apply', '--json']);
      expect(exitCode).toBe(0);
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(parseJsonOutput(consoleLogSpy).action).toBe('none');
    });

    it('no-op (exit 0) when the config file is missing', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const exitCode = await integrationConfigCommand(['migrate', '--json']);
      expect(exitCode).toBe(0);
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(parseJsonOutput(consoleLogSpy).action).toBe('none');
    });

    it('exit 1 on unparseable JSON (no write)', async () => {
      mockReadFile.mockResolvedValue('{bad');

      const exitCode = await integrationConfigCommand(['migrate', '--apply']);
      expect(exitCode).toBe(1);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('--apply succeeds even when an UNRELATED sibling is schema-invalid (delete-only is provably safe)', async () => {
      // retention_days:9999 is out of the valid range, but migrate only removes
      // mine_active_skills and must NOT be blocked by unrelated pre-existing drift
      // (the operator runs `validate` for that). The drift is preserved untouched.
      const original = JSON.stringify({ observation: { mine_active_skills: false, retention_days: 9999 } }, null, 2);
      mockReadFile.mockResolvedValue(original);
      mockWriteFile.mockResolvedValue(undefined);

      const exitCode = await integrationConfigCommand(['migrate', '--apply', '--json']);
      expect(exitCode).toBe(0);
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      const [, cfgContent] = mockWriteFile.mock.calls[1] as [string, string];
      const written = JSON.parse(cfgContent);
      expect(written.observation.mine_active_skills).toBeUndefined();
      expect(written.observation.retention_days).toBe(9999); // unrelated drift preserved
      expect(parseJsonOutput(consoleLogSpy).applied).toBe(true);
    });

    it('idempotent: re-running on the post-migration (absent-key) config is a no-op', async () => {
      // First apply removes the key; simulate the resulting on-disk state.
      mockReadFile.mockResolvedValue(JSON.stringify({ observation: { retention_days: 90 } }, null, 2));
      const exitCode = await integrationConfigCommand(['migrate', '--apply', '--json']);
      expect(exitCode).toBe(0);
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(parseJsonOutput(consoleLogSpy).action).toBe('none');
    });
  });
});

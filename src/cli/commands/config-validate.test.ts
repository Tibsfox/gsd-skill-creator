/**
 * Tests for the config validate CLI command.
 *
 * Covers:
 * - Missing config file (exit 0 with message)
 * - Invalid JSON in config file (exit 1)
 * - Valid config with all defaults (exit 0, no issues)
 * - Config with type errors (exit 1)
 * - Config with warnings only (exit 0)
 * - Config with security issues (exit 0)
 * - JSON output mode (--json flag)
 * - Help flag (--help)
 * - Custom config path (--config flag)
 * - Combined errors + warnings + security
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configValidateCommand } from './config-validate.js';

// Mock fs/promises for controlled file reading
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
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

import { readFile } from 'fs/promises';

const mockReadFile = vi.mocked(readFile);

describe('configValidateCommand', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // ============================================================================
  // Missing config file
  // ============================================================================

  describe('missing config file', () => {
    it('returns exit 0 when config file does not exist', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(0);
    });

    it('reads from .planning/config.json by default', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      await configValidateCommand([]);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        'utf-8'
      );
    });
  });

  // ============================================================================
  // Invalid JSON
  // ============================================================================

  describe('invalid JSON', () => {
    it('returns exit 1 for unparseable JSON', async () => {
      mockReadFile.mockResolvedValue('not valid json {{{');

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(1);
    });
  });

  // ============================================================================
  // Valid config (all defaults)
  // ============================================================================

  describe('valid config (no issues)', () => {
    it('returns exit 0 for empty config object', async () => {
      mockReadFile.mockResolvedValue('{}');

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(0);
    });

    it('returns exit 0 for fully in-range config', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        mode: 'interactive',
        verbosity: 3,
        depth: 'standard',
        model_profile: 'balanced',
        safety: {
          max_files_per_commit: 20,
          require_tests: true,
        },
        gates: {
          require_plan_approval: false,
          require_checkpoint_approval: true,
        },
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(0);
    });
  });

  // ============================================================================
  // Type errors (exit 1)
  // ============================================================================

  describe('type errors', () => {
    it('returns exit 1 when config has type errors', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        verbosity: 'high',
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(1);
    });

    it('returns exit 1 for invalid enum values', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        mode: 'turbo',
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(1);
    });

    it('returns exit 1 for out-of-range values', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        verbosity: 10,
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(1);
    });
  });

  // ============================================================================
  // Warnings only (exit 0)
  // ============================================================================

  describe('warnings only', () => {
    it('returns exit 0 when config has only warnings', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        safety: { max_files_per_commit: 75 },
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(0);
    });
  });

  // ============================================================================
  // Security issues (exit 0)
  // ============================================================================

  describe('security issues', () => {
    it('returns exit 0 when config has only security issues', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        mode: 'yolo',
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(0);
    });

    it('returns exit 0 for disabled tests (security warning but not error)', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        safety: { require_tests: false },
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(0);
    });
  });

  // ============================================================================
  // JSON output mode
  // ============================================================================

  describe('JSON output mode (--json)', () => {
    it('outputs valid JSON for a clean config', async () => {
      mockReadFile.mockResolvedValue('{}');

      const exitCode = await configValidateCommand(['--json']);
      expect(exitCode).toBe(0);

      // Find the JSON output call
      const jsonCall = consoleLogSpy.mock.calls.find(
        (call: unknown[]) => {
          try {
            JSON.parse(call[0] as string);
            return true;
          } catch {
            return false;
          }
        }
      );
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed.valid).toBe(true);
      expect(parsed.errors).toEqual([]);
      expect(parsed.warnings).toEqual([]);
      expect(parsed.securityIssues).toEqual([]);
    });

    it('outputs valid JSON with errors for invalid config', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        verbosity: 'high',
      }));

      const exitCode = await configValidateCommand(['--json']);
      expect(exitCode).toBe(1);

      const jsonCall = consoleLogSpy.mock.calls.find(
        (call: unknown[]) => {
          try {
            JSON.parse(call[0] as string);
            return true;
          } catch {
            return false;
          }
        }
      );
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed.valid).toBe(false);
      expect(parsed.errors.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Help flag
  // ============================================================================

  describe('help flag', () => {
    it('returns exit 0 for --help', async () => {
      const exitCode = await configValidateCommand(['--help']);
      expect(exitCode).toBe(0);
    });

    it('returns exit 0 for -h', async () => {
      const exitCode = await configValidateCommand(['-h']);
      expect(exitCode).toBe(0);
    });

    it('does not read config file when --help is passed', async () => {
      await configValidateCommand(['--help']);
      expect(mockReadFile).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Custom config path
  // ============================================================================

  describe('custom config path (--config)', () => {
    it('reads from custom path when --config flag is used', async () => {
      mockReadFile.mockResolvedValue('{}');

      await configValidateCommand(['--config=/custom/path/config.json']);
      expect(mockReadFile).toHaveBeenCalledWith('/custom/path/config.json', 'utf-8');
    });
  });

  // ============================================================================
  // Combined scenarios
  // ============================================================================

  describe('combined scenarios', () => {
    it('returns exit 1 when errors exist alongside warnings and security issues', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        mode: 'yolo',
        verbosity: 'loud',
        safety: { max_files_per_commit: 75 },
      }));

      const exitCode = await configValidateCommand([]);
      expect(exitCode).toBe(1);
    });
  });
});

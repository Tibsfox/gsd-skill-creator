/**
 * Tests for the integration config reader.
 *
 * Covers:
 * - Missing file returns all defaults (CONFIG-05)
 * - Empty JSON object returns defaults
 * - Partial override merges with defaults
 * - Full valid config roundtrip
 * - Invalid JSON throws IntegrationConfigError
 * - Out-of-range value throws IntegrationConfigError
 * - Wrong type throws IntegrationConfigError
 * - Custom config path
 * - Pure validateIntegrationConfig function
 * - Non-ENOENT errors propagate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  readIntegrationConfig,
  validateIntegrationConfig,
  IntegrationConfigError,
  DEFAULT_CONFIG_PATH,
} from './reader.js';
import { DEFAULT_INTEGRATION_CONFIG } from './schema.js';

// Mock fs/promises for controlled file reading
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'fs/promises';

const mockReadFile = vi.mocked(readFile);

describe('readIntegrationConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Missing file returns defaults (CONFIG-05)
  // ==========================================================================

  describe('missing config file', () => {
    it('returns all defaults when file does not exist', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const config = await readIntegrationConfig();

      expect(config).toEqual(DEFAULT_INTEGRATION_CONFIG);
    });

    it('defaults have expected values', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const config = await readIntegrationConfig();

      // All toggles are true
      expect(config.integration.auto_load_skills).toBe(true);
      expect(config.integration.observe_sessions).toBe(true);
      expect(config.integration.phase_transition_hooks).toBe(true);
      expect(config.integration.suggest_on_session_start).toBe(true);
      expect(config.integration.install_git_hooks).toBe(true);
      expect(config.integration.wrapper_commands).toBe(true);

      // Token budget
      expect(config.token_budget.max_percent).toBe(5);
      expect(config.token_budget.warn_at_percent).toBe(4);

      // Observation
      expect(config.observation.retention_days).toBe(90);
      expect(config.observation.max_entries).toBe(1000);
      expect(config.observation.capture_corrections).toBe(true);

      // Suggestions
      expect(config.suggestions.min_occurrences).toBe(3);
      expect(config.suggestions.cooldown_days).toBe(7);
      expect(config.suggestions.auto_dismiss_after_days).toBe(30);
    });

    it('reads from DEFAULT_CONFIG_PATH by default', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      await readIntegrationConfig();

      expect(mockReadFile).toHaveBeenCalledWith(DEFAULT_CONFIG_PATH, 'utf-8');
      expect(DEFAULT_CONFIG_PATH).toBe('.planning/skill-creator.json');
    });
  });

  // ==========================================================================
  // Empty JSON object returns defaults
  // ==========================================================================

  describe('empty config', () => {
    it('returns all defaults for empty JSON object', async () => {
      mockReadFile.mockResolvedValue('{}');

      const config = await readIntegrationConfig();

      expect(config).toEqual(DEFAULT_INTEGRATION_CONFIG);
    });
  });

  // ==========================================================================
  // Partial override merges with defaults
  // ==========================================================================

  describe('partial overrides', () => {
    it('merges partial integration toggles with defaults', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ integration: { wrapper_commands: false } }),
      );

      const config = await readIntegrationConfig();

      // Overridden value
      expect(config.integration.wrapper_commands).toBe(false);

      // Other toggles remain true (defaults)
      expect(config.integration.auto_load_skills).toBe(true);
      expect(config.integration.observe_sessions).toBe(true);
      expect(config.integration.phase_transition_hooks).toBe(true);
      expect(config.integration.suggest_on_session_start).toBe(true);
      expect(config.integration.install_git_hooks).toBe(true);

      // Other sections get defaults
      expect(config.token_budget).toEqual(DEFAULT_INTEGRATION_CONFIG.token_budget);
      expect(config.observation).toEqual(DEFAULT_INTEGRATION_CONFIG.observation);
      expect(config.suggestions).toEqual(DEFAULT_INTEGRATION_CONFIG.suggestions);
    });

    it('merges partial token budget with defaults', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ token_budget: { max_percent: 10 } }),
      );

      const config = await readIntegrationConfig();

      expect(config.token_budget.max_percent).toBe(10);
      expect(config.token_budget.warn_at_percent).toBe(4); // default
    });
  });

  // ==========================================================================
  // Full valid config roundtrip
  // ==========================================================================

  describe('full config', () => {
    it('parses a complete config without overriding explicit values', async () => {
      const fullConfig = {
        integration: {
          auto_load_skills: false,
          observe_sessions: false,
          phase_transition_hooks: false,
          suggest_on_session_start: false,
          install_git_hooks: false,
          wrapper_commands: false,
        },
        token_budget: {
          max_percent: 10,
          warn_at_percent: 8,
        },
        observation: {
          retention_days: 30,
          max_entries: 500,
          capture_corrections: false,
        },
        suggestions: {
          min_occurrences: 5,
          cooldown_days: 14,
          auto_dismiss_after_days: 60,
        },
        terminal: {
          port: 9090,
          base_path: '/term',
          auth_mode: 'none' as const,
          theme: 'light' as const,
          session_name: 'custom',
        },
      };

      mockReadFile.mockResolvedValue(JSON.stringify(fullConfig));

      const config = await readIntegrationConfig();

      expect(config).toEqual(fullConfig);
    });
  });

  // ==========================================================================
  // Invalid JSON
  // ==========================================================================

  describe('invalid JSON', () => {
    it('throws IntegrationConfigError with "Invalid JSON" message', async () => {
      mockReadFile.mockResolvedValue('{bad json');

      await expect(readIntegrationConfig()).rejects.toThrow(IntegrationConfigError);
      await expect(readIntegrationConfig()).rejects.toThrow(/Invalid JSON/);
    });
  });

  // ==========================================================================
  // Out-of-range values
  // ==========================================================================

  describe('out-of-range values', () => {
    it('throws IntegrationConfigError for negative max_percent', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ token_budget: { max_percent: -5 } }),
      );

      await expect(readIntegrationConfig()).rejects.toThrow(IntegrationConfigError);
      await expect(readIntegrationConfig()).rejects.toThrow(/token_budget/);
    });

    it('throws IntegrationConfigError for retention_days exceeding max', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ observation: { retention_days: 999 } }),
      );

      await expect(readIntegrationConfig()).rejects.toThrow(IntegrationConfigError);
    });
  });

  // ==========================================================================
  // Wrong type
  // ==========================================================================

  describe('wrong type', () => {
    it('throws IntegrationConfigError for string instead of boolean', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ integration: { auto_load_skills: 'yes' } }),
      );

      await expect(readIntegrationConfig()).rejects.toThrow(IntegrationConfigError);
    });
  });

  // ==========================================================================
  // Custom config path
  // ==========================================================================

  describe('custom config path', () => {
    it('reads from the specified path', async () => {
      mockReadFile.mockResolvedValue('{}');

      await readIntegrationConfig('/custom/path.json');

      expect(mockReadFile).toHaveBeenCalledWith('/custom/path.json', 'utf-8');
    });
  });

  // ==========================================================================
  // Non-ENOENT errors propagate
  // ==========================================================================

  describe('non-ENOENT errors', () => {
    it('propagates EACCES errors', async () => {
      const err = new Error('Permission denied') as NodeJS.ErrnoException;
      err.code = 'EACCES';
      mockReadFile.mockRejectedValue(err);

      await expect(readIntegrationConfig()).rejects.toThrow('Permission denied');
    });

    it('does not catch non-ENOENT errors as missing file', async () => {
      const err = new Error('Permission denied') as NodeJS.ErrnoException;
      err.code = 'EACCES';
      mockReadFile.mockRejectedValue(err);

      await expect(readIntegrationConfig()).rejects.not.toThrow(IntegrationConfigError);
    });
  });
});

// =============================================================================
// validateIntegrationConfig (pure function)
// =============================================================================

describe('validateIntegrationConfig', () => {
  it('returns valid=true with defaults for empty object', () => {
    const result = validateIntegrationConfig({});

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.config).toEqual(DEFAULT_INTEGRATION_CONFIG);
    }
  });

  it('returns valid=true with parsed config for valid input', () => {
    const result = validateIntegrationConfig({
      token_budget: { max_percent: 10 },
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.config.token_budget.max_percent).toBe(10);
      expect(result.config.token_budget.warn_at_percent).toBe(4); // default
    }
  });

  it('returns valid=false with errors for out-of-range value', () => {
    const result = validateIntegrationConfig({
      token_budget: { max_percent: -1 },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('token_budget'))).toBe(true);
    }
  });

  it('returns valid=false with errors for wrong type', () => {
    const result = validateIntegrationConfig({
      integration: { auto_load_skills: 'yes' },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('error strings contain field paths', () => {
    const result = validateIntegrationConfig({
      observation: { retention_days: 0 },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('observation.retention_days'))).toBe(true);
    }
  });
});

// =============================================================================
// Terminal config via reader
// =============================================================================

describe('terminal config via reader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns terminal defaults when file is missing', async () => {
    const err = new Error('ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReadFile.mockRejectedValue(err);

    const config = await readIntegrationConfig();

    expect(config.terminal).toEqual({
      port: 11338,
      base_path: '/terminal',
      auth_mode: 'none',
      theme: 'dark',
      session_name: 'dev',
    });
  });

  it('returns terminal defaults for empty JSON object', async () => {
    mockReadFile.mockResolvedValue('{}');

    const config = await readIntegrationConfig();

    expect(config.terminal).toEqual({
      port: 11338,
      base_path: '/terminal',
      auth_mode: 'none',
      theme: 'dark',
      session_name: 'dev',
    });
  });

  it('merges partial terminal override with defaults', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ terminal: { port: 4000 } }),
    );

    const config = await readIntegrationConfig();

    expect(config.terminal.port).toBe(4000);
    expect(config.terminal.base_path).toBe('/terminal');
    expect(config.terminal.auth_mode).toBe('none');
    expect(config.terminal.theme).toBe('dark');
  });

  it('throws IntegrationConfigError for invalid terminal value', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ terminal: { port: -1 } }),
    );

    await expect(readIntegrationConfig()).rejects.toThrow(IntegrationConfigError);
  });
});

// =============================================================================
// validateIntegrationConfig with terminal
// =============================================================================

describe('validateIntegrationConfig with terminal', () => {
  it('returns config with terminal defaults for empty object', () => {
    const result = validateIntegrationConfig({});

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.config.terminal).toEqual({
        port: 11338,
        base_path: '/terminal',
        auth_mode: 'none',
        theme: 'dark',
        session_name: 'dev',
      });
    }
  });

  it('returns valid=false for invalid terminal theme', () => {
    const result = validateIntegrationConfig({
      terminal: { theme: 'blue' },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

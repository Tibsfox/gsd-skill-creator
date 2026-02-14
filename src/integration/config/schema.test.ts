/**
 * TDD tests for the integration config Zod schema.
 *
 * Covers all four CONFIG requirements:
 * - CONFIG-01: Feature toggles (all default true, individually settable)
 * - CONFIG-02: Token budget (max_percent, warn_at_percent with ranges)
 * - CONFIG-03: Observation retention (retention_days, max_entries, capture_corrections)
 * - CONFIG-04: Suggestion settings (min_occurrences, cooldown_days, auto_dismiss_after_days)
 *
 * @module integration/config/schema.test
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { IntegrationConfigSchema, DEFAULT_INTEGRATION_CONFIG } from './schema.js';

// ============================================================================
// Defaults from empty object
// ============================================================================

describe('IntegrationConfigSchema defaults', () => {
  it('produces a complete config from an empty object', () => {
    const config = IntegrationConfigSchema.parse({});

    // All four sections must be present
    expect(config).toHaveProperty('integration');
    expect(config).toHaveProperty('token_budget');
    expect(config).toHaveProperty('observation');
    expect(config).toHaveProperty('suggestions');
  });

  it('populates all 6 integration toggles as true', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.integration.auto_load_skills).toBe(true);
    expect(config.integration.observe_sessions).toBe(true);
    expect(config.integration.phase_transition_hooks).toBe(true);
    expect(config.integration.suggest_on_session_start).toBe(true);
    expect(config.integration.install_git_hooks).toBe(true);
    expect(config.integration.wrapper_commands).toBe(true);
  });

  it('populates token_budget with max_percent=5 and warn_at_percent=4', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.token_budget.max_percent).toBe(5);
    expect(config.token_budget.warn_at_percent).toBe(4);
  });

  it('populates observation with retention_days=90, max_entries=1000, capture_corrections=true', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.observation.retention_days).toBe(90);
    expect(config.observation.max_entries).toBe(1000);
    expect(config.observation.capture_corrections).toBe(true);
  });

  it('populates suggestions with min_occurrences=3, cooldown_days=7, auto_dismiss_after_days=30', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.suggestions.min_occurrences).toBe(3);
    expect(config.suggestions.cooldown_days).toBe(7);
    expect(config.suggestions.auto_dismiss_after_days).toBe(30);
  });
});

// ============================================================================
// CONFIG-01: Feature Toggles
// ============================================================================

describe('CONFIG-01: Feature toggles', () => {
  it('allows auto_load_skills to be set to false independently', () => {
    const config = IntegrationConfigSchema.parse({
      integration: { auto_load_skills: false },
    });

    expect(config.integration.auto_load_skills).toBe(false);
    expect(config.integration.observe_sessions).toBe(true);
    expect(config.integration.phase_transition_hooks).toBe(true);
    expect(config.integration.suggest_on_session_start).toBe(true);
    expect(config.integration.install_git_hooks).toBe(true);
    expect(config.integration.wrapper_commands).toBe(true);
  });

  it('allows observe_sessions to be set to false independently', () => {
    const config = IntegrationConfigSchema.parse({
      integration: { observe_sessions: false },
    });

    expect(config.integration.observe_sessions).toBe(false);
    expect(config.integration.auto_load_skills).toBe(true);
    expect(config.integration.phase_transition_hooks).toBe(true);
  });

  it('allows install_git_hooks to be set to false independently', () => {
    const config = IntegrationConfigSchema.parse({
      integration: { install_git_hooks: false },
    });

    expect(config.integration.install_git_hooks).toBe(false);
    expect(config.integration.auto_load_skills).toBe(true);
    expect(config.integration.wrapper_commands).toBe(true);
  });

  it('allows multiple toggles to be set to false simultaneously', () => {
    const config = IntegrationConfigSchema.parse({
      integration: {
        auto_load_skills: false,
        wrapper_commands: false,
        suggest_on_session_start: false,
      },
    });

    expect(config.integration.auto_load_skills).toBe(false);
    expect(config.integration.wrapper_commands).toBe(false);
    expect(config.integration.suggest_on_session_start).toBe(false);
    // Remaining toggles stay true
    expect(config.integration.observe_sessions).toBe(true);
    expect(config.integration.phase_transition_hooks).toBe(true);
    expect(config.integration.install_git_hooks).toBe(true);
  });
});

// ============================================================================
// CONFIG-02: Token Budget
// ============================================================================

describe('CONFIG-02: Token budget', () => {
  it('allows overriding max_percent without affecting warn_at_percent', () => {
    const config = IntegrationConfigSchema.parse({
      token_budget: { max_percent: 10 },
    });

    expect(config.token_budget.max_percent).toBe(10);
    expect(config.token_budget.warn_at_percent).toBe(4);
  });

  it('allows overriding warn_at_percent without affecting max_percent', () => {
    const config = IntegrationConfigSchema.parse({
      token_budget: { warn_at_percent: 3 },
    });

    expect(config.token_budget.max_percent).toBe(5);
    expect(config.token_budget.warn_at_percent).toBe(3);
  });

  it('accepts boundary values (1 and 100)', () => {
    const config = IntegrationConfigSchema.parse({
      token_budget: { max_percent: 100, warn_at_percent: 1 },
    });

    expect(config.token_budget.max_percent).toBe(100);
    expect(config.token_budget.warn_at_percent).toBe(1);
  });
});

// ============================================================================
// CONFIG-03: Observation Retention
// ============================================================================

describe('CONFIG-03: Observation retention', () => {
  it('allows overriding retention_days without affecting other fields', () => {
    const config = IntegrationConfigSchema.parse({
      observation: { retention_days: 30 },
    });

    expect(config.observation.retention_days).toBe(30);
    expect(config.observation.max_entries).toBe(1000);
    expect(config.observation.capture_corrections).toBe(true);
  });

  it('allows setting capture_corrections to false', () => {
    const config = IntegrationConfigSchema.parse({
      observation: { capture_corrections: false },
    });

    expect(config.observation.capture_corrections).toBe(false);
    expect(config.observation.retention_days).toBe(90);
  });

  it('accepts boundary values for max_entries (100 and 100000)', () => {
    const low = IntegrationConfigSchema.parse({
      observation: { max_entries: 100 },
    });
    expect(low.observation.max_entries).toBe(100);

    const high = IntegrationConfigSchema.parse({
      observation: { max_entries: 100000 },
    });
    expect(high.observation.max_entries).toBe(100000);
  });
});

// ============================================================================
// CONFIG-04: Suggestion Settings
// ============================================================================

describe('CONFIG-04: Suggestion settings', () => {
  it('allows overriding min_occurrences without affecting other fields', () => {
    const config = IntegrationConfigSchema.parse({
      suggestions: { min_occurrences: 5 },
    });

    expect(config.suggestions.min_occurrences).toBe(5);
    expect(config.suggestions.cooldown_days).toBe(7);
    expect(config.suggestions.auto_dismiss_after_days).toBe(30);
  });

  it('allows overriding cooldown_days and auto_dismiss_after_days', () => {
    const config = IntegrationConfigSchema.parse({
      suggestions: {
        cooldown_days: 14,
        auto_dismiss_after_days: 60,
      },
    });

    expect(config.suggestions.cooldown_days).toBe(14);
    expect(config.suggestions.auto_dismiss_after_days).toBe(60);
    expect(config.suggestions.min_occurrences).toBe(3);
  });
});

// ============================================================================
// Partial overrides (cross-section)
// ============================================================================

describe('Partial overrides across sections', () => {
  it('overriding one section does not affect other sections', () => {
    const config = IntegrationConfigSchema.parse({
      integration: { auto_load_skills: false },
      token_budget: { max_percent: 10 },
    });

    // Overridden values
    expect(config.integration.auto_load_skills).toBe(false);
    expect(config.token_budget.max_percent).toBe(10);

    // Untouched sections retain defaults
    expect(config.observation.retention_days).toBe(90);
    expect(config.suggestions.min_occurrences).toBe(3);
  });
});

// ============================================================================
// Range validation (Zod errors)
// ============================================================================

describe('Range validation', () => {
  it('rejects token_budget.max_percent below minimum (0)', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ token_budget: { max_percent: 0 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects token_budget.max_percent above maximum (101)', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ token_budget: { max_percent: 101 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects negative observation.retention_days (-1)', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ observation: { retention_days: -1 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects observation.max_entries below minimum (50)', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ observation: { max_entries: 50 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects suggestions.min_occurrences of 0', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ suggestions: { min_occurrences: 0 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects token_budget.warn_at_percent above 100', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ token_budget: { warn_at_percent: 101 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects observation.retention_days above 365', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ observation: { retention_days: 366 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects suggestions.cooldown_days above 365', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ suggestions: { cooldown_days: 366 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects observation.max_entries above 100000', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ observation: { max_entries: 100001 } }),
    ).toThrow(z.ZodError);
  });
});

// ============================================================================
// Type validation (wrong types)
// ============================================================================

describe('Type validation', () => {
  it('rejects string where boolean expected (auto_load_skills: "yes")', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ integration: { auto_load_skills: 'yes' } }),
    ).toThrow(z.ZodError);
  });

  it('rejects string where number expected (max_percent: "five")', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ token_budget: { max_percent: 'five' } }),
    ).toThrow(z.ZodError);
  });

  it('rejects boolean where number expected (retention_days: true)', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ observation: { retention_days: true } }),
    ).toThrow(z.ZodError);
  });

  it('rejects number where boolean expected (capture_corrections: 1)', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ observation: { capture_corrections: 1 } }),
    ).toThrow(z.ZodError);
  });
});

// ============================================================================
// DEFAULT_INTEGRATION_CONFIG constant
// ============================================================================

describe('DEFAULT_INTEGRATION_CONFIG', () => {
  it('deep-equals IntegrationConfigSchema.parse({})', () => {
    const parsed = IntegrationConfigSchema.parse({});
    expect(DEFAULT_INTEGRATION_CONFIG).toEqual(parsed);
  });

  it('is a frozen-in-time snapshot (not a live reference)', () => {
    // Verify it's a plain object, not a getter or proxy
    expect(typeof DEFAULT_INTEGRATION_CONFIG).toBe('object');
    expect(DEFAULT_INTEGRATION_CONFIG).not.toBeNull();
  });
});

// ============================================================================
// Full valid config roundtrip
// ============================================================================

describe('Full config roundtrip', () => {
  it('preserves all values when a fully specified config is parsed', () => {
    const fullConfig = {
      integration: {
        auto_load_skills: false,
        observe_sessions: false,
        phase_transition_hooks: true,
        suggest_on_session_start: false,
        install_git_hooks: true,
        wrapper_commands: false,
      },
      token_budget: {
        max_percent: 15,
        warn_at_percent: 12,
      },
      observation: {
        retention_days: 180,
        max_entries: 5000,
        capture_corrections: false,
      },
      suggestions: {
        min_occurrences: 5,
        cooldown_days: 14,
        auto_dismiss_after_days: 60,
      },
      terminal: {
        port: 4000,
        base_path: '/shell',
        auth_mode: 'none' as const,
        theme: 'light' as const,
        session_name: 'work',
      },
    };

    const parsed = IntegrationConfigSchema.parse(fullConfig);
    expect(parsed).toEqual(fullConfig);
  });
});

// ============================================================================
// CONF-02: Terminal defaults in composite config
// ============================================================================

describe('Terminal defaults in composite config', () => {
  it('produces terminal section from empty object', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config).toHaveProperty('terminal');
  });

  it('has port=11338 by default', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.terminal.port).toBe(11338);
  });

  it('has base_path="/terminal" by default', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.terminal.base_path).toBe('/terminal');
  });

  it('has auth_mode="none" by default', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.terminal.auth_mode).toBe('none');
  });

  it('has theme="dark" by default', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.terminal.theme).toBe('dark');
  });
});

// ============================================================================
// CONF-02: Terminal partial overrides in composite config
// ============================================================================

describe('Terminal partial overrides in composite config', () => {
  it('allows overriding port without affecting other terminal fields', () => {
    const config = IntegrationConfigSchema.parse({ terminal: { port: 8080 } });

    expect(config.terminal.port).toBe(8080);
    expect(config.terminal.base_path).toBe('/terminal');
    expect(config.terminal.auth_mode).toBe('none');
    expect(config.terminal.theme).toBe('dark');
  });

  it('does not affect other config sections when terminal is overridden', () => {
    const config = IntegrationConfigSchema.parse({ terminal: { port: 8080 } });

    // Existing sections retain defaults
    expect(config.integration.auto_load_skills).toBe(true);
    expect(config.token_budget.max_percent).toBe(5);
    expect(config.observation.retention_days).toBe(90);
    expect(config.suggestions.min_occurrences).toBe(3);
  });

  it('allows overriding theme to light', () => {
    const config = IntegrationConfigSchema.parse({ terminal: { theme: 'light' } });

    expect(config.terminal.theme).toBe('light');
    expect(config.terminal.port).toBe(11338);
  });
});

// ============================================================================
// CONF-02: Terminal validation in composite config
// ============================================================================

describe('Terminal validation in composite config', () => {
  it('rejects terminal port of 0', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ terminal: { port: 0 } }),
    ).toThrow(z.ZodError);
  });

  it('rejects invalid auth_mode', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ terminal: { auth_mode: 'password' } }),
    ).toThrow(z.ZodError);
  });

  it('rejects invalid theme value', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ terminal: { theme: 'blue' } }),
    ).toThrow(z.ZodError);
  });

  it('rejects empty base_path', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ terminal: { base_path: '' } }),
    ).toThrow(z.ZodError);
  });
});

// ============================================================================
// Full config roundtrip with terminal
// ============================================================================

describe('Full config roundtrip with terminal', () => {
  it('preserves all values including terminal when fully specified', () => {
    const fullConfig = {
      integration: {
        auto_load_skills: false,
        observe_sessions: true,
        phase_transition_hooks: true,
        suggest_on_session_start: false,
        install_git_hooks: true,
        wrapper_commands: false,
      },
      token_budget: {
        max_percent: 15,
        warn_at_percent: 12,
      },
      observation: {
        retention_days: 180,
        max_entries: 5000,
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

    const parsed = IntegrationConfigSchema.parse(fullConfig);
    expect(parsed).toEqual(fullConfig);
  });
});

// ============================================================================
// Existing config behavior unchanged with terminal addition
// ============================================================================

describe('Existing config behavior unchanged', () => {
  it('cumulative_char_budget is undefined by default (opt-in)', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.token_budget.cumulative_char_budget).toBeUndefined();
  });

  it('profile_budgets is undefined by default (opt-in)', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.token_budget.profile_budgets).toBeUndefined();
  });

  it('adding terminal section does not alter existing section defaults', () => {
    const config = IntegrationConfigSchema.parse({
      integration: { auto_load_skills: false },
    });

    // Integration override works
    expect(config.integration.auto_load_skills).toBe(false);
    expect(config.integration.observe_sessions).toBe(true);

    // Terminal gets defaults
    expect(config.terminal.port).toBe(11338);
    expect(config.terminal.base_path).toBe('/terminal');
    expect(config.terminal.auth_mode).toBe('none');
    expect(config.terminal.theme).toBe('dark');

    // Other sections unaffected
    expect(config.token_budget.max_percent).toBe(5);
    expect(config.observation.retention_days).toBe(90);
    expect(config.suggestions.min_occurrences).toBe(3);
  });

  it('DEFAULT_INTEGRATION_CONFIG includes terminal section', () => {
    expect(DEFAULT_INTEGRATION_CONFIG).toHaveProperty('terminal');
    expect(DEFAULT_INTEGRATION_CONFIG.terminal).toEqual({
      port: 11338,
      base_path: '/terminal',
      auth_mode: 'none',
      theme: 'dark',
      session_name: 'dev',
    });
  });
});

// ============================================================================
// Cumulative budget config (BF-01, BF-02)
// ============================================================================

describe('cumulative budget config (BF-01, BF-02)', () => {
  it('parsing {} produces default token_budget.cumulative_char_budget of undefined', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.token_budget.cumulative_char_budget).toBeUndefined();
  });

  it('parsing { token_budget: { cumulative_char_budget: 20000 } } produces that value', () => {
    const config = IntegrationConfigSchema.parse({
      token_budget: { cumulative_char_budget: 20000 },
    });

    expect(config.token_budget.cumulative_char_budget).toBe(20000);
  });

  it('cumulative_char_budget: 0 fails validation (min 1000)', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ token_budget: { cumulative_char_budget: 0 } }),
    ).toThrow(z.ZodError);
  });

  it('cumulative_char_budget: -1 fails validation', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ token_budget: { cumulative_char_budget: -1 } }),
    ).toThrow(z.ZodError);
  });

  it('parsing { token_budget: { profile_budgets: { executor: 25000, planner: 15000 } } } produces those values', () => {
    const config = IntegrationConfigSchema.parse({
      token_budget: { profile_budgets: { executor: 25000, planner: 15000 } },
    });

    expect(config.token_budget.profile_budgets).toEqual({ executor: 25000, planner: 15000 });
  });

  it('parsing {} produces default token_budget.profile_budgets of undefined', () => {
    const config = IntegrationConfigSchema.parse({});

    expect(config.token_budget.profile_budgets).toBeUndefined();
  });

  it('profile_budgets values must be >= 1000', () => {
    expect(() =>
      IntegrationConfigSchema.parse({ token_budget: { profile_budgets: { executor: 500 } } }),
    ).toThrow(z.ZodError);
  });
});

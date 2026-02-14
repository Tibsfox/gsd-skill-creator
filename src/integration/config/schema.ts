/**
 * Zod schema for the GSD integration configuration.
 *
 * Every field has a `.default()` so that `IntegrationConfigSchema.parse({})`
 * returns a complete, fully populated config. This means users can provide
 * a partial config (or no config at all) and get sensible behavior.
 *
 * Nested object schemas use `.default(() => ({ ... }))` factory functions
 * following the established project pattern (see GsdConfigSchema in
 * src/orchestrator/state/types.ts).
 *
 * @module integration/config/schema
 */

import { z } from 'zod';
import type { IntegrationConfig } from './types.js';
import { TerminalConfigSchema } from './terminal-schema.js';

// ============================================================================
// CONFIG-01: Feature Toggles Schema
// ============================================================================

/**
 * Schema for integration feature toggles.
 * All toggles default to `true` (opt-out model).
 */
const IntegrationTogglesSchema = z.object({
  auto_load_skills: z.boolean().default(true),
  observe_sessions: z.boolean().default(true),
  phase_transition_hooks: z.boolean().default(true),
  suggest_on_session_start: z.boolean().default(true),
  install_git_hooks: z.boolean().default(true),
  wrapper_commands: z.boolean().default(true),
});

// ============================================================================
// CONFIG-02: Token Budget Schema
// ============================================================================

/**
 * Schema for token budget configuration.
 * max_percent defaults to 5, warn_at_percent defaults to 4.
 */
const TokenBudgetSchema = z.object({
  max_percent: z.number().min(1).max(100).default(5),
  warn_at_percent: z.number().min(1).max(100).default(4),
  cumulative_char_budget: z.number().min(1000).optional(),
  profile_budgets: z.record(z.string(), z.number().min(1000)).optional(),
});

// ============================================================================
// CONFIG-03: Observation Retention Schema
// ============================================================================

/**
 * Schema for observation retention configuration.
 * retention_days defaults to 90, max_entries to 1000, capture_corrections to true.
 */
const ObservationSchema = z.object({
  retention_days: z.number().min(1).max(365).default(90),
  max_entries: z.number().min(100).max(100000).default(1000),
  capture_corrections: z.boolean().default(true),
});

// ============================================================================
// CONFIG-04: Suggestion Settings Schema
// ============================================================================

/**
 * Schema for suggestion configuration.
 * min_occurrences defaults to 3, cooldown_days to 7, auto_dismiss_after_days to 30.
 */
const SuggestionSchema = z.object({
  min_occurrences: z.number().min(1).max(100).default(3),
  cooldown_days: z.number().min(1).max(365).default(7),
  auto_dismiss_after_days: z.number().min(1).max(365).default(30),
});

// ============================================================================
// Composite Integration Config Schema
// ============================================================================

/**
 * Complete integration config schema with defaults on every field.
 *
 * Usage:
 * ```typescript
 * // Full defaults from empty input:
 * const config = IntegrationConfigSchema.parse({});
 *
 * // Partial override:
 * const config = IntegrationConfigSchema.parse({
 *   integration: { auto_load_skills: false },
 *   token_budget: { max_percent: 10 },
 * });
 * ```
 */
export const IntegrationConfigSchema = z.object({
  integration: IntegrationTogglesSchema.default(() => ({
    auto_load_skills: true,
    observe_sessions: true,
    phase_transition_hooks: true,
    suggest_on_session_start: true,
    install_git_hooks: true,
    wrapper_commands: true,
  })),
  token_budget: TokenBudgetSchema.default(() => ({
    max_percent: 5,
    warn_at_percent: 4,
  })),
  observation: ObservationSchema.default(() => ({
    retention_days: 90,
    max_entries: 1000,
    capture_corrections: true,
  })),
  suggestions: SuggestionSchema.default(() => ({
    min_occurrences: 3,
    cooldown_days: 7,
    auto_dismiss_after_days: 30,
  })),
  terminal: TerminalConfigSchema.default(() => ({
    port: 11338,
    base_path: '/terminal',
    auth_mode: 'none' as const,
    theme: 'dark' as const,
    session_name: 'dev',
  })),
});

/**
 * Inferred TypeScript type from the Zod schema.
 *
 * This should be structurally identical to the `IntegrationConfig` interface
 * defined in types.ts. The interface exists for documentation; this type
 * is used for runtime type safety.
 */
export type InferredIntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

/**
 * Default integration config produced by parsing an empty object.
 *
 * Consumers can use this as a reference for all default values or as
 * a starting point for building partial overrides.
 */
export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = IntegrationConfigSchema.parse({});

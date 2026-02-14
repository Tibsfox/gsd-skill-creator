/**
 * Type definitions for the GSD integration configuration.
 *
 * These interfaces define the contract between all integration components:
 * install script, git hooks, session start, slash commands, wrappers, and
 * passive monitoring. Every downstream consumer reads this config.
 *
 * Five sections:
 * - IntegrationToggles (CONFIG-01): Feature on/off switches
 * - TokenBudgetConfig (CONFIG-02): Skill loading token budget limits
 * - ObservationConfig (CONFIG-03): Session observation retention settings
 * - SuggestionConfig (CONFIG-04): Pattern suggestion thresholds
 * - TerminalConfig (CONF-01/02/03): Terminal (Wetty) integration settings
 *
 * @module integration/config/types
 */

import type { TerminalConfig } from './terminal-types.js';

// ============================================================================
// CONFIG-01: Feature Toggles
// ============================================================================

/**
 * Feature toggles controlling which integration features are active.
 *
 * All toggles default to `true` (opt-out model). Users disable specific
 * features rather than enabling them one by one.
 */
export interface IntegrationToggles {
  /** Load relevant skills before GSD phases. */
  auto_load_skills: boolean;
  /** Capture session observations to JSONL. */
  observe_sessions: boolean;
  /** Fire hooks on GSD phase transitions. */
  phase_transition_hooks: boolean;
  /** Surface skill suggestions at session start. */
  suggest_on_session_start: boolean;
  /** Install post-commit git hook. */
  install_git_hooks: boolean;
  /** Enable wrapper command features. */
  wrapper_commands: boolean;
}

// ============================================================================
// CONFIG-02: Token Budget
// ============================================================================

/**
 * Token budget configuration for skill loading.
 *
 * Controls the maximum percentage of context window that loaded skills
 * may consume, and the warning threshold before hitting the ceiling.
 */
export interface TokenBudgetConfig {
  /** Maximum token budget as percentage of context window (1-100). */
  max_percent: number;
  /** Warning threshold as percentage (1-100, should be <= max_percent). */
  warn_at_percent: number;
  /** Cumulative character budget override (replaces SLASH_COMMAND_TOOL_CHAR_BUDGET env var). */
  cumulative_char_budget?: number;
  /** Per-profile cumulative budget overrides. Keys are profile names (e.g. "executor", "planner"). */
  profile_budgets?: Record<string, number>;
}

// ============================================================================
// CONFIG-03: Observation Retention
// ============================================================================

/**
 * Observation retention configuration for session data.
 *
 * Controls how long session observations are kept, how many entries
 * trigger compaction, and whether user corrections are captured.
 */
export interface ObservationConfig {
  /** Days to retain session observations before cleanup (1-365). */
  retention_days: number;
  /** Maximum JSONL entries before compaction is triggered (100-100000). */
  max_entries: number;
  /** Whether to capture user corrections as observations. */
  capture_corrections: boolean;
}

// ============================================================================
// CONFIG-04: Suggestion Settings
// ============================================================================

/**
 * Suggestion configuration for pattern detection and skill proposals.
 *
 * Controls the sensitivity and lifecycle of pattern-based skill suggestions.
 */
export interface SuggestionConfig {
  /** Minimum pattern occurrences before suggesting a skill (1-100). */
  min_occurrences: number;
  /** Days to wait before re-suggesting a dismissed pattern (1-365). */
  cooldown_days: number;
  /** Days after which unreviewed suggestions are auto-dismissed (1-365). */
  auto_dismiss_after_days: number;
}

// ============================================================================
// Composite Config
// ============================================================================

/**
 * Complete integration configuration combining all four sections.
 *
 * This is the top-level type that `IntegrationConfigSchema.parse()` produces.
 * Parsing an empty object `{}` yields a fully populated config with all defaults.
 */
export interface IntegrationConfig {
  /** Feature toggles (CONFIG-01). */
  integration: IntegrationToggles;
  /** Token budget limits (CONFIG-02). */
  token_budget: TokenBudgetConfig;
  /** Observation retention settings (CONFIG-03). */
  observation: ObservationConfig;
  /** Suggestion thresholds (CONFIG-04). */
  suggestions: SuggestionConfig;
  /** Terminal integration settings (CONF-01/02/03). */
  terminal: TerminalConfig;
}

export type { TerminalConfig } from './terminal-types.js';

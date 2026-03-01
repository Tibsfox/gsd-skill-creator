/**
 * Safety module types -- SafetyWarden and AllergenManager.
 *
 * Provides type definitions for safety enforcement modes, check results,
 * danger zone tracking, allergen flagging, and substitution checking.
 *
 * @module safety/types
 */

import type { SafetyBoundary } from '../rosetta-core/types.js';

// ─── Safety Enforcement ─────────────────────────────────────────────────────

/** Three enforcement modes for safety boundary violations. */
export type SafetyMode = 'annotate' | 'gate' | 'redirect';

/** Input to a safety check -- a parameter name and proposed value. */
export interface SafetyCheckInput {
  parameter: string;
  proposedValue: number;
}

/** Result of a safety check -- whether safe, and mode-specific action details. */
export interface SafetyCheckResult {
  safe: boolean;
  action?: SafetyMode;
  warning?: string;
  reason?: string;
  proposedValue?: number;
  safeValue?: number;
  requiresAcknowledgment?: boolean;
  boundary?: SafetyBoundary;
}

// ─── Danger Zone ────────────────────────────────────────────────────────────

/** An item being tracked in the temperature danger zone (40-140F). */
export interface DangerZoneEntry {
  itemId: string;
  temperature: number;
  startTime: Date;
  warning: boolean;
  elapsedMinutes: number;
}

// ─── Allergen Management ────────────────────────────────────────────────────

/** A flagged allergen found in an ingredient. */
export interface AllergenFlag {
  allergen: string;
  severity: 'trace' | 'contains' | 'major-ingredient';
  ingredient: string;
  substitutions: string[];
}

/** Result of checking a substitution for allergen implications. */
export interface SubstitutionCheck {
  original: AllergenFlag[];
  replacement: AllergenFlag[];
  safe: boolean;
  warnings: string[];
}

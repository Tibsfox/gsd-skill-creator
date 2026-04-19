/**
 * ME-4 — Teach-Warning Text Composer
 *
 * Composes the warning string shown by the teach CLI when a developer targets a
 * skill classified coin-flip or unknown.  The warning is INFORMATIONAL ONLY —
 * the teach entry is always written regardless.
 *
 * Language rules (SC-ME4-01, SC-PARASOC):
 *   - Engineering-observational register only.
 *   - No first-person-plural: "we", "our", "us", "let's".
 *   - No emotional framing: "feel", "excited", "hope", "happy", "love", "care".
 *   - No relational framing: "together", "partnership", "bond", "relationship",
 *     "journey", "trust", "collaborate".
 *   - No personification: "I think", "I prefer", "I believe", "I notice", "I've".
 *   - No metaphysical claims: "alive", "conscious", "understands".
 *
 * All warning strings are validated by `validateOffering()` from
 * `parasocial-guard.ts` at construction time.  If a composed string fails
 * validation, an Error is thrown so the defect is caught at development time,
 * not silently emitted at runtime.
 *
 * @module symbiosis/teach-warning
 */

import { validateOffering } from './parasocial-guard.js';
import type { ExpectedEffectLevel } from './expected-effect.js';
import type { TractabilityClass } from '../tractability/selector-api.js';

// ---------------------------------------------------------------------------
// Static warning templates
//
// Each template is tested against the parasocial-guard at module-level below.
// ---------------------------------------------------------------------------

/** Warning emitted for coin-flip skills (prose output declared). */
const WARN_COIN_FLIP =
  'The targeted skill is classified as prose output. ' +
  'Per Zhang 2026 §4.2, prompt-content edits on prose-output skills produce ' +
  'effects that are statistically indistinguishable from a coin flip. ' +
  'The teach entry is recorded and applied; measurable behavioural change is not guaranteed.';

/** Warning emitted for unknown-tractability skills (no output_structure declared). */
const WARN_UNKNOWN =
  'The targeted skill has no declared output_structure. ' +
  'Without a declaration, tractability defaults to the coin-flip regime ' +
  '(Zhang 2026 §4.2). ' +
  'The teach entry is recorded and applied; measurable behavioural change is not guaranteed.';

/** Informational note emitted for tractable skills (no warning needed). */
const NOTE_TRACTABLE =
  'The targeted skill is classified as structured output. ' +
  'Prompt-content edits in the structured-output regime have statistically reliable effects ' +
  '(Zhang 2026 §4.3).';

// ---------------------------------------------------------------------------
// Validate all static strings at module load
// ---------------------------------------------------------------------------

function assertPassesGuard(text: string, label: string): void {
  const result = validateOffering(text);
  if (!result.ok) {
    throw new Error(
      `teach-warning: "${label}" fails parasocial-guard:\n` +
        (result.rejected ?? []).map((r) => `  • ${r}`).join('\n'),
    );
  }
}

// These calls run once when the module is first imported.  Any violation
// is a programming error caught in development.
assertPassesGuard(WARN_COIN_FLIP, 'WARN_COIN_FLIP');
assertPassesGuard(WARN_UNKNOWN, 'WARN_UNKNOWN');
assertPassesGuard(NOTE_TRACTABLE, 'NOTE_TRACTABLE');

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TeachWarningResult {
  /** Whether a warning should be shown (false for tractable skills). */
  shouldWarn: boolean;
  /**
   * The warning / note text.  Always present; callers suppress display when
   * `shouldWarn` is false or when `--no-warning` flag is active.
   */
  text: string;
  /** Expected-effect level that drove the warning decision. */
  level: ExpectedEffectLevel;
  /** Tractability class, when available. */
  tractabilityClass?: TractabilityClass;
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Compose the teach-CLI warning text for the given expected-effect level.
 *
 * Returns a `TeachWarningResult` containing the warning text and whether the
 * warning should be shown.  The text always passes `validateOffering()`.
 *
 * @param level - The `ExpectedEffectLevel` from `classifyExpectedEffect()`.
 * @param tractabilityClass - Optional ME-1 tractability class for richer messages.
 */
export function composeTeachWarning(
  level: ExpectedEffectLevel,
  tractabilityClass?: TractabilityClass,
): TeachWarningResult {
  switch (level) {
    case 'high':
      return {
        shouldWarn: false,
        text: NOTE_TRACTABLE,
        level,
        tractabilityClass,
      };

    case 'low': {
      // Distinguish coin-flip vs unknown for more precise copy.
      const text =
        tractabilityClass === 'coin-flip' ? WARN_COIN_FLIP : WARN_UNKNOWN;
      return {
        shouldWarn: true,
        text,
        level,
        tractabilityClass,
      };
    }

    case 'medium':
      // Medium is reserved for future hybrid-tractability classes.
      // Emit the coin-flip warning conservatively until a dedicated template exists.
      return {
        shouldWarn: true,
        text: WARN_COIN_FLIP,
        level,
        tractabilityClass,
      };

    default: {
      const _exhaustive: never = level;
      void _exhaustive;
      return {
        shouldWarn: true,
        text: WARN_UNKNOWN,
        level,
        tractabilityClass,
      };
    }
  }
}

/**
 * Format the full CLI output block for the teach warning.
 *
 * Returns one or two lines, depending on the warning level.  Line format is
 * plain text with no ANSI codes (callers may add colour if desired).
 *
 * Example output (coin-flip):
 *   [WARN] Expected effect: low
 *   The targeted skill is classified as prose output. ...
 *
 * Example output (tractable, no warn):
 *   Expected effect: high
 */
export function formatTeachWarningBlock(result: TeachWarningResult): string {
  const prefix = result.shouldWarn ? '[WARN] ' : '';
  const lines: string[] = [];
  lines.push(`${prefix}Expected effect: ${result.level}`);
  if (result.shouldWarn) {
    lines.push(result.text);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Re-export the static strings for test inspection
// ---------------------------------------------------------------------------

export { WARN_COIN_FLIP, WARN_UNKNOWN, NOTE_TRACTABLE };

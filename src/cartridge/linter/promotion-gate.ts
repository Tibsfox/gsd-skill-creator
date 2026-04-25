/**
 * HB-05 Five-Principle Linter — promotion-gate integration shim.
 *
 * Wraps `checkStructuralCompleteness()` with the cs25-26-sweep
 * default-off flag so that the cartridge promotion pipeline can call a
 * single function and get correct flag-aware behavior:
 *
 *   - Flag OFF (default) → linter still runs, but the gate is
 *     non-blocking. Failures are returned as `warnings`, not `blocked`.
 *     Promotion proceeds. Byte-identical-with-flag-off contract.
 *   - Flag ON             → linter failures are blocking. The gate
 *     returns `blocked: true` and the promotion pipeline must refuse
 *     promotion out of `.planning/staging/inbox/`.
 *
 * No existing cartridge promotion code calls this yet — that wiring is
 * a follow-on (HB-06 lands the docs/skill-md-quality-checks.md plus a
 * combined call-site). Until that lands, the gate is library-only and
 * cannot regress the promotion pipeline.
 *
 * @module cartridge/linter/promotion-gate
 */

import {
  checkStructuralCompleteness,
  type FivePrincipleCheckResult,
  type StructuralCompletenessOptions,
} from './structural-completeness.js';
import { isStructuralCompletenessEnabled } from './settings.js';

export interface PromotionGateResult {
  /** True iff the gate refuses promotion (only possible with flag on). */
  blocked: boolean;
  /** True if the lint result itself failed, regardless of blocking. */
  lintFailed: boolean;
  /** Was the structural-completeness flag on at the time of the call? */
  flagEnabled: boolean;
  /** The underlying lint result. Always populated. */
  lintResult: FivePrincipleCheckResult;
  /** Warnings emitted (populated when lint failed but flag was off). */
  warnings: string[];
}

export interface PromotionGateOptions extends StructuralCompletenessOptions {
  /** Override the settings file path (tests). */
  settingsPath?: string;
}

/**
 * Frozen no-op-warning sentinel for when the lint passed (no warning
 * needed regardless of flag state).
 */
const NO_WARNINGS: readonly string[] = Object.freeze([]);

/**
 * Run the structural-completeness check as a promotion-pipeline gate.
 *
 * @param skillMdContent  Markdown contents of the SKILL.md to check.
 * @param filePath        Path used for the lint result + warning text.
 * @param options         Optional strict mode + settings path override.
 */
export function runPromotionGate(
  skillMdContent: string,
  filePath: string,
  options: PromotionGateOptions = {},
): PromotionGateResult {
  const flagEnabled = isStructuralCompletenessEnabled(options.settingsPath);
  const lintResult = checkStructuralCompleteness(skillMdContent, filePath, {
    strict: options.strict,
  });

  if (lintResult.passed) {
    return {
      blocked: false,
      lintFailed: false,
      flagEnabled,
      lintResult,
      warnings: NO_WARNINGS as string[],
    };
  }

  // Lint failed. Compose human-readable warnings.
  const warnings: string[] = [];
  for (const [principle, result] of Object.entries(lintResult.principleResults)) {
    if (!result.satisfied) {
      warnings.push(
        `[structural-completeness] ${filePath}: ${principle} — ${result.rationale}`,
      );
    }
  }

  return {
    blocked: flagEnabled,
    lintFailed: true,
    flagEnabled,
    lintResult,
    warnings,
  };
}

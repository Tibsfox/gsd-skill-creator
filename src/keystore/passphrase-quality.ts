/**
 * R14 — Passphrase quality enforcement via zxcvbn entropy scoring.
 *
 * Shipped at v1.49.637 (Housekeeping Cluster #4, C3) to close the R14
 * named carry-forward from v1.49.636. Replaces the prior "any non-empty
 * passphrase is accepted" behavior at the keystore enrollment boundary
 * (see `desktop/src/keystore/passphrase-flow.ts`).
 *
 * Design + verdict references:
 *   - `.planning/c3-zxcvbn-integration-design.md` (W0a)
 *   - `.planning/c3-zxcvbn-integration-design-verdict.md` (W0b PASS-WITH-NITS)
 *   - `.planning/missions/v1-49-637-housekeeping-cluster-4/components/03-r14-zxcvbn-entropy.md`
 *
 * Enforcement is TS-side at the UX boundary. Rust accepts substrate-
 * validated values (defense-in-depth would duplicate dictionary loading;
 * see design doc §"Integration-point decision").
 *
 * Default threshold: zxcvbn score >= 3 (~10^10 guess space).
 * Operator override: `SC_PASSPHRASE_MIN_SCORE` env var, range 0-4.
 *
 * Security note: the rejected passphrase value MUST NOT appear in
 * returned objects or thrown error messages — only the score, the
 * required score, and zxcvbn's `feedback` (which never includes the
 * passphrase) cross the trust boundary.
 *
 * @module keystore/passphrase-quality
 */

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

// Module-load singleton: configure zxcvbn ONCE with the English language
// pack + common-password dictionary. The ~80KB dictionary load happens
// here (one-time); subsequent imports hit Node's module cache.
// Per design-verdict NIT #4: instantiation is expensive — do not move
// inside validatePassphraseQuality().
zxcvbnOptions.setOptions({
  translations: zxcvbnEnPackage.translations,
  dictionary: { ...zxcvbnEnPackage.dictionary },
});

/** zxcvbn quality score, 0 (very guessable) through 4 (very unguessable). */
export type ZxcvbnScore = 0 | 1 | 2 | 3 | 4;

/**
 * Result of a passphrase-quality check.
 *
 * `passphrase` is INTENTIONALLY ABSENT — the rejected value never re-enters
 * the return shape (security invariant; see module docstring).
 */
export interface PassphraseQualityResult {
  /** True iff `score >= requiredScore`. */
  accepted: boolean;
  /** zxcvbn-assigned score (0-4). */
  score: ZxcvbnScore;
  /** Threshold the passphrase had to meet. */
  requiredScore: number;
  /**
   * zxcvbn's human-readable feedback. `warning` may be empty (zxcvbn
   * returns `null` when no specific warning applies; we normalize to "").
   * `suggestions` is always an array (possibly empty).
   */
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

/** Default minimum acceptable score when no override is in effect. */
export const DEFAULT_MIN_SCORE = 3;

/** Env-var name used to override the default threshold (range 0-4). */
export const ENV_VAR_OVERRIDE = 'SC_PASSPHRASE_MIN_SCORE';

/**
 * Resolve the effective minimum score by checking the env var, falling
 * back to `DEFAULT_MIN_SCORE` on absence, invalid value, or out-of-range.
 *
 * Invalid values produce a single console warning (operator-visible) and
 * fall back silently; this is friendlier than crashing the enrollment
 * flow on a misconfigured env var.
 */
function resolveDefaultMinScore(): number {
  const raw = process.env[ENV_VAR_OVERRIDE];
  if (raw === undefined) return DEFAULT_MIN_SCORE;
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 0 || n > 4) {
    // eslint-disable-next-line no-console
    console.warn(
      `${ENV_VAR_OVERRIDE}='${raw}' invalid (must be integer 0-4); using default ${DEFAULT_MIN_SCORE}`,
    );
    return DEFAULT_MIN_SCORE;
  }
  return n;
}

/**
 * Score a passphrase via zxcvbn and report whether it meets the
 * acceptance threshold.
 *
 * @param passphrase The candidate passphrase (NEVER echoed in the result).
 * @param options    Optional override; `minScore` takes precedence over the
 *                   `SC_PASSPHRASE_MIN_SCORE` env var.
 * @returns A {@link PassphraseQualityResult} describing acceptance, score,
 *          threshold, and zxcvbn feedback.
 */
export function validatePassphraseQuality(
  passphrase: string,
  options?: { minScore?: number },
): PassphraseQualityResult {
  const required = options?.minScore ?? resolveDefaultMinScore();
  const result = zxcvbn(passphrase);
  return {
    accepted: result.score >= required,
    score: result.score,
    requiredScore: required,
    feedback: {
      warning: result.feedback.warning ?? '',
      suggestions: [...result.feedback.suggestions],
    },
  };
}

/**
 * Build a human-readable rejection message from a `PassphraseQualityResult`.
 *
 * The rejected passphrase is NEVER included in the output. The example
 * override command uses `keystore migrate` (not `keystore enroll`, which
 * does not exist in the substrate; see design verdict NIT #2).
 */
export function formatRejectionMessage(result: PassphraseQualityResult): string {
  const lines: string[] = [];
  lines.push('Passphrase does not meet quality requirement.');
  lines.push('');
  lines.push(`Score: ${result.score} (required: >= ${result.requiredScore})`);
  if (result.feedback.warning) {
    lines.push(`Warning: ${result.feedback.warning}`);
  }
  if (result.feedback.suggestions.length > 0) {
    lines.push('Suggestions:');
    for (const s of result.feedback.suggestions) lines.push(`  - ${s}`);
  }
  lines.push('');
  lines.push('To override (NOT recommended for production):');
  lines.push(`  ${ENV_VAR_OVERRIDE}=${result.score} skill-creator keystore migrate ...`);
  return lines.join('\n');
}

/**
 * Throw a `PassphraseQualityError` if the passphrase fails the threshold;
 * return silently on accept. Callers at the enrollment boundary use this
 * to gate the Tauri invoke without having to inspect a result object.
 */
export function assertPassphraseQuality(
  passphrase: string,
  options?: { minScore?: number },
): void {
  const result = validatePassphraseQuality(passphrase, options);
  if (!result.accepted) {
    throw new PassphraseQualityError(result);
  }
}

/**
 * Error thrown by `assertPassphraseQuality()` on rejection.
 *
 * Carries the structured `PassphraseQualityResult` for programmatic
 * inspection by UI presenters while never holding the rejected
 * passphrase itself.
 */
export class PassphraseQualityError extends Error {
  readonly score: ZxcvbnScore;
  readonly requiredScore: number;
  readonly suggestions: string[];

  constructor(public readonly result: PassphraseQualityResult) {
    super(formatRejectionMessage(result));
    this.name = 'PassphraseQualityError';
    this.score = result.score;
    this.requiredScore = result.requiredScore;
    this.suggestions = [...result.feedback.suggestions];
  }
}

/**
 * Production substrate consumer for the `token_budget.warn_at_percent`
 * calibratable threshold (v1.49.926 — closes the v803 deferred substrate
 * auto-emit half; completes the FIRST #10439 CLI+substrate duality).
 *
 * v803 wired BOTH the READ side (`loadObservationsForThreshold(
 * 'token_budget.warn_at_percent')`) AND the CLI manual recorder
 * (`bounded-learning --record-event --kind responsive|ignored`). The
 * SUBSTRATE auto-emit half — a production code path that classifies the
 * operator's response to a warn and auto-emits a `TokenBudgetEvent` so the
 * calibration loop has TRAFFIC-attributed observations (not just
 * operator-attributed CLI invocations that in practice never happen) — was
 * never shipped, leaving `warn_at_percent` the lone `token_budget.*` sibling
 * with no substrate writer. Its YOUNGER sibling `max_percent` got one at
 * v893 (`ceiling-substrate.ts`). This module is the long-missing writer: the
 * SECOND write-caller per the #10439 duality, ~123 ships after the
 * read+CLI half.
 *
 * Mirrors v846 (predictive low-confidence), v891 (observation-retention),
 * and v893 (ceiling). FOURTH instance of the substrate-wrapper pattern
 * (#10452).
 *
 * ## Two-reading semantics (the warn-vs-ceiling distinction)
 *
 * `token_budget.max_percent` is a SINGLE-reading concept: one
 * `usagePercent < max_percent` inequality both decides the outcome and IS
 * the substrate (v893 `ceiling-substrate.ts`). `token_budget.warn_at_percent`
 * is a TWO-reading concept: a warn fires when usage first crosses
 * `warn_at_percent` (reading 1), and the operator's RESPONSE is measured on
 * the NEXT check (reading 2) — did usage drop back below `warn_at_percent`?
 * This substrate models reading 2. Its PRECONDITION is that a warn already
 * fired; the caller invokes it on the next skill-load check after emitting a
 * warn line (the flow `token-budget-events.ts` documents for /sc:status +
 * /sc:start).
 *
 * Hence the parameter is `followUpUsagePercent`, NOT `usagePercent`: calling
 * this at warn-FIRE time (when usage is at/above warn) would misclassify the
 * fire itself as `ignored`. The reading that matters is the follow-up.
 *
 *   - `followUpUsagePercent <  warn_at_percent` → `responsive` (+1) —
 *     operator reduced load; the warn was useful. Favors LOWERING the
 *     threshold so warns fire earlier.
 *   - `followUpUsagePercent >= warn_at_percent` → `ignored` (-1) —
 *     operator continued past the warn; it was noise. Favors RAISING the
 *     threshold so warns fire less often.
 *
 * Polarity is encoded once in `token-budget-events.ts::eventKindToValue`
 * (responsive=+1, ignored=-1); this module does NOT re-derive it (#10425
 * math-check: a higher threshold reduces warn-fire frequency, so +1 favors
 * LOWER — same direction as ceiling/retention, opposite to predictive).
 * Boundary: equality (`followUp === warn`) is `ignored` (still at/above),
 * mirroring ceiling's strict-less-than `underBudget`.
 *
 * ## Outcome-driven auto-emit kind
 *
 * Like v893 (ceiling), the kind is DERIVED from the comparison rather than a
 * fixed default (v891 retention). The `defaultKind` option overrides this for
 * operators who need to force a polarity (mirrors v891/v893). This
 * outcome-driven shape is natural here because the threshold-compare IS the
 * substrate: the polarity falls out of the same inequality that drives the
 * result.
 *
 * ## Failure contract (Lesson #10427 + #10437)
 *
 * `appendTokenBudgetEvent` is invoked fire-and-forget. Disk-full or
 * permission-denied during the auto-emit MUST NOT break the check — forensic
 * surface per #10427, subscriber-gated observability-only per #10437.
 *
 * @module token-budget/warn-substrate
 */

import {
  appendTokenBudgetEvent,
  type TokenBudgetEventKind,
} from '../bounded-learning/token-budget-events.js';

/**
 * Minimal shape of the integration config consumed here. Avoids importing
 * the full `IntegrationConfig` type to keep this module's surface narrow.
 */
export interface TokenBudgetWarnConfig {
  token_budget: {
    warn_at_percent: number;
  };
}

export interface WarnCheckOptions {
  /**
   * When false, disables the auto-emit. Default true. Tests and callers who
   * want a pure warn-follow-up classification without observability pass
   * `{ autoEmit: false }`.
   */
  autoEmit?: boolean;
  /**
   * Override the path the auto-emit writes to. Defaults to the events
   * module's default JSONL location.
   */
  eventsPath?: string;
  /**
   * Force a specific kind regardless of the outcome-driven default.
   * Production callers SHOULD prefer the outcome-driven default; operators
   * who need to record a discrepancy use the CLI manual recorder.
   */
  defaultKind?: TokenBudgetEventKind;
  /**
   * Free-form note recorded on the event (best-effort).
   */
  reason?: string;
}

export interface WarnCheckResult {
  /**
   * True when the follow-up reading fell strictly below `warn_at_percent`
   * (operator responded to the warn).
   */
  responded: boolean;
  /** The follow-up usagePercent reading passed in (reading 2). */
  followUpUsagePercent: number;
  /** The warn_at_percent threshold value read from config. */
  warnAtPercent: number;
  /** The kind that was auto-emitted (or would be, if autoEmit were true). */
  emittedKind: TokenBudgetEventKind;
}

/**
 * Classify the operator's response to a token-budget warn from the FOLLOW-UP
 * usagePercent reading and auto-emit a `TokenBudgetEvent` for the
 * calibration loop.
 *
 * PRECONDITION: a warn previously fired (usage crossed `warn_at_percent`);
 * `followUpUsagePercent` is the NEXT reading after that warn. See the
 * two-reading note in the module docstring — do NOT call this at warn-fire
 * time.
 *
 * Substrate auto-emit writer for `token_budget.warn_at_percent` (the second
 * #10439 write-caller, after the v803 CLI manual recorder).
 *
 * Synchronous — the only async work is the fire-and-forget auto-emit, which
 * is intentionally not awaited per the #10437 contract.
 */
export function runTokenBudgetWarnCheck(
  config: TokenBudgetWarnConfig,
  followUpUsagePercent: number,
  options: WarnCheckOptions = {},
): WarnCheckResult {
  const warnAtPercent = config.token_budget.warn_at_percent;
  const responded = followUpUsagePercent < warnAtPercent;
  const outcomeKind: TokenBudgetEventKind = responded ? 'responsive' : 'ignored';
  const emittedKind = options.defaultKind ?? outcomeKind;

  if (options.autoEmit !== false) {
    const appendOptions = options.eventsPath !== undefined
      ? { path: options.eventsPath }
      : {};
    // Fire-and-forget per #10437. Failure MUST NOT break the substrate.
    appendTokenBudgetEvent(
      {
        timestamp: new Date().toISOString(),
        kind: emittedKind,
        usagePercent: followUpUsagePercent,
        warnAtPercent,
        ...(options.reason !== undefined ? { reason: options.reason } : {}),
      },
      appendOptions,
    ).catch(() => {
      /* auto-emit is observability-only; never break the check */
    });
  }

  return { responded, followUpUsagePercent, warnAtPercent, emittedKind };
}

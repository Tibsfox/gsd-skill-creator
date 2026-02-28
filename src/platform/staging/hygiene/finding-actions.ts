/**
 * Finding actions for hygiene scan results.
 *
 * Defines the five user actions available for each hygiene finding:
 * approve, suppress, cleanup, skip, and observe. Each action produces
 * a structured result describing the outcome and any trust store updates.
 *
 * @module staging/hygiene/finding-actions
 */

import type { TrustStore } from './trust-store.js';
import { CRITICAL_PATTERN_IDS } from './trust-types.js';

/** Actions a user can take on a hygiene finding. */
export type FindingAction =
  | 'approve'
  | 'suppress'
  | 'cleanup'
  | 'skip'
  | 'observe';

/** All finding actions as a const array. */
export const FINDING_ACTIONS: readonly FindingAction[] = [
  'approve',
  'suppress',
  'cleanup',
  'skip',
  'observe',
] as const;

/** Result of applying an action to a finding. */
export interface FindingActionResult {
  /** Which action was applied. */
  action: FindingAction;
  /** Pattern ID the action was applied to. */
  patternId: string;
  /** Whether the finding is resolved (approve, suppress, cleanup, skip = true; observe = false). */
  resolved: boolean;
  /** Human-readable message describing the outcome. */
  message: string;
  /** Whether trust was updated (only for approve and suppress). */
  trustUpdated: boolean;
  /** Whether enhanced logging was enabled (only for observe). */
  enhancedLogging: boolean;
}

/**
 * Append critical pattern note to message if pattern is critical.
 */
function withCriticalNote(
  message: string,
  patternId: string,
): string {
  if (CRITICAL_PATTERN_IDS.has(patternId)) {
    return `${message} (critical pattern -- will always surface)`;
  }
  return message;
}

/**
 * Apply a finding action to a pattern.
 *
 * - **approve**: Records approval in trust store. Pattern progresses through trust tiers.
 * - **suppress**: Same as approve (trust store call), but implies user wants auto-approval next time.
 * - **cleanup**: Marks finding for cleanup. No trust store interaction (caller handles actual cleanup).
 * - **skip**: Skips the finding. No trust store interaction.
 * - **observe**: Enables enhanced logging for the pattern. Finding remains unresolved.
 *
 * For approve and suppress on critical patterns, the message includes a note
 * that the pattern will always surface regardless of approval count.
 */
export function applyFindingAction(
  action: FindingAction,
  patternId: string,
  trustStore: TrustStore,
): FindingActionResult {
  switch (action) {
    case 'approve': {
      trustStore.approve(patternId);
      return {
        action,
        patternId,
        resolved: true,
        message: withCriticalNote(
          'Pattern approved for this session',
          patternId,
        ),
        trustUpdated: true,
        enhancedLogging: false,
      };
    }

    case 'suppress': {
      trustStore.approve(patternId);
      return {
        action,
        patternId,
        resolved: true,
        message: withCriticalNote(
          'Pattern approved and suppressed for future occurrences',
          patternId,
        ),
        trustUpdated: true,
        enhancedLogging: false,
      };
    }

    case 'cleanup': {
      return {
        action,
        patternId,
        resolved: true,
        message: 'Marked for cleanup',
        trustUpdated: false,
        enhancedLogging: false,
      };
    }

    case 'skip': {
      return {
        action,
        patternId,
        resolved: true,
        message: 'Finding skipped',
        trustUpdated: false,
        enhancedLogging: false,
      };
    }

    case 'observe': {
      return {
        action,
        patternId,
        resolved: false,
        message: 'Enhanced logging enabled for this pattern',
        trustUpdated: false,
        enhancedLogging: true,
      };
    }
  }
}

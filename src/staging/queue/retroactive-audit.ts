/**
 * Retroactive audit recommender for the staging queue.
 *
 * When new hygiene patterns are added to the pattern reference, this
 * module identifies previously approved queue items (in ready or queued
 * states) that should be re-evaluated against the new patterns.
 *
 * Pure functions -- no I/O. All data is passed as arguments.
 *
 * @module staging/queue/retroactive-audit
 */

import type {
  HygienePattern,
  HygieneCategory,
  HygieneSeverity,
} from '../hygiene/types.js';
import type { QueueEntry, QueueState } from './types.js';

// ============================================================================
// Types
// ============================================================================

/** Details about a single pattern that triggered a recommendation. */
export interface PatternTrigger {
  /** Pattern identifier. */
  patternId: string;
  /** Human-readable pattern name. */
  patternName: string;
  /** Category of the pattern. */
  category: HygieneCategory;
  /** Severity of the pattern. */
  severity: HygieneSeverity;
}

/** Options for the retroactive audit recommender. */
export interface RetroactiveAuditOptions {
  /** Newly added hygiene patterns to check against. */
  newPatterns: HygienePattern[];
  /** Current queue entries to evaluate. */
  entries: QueueEntry[];
  /** Optional map of entryId -> document content for content scanning. */
  documentContents?: Map<string, string>;
}

/** A recommendation to re-audit a previously approved queue entry. */
export interface RetroactiveAuditRecommendation {
  /** Queue entry identifier. */
  entryId: string;
  /** Document filename. */
  filename: string;
  /** Milestone name of the entry. */
  milestoneName: string;
  /** All new patterns that triggered this recommendation. */
  triggeringPatterns: PatternTrigger[];
  /** Computed severity (max across triggering patterns, or matched patterns if content available). */
  severity: HygieneSeverity;
  /** Human-readable reason for the recommendation. */
  reason: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Only entries in these states are candidates for retroactive audit. */
export const ELIGIBLE_STATES: ReadonlySet<QueueState> = new Set<QueueState>([
  'ready',
  'queued',
]);

/** Severity ordering for sorting (lower number = higher priority). */
export const SEVERITY_ORDER: Record<HygieneSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Compute the maximum (most severe) severity from a list of severities.
 *
 * @param severities - Array of severity levels.
 * @returns The most severe level, or 'info' if the array is empty.
 */
function maxSeverity(severities: HygieneSeverity[]): HygieneSeverity {
  if (severities.length === 0) return 'info';
  let best: HygieneSeverity = severities[0];
  for (let i = 1; i < severities.length; i++) {
    if (SEVERITY_ORDER[severities[i]] < SEVERITY_ORDER[best]) {
      best = severities[i];
    }
  }
  return best;
}

/**
 * Check if a pattern's regex or detect function matches the given content.
 */
function patternMatchesContent(
  pattern: HygienePattern,
  content: string,
): boolean {
  if (pattern.detect) {
    const findings = pattern.detect(content);
    return findings.length > 0;
  }
  if (pattern.regex) {
    // Clone regex to avoid shared state with global flag
    const re = new RegExp(pattern.regex.source, pattern.regex.flags);
    return re.test(content);
  }
  return false;
}

// ============================================================================
// Main function
// ============================================================================

/**
 * Recommend retroactive hygiene audits for queue entries affected by
 * newly added patterns.
 *
 * Filters entries to only those in eligible states (ready, queued),
 * then builds a recommendation for each with all triggering patterns.
 *
 * When documentContents is provided, content is scanned against each
 * pattern to determine severity from actual matches. If no content is
 * available or no patterns match, severity falls back to the max
 * severity across all triggering patterns (precautionary).
 *
 * Results are sorted by severity (critical first).
 *
 * @param options - The audit options including patterns, entries, and optional content.
 * @returns Array of recommendations sorted by severity.
 */
export function recommendRetroactiveAudit(
  options: RetroactiveAuditOptions,
): RetroactiveAuditRecommendation[] {
  const { newPatterns, entries, documentContents } = options;

  // Early return for empty inputs
  if (newPatterns.length === 0 || entries.length === 0) {
    return [];
  }

  // Filter to eligible entries only
  const eligible = entries.filter((e) =>
    ELIGIBLE_STATES.has(e.state),
  );

  if (eligible.length === 0) {
    return [];
  }

  // Build triggers from all new patterns (same for every entry)
  const triggers: PatternTrigger[] = newPatterns.map((p) => ({
    patternId: p.id,
    patternName: p.name,
    category: p.category,
    severity: p.severity,
  }));

  // Precompute max severity across all triggering patterns
  const precautionarySeverity = maxSeverity(
    newPatterns.map((p) => p.severity),
  );

  // Build pattern name list for reason string
  const patternNames = newPatterns.map((p) => p.name).join(', ');

  const recommendations: RetroactiveAuditRecommendation[] = [];

  for (const entry of eligible) {
    // Determine severity: scan content if available
    let severity: HygieneSeverity;

    const content = documentContents?.get(entry.id);
    if (content !== undefined) {
      // Scan content against each pattern
      const matchedSeverities: HygieneSeverity[] = [];
      for (const pattern of newPatterns) {
        if (patternMatchesContent(pattern, content)) {
          matchedSeverities.push(pattern.severity);
        }
      }
      // If any matched, use max of matched; otherwise precautionary
      severity =
        matchedSeverities.length > 0
          ? maxSeverity(matchedSeverities)
          : precautionarySeverity;
    } else {
      severity = precautionarySeverity;
    }

    recommendations.push({
      entryId: entry.id,
      filename: entry.filename,
      milestoneName: entry.milestoneName,
      triggeringPatterns: triggers,
      severity,
      reason: `New hygiene pattern(s) added: ${patternNames}. Retroactive audit recommended for previously approved item.`,
    });
  }

  // Sort by severity (critical first)
  recommendations.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return recommendations;
}

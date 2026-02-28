/**
 * Self-Improvement Lifecycle -- action item generator.
 *
 * Generates prioritized action items from three sources:
 * 1. Calibration deltas (estimation adjustments)
 * 2. Changelog features (leverage/adopt decisions)
 * 3. Observations (new skills to create, promotions to evaluate)
 *
 * Pure function: no side effects, no I/O.
 *
 * @module retro/action-generator
 */

import type { ActionItem, CalibrationDelta, ChangelogEntry } from './types.js';
import type { ObservationSummary } from './observation-harvester.js';

// ============================================================================
// Priority ordering
// ============================================================================

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Sort action items by priority (high first), maintaining insertion order
 * within the same priority level.
 */
function sortByPriority(items: ActionItem[]): ActionItem[] {
  return [...items].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3),
  );
}

// ============================================================================
// Formatters
// ============================================================================

/**
 * Format a ratio for human display.
 */
function fmtRatio(ratio: number): string {
  if (ratio === Infinity) return 'Infinity';
  return ratio.toFixed(2);
}

// ============================================================================
// Main generator
// ============================================================================

/**
 * Generate action items from calibration deltas, changelog features, and
 * observations.
 *
 * Rules:
 * - Calibration: over/under deltas produce high-priority adjustment items.
 *   Accurate deltas are skipped (no action needed).
 * - Changelog: LEVERAGE_NOW features are high priority, PLAN_FOR are medium,
 *   WATCH features generate no action items (informational only).
 * - Observations: skill suggestions are medium priority, promotion candidates
 *   are low priority, new patterns are informational only.
 *
 * Result is sorted by priority: high -> medium -> low.
 */
export function generateActionItems(opts: {
  deltas: CalibrationDelta[];
  changelog?: ChangelogEntry[];
  observations?: ObservationSummary;
}): ActionItem[] {
  const items: ActionItem[] = [];

  // --- Calibration deltas ---
  for (const delta of opts.deltas) {
    if (delta.direction === 'accurate') continue;

    const verb = delta.direction === 'over' ? 'Reduce' : 'Increase';
    items.push({
      description: `${verb} estimate for ${delta.metric_name}: was ${delta.estimated}, actual ${delta.actual} (${fmtRatio(delta.ratio)}x)`,
      source: 'calibration',
      priority: 'high',
    });
  }

  // --- Changelog features ---
  if (opts.changelog) {
    for (const entry of opts.changelog) {
      if (entry.classification === 'LEVERAGE_NOW') {
        items.push({
          description: `Adopt ${entry.name}: ${entry.action || entry.impact}`,
          source: 'changelog',
          priority: 'high',
        });
      } else if (entry.classification === 'PLAN_FOR') {
        items.push({
          description: `Plan for ${entry.name}: ${entry.action || entry.impact}`,
          source: 'changelog',
          priority: 'medium',
        });
      }
      // WATCH: no action item (informational only, shown in retrospective)
    }
  }

  // --- Observations ---
  if (opts.observations) {
    for (const suggestion of opts.observations.skill_suggestions) {
      items.push({
        description: `Create skill for: ${suggestion}`,
        source: 'observation',
        priority: 'medium',
      });
    }

    for (const candidate of opts.observations.promotion_candidates) {
      items.push({
        description: `Evaluate promotion: ${candidate}`,
        source: 'observation',
        priority: 'low',
      });
    }

    // new_patterns: no action items (informational only, shown in retrospective)
  }

  return sortByPriority(items);
}

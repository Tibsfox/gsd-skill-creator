/**
 * Event boost post-processing for relevance scoring.
 *
 * Applies an additive boost to skills whose listens entries match
 * pending events. This is a standalone post-processor -- it does not
 * modify or couple to RelevanceScorer itself.
 *
 * Boost is applied once per skill regardless of how many events match
 * (uses some() not counting). The default boost factor is 0.3.
 */

import type { ScoredSkill } from '../types/application.js';
import type { EventEntry } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal skill metadata needed for event boost evaluation.
 * Skills declare which events they listen for in their frontmatter.
 */
export interface EventAwareSkill {
  name: string;
  listens?: string[];
}

// ============================================================================
// applyEventBoost
// ============================================================================

/**
 * Post-process scored skills to boost those with matching listens for pending events.
 *
 * @param scores - Scored skills from relevance scoring
 * @param pendingEvents - Currently pending events from the event store
 * @param skills - Skill metadata with listens declarations
 * @param boostFactor - Additive boost amount (default 0.3)
 * @returns New array of scored skills with boosted scores where applicable
 */
export function applyEventBoost(
  scores: ScoredSkill[],
  pendingEvents: EventEntry[],
  skills: EventAwareSkill[],
  boostFactor: number = 0.3,
): ScoredSkill[] {
  if (pendingEvents.length === 0) return scores;

  // Build set of pending event names for O(1) lookup
  const pendingNames = new Set(pendingEvents.map(e => e.event_name));

  // Build map of skill name -> listens entries for skills with non-empty listens
  const listensMap = new Map<string, string[]>();
  for (const skill of skills) {
    if (skill.listens && skill.listens.length > 0) {
      listensMap.set(skill.name, skill.listens);
    }
  }

  // Map over scores: boost if skill has matching listens
  return scores.map(scored => {
    const skillListens = listensMap.get(scored.name);
    if (!skillListens) return scored;

    // Check if ANY listen matches ANY pending event (boolean, not counting)
    const hasMatch = skillListens.some(listen => pendingNames.has(listen));
    if (!hasMatch) return scored;

    return { ...scored, score: scored.score + boostFactor };
  });
}

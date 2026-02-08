/**
 * Event connection suggestion engine using co-activation patterns.
 *
 * Analyzes session observations via CoActivationTracker to find skill
 * pairs that frequently activate together. For each pair, checks if
 * emitter skills have events that the co-activated partner doesn't
 * listen for, and suggests those as potential event connections.
 *
 * Follows the BundleSuggester pattern: wraps CoActivationTracker,
 * delegates pair detection, adds domain-specific suggestion logic.
 */

import { CoActivationTracker } from '../agents/co-activation-tracker.js';
import type { SessionObservation } from '../types/observation.js';
import type { EventConnectionSuggestion } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface EventSuggesterConfig {
  minCoActivations: number;
  recencyDays: number;
}

const DEFAULT_CONFIG: EventSuggesterConfig = {
  minCoActivations: 3,
  recencyDays: 14,
};

// ============================================================================
// EventSuggester
// ============================================================================

/**
 * Suggests event connections based on co-activation patterns in session data.
 *
 * Workflow:
 * 1. Run CoActivationTracker.analyze() to get pairwise co-activation data
 * 2. For each pair, check if emitter has events partner doesn't listen for
 * 3. Create suggestions for missing event connections
 * 4. Sort by coActivationScore descending
 */
export class EventSuggester {
  private config: EventSuggesterConfig;

  constructor(config?: Partial<EventSuggesterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Suggest event connections from session co-activation patterns.
   *
   * @param sessions - Session observations to analyze
   * @param skillEvents - Map of skill name to their declared emits/listens
   * @returns Suggestions sorted by coActivationScore descending
   */
  suggest(
    sessions: SessionObservation[],
    skillEvents: Map<string, { emits?: string[]; listens?: string[] }>,
  ): EventConnectionSuggestion[] {
    if (sessions.length === 0) return [];

    // 1. Get pairwise co-activation data
    const tracker = new CoActivationTracker({
      minCoActivations: this.config.minCoActivations,
      recencyDays: this.config.recencyDays,
    });
    const coActivations = tracker.analyze(sessions);

    if (coActivations.length === 0) return [];

    // 2. Build suggestions from co-activation pairs
    const suggestions: EventConnectionSuggestion[] = [];

    for (const ca of coActivations) {
      const [skillA, skillB] = ca.skillPair;

      const eventsA = skillEvents.get(skillA);
      const eventsB = skillEvents.get(skillB);

      // Check A emits -> B doesn't listen
      if (eventsA?.emits) {
        for (const eventName of eventsA.emits) {
          const bListens = eventsB?.listens ?? [];
          if (!bListens.includes(eventName)) {
            suggestions.push({
              emitterSkill: skillA,
              listenerSkill: skillB,
              suggestedEvent: eventName,
              coActivationScore: ca.coActivationCount,
              sessionCount: ca.sessions.length,
            });
          }
        }
      }

      // Check B emits -> A doesn't listen
      if (eventsB?.emits) {
        for (const eventName of eventsB.emits) {
          const aListens = eventsA?.listens ?? [];
          if (!aListens.includes(eventName)) {
            suggestions.push({
              emitterSkill: skillB,
              listenerSkill: skillA,
              suggestedEvent: eventName,
              coActivationScore: ca.coActivationCount,
              sessionCount: ca.sessions.length,
            });
          }
        }
      }
    }

    // 3. Sort by coActivationScore descending
    suggestions.sort((a, b) => b.coActivationScore - a.coActivationScore);

    return suggestions;
  }
}

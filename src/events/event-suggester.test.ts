/**
 * Tests for EventSuggester co-activation-based event connection suggestions.
 *
 * Covers:
 * - Returns empty array when sessions is empty
 * - Returns empty array when no skill pairs have co-activation above threshold
 * - Suggests event connection when skill A has emits, co-activates with B, and B has no matching listens
 * - Suggests in both directions: A emits -> B doesn't listen, AND B emits -> A doesn't listen
 * - Does NOT suggest connection when B already listens to A's event
 * - Suggestions sorted by coActivationScore descending
 * - Session count reflects the number of sessions where the pair co-activated
 * - Respects minCoActivations config (pairs below threshold omitted)
 * - Handles skills with no events declaration (treated as having neither emits nor listens)
 */

import { describe, it, expect } from 'vitest';
import { EventSuggester } from './event-suggester.js';
import type { SessionObservation } from '../types/observation.js';

// ============================================================================
// Helpers
// ============================================================================

function makeSession(
  sessionId: string,
  activeSkills: string[],
  startTime?: number,
): SessionObservation {
  const now = Date.now();
  return {
    sessionId,
    startTime: startTime ?? now,
    endTime: (startTime ?? now) + 60000,
    durationMinutes: 1,
    source: 'startup',
    reason: 'other',
    metrics: {
      userMessages: 5,
      assistantMessages: 5,
      toolCalls: 3,
      uniqueFilesRead: 2,
      uniqueFilesWritten: 1,
      uniqueCommandsRun: 1,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills,
  };
}

/**
 * Create N sessions where skillA and skillB co-activate.
 */
function makeSessions(skillA: string, skillB: string, count: number): SessionObservation[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) =>
    makeSession(`session-${i}`, [skillA, skillB], now - i * 1000),
  );
}

// ============================================================================
// EventSuggester
// ============================================================================

describe('EventSuggester', () => {
  it('returns empty array when sessions is empty', () => {
    const suggester = new EventSuggester();
    const skillEvents = new Map<string, { emits?: string[]; listens?: string[] }>();
    const result = suggester.suggest([], skillEvents);
    expect(result).toEqual([]);
  });

  it('returns empty array when no skill pairs have co-activation above threshold', () => {
    const suggester = new EventSuggester({ minCoActivations: 3 });
    // Only 2 sessions -- below threshold of 3
    const sessions = makeSessions('skill-a', 'skill-b', 2);
    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
      ['skill-b', { listens: [] }],
    ]);
    const result = suggester.suggest(sessions, skillEvents);
    expect(result).toEqual([]);
  });

  it('suggests event connection when skill A has emits, co-activates with B, and B has no matching listens', () => {
    const suggester = new EventSuggester({ minCoActivations: 3 });
    const sessions = makeSessions('skill-a', 'skill-b', 5);
    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
      ['skill-b', { listens: [] }],
    ]);
    const result = suggester.suggest(sessions, skillEvents);

    expect(result.length).toBeGreaterThanOrEqual(1);
    const suggestion = result.find(
      s => s.emitterSkill === 'skill-a' && s.listenerSkill === 'skill-b',
    );
    expect(suggestion).toBeDefined();
    expect(suggestion!.suggestedEvent).toBe('lint:complete');
    expect(suggestion!.coActivationScore).toBe(5);
  });

  it('suggests in both directions: A emits -> B and B emits -> A', () => {
    const suggester = new EventSuggester({ minCoActivations: 3 });
    const sessions = makeSessions('skill-a', 'skill-b', 4);
    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
      ['skill-b', { emits: ['test:pass'] }],
    ]);
    const result = suggester.suggest(sessions, skillEvents);

    const aToB = result.find(
      s => s.emitterSkill === 'skill-a' && s.listenerSkill === 'skill-b',
    );
    const bToA = result.find(
      s => s.emitterSkill === 'skill-b' && s.listenerSkill === 'skill-a',
    );
    expect(aToB).toBeDefined();
    expect(aToB!.suggestedEvent).toBe('lint:complete');
    expect(bToA).toBeDefined();
    expect(bToA!.suggestedEvent).toBe('test:pass');
  });

  it('does NOT suggest connection when B already listens to A\'s event', () => {
    const suggester = new EventSuggester({ minCoActivations: 3 });
    const sessions = makeSessions('skill-a', 'skill-b', 5);
    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
      ['skill-b', { listens: ['lint:complete'] }], // already listens!
    ]);
    const result = suggester.suggest(sessions, skillEvents);

    const aToB = result.find(
      s => s.emitterSkill === 'skill-a' && s.listenerSkill === 'skill-b',
    );
    expect(aToB).toBeUndefined();
  });

  it('suggestions sorted by coActivationScore descending', () => {
    const suggester = new EventSuggester({ minCoActivations: 3 });

    // Create sessions with different co-activation counts
    const now = Date.now();
    const sessions = [
      // skill-a + skill-b: 5 sessions
      ...makeSessions('skill-a', 'skill-b', 5),
      // skill-c + skill-d: 3 sessions (lower count)
      ...Array.from({ length: 3 }, (_, i) =>
        makeSession(`cd-session-${i}`, ['skill-c', 'skill-d'], now - i * 1000),
      ),
    ];

    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
      ['skill-b', {}],
      ['skill-c', { emits: ['build:start'] }],
      ['skill-d', {}],
    ]);

    const result = suggester.suggest(sessions, skillEvents);

    expect(result.length).toBeGreaterThanOrEqual(2);
    // First suggestion should have higher score
    expect(result[0].coActivationScore).toBeGreaterThanOrEqual(result[1].coActivationScore);
  });

  it('session count reflects the number of sessions where the pair co-activated', () => {
    const suggester = new EventSuggester({ minCoActivations: 3 });
    const sessions = makeSessions('skill-a', 'skill-b', 4);
    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
      ['skill-b', {}],
    ]);

    const result = suggester.suggest(sessions, skillEvents);
    const suggestion = result.find(s => s.emitterSkill === 'skill-a');
    expect(suggestion).toBeDefined();
    expect(suggestion!.sessionCount).toBe(4);
  });

  it('respects minCoActivations config (pairs below threshold omitted)', () => {
    const suggester = new EventSuggester({ minCoActivations: 10 });
    // Only 5 sessions -- below threshold of 10
    const sessions = makeSessions('skill-a', 'skill-b', 5);
    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
      ['skill-b', {}],
    ]);
    const result = suggester.suggest(sessions, skillEvents);
    expect(result).toEqual([]);
  });

  it('handles skills with no events declaration (treated as having neither emits nor listens)', () => {
    const suggester = new EventSuggester({ minCoActivations: 3 });
    const sessions = makeSessions('skill-a', 'skill-b', 5);

    // skill-b is NOT in the skillEvents map at all
    const skillEvents = new Map([
      ['skill-a', { emits: ['lint:complete'] }],
    ]);

    // Should still suggest since skill-b doesn't appear in map (no listens)
    const result = suggester.suggest(sessions, skillEvents);
    const suggestion = result.find(
      s => s.emitterSkill === 'skill-a' && s.listenerSkill === 'skill-b',
    );
    expect(suggestion).toBeDefined();
    expect(suggestion!.suggestedEvent).toBe('lint:complete');
  });
});

/**
 * Tests for applyEventBoost post-processing function.
 *
 * Covers:
 * - Returns scores unchanged when pendingEvents is empty array
 * - Returns scores unchanged when no skill has matching listens entries
 * - Boosts score by 0.3 (default boostFactor) for skill whose listens includes a pending event name
 * - Does not boost skills with no listens field
 * - Handles multiple pending events -- skill listening to any one gets boosted
 * - Does not double-boost a skill that matches multiple pending events (boost applied once per skill)
 * - Custom boostFactor (e.g., 0.5) is applied instead of default
 * - Preserves original matchType on boosted skills
 * - Returns new array (does not mutate input)
 */

import { describe, it, expect } from 'vitest';
import { applyEventBoost } from './event-boost.js';
import type { EventAwareSkill } from './event-boost.js';
import type { ScoredSkill } from '../types/application.js';
import type { EventEntry } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeScoredSkill(name: string, score: number, matchType: 'intent' | 'file' | 'context' = 'intent'): ScoredSkill {
  return { name, score, matchType };
}

function makeEventEntry(eventName: string, overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    event_name: eventName,
    emitted_by: 'test-skill',
    status: 'pending',
    emitted_at: new Date().toISOString(),
    consumed_by: null,
    consumed_at: null,
    ttl_hours: 24,
    ...overrides,
  };
}

// ============================================================================
// applyEventBoost
// ============================================================================

describe('applyEventBoost', () => {
  const skills: EventAwareSkill[] = [
    { name: 'skill-a', listens: ['lint:complete', 'test:pass'] },
    { name: 'skill-b', listens: ['deploy:start'] },
    { name: 'skill-c' }, // no listens
  ];

  const scores: ScoredSkill[] = [
    makeScoredSkill('skill-a', 0.5),
    makeScoredSkill('skill-b', 0.4),
    makeScoredSkill('skill-c', 0.3),
  ];

  it('returns scores unchanged when pendingEvents is empty array', () => {
    const result = applyEventBoost(scores, [], skills);
    expect(result).toEqual(scores);
  });

  it('returns scores unchanged when no skill has matching listens entries', () => {
    const pending = [makeEventEntry('build:complete')];
    const result = applyEventBoost(scores, pending, skills);
    expect(result).toEqual(scores);
  });

  it('boosts score by 0.3 (default boostFactor) for skill whose listens includes a pending event name', () => {
    const pending = [makeEventEntry('lint:complete')];
    const result = applyEventBoost(scores, pending, skills);

    const boostedA = result.find(s => s.name === 'skill-a');
    expect(boostedA?.score).toBeCloseTo(0.8); // 0.5 + 0.3

    const unchangedB = result.find(s => s.name === 'skill-b');
    expect(unchangedB?.score).toBeCloseTo(0.4);
  });

  it('does not boost skills with no listens field', () => {
    const pending = [makeEventEntry('lint:complete')];
    const result = applyEventBoost(scores, pending, skills);

    const unchangedC = result.find(s => s.name === 'skill-c');
    expect(unchangedC?.score).toBeCloseTo(0.3);
  });

  it('handles multiple pending events -- skill listening to any one gets boosted', () => {
    const pending = [
      makeEventEntry('deploy:start'),
      makeEventEntry('lint:complete'),
    ];
    const result = applyEventBoost(scores, pending, skills);

    const boostedA = result.find(s => s.name === 'skill-a');
    expect(boostedA?.score).toBeCloseTo(0.8); // skill-a listens to lint:complete

    const boostedB = result.find(s => s.name === 'skill-b');
    expect(boostedB?.score).toBeCloseTo(0.7); // skill-b listens to deploy:start
  });

  it('does not double-boost a skill that matches multiple pending events', () => {
    const pending = [
      makeEventEntry('lint:complete'),
      makeEventEntry('test:pass'),
    ];
    // skill-a listens to both lint:complete and test:pass
    const result = applyEventBoost(scores, pending, skills);

    const boostedA = result.find(s => s.name === 'skill-a');
    expect(boostedA?.score).toBeCloseTo(0.8); // 0.5 + 0.3, NOT 0.5 + 0.6
  });

  it('custom boostFactor (e.g., 0.5) is applied instead of default', () => {
    const pending = [makeEventEntry('lint:complete')];
    const result = applyEventBoost(scores, pending, skills, 0.5);

    const boostedA = result.find(s => s.name === 'skill-a');
    expect(boostedA?.score).toBeCloseTo(1.0); // 0.5 + 0.5
  });

  it('preserves original matchType on boosted skills', () => {
    const typedScores: ScoredSkill[] = [
      makeScoredSkill('skill-a', 0.5, 'file'),
      makeScoredSkill('skill-b', 0.4, 'context'),
    ];
    const pending = [makeEventEntry('lint:complete')];
    const result = applyEventBoost(typedScores, pending, skills);

    const boostedA = result.find(s => s.name === 'skill-a');
    expect(boostedA?.matchType).toBe('file');

    const unchangedB = result.find(s => s.name === 'skill-b');
    expect(unchangedB?.matchType).toBe('context');
  });

  it('returns new array (does not mutate input)', () => {
    const pending = [makeEventEntry('lint:complete')];
    const originalScores = scores.map(s => ({ ...s }));
    const result = applyEventBoost(originalScores, pending, skills);

    // Result should be a different array reference
    expect(result).not.toBe(originalScores);

    // Original scores should not be modified
    expect(originalScores[0].score).toBeCloseTo(0.5);
  });
});

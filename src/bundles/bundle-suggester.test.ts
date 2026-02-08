/**
 * Tests for bundle auto-suggestion from co-activation patterns.
 *
 * Covers:
 * - suggest() with no sessions returns empty array
 * - suggest() with < 3 skills returns empty (need 3+ for a bundle)
 * - suggest() with 3 skills that all co-activate >= minCoActivations returns suggestion
 * - suggest() filters out partial cliques (A-B + B-C but not A-C = no bundle)
 * - suggest() returns multiple suggestions when multiple cliques exist
 * - suggest() suggestions sorted by coActivationScore descending
 * - suggest() filters out skills in excludeSkills set
 * - suggest() with minClusterSize=4 requires 4+ skill cliques
 * - Clique detection: 3 skills all pairwise co-activated = clique detected
 * - Clique detection: 4 skills where only 3 form complete subgraph = returns 3-skill clique
 * - Clique detection: skills below minCoActivations are not included
 */

import { describe, it, expect } from 'vitest';
import { BundleSuggester } from './bundle-suggester.js';
import type { SessionObservation } from '../types/observation.js';

// ============================================================================
// Helpers
// ============================================================================

function createSession(
  id: string,
  activeSkills: string[],
  overrides: Partial<SessionObservation> = {},
): SessionObservation {
  return {
    sessionId: id,
    startTime: Date.now(),
    endTime: Date.now() + 60000,
    durationMinutes: 5,
    source: 'startup',
    reason: 'clear',
    metrics: {
      userMessages: 3,
      assistantMessages: 3,
      toolCalls: 5,
      uniqueFilesRead: 2,
      uniqueFilesWritten: 1,
      uniqueCommandsRun: 1,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills,
    ...overrides,
  };
}

/**
 * Create N sessions where all given skills are active together.
 * This ensures all pairwise co-activations hit the threshold.
 */
function createCoActivatedSessions(
  skills: string[],
  count: number,
  baseId = 'sess',
): SessionObservation[] {
  return Array.from({ length: count }, (_, i) =>
    createSession(`${baseId}-${i}`, skills),
  );
}

// ============================================================================
// BundleSuggester
// ============================================================================

describe('BundleSuggester', () => {
  describe('suggest', () => {
    it('returns empty array for no sessions', () => {
      const suggester = new BundleSuggester({ minCoActivations: 3 });
      const result = suggester.suggest([]);
      expect(result).toEqual([]);
    });

    it('returns empty when sessions have < 3 unique skills', () => {
      const suggester = new BundleSuggester({ minCoActivations: 1 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b']),
        createSession('s2', ['skill-a', 'skill-b']),
        createSession('s3', ['skill-a', 'skill-b']),
      ];
      const result = suggester.suggest(sessions);
      expect(result).toEqual([]);
    });

    it('returns a suggestion when 3 skills all co-activate >= minCoActivations', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 3,
      });
      // 3 sessions where all 3 skills are active together
      const sessions = createCoActivatedSessions(['skill-a', 'skill-b', 'skill-c'], 3);
      const result = suggester.suggest(sessions);

      expect(result.length).toBeGreaterThanOrEqual(1);
      const suggestion = result[0];
      expect(suggestion.skills.sort()).toEqual(['skill-a', 'skill-b', 'skill-c']);
      expect(suggestion.coActivationScore).toBeGreaterThan(0);
      expect(suggestion.sessionCount).toBe(3);
    });

    it('filters out partial cliques (A-B co-activate, B-C co-activate, but A-C do not)', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 3,
      });
      // A-B co-activate in 3 sessions
      const abSessions = createCoActivatedSessions(['skill-a', 'skill-b'], 3, 'ab');
      // B-C co-activate in 3 sessions
      const bcSessions = createCoActivatedSessions(['skill-b', 'skill-c'], 3, 'bc');
      // A-C never co-activate together -> no 3-clique

      const result = suggester.suggest([...abSessions, ...bcSessions]);
      expect(result).toEqual([]);
    });

    it('returns multiple suggestions when multiple cliques exist', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 3,
      });
      // Clique 1: alpha, beta, gamma
      const clique1 = createCoActivatedSessions(
        ['alpha', 'beta', 'gamma'],
        3,
        'c1',
      );
      // Clique 2: x, y, z
      const clique2 = createCoActivatedSessions(['x', 'y', 'z'], 3, 'c2');

      const result = suggester.suggest([...clique1, ...clique2]);
      expect(result.length).toBeGreaterThanOrEqual(2);

      const skillSets = result.map(s => s.skills.sort().join(','));
      expect(skillSets).toContain('alpha,beta,gamma');
      expect(skillSets).toContain('x,y,z');
    });

    it('suggestions are sorted by coActivationScore descending', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 3,
      });
      // Clique 1 has 3 co-activations
      const clique1 = createCoActivatedSessions(
        ['alpha', 'beta', 'gamma'],
        3,
        'c1',
      );
      // Clique 2 has 5 co-activations (stronger)
      const clique2 = createCoActivatedSessions(['x', 'y', 'z'], 5, 'c2');

      const result = suggester.suggest([...clique1, ...clique2]);
      expect(result.length).toBeGreaterThanOrEqual(2);

      // First suggestion should have higher score
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].coActivationScore).toBeGreaterThanOrEqual(
          result[i].coActivationScore,
        );
      }
    });

    it('filters out skills in excludeSkills set', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 3,
      });
      const sessions = createCoActivatedSessions(
        ['skill-a', 'skill-b', 'skill-c'],
        3,
      );

      // Exclude skill-a -> no 3-clique possible with remaining skills
      const result = suggester.suggest(sessions, new Set(['skill-a']));
      expect(result).toEqual([]);
    });

    it('with minClusterSize=4 requires 4+ skill cliques', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 4,
      });
      // Only 3 skills co-activate -> should not meet minClusterSize=4
      const sessions = createCoActivatedSessions(
        ['skill-a', 'skill-b', 'skill-c'],
        3,
      );
      const result = suggester.suggest(sessions);
      expect(result).toEqual([]);
    });

    it('with minClusterSize=4 returns suggestion when 4 skills form complete clique', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 4,
      });
      const sessions = createCoActivatedSessions(
        ['skill-a', 'skill-b', 'skill-c', 'skill-d'],
        3,
      );
      const result = suggester.suggest(sessions);

      expect(result.length).toBeGreaterThanOrEqual(1);
      const largest = result[0];
      expect(largest.skills.sort()).toEqual([
        'skill-a',
        'skill-b',
        'skill-c',
        'skill-d',
      ]);
    });
  });

  describe('clique detection', () => {
    it('detects 3 skills all pairwise co-activated >= threshold', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 2,
        minClusterSize: 3,
      });
      const sessions = createCoActivatedSessions(
        ['skill-a', 'skill-b', 'skill-c'],
        2,
      );
      const result = suggester.suggest(sessions);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].skills.sort()).toEqual([
        'skill-a',
        'skill-b',
        'skill-c',
      ]);
    });

    it('returns 3-skill clique when only 3 of 4 form complete subgraph', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 3,
        minClusterSize: 3,
      });
      // A-B-C form a complete clique
      const cliqueSessions = createCoActivatedSessions(
        ['skill-a', 'skill-b', 'skill-c'],
        3,
        'clique',
      );
      // D co-activates with A and B but NOT C
      const daSessions = createCoActivatedSessions(
        ['skill-d', 'skill-a'],
        3,
        'da',
      );
      const dbSessions = createCoActivatedSessions(
        ['skill-d', 'skill-b'],
        3,
        'db',
      );
      // D-C never co-activate

      const result = suggester.suggest([
        ...cliqueSessions,
        ...daSessions,
        ...dbSessions,
      ]);

      // Should find the A-B-C clique but NOT a 4-skill clique
      expect(result.length).toBeGreaterThanOrEqual(1);
      const skillSets = result.map(s => s.skills.sort().join(','));
      expect(skillSets).toContain('skill-a,skill-b,skill-c');
      // No 4-skill clique should exist
      const fourSkillCliques = result.filter(s => s.skills.length >= 4);
      expect(fourSkillCliques).toHaveLength(0);
    });

    it('skills that co-activate below minCoActivations are not included', () => {
      const suggester = new BundleSuggester({
        minCoActivations: 5,
        minClusterSize: 3,
      });
      // Only 3 co-activations, but threshold is 5
      const sessions = createCoActivatedSessions(
        ['skill-a', 'skill-b', 'skill-c'],
        3,
      );
      const result = suggester.suggest(sessions);
      expect(result).toEqual([]);
    });
  });
});

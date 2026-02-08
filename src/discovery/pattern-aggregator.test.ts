/**
 * TDD tests for pattern aggregator with noise filtering.
 *
 * Tests PatternAggregator class: addSessionPatterns (cross-session/project
 * accumulation), filterNoise (framework noise removal), getResults (defensive
 * copy), and getTotalProjectsTracked (unique project count).
 */

import { describe, it, expect } from 'vitest';
import { PatternAggregator } from './pattern-aggregator.js';
import type { SessionPatterns, PatternOccurrence } from './pattern-aggregator.js';

// ============================================================================
// Helpers
// ============================================================================

function makeSession(overrides: Partial<SessionPatterns> & { sessionId: string; projectSlug: string }): SessionPatterns {
  return {
    toolBigrams: new Map(),
    toolTrigrams: new Map(),
    bashPatterns: new Map(),
    ...overrides,
  };
}

// ============================================================================
// addSessionPatterns
// ============================================================================

describe('PatternAggregator', () => {
  describe('addSessionPatterns', () => {
    it('accumulates tool bigram counts with correct key prefix', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 3]]),
      }));

      const results = agg.getResults();
      const entry = results.get('tool:bigram:Read->Edit');
      expect(entry).toBeDefined();
      expect(entry!.totalCount).toBe(3);
      expect(entry!.sessionCount).toBe(1);
      expect(entry!.projectCount).toBe(1);
      expect(entry!.sessionIds.has('s1')).toBe(true);
      expect(entry!.projectSlugs.has('proj-a')).toBe(true);
      expect(entry!.perSessionCounts.get('s1')).toBe(3);
    });

    it('accumulates tool trigram counts with correct key prefix', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolTrigrams: new Map([['Read->Edit->Bash', 2]]),
      }));

      const results = agg.getResults();
      const entry = results.get('tool:trigram:Read->Edit->Bash');
      expect(entry).toBeDefined();
      expect(entry!.totalCount).toBe(2);
    });

    it('accumulates bash pattern counts with correct key prefix', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        bashPatterns: new Map([['git-workflow', 5]]),
      }));

      const results = agg.getResults();
      const entry = results.get('bash:git-workflow');
      expect(entry).toBeDefined();
      expect(entry!.totalCount).toBe(5);
    });

    it('merges counts from same session correctly', () => {
      const agg = new PatternAggregator();
      // Two calls with same session -- could happen if session data is split
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 3]]),
      }));
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 2]]),
      }));

      const results = agg.getResults();
      const entry = results.get('tool:bigram:Read->Edit')!;
      expect(entry.totalCount).toBe(5);
      // Same session added twice -- sessionCount should stay 1
      expect(entry.sessionCount).toBe(1);
      expect(entry.sessionIds.size).toBe(1);
      // perSessionCounts should accumulate
      expect(entry.perSessionCounts.get('s1')).toBe(5);
    });

    it('increments sessionCount and adds sessionId for new sessions', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 1]]),
      }));
      agg.addSessionPatterns(makeSession({
        sessionId: 's2',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 4]]),
      }));

      const entry = agg.getResults().get('tool:bigram:Read->Edit')!;
      expect(entry.totalCount).toBe(5);
      expect(entry.sessionCount).toBe(2);
      expect(entry.sessionIds.has('s1')).toBe(true);
      expect(entry.sessionIds.has('s2')).toBe(true);
      // Same project, so projectCount stays 1
      expect(entry.projectCount).toBe(1);
      expect(entry.projectSlugs.size).toBe(1);
      expect(entry.perSessionCounts.get('s1')).toBe(1);
      expect(entry.perSessionCounts.get('s2')).toBe(4);
    });

    it('increments projectCount and adds projectSlug for new projects', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 1]]),
      }));
      agg.addSessionPatterns(makeSession({
        sessionId: 's2',
        projectSlug: 'proj-b',
        toolBigrams: new Map([['Read->Edit', 1]]),
      }));

      const entry = agg.getResults().get('tool:bigram:Read->Edit')!;
      expect(entry.projectCount).toBe(2);
      expect(entry.projectSlugs.has('proj-a')).toBe(true);
      expect(entry.projectSlugs.has('proj-b')).toBe(true);
    });

    it('handles all three pattern types in a single session', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 2]]),
        toolTrigrams: new Map([['Read->Edit->Bash', 1]]),
        bashPatterns: new Map([['git-workflow', 3]]),
      }));

      const results = agg.getResults();
      expect(results.size).toBe(3);
      expect(results.get('tool:bigram:Read->Edit')!.totalCount).toBe(2);
      expect(results.get('tool:trigram:Read->Edit->Bash')!.totalCount).toBe(1);
      expect(results.get('bash:git-workflow')!.totalCount).toBe(3);
    });

    it('handles empty maps gracefully', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
      }));

      expect(agg.getResults().size).toBe(0);
    });
  });

  // ============================================================================
  // filterNoise
  // ============================================================================

  describe('filterNoise', () => {
    it('removes patterns at or above both thresholds (20 of 24 = 83% >= 80%, 20 >= 15)', () => {
      const agg = new PatternAggregator();
      // Add pattern across 20 projects
      for (let i = 0; i < 20; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Read->Edit', 1]]),
        }));
      }

      agg.filterNoise(24);
      expect(agg.getResults().has('tool:bigram:Read->Edit')).toBe(false);
    });

    it('keeps patterns below percentage threshold (20 of 30 = 67% < 80%)', () => {
      const agg = new PatternAggregator();
      for (let i = 0; i < 20; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Read->Edit', 1]]),
        }));
      }

      agg.filterNoise(30);
      expect(agg.getResults().has('tool:bigram:Read->Edit')).toBe(true);
    });

    it('keeps patterns below absolute threshold (10 of 12 = 83% but 10 < 15)', () => {
      const agg = new PatternAggregator();
      for (let i = 0; i < 10; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Read->Edit', 1]]),
        }));
      }

      agg.filterNoise(12);
      expect(agg.getResults().has('tool:bigram:Read->Edit')).toBe(true);
    });

    it('keeps patterns in very small corpus (3 of 3 = 100% but 3 < 15)', () => {
      const agg = new PatternAggregator();
      for (let i = 0; i < 3; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Read->Edit', 1]]),
        }));
      }

      agg.filterNoise(3);
      expect(agg.getResults().has('tool:bigram:Read->Edit')).toBe(true);
    });

    it('uses custom minProjectThreshold when provided', () => {
      const agg = new PatternAggregator();
      for (let i = 0; i < 5; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Read->Edit', 1]]),
        }));
      }

      // 5 of 6 = 83% and 5 >= 5 (custom threshold) -- should be removed
      agg.filterNoise(6, 5);
      expect(agg.getResults().has('tool:bigram:Read->Edit')).toBe(false);
    });

    it('preserves non-noisy patterns while removing noisy ones', () => {
      const agg = new PatternAggregator();
      // Add ubiquitous pattern across 20 projects
      for (let i = 0; i < 20; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Read->Edit', 1]]),
        }));
      }
      // Add rare pattern in only 3 projects
      for (let i = 0; i < 3; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `rare-s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Glob->Read', 1]]),
        }));
      }

      agg.filterNoise(24);
      expect(agg.getResults().has('tool:bigram:Read->Edit')).toBe(false);
      expect(agg.getResults().has('tool:bigram:Glob->Read')).toBe(true);
    });

    it('mutates in place (does not return new aggregator)', () => {
      const agg = new PatternAggregator();
      for (let i = 0; i < 20; i++) {
        agg.addSessionPatterns(makeSession({
          sessionId: `s${i}`,
          projectSlug: `proj-${i}`,
          toolBigrams: new Map([['Read->Edit', 1]]),
        }));
      }

      const resultBefore = agg.getResults();
      expect(resultBefore.size).toBe(1);

      agg.filterNoise(24);

      const resultAfter = agg.getResults();
      expect(resultAfter.size).toBe(0);
    });
  });

  // ============================================================================
  // getResults
  // ============================================================================

  describe('getResults', () => {
    it('returns a defensive copy (mutating returned map does not affect internal state)', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 1]]),
      }));

      const copy = agg.getResults();
      copy.delete('tool:bigram:Read->Edit');

      // Internal state should be unaffected
      const fresh = agg.getResults();
      expect(fresh.has('tool:bigram:Read->Edit')).toBe(true);
    });

    it('returns empty map when no patterns have been added', () => {
      const agg = new PatternAggregator();
      expect(agg.getResults().size).toBe(0);
    });
  });

  // ============================================================================
  // getTotalProjectsTracked
  // ============================================================================

  describe('getTotalProjectsTracked', () => {
    it('returns 0 when no sessions have been added', () => {
      const agg = new PatternAggregator();
      expect(agg.getTotalProjectsTracked()).toBe(0);
    });

    it('returns count of unique project slugs', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 1]]),
      }));
      agg.addSessionPatterns(makeSession({
        sessionId: 's2',
        projectSlug: 'proj-b',
        toolBigrams: new Map([['Read->Edit', 1]]),
      }));
      agg.addSessionPatterns(makeSession({
        sessionId: 's3',
        projectSlug: 'proj-a',
        toolBigrams: new Map([['Read->Edit', 1]]),
      }));

      expect(agg.getTotalProjectsTracked()).toBe(2);
    });

    it('tracks projects even from sessions with empty pattern maps', () => {
      const agg = new PatternAggregator();
      agg.addSessionPatterns(makeSession({
        sessionId: 's1',
        projectSlug: 'proj-a',
      }));

      expect(agg.getTotalProjectsTracked()).toBe(1);
    });
  });
});

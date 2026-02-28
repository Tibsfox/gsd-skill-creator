/**
 * TDD tests for multi-factor pattern scoring formula.
 *
 * Tests scorePattern (frequency, cross-project, recency, consistency factors),
 * parsePatternKey (all three key formats), and generateCandidateName (skill
 * name generation from parsed keys).
 */

import { describe, it, expect } from 'vitest';
import {
  scorePattern,
  parsePatternKey,
  generateCandidateName,
  DEFAULT_SCORING_WEIGHTS,
} from './pattern-scorer.js';
import type { PatternOccurrence } from './pattern-aggregator.js';
import type { ScoringWeights } from './pattern-scorer.js';

// ============================================================================
// Helpers
// ============================================================================

function makeOccurrence(overrides: Partial<PatternOccurrence> = {}): PatternOccurrence {
  const sessionIds = overrides.sessionIds ?? new Set(['s1', 's2', 's3', 's4', 's5']);
  const projectSlugs = overrides.projectSlugs ?? new Set(['p1', 'p2', 'p3']);
  const perSessionCounts = overrides.perSessionCounts ?? new Map([
    ['s1', 2], ['s2', 3], ['s3', 1], ['s4', 2], ['s5', 2],
  ]);

  return {
    totalCount: overrides.totalCount ?? 10,
    sessionCount: overrides.sessionCount ?? 5,
    projectCount: overrides.projectCount ?? 3,
    sessionIds,
    projectSlugs,
    perSessionCounts,
  };
}

/** Helper to create a session timestamps map */
function makeTimestamps(entries: Array<[string, number]>): Map<string, number> {
  return new Map(entries);
}

// ============================================================================
// parsePatternKey
// ============================================================================

describe('parsePatternKey', () => {
  it('parses tool:bigram key into type, tools, and raw', () => {
    const result = parsePatternKey('tool:bigram:Read->Edit');
    expect(result).toEqual({
      type: 'tool-bigram',
      tools: ['Read', 'Edit'],
      raw: 'Read->Edit',
    });
  });

  it('parses tool:trigram key into type, tools, and raw', () => {
    const result = parsePatternKey('tool:trigram:Read->Edit->Bash');
    expect(result).toEqual({
      type: 'tool-trigram',
      tools: ['Read', 'Edit', 'Bash'],
      raw: 'Read->Edit->Bash',
    });
  });

  it('parses bash key into type, category, and raw', () => {
    const result = parsePatternKey('bash:git-workflow');
    expect(result).toEqual({
      type: 'bash-pattern',
      category: 'git-workflow',
      raw: 'git-workflow',
    });
  });

  it('throws on unknown key format', () => {
    expect(() => parsePatternKey('unknown:foo')).toThrow('Unknown pattern key format');
  });
});

// ============================================================================
// generateCandidateName
// ============================================================================

describe('generateCandidateName', () => {
  it('generates hyphenated workflow name for tool bigram', () => {
    const parsed = parsePatternKey('tool:bigram:Read->Edit');
    expect(generateCandidateName(parsed)).toBe('read-edit-workflow');
  });

  it('generates hyphenated workflow name for tool trigram', () => {
    const parsed = parsePatternKey('tool:trigram:Read->Edit->Bash');
    expect(generateCandidateName(parsed)).toBe('read-edit-bash-workflow');
  });

  it('generates patterns name for bash category', () => {
    const parsed = parsePatternKey('bash:git-workflow');
    expect(generateCandidateName(parsed)).toBe('git-workflow-patterns');
  });
});

// ============================================================================
// DEFAULT_SCORING_WEIGHTS
// ============================================================================

describe('DEFAULT_SCORING_WEIGHTS', () => {
  it('has weights that sum to 1.0', () => {
    const sum =
      DEFAULT_SCORING_WEIGHTS.frequency +
      DEFAULT_SCORING_WEIGHTS.crossProject +
      DEFAULT_SCORING_WEIGHTS.recency +
      DEFAULT_SCORING_WEIGHTS.consistency;
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

// ============================================================================
// scorePattern
// ============================================================================

describe('scorePattern', () => {
  const now = Date.now();

  it('returns score in [0, 1] range for typical inputs', () => {
    const occ = makeOccurrence();
    const timestamps = makeTimestamps([
      ['s1', now - 86400000],       // 1 day ago
      ['s2', now - 2 * 86400000],   // 2 days ago
      ['s3', now - 5 * 86400000],   // 5 days ago
      ['s4', now - 10 * 86400000],  // 10 days ago
      ['s5', now - 20 * 86400000],  // 20 days ago
    ]);

    const { score } = scorePattern(occ, 10, 100, timestamps, now);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('uses log-scale for frequency: 1000 count does NOT produce 100x score of 10 count', () => {
    const timestamps = makeTimestamps([['s1', now]]);

    const occ10 = makeOccurrence({
      totalCount: 10,
      sessionCount: 1,
      projectCount: 1,
      sessionIds: new Set(['s1']),
      projectSlugs: new Set(['p1']),
      perSessionCounts: new Map([['s1', 10]]),
    });
    const occ1000 = makeOccurrence({
      totalCount: 1000,
      sessionCount: 1,
      projectCount: 1,
      sessionIds: new Set(['s1']),
      projectSlugs: new Set(['p1']),
      perSessionCounts: new Map([['s1', 1000]]),
    });

    const { breakdown: b10 } = scorePattern(occ10, 10, 10, timestamps, now);
    const { breakdown: b1000 } = scorePattern(occ1000, 10, 10, timestamps, now);

    // With log-scale, 1000 should NOT be 100x the score of 10
    // log2(11)/10 ≈ 0.346, log2(1001)/10 ≈ 0.999
    // Ratio should be roughly 3x, not 100x
    const ratio = b1000.frequency / b10.frequency;
    expect(ratio).toBeLessThan(10);
    expect(ratio).toBeGreaterThan(1);
  });

  it('calculates cross-project score as fraction of total projects', () => {
    const occ = makeOccurrence({
      projectCount: 5,
      projectSlugs: new Set(['p1', 'p2', 'p3', 'p4', 'p5']),
    });
    const timestamps = makeTimestamps([['s1', now]]);

    const { breakdown } = scorePattern(occ, 10, 100, timestamps, now);
    expect(breakdown.crossProject).toBeCloseTo(0.5, 5);
  });

  it('gives high recency for pattern seen today', () => {
    const occ = makeOccurrence({
      sessionIds: new Set(['s1']),
      sessionCount: 1,
      perSessionCounts: new Map([['s1', 5]]),
    });
    const timestamps = makeTimestamps([['s1', now]]);

    const { breakdown } = scorePattern(occ, 10, 100, timestamps, now);
    expect(breakdown.recency).toBeGreaterThan(0.9);
  });

  it('gives low recency for pattern seen 60 days ago', () => {
    const occ = makeOccurrence({
      sessionIds: new Set(['s1']),
      sessionCount: 1,
      perSessionCounts: new Map([['s1', 5]]),
    });
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const timestamps = makeTimestamps([['s1', now - sixtyDaysMs]]);

    const { breakdown } = scorePattern(occ, 10, 100, timestamps, now);
    // exp(-0.693 * 60/14) ≈ exp(-2.97) ≈ 0.051
    expect(breakdown.recency).toBeLessThan(0.1);
  });

  it('gives zero recency when no session timestamps exist', () => {
    const occ = makeOccurrence({
      sessionIds: new Set(['s1']),
      sessionCount: 1,
      perSessionCounts: new Map([['s1', 5]]),
    });
    const timestamps = makeTimestamps([]); // no timestamps at all

    const { breakdown } = scorePattern(occ, 10, 100, timestamps, now);
    expect(breakdown.recency).toBe(0);
  });

  it('calculates consistency as fraction of total sessions', () => {
    const occ = makeOccurrence({
      sessionCount: 10,
      sessionIds: new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']),
    });
    const timestamps = makeTimestamps([['s1', now]]);

    const { breakdown } = scorePattern(occ, 10, 100, timestamps, now);
    expect(breakdown.consistency).toBeCloseTo(0.1, 5);
  });

  it('applies custom weights instead of defaults', () => {
    const occ = makeOccurrence();
    const timestamps = makeTimestamps([['s1', now]]);

    // All weight on frequency
    const customWeights: ScoringWeights = {
      frequency: 1.0,
      crossProject: 0,
      recency: 0,
      consistency: 0,
    };

    const { score, breakdown } = scorePattern(occ, 10, 100, timestamps, now, customWeights);
    expect(score).toBeCloseTo(breakdown.frequency, 5);
  });

  it('handles zero totalProjects gracefully', () => {
    const occ = makeOccurrence();
    const timestamps = makeTimestamps([['s1', now]]);

    const { breakdown } = scorePattern(occ, 0, 100, timestamps, now);
    expect(breakdown.crossProject).toBe(0);
  });

  it('handles zero totalSessions gracefully', () => {
    const occ = makeOccurrence();
    const timestamps = makeTimestamps([['s1', now]]);

    const { breakdown } = scorePattern(occ, 10, 0, timestamps, now);
    expect(breakdown.consistency).toBe(0);
  });

  it('handles zero totalCount gracefully', () => {
    const occ = makeOccurrence({ totalCount: 0 });
    const timestamps = makeTimestamps([['s1', now]]);

    const { score } = scorePattern(occ, 10, 100, timestamps, now);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

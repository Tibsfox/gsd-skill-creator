/**
 * TDD tests for cluster-specific scoring and candidate ranking.
 *
 * Tests scoreCluster (size, crossProject, coherence, recency factors),
 * generateClusterName (kebab-case slug from natural language),
 * generateClusterDescription (brief intent description),
 * and rankClusterCandidates (full pipeline with dedup).
 */

import { describe, it, expect } from 'vitest';
import {
  scoreCluster,
  generateClusterName,
  generateClusterDescription,
  rankClusterCandidates,
  DEFAULT_CLUSTER_WEIGHTS,
} from './cluster-scorer.js';
import type {
  ClusterScore,
  ClusterScoreBreakdown,
  ClusterCandidate,
  PromptCluster,
} from './cluster-scorer.js';
import type { ExistingSkill } from './candidate-ranker.js';

// ============================================================================
// Helpers
// ============================================================================

/** Build a PromptCluster with sensible defaults and overrides */
function makeCluster(overrides: Partial<PromptCluster> = {}): PromptCluster {
  return {
    label: overrides.label ?? 'Help me refactor this authentication module',
    examplePrompts: overrides.examplePrompts ?? [
      'Help me refactor this authentication module',
      'Refactor the auth service to use JWT',
      'Clean up the authentication logic',
    ],
    centroid: overrides.centroid ?? [0.1, 0.2, 0.3],
    memberCount: overrides.memberCount ?? 10,
    projectSlugs: overrides.projectSlugs ?? ['project-a', 'project-b', 'project-c'],
    timestamps: overrides.timestamps ?? [
      new Date(Date.now() - 86400000).toISOString(),       // 1 day ago
      new Date(Date.now() - 2 * 86400000).toISOString(),   // 2 days ago
      new Date(Date.now() - 5 * 86400000).toISOString(),   // 5 days ago
    ],
    coherence: overrides.coherence ?? 0.75, // Default reasonable coherence
  };
}

// ============================================================================
// DEFAULT_CLUSTER_WEIGHTS
// ============================================================================

describe('DEFAULT_CLUSTER_WEIGHTS', () => {
  it('has weights that sum to 1.0', () => {
    const sum =
      DEFAULT_CLUSTER_WEIGHTS.size +
      DEFAULT_CLUSTER_WEIGHTS.crossProject +
      DEFAULT_CLUSTER_WEIGHTS.coherence +
      DEFAULT_CLUSTER_WEIGHTS.recency;
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('emphasizes coherence and crossProject at 0.30 each', () => {
    expect(DEFAULT_CLUSTER_WEIGHTS.crossProject).toBe(0.30);
    expect(DEFAULT_CLUSTER_WEIGHTS.coherence).toBe(0.30);
  });

  it('has size and recency at 0.20 each', () => {
    expect(DEFAULT_CLUSTER_WEIGHTS.size).toBe(0.20);
    expect(DEFAULT_CLUSTER_WEIGHTS.recency).toBe(0.20);
  });
});

// ============================================================================
// scoreCluster
// ============================================================================

describe('scoreCluster', () => {
  const now = Date.now();

  it('returns score in [0, 1] range for typical inputs', () => {
    const result = scoreCluster(10, 100, 3, 5, 0.8, now - 86400000, now);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('large cluster (20 members) in 3/5 projects, high coherence, recent -> high score', () => {
    const result = scoreCluster(20, 100, 3, 5, 0.9, now, now);
    // crossProject = 3/5 = 0.6, coherence = 0.9, recency ~ 1.0
    // size = log2(21)/log2(101) ~ 4.39/6.66 ~ 0.66
    // score ~ 0.20*0.66 + 0.30*0.60 + 0.30*0.90 + 0.20*1.0 ~ 0.78
    expect(result.score).toBeGreaterThan(0.7);
  });

  it('small cluster (3 members) in 1/5 projects, low coherence, old -> low score', () => {
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const result = scoreCluster(3, 100, 1, 5, 0.5, now - sixtyDaysMs, now);
    // crossProject = 0.2, coherence = 0.5, recency ~ 0.05
    // size = log2(4)/log2(101) ~ 2.0/6.66 ~ 0.30
    // score ~ 0.20*0.30 + 0.30*0.20 + 0.30*0.50 + 0.20*0.05 ~ 0.28
    expect(result.score).toBeLessThan(0.4);
  });

  it('all factors at zero -> score is 0', () => {
    const result = scoreCluster(0, 0, 0, 0, 0, 0, now);
    expect(result.score).toBe(0);
  });

  it('all factors at maximum -> score is 1.0', () => {
    // clusterSize == totalPrompts, all projects, coherence 1.0, recency now
    const result = scoreCluster(100, 100, 5, 5, 1.0, now, now);
    expect(result.score).toBeCloseTo(1.0, 1);
  });

  it('returns correct breakdown shape', () => {
    const result = scoreCluster(10, 100, 3, 5, 0.8, now, now);
    expect(result.breakdown).toHaveProperty('size');
    expect(result.breakdown).toHaveProperty('crossProject');
    expect(result.breakdown).toHaveProperty('coherence');
    expect(result.breakdown).toHaveProperty('recency');
  });

  it('size uses log-scale: 1000 members is NOT 100x score of 10 members', () => {
    const r10 = scoreCluster(10, 10000, 1, 1, 0.5, now, now);
    const r1000 = scoreCluster(1000, 10000, 1, 1, 0.5, now, now);
    const ratio = r1000.breakdown.size / r10.breakdown.size;
    expect(ratio).toBeLessThan(10);
    expect(ratio).toBeGreaterThan(1);
  });

  it('crossProject is fraction of total projects', () => {
    const result = scoreCluster(10, 100, 4, 10, 0.5, now, now);
    expect(result.breakdown.crossProject).toBeCloseTo(0.4, 5);
  });

  it('coherence is passed through directly', () => {
    const result = scoreCluster(10, 100, 3, 5, 0.75, now, now);
    expect(result.breakdown.coherence).toBe(0.75);
  });

  it('gives high recency for cluster seen today', () => {
    const result = scoreCluster(10, 100, 3, 5, 0.5, now, now);
    expect(result.breakdown.recency).toBeGreaterThan(0.9);
  });

  it('gives low recency for cluster seen 60 days ago', () => {
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const result = scoreCluster(10, 100, 3, 5, 0.5, now - sixtyDaysMs, now);
    expect(result.breakdown.recency).toBeLessThan(0.1);
  });

  it('handles zero totalProjects gracefully', () => {
    const result = scoreCluster(10, 100, 3, 0, 0.5, now, now);
    expect(result.breakdown.crossProject).toBe(0);
  });

  it('handles zero totalPrompts gracefully', () => {
    const result = scoreCluster(10, 0, 3, 5, 0.5, now, now);
    expect(result.breakdown.size).toBe(0);
  });
});

// ============================================================================
// generateClusterName
// ============================================================================

describe('generateClusterName', () => {
  it('generates kebab-case slug from natural language label', () => {
    const name = generateClusterName('Help me refactor this authentication module');
    expect(name).toBe('help-refactor-authentication-module');
  });

  it('removes stopwords from label', () => {
    const name = generateClusterName('Debug the failing test in payment service');
    const words = name.split('-');
    expect(words).not.toContain('the');
    expect(words).not.toContain('in');
  });

  it('limits slug to 5 significant words', () => {
    const name = generateClusterName('Help me refactor the old authentication module code badly broken stuff');
    const parts = name.split('-');
    expect(parts.length).toBeLessThanOrEqual(5);
  });

  it('converts to lowercase', () => {
    const name = generateClusterName('Fix The Broken Database Connection');
    expect(name).toBe(name.toLowerCase());
  });

  it('handles label with only stopwords by returning empty or reasonable slug', () => {
    const name = generateClusterName('the a an and or');
    // All stopwords removed, should produce an empty-ish result or something safe
    expect(typeof name).toBe('string');
  });

  it('produces valid kebab-case (no double hyphens, no leading/trailing hyphens)', () => {
    const name = generateClusterName('Help me refactor this authentication module');
    expect(name).not.toMatch(/--/);
    expect(name).not.toMatch(/^-/);
    expect(name).not.toMatch(/-$/);
  });
});

// ============================================================================
// generateClusterDescription
// ============================================================================

describe('generateClusterDescription', () => {
  it('returns description starting with "Guides workflow when:"', () => {
    const desc = generateClusterDescription('Refactor authentication module');
    expect(desc).toMatch(/^Guides workflow when:/);
  });

  it('includes the label text', () => {
    const desc = generateClusterDescription('Debug failing test');
    expect(desc).toContain('Debug failing test');
  });

  it('truncates very long labels to 100 chars', () => {
    const longLabel = 'A'.repeat(200);
    const desc = generateClusterDescription(longLabel);
    // The label portion should be truncated
    expect(desc.length).toBeLessThan(200);
  });
});

// ============================================================================
// rankClusterCandidates
// ============================================================================

describe('rankClusterCandidates', () => {
  const now = Date.now();

  it('ranks clusters by score descending', () => {
    const clusters: PromptCluster[] = [
      makeCluster({
        label: 'Small old cluster',
        memberCount: 2,
        projectSlugs: ['p1'],
        timestamps: [new Date(now - 60 * 86400000).toISOString()],
      }),
      makeCluster({
        label: 'Large recent cluster',
        memberCount: 20,
        projectSlugs: ['p1', 'p2', 'p3'],
        timestamps: [new Date(now).toISOString()],
      }),
    ];

    const result = rankClusterCandidates(clusters, 100, 5, [], now);
    expect(result.length).toBe(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[0].label).toBe('Large recent cluster');
  });

  it('returns ClusterCandidate objects with all required fields', () => {
    const clusters = [makeCluster()];
    const result = rankClusterCandidates(clusters, 100, 5, [], now);
    expect(result.length).toBe(1);

    const c = result[0];
    expect(c).toHaveProperty('label');
    expect(c).toHaveProperty('suggestedName');
    expect(c).toHaveProperty('suggestedDescription');
    expect(c).toHaveProperty('clusterSize');
    expect(c).toHaveProperty('coherence');
    expect(c).toHaveProperty('score');
    expect(c).toHaveProperty('scoreBreakdown');
    expect(c).toHaveProperty('examplePrompts');
    expect(c).toHaveProperty('evidence');
    expect(c.evidence).toHaveProperty('projects');
    expect(c.evidence).toHaveProperty('promptCount');
    expect(c.evidence).toHaveProperty('lastSeen');
  });

  it('deduplicates against existing skills with Jaccard similarity', () => {
    const clusters = [
      makeCluster({ label: 'Refactor authentication module' }),
      makeCluster({
        label: 'Build new database schema',
        memberCount: 5,
        projectSlugs: ['p1'],
        timestamps: [new Date(now).toISOString()],
      }),
    ];
    const existingSkills: ExistingSkill[] = [
      { name: 'refactor-auth', description: 'Guides workflow when: Refactor authentication module' },
    ];

    const result = rankClusterCandidates(clusters, 100, 5, existingSkills, now);
    // First cluster should be removed by dedup, second should remain
    expect(result.length).toBe(1);
    expect(result[0].label).toBe('Build new database schema');
  });

  it('minimum-results guarantee: returns all if all would be deduplicated', () => {
    const clusters = [
      makeCluster({ label: 'Refactor authentication module' }),
    ];
    const existingSkills: ExistingSkill[] = [
      { name: 'refactor-auth', description: 'Guides workflow when: Refactor authentication module' },
    ];

    // When there's only one candidate and it would be removed, minimum-results guarantee kicks in
    const result = rankClusterCandidates(clusters, 100, 5, existingSkills, now);
    // Since it's the only one, minimum-results guarantee should return it
    expect(result.length).toBe(1);
  });

  it('uses cluster memberCount for scoring', () => {
    const clusters = [
      makeCluster({ memberCount: 50 }),
    ];
    const result = rankClusterCandidates(clusters, 100, 5, [], now);
    expect(result[0].clusterSize).toBe(50);
  });

  it('passes coherence through from cluster centroid similarity', () => {
    // Coherence is not directly on PromptCluster -- it comes from somewhere
    // For now, we pass 0 as meanIntraSimilarity defaults
    const clusters = [makeCluster()];
    const result = rankClusterCandidates(clusters, 100, 5, [], now);
    expect(typeof result[0].coherence).toBe('number');
  });

  it('defaults now to Date.now() when not provided', () => {
    const clusters = [makeCluster()];
    // Should not throw when now is omitted
    const result = rankClusterCandidates(clusters, 100, 5, []);
    expect(result.length).toBe(1);
  });

  it('handles empty clusters array', () => {
    const result = rankClusterCandidates([], 100, 5, [], now);
    expect(result).toEqual([]);
  });
});

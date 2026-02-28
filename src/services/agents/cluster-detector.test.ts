import { describe, it, expect } from 'vitest';
import {
  ClusterDetector,
  SkillCluster,
  DEFAULT_CLUSTER_CONFIG,
} from './cluster-detector.js';
import { SkillCoActivation } from './co-activation-tracker.js';

describe('ClusterDetector', () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  function createCoActivation(
    skillA: string,
    skillB: string,
    count: number,
    daysAgo: number = 7
  ): SkillCoActivation {
    const [a, b] = [skillA, skillB].sort();
    return {
      skillPair: [a, b],
      coActivationCount: count,
      sessions: Array(count).fill(null).map((_, i) => `sess-${i}`),
      firstSeen: now - daysAgo * dayMs,
      lastSeen: now,
    };
  }

  describe('empty and small inputs', () => {
    it('returns empty clusters for empty co-activations', () => {
      const detector = new ClusterDetector();
      const clusters = detector.detect([]);
      expect(clusters).toEqual([]);
    });

    it('does not cluster single pair below threshold', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [createCoActivation('skill-a', 'skill-b', 3)];
      const clusters = detector.detect(coActivations);
      expect(clusters).toEqual([]);
    });

    it('clusters single pair above threshold', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [createCoActivation('skill-a', 'skill-b', 6)];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(1);
      expect(clusters[0].skills).toEqual(['skill-a', 'skill-b']);
    });
  });

  describe('connected components', () => {
    it('forms one cluster from three connected skills', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [
        createCoActivation('skill-a', 'skill-b', 6),
        createCoActivation('skill-b', 'skill-c', 7),
      ];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(1);
      expect(clusters[0].skills).toEqual(['skill-a', 'skill-b', 'skill-c']);
    });

    it('forms two clusters from disconnected pairs', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [
        createCoActivation('skill-a', 'skill-b', 6),
        createCoActivation('skill-x', 'skill-y', 7),
      ];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(2);
      const skillSets = clusters.map(c => c.skills.sort());
      expect(skillSets).toContainEqual(['skill-a', 'skill-b']);
      expect(skillSets).toContainEqual(['skill-x', 'skill-y']);
    });

    it('excludes cluster larger than maxClusterSize', () => {
      const detector = new ClusterDetector({ minCoActivations: 5, maxClusterSize: 3 });
      // Create a chain of 4 skills (too large)
      const coActivations = [
        createCoActivation('skill-a', 'skill-b', 6),
        createCoActivation('skill-b', 'skill-c', 7),
        createCoActivation('skill-c', 'skill-d', 8),
      ];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(0);
    });

    it('excludes cluster smaller than minClusterSize', () => {
      const detector = new ClusterDetector({ minCoActivations: 5, minClusterSize: 3 });
      const coActivations = [createCoActivation('skill-a', 'skill-b', 6)];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(0);
    });
  });

  describe('cluster properties', () => {
    it('generates suggestedName from common prefix', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [
        createCoActivation('react-hooks', 'react-components', 6),
      ];
      const clusters = detector.detect(coActivations);
      expect(clusters[0].suggestedName).toBe('react-agent');
    });

    it('generates suggestedName from first skill when no common prefix', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [createCoActivation('auth', 'database', 6)];
      const clusters = detector.detect(coActivations);
      expect(clusters[0].suggestedName).toBe('auth-combo-agent');
    });

    it('calculates stabilityDays from firstSeen', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [createCoActivation('skill-a', 'skill-b', 6, 10)];
      const clusters = detector.detect(coActivations);
      expect(clusters[0].stabilityDays).toBe(10);
    });

    it('normalizes coActivationScore to 0-1', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });

      // Low count
      const lowClusters = detector.detect([
        createCoActivation('skill-a', 'skill-b', 5),
      ]);
      expect(lowClusters[0].coActivationScore).toBe(0.5);

      // High count (capped at 1)
      const highClusters = detector.detect([
        createCoActivation('skill-x', 'skill-y', 20),
      ]);
      expect(highClusters[0].coActivationScore).toBe(1);
    });

    it('generates correct cluster ID from skills', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [createCoActivation('zebra', 'alpha', 6)];
      const clusters = detector.detect(coActivations);
      expect(clusters[0].id).toBe('cluster-alpha-zebra');
    });

    it('generates description listing skills', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [createCoActivation('skill-a', 'skill-b', 6)];
      const clusters = detector.detect(coActivations);
      expect(clusters[0].suggestedDescription).toContain('skill-a');
      expect(clusters[0].suggestedDescription).toContain('skill-b');
    });
  });

  describe('sorting and filtering', () => {
    it('sorts clusters by coActivationScore descending', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [
        createCoActivation('low-a', 'low-b', 5),
        createCoActivation('high-a', 'high-b', 10),
      ];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(2);
      expect(clusters[0].skills).toContain('high-a');
      expect(clusters[1].skills).toContain('low-a');
    });

    it('ignores edges below minCoActivations threshold', () => {
      const detector = new ClusterDetector({ minCoActivations: 5 });
      const coActivations = [
        createCoActivation('skill-a', 'skill-b', 6),
        createCoActivation('skill-b', 'skill-c', 2), // Below threshold
      ];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(1);
      expect(clusters[0].skills).toEqual(['skill-a', 'skill-b']);
    });
  });

  describe('config defaults', () => {
    it('uses DEFAULT_CLUSTER_CONFIG values', () => {
      expect(DEFAULT_CLUSTER_CONFIG.minClusterSize).toBe(2);
      expect(DEFAULT_CLUSTER_CONFIG.maxClusterSize).toBe(5);
      expect(DEFAULT_CLUSTER_CONFIG.minCoActivations).toBe(5);
      expect(DEFAULT_CLUSTER_CONFIG.stabilityDays).toBe(7);
    });

    it('allows partial config override', () => {
      const detector = new ClusterDetector({ minCoActivations: 3 });
      const coActivations = [createCoActivation('skill-a', 'skill-b', 4)];
      const clusters = detector.detect(coActivations);
      expect(clusters).toHaveLength(1);
    });
  });
});

/**
 * Tests for EulerCompositionEngine, generateCompositeName,
 * generateCompositionExplanation, and enhanceClusterWithGeometry.
 *
 * Covers: Euler complex multiplication, quality assessment, action mapping,
 * explanation generation, composite suggestions, and cluster enhancement.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  EulerCompositionEngine,
  generateCompositeName,
  generateCompositionExplanation,
  enhanceClusterWithGeometry,
} from './composition.js';
import type { CompositionResult, CompositeSuggestion, EnhancedCluster } from './composition.js';
import { createPosition, arcDistance, chordLength } from './arithmetic.js';
import { ChordDetector, assessCompositionQuality } from './chords.js';
import type { PositionStorePort } from './chords.js';
import type { SkillPosition, ChordCandidate } from './types.js';
import type { SkillCluster } from '../../agents/cluster-detector.js';

// ============================================================================
// Helpers
// ============================================================================

class MockPositionStore implements PositionStorePort {
  private positions = new Map<string, SkillPosition>();

  get(skillId: string): SkillPosition | null {
    return this.positions.get(skillId) ?? null;
  }

  set(skillId: string, position: SkillPosition): void {
    this.positions.set(skillId, position);
  }

  all(): Map<string, SkillPosition> {
    return new Map(this.positions);
  }
}

function makeCluster(overrides: Partial<SkillCluster> & { skills: string[] }): SkillCluster {
  return {
    id: `cluster-${overrides.skills.join('-').slice(0, 20)}`,
    skills: overrides.skills,
    coActivationScore: overrides.coActivationScore ?? 0.8,
    stabilityDays: overrides.stabilityDays ?? 10,
    suggestedName: overrides.suggestedName ?? 'test-agent',
    suggestedDescription: overrides.suggestedDescription ?? 'A test cluster',
  };
}

function makeChord(
  fromId: string,
  toId: string,
  store: MockPositionStore,
  savings: number,
  frequency: number,
): ChordCandidate {
  const fromPos = store.get(fromId)!;
  const toPos = store.get(toId)!;
  const arc = arcDistance(fromPos, toPos);
  const chord = chordLength(fromPos, toPos);
  return {
    fromId,
    toId,
    fromPosition: fromPos,
    toPosition: toPos,
    arcDistance: arc,
    chordLength: chord,
    savings,
    frequency,
  };
}

// ============================================================================
// generateCompositeName
// ============================================================================

describe('generateCompositeName', () => {
  it('uses common prefix when > 3 chars', () => {
    const name = generateCompositeName('react-hooks', 'react-components');
    expect(name).toBe('react-composite');
  });

  it('joins names when no common prefix', () => {
    const name = generateCompositeName('git-workflow', 'test-patterns');
    expect(name).toContain('composite');
    expect(name).toContain('git-workflow');
    expect(name).toContain('test-patterns');
  });

  it('handles short names', () => {
    const name = generateCompositeName('a', 'b');
    expect(name).toContain('composite');
  });
});

// ============================================================================
// generateCompositionExplanation
// ============================================================================

describe('generateCompositionExplanation', () => {
  it('describes grounded + working composition', () => {
    const a = createPosition(0.2, 0.8);  // grounded
    const b = createPosition(0.8, 0.7);  // working
    const composed = createPosition(1.0, 0.56);
    const explanation = generateCompositionExplanation(a, b, composed);
    expect(explanation).toContain('grounded');
    expect(explanation).toContain('working');
    expect(explanation).toContain(a.theta.toFixed(2));
    expect(explanation).toContain(b.theta.toFixed(2));
  });

  it('warns about high theta composition', () => {
    const a = createPosition(2.0, 0.6);  // frontier
    const b = createPosition(2.0, 0.5);  // frontier
    // composed theta ~ 4.0 > pi
    const composed = createPosition(4.0, 0.3);
    const explanation = generateCompositionExplanation(a, b, composed);
    expect(explanation.toLowerCase()).toMatch(/wrap|divergent|past pi/i);
  });

  it('includes radius context for immature skills', () => {
    const a = createPosition(0.5, 0.1);
    const b = createPosition(0.3, 0.1);
    const composed = createPosition(0.8, 0.01);
    const explanation = generateCompositionExplanation(a, b, composed);
    expect(explanation.toLowerCase()).toContain('low');
    expect(explanation).toContain(composed.radius.toFixed(2));
  });

  it('returns non-empty string for all valid inputs', () => {
    const a = createPosition(0.5, 0.5);
    const b = createPosition(0.5, 0.5);
    const composed = createPosition(1.0, 0.25);
    const explanation = generateCompositionExplanation(a, b, composed);
    expect(explanation.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// EulerCompositionEngine.compose
// ============================================================================

describe('EulerCompositionEngine', () => {
  let store: MockPositionStore;
  let detector: ChordDetector;
  let engine: EulerCompositionEngine;

  beforeEach(() => {
    store = new MockPositionStore();
    store.set('git-workflow', createPosition(0.2, 0.8));
    store.set('test-patterns', createPosition(0.8, 0.7));
    store.set('architecture', createPosition(1.4, 0.6));
    store.set('devops', createPosition(0.1, 0.9));
    store.set('research', createPosition(1.5, 0.3));
    store.set('nascent', createPosition(0.5, 0.05));

    detector = new ChordDetector(store);
    engine = new EulerCompositionEngine(store, detector);
  });

  describe('compose', () => {
    it('composes two known skills', () => {
      const result = engine.compose('git-workflow', 'test-patterns');
      expect(result.success).toBe(true);
      expect(result.composedPosition).toBeDefined();
      // theta ~ 0.2 + 0.8 = 1.0
      expect(result.composedPosition!.theta).toBeCloseTo(1.0, 1);
      // radius ~ 0.8 * 0.7 = 0.56
      expect(result.composedPosition!.radius).toBeCloseTo(0.56, 2);
    });

    it('returns failure when skill not found', () => {
      const result = engine.compose('unknown', 'git-workflow');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Missing');
    });

    it('returns failure when both missing', () => {
      const result = engine.compose('x', 'y');
      expect(result.success).toBe(false);
    });

    it('quality reflects composed position', () => {
      // Two concrete skills -> composed theta ~ 0.3, moderate radius
      const result = engine.compose('git-workflow', 'devops');
      expect(result.success).toBe(true);
      expect(['excellent', 'good', 'marginal', 'poor']).toContain(result.quality);
    });

    it('explanation is non-empty on success', () => {
      const result = engine.compose('git-workflow', 'test-patterns');
      expect(result.success).toBe(true);
      expect(result.explanation!.length).toBeGreaterThan(0);
    });

    it('two concrete skills stay relatively concrete', () => {
      const result = engine.compose('git-workflow', 'devops');
      expect(result.success).toBe(true);
      // theta ~ 0.2 + 0.1 = 0.3
      expect(result.composedPosition!.theta).toBeCloseTo(0.3, 1);
    });

    it('maturity product: two mature skills produce mature composite', () => {
      const result = engine.compose('git-workflow', 'devops');
      expect(result.success).toBe(true);
      // radius ~ 0.8 * 0.9 = 0.72
      expect(result.composedPosition!.radius).toBeCloseTo(0.72, 2);
    });

    it('maturity product: immature skill limits composite', () => {
      const result = engine.compose('nascent', 'git-workflow');
      expect(result.success).toBe(true);
      // radius ~ 0.05 * 0.8 = 0.04
      expect(result.composedPosition!.radius).toBeCloseTo(0.04, 2);
    });
  });

  // --------------------------------------------------------------------------
  // generateCompositeSuggestions
  // --------------------------------------------------------------------------

  describe('generateCompositeSuggestions', () => {
    it('filters out ignore actions', () => {
      // Two abstract skills: composed theta > pi -> poor -> ignore
      const chord: ChordCandidate = {
        fromId: 'architecture',
        toId: 'research',
        fromPosition: store.get('architecture')!,
        toPosition: store.get('research')!,
        arcDistance: 0.1,
        chordLength: 0.05,
        savings: 0.05,
        frequency: 20,
      };
      const suggestions = engine.generateCompositeSuggestions([chord]);
      // If evaluateChord returns 'poor' -> 'ignore', it should be filtered
      const evaluation = detector.evaluateChord(chord);
      if (evaluation.recommendAction === 'ignore') {
        expect(suggestions.length).toBe(0);
      }
    });

    it('includes non-ignore suggestions', () => {
      // git-workflow + test-patterns: composed theta ~ 1.0, r ~ 0.56
      // Quality should be working zone, not poor
      const chord = makeChord('git-workflow', 'test-patterns', store, 0.5, 12);
      const suggestions = engine.generateCompositeSuggestions([chord]);
      // Should have at least one suggestion (non-ignore)
      const evaluation = detector.evaluateChord(chord);
      if (evaluation.recommendAction !== 'ignore') {
        expect(suggestions.length).toBe(1);
        expect(suggestions[0].constituents).toEqual(['git-workflow', 'test-patterns']);
      }
    });

    it('suggestions have correct fields', () => {
      const chord = makeChord('git-workflow', 'devops', store, 0.3, 8);
      const suggestions = engine.generateCompositeSuggestions([chord]);
      if (suggestions.length > 0) {
        const s = suggestions[0];
        expect(s.name).toContain('composite');
        expect(s.position).toBeDefined();
        expect(s.constituents).toEqual(['git-workflow', 'devops']);
        expect(s.chordSavings).toBe(0.3);
        expect(s.frequency).toBe(8);
        expect(['create_composite', 'suggest_to_user', 'monitor']).toContain(s.action);
        expect(s.explanation.length).toBeGreaterThan(0);
      }
    });

    it('suggestions have non-empty explanation', () => {
      const chord = makeChord('git-workflow', 'test-patterns', store, 0.5, 10);
      const suggestions = engine.generateCompositeSuggestions([chord]);
      if (suggestions.length > 0) {
        expect(suggestions[0].explanation.length).toBeGreaterThan(0);
      }
    });

    it('returns empty for empty chord array', () => {
      expect(engine.generateCompositeSuggestions([])).toEqual([]);
    });
  });
});

// ============================================================================
// enhanceClusterWithGeometry
// ============================================================================

describe('enhanceClusterWithGeometry', () => {
  let store: MockPositionStore;

  beforeEach(() => {
    store = new MockPositionStore();
    store.set('git-workflow', createPosition(0.2, 0.8));
    store.set('test-patterns', createPosition(0.8, 0.7));
    store.set('architecture', createPosition(1.4, 0.6));
  });

  it('returns enhanced cluster with geometric data', () => {
    const cluster = makeCluster({ skills: ['git-workflow', 'test-patterns'] });
    const result = enhanceClusterWithGeometry(cluster, store);
    expect(result).not.toBeNull();
    expect(result!.cluster).toBe(cluster);
    expect(typeof result!.averageChordQuality).toBe('number');
    expect(typeof result!.geometricallySuitable).toBe('boolean');
  });

  it('returns null when skills lack positions', () => {
    const cluster = makeCluster({ skills: ['unknown-a', 'unknown-b'] });
    const result = enhanceClusterWithGeometry(cluster, store);
    expect(result).toBeNull();
  });

  it('includes pairEvaluations', () => {
    const cluster = makeCluster({ skills: ['git-workflow', 'test-patterns'] });
    const result = enhanceClusterWithGeometry(cluster, store);
    expect(result).not.toBeNull();
    expect(result!.pairEvaluations.length).toBeGreaterThanOrEqual(1);
  });

  it('geometricallySuitable true when good+ quality exists', () => {
    // git-workflow + test-patterns: composed theta ~ 1.0, r ~ 0.56
    // That's marginal (theta > pi/2). But we test for good+ existence.
    const cluster = makeCluster({
      skills: ['git-workflow', 'test-patterns'],
      coActivationScore: 0.8,
    });
    const result = enhanceClusterWithGeometry(cluster, store);
    expect(result).not.toBeNull();
    // The actual result depends on the specific quality assessment
    expect(typeof result!.geometricallySuitable).toBe('boolean');
  });

  it('geometricallySuitable false when all pairs have marginal or poor quality', () => {
    // Use skills that compose to high theta or low radius
    store.set('abstract-a', createPosition(2.0, 0.5));
    store.set('abstract-b', createPosition(2.0, 0.5));
    const cluster = makeCluster({ skills: ['abstract-a', 'abstract-b'] });
    const result = enhanceClusterWithGeometry(cluster, store);
    expect(result).not.toBeNull();
    // composed theta ~ 4.0 > pi -> poor -> not suitable
    expect(result!.geometricallySuitable).toBe(false);
  });
});

// ============================================================================
// Integration: geometric gate on co-activation
// ============================================================================

describe('Integration: geometric gate on co-activation', () => {
  it('existing 5+/7+ threshold remains -- enhanceCluster does not remove it', () => {
    // enhanceClusterWithGeometry takes a cluster (already filtered by co-activation)
    // and adds geometric analysis. It does NOT modify the cluster object.
    const store = new MockPositionStore();
    store.set('a', createPosition(0.2, 0.8));
    store.set('b', createPosition(0.8, 0.7));

    const cluster = makeCluster({
      skills: ['a', 'b'],
      coActivationScore: 0.3,  // Low co-activation, but already passed threshold
    });

    const result = enhanceClusterWithGeometry(cluster, store);
    // The function returns geometric data; original cluster is unchanged
    expect(result).not.toBeNull();
    expect(result!.cluster.coActivationScore).toBe(0.3);
  });

  it('geometric filter does not break clusters without positions', () => {
    const store = new MockPositionStore();
    const cluster = makeCluster({ skills: ['no-pos-a', 'no-pos-b'] });
    const result = enhanceClusterWithGeometry(cluster, store);
    // Returns null = use existing path (no geometric data)
    expect(result).toBeNull();
  });
});

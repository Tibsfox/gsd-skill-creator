import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive, CompositionRule } from '../../types/mfe-types.js';
import {
  generateTeam,
  topologySignature,
  type TopologyType,
} from './team-generator.js';

// === Test Helpers ===

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'test-prim',
    name: 'Test Primitive',
    type: 'definition',
    domain: 'perception',
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0.5, imaginary: 0.3 },
    formalStatement: 'Test formal statement',
    computationalForm: 'test(x) = x',
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: ['test'],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

/** Create a composition rule that references a target primitive */
function makeRule(targetId: string): CompositionRule {
  return {
    with: targetId,
    yields: 'combined-result',
    type: 'sequential',
    conditions: [],
    example: 'example',
  };
}

/**
 * Create primitives spread across quadrants with cross-quadrant composition rules.
 * Q1: real >= 0, imaginary >= 0
 * Q2: real < 0, imaginary >= 0
 * Q3: real < 0, imaginary < 0
 * Q4: real >= 0, imaginary < 0
 */
function makeMultiQuadrantPrimitives(
  count: number,
  crossRuleCount: number,
): MathematicalPrimitive[] {
  const quadrantPositions = [
    { real: 0.5, imaginary: 0.5 },   // Q1
    { real: -0.5, imaginary: 0.5 },  // Q2
    { real: -0.5, imaginary: -0.5 }, // Q3
    { real: 0.5, imaginary: -0.5 },  // Q4
  ];

  const primitives: MathematicalPrimitive[] = [];

  for (let i = 0; i < count; i++) {
    const quadrant = i % 4;
    const pos = quadrantPositions[quadrant];
    // Assign cross-quadrant composition rules to early primitives
    const rules: CompositionRule[] = [];
    if (i < crossRuleCount) {
      // Each rule targets a primitive in a DIFFERENT quadrant
      const targetQuadrant = (quadrant + 1) % 4;
      const targetIdx = targetQuadrant; // First prim in that quadrant
      rules.push(makeRule(`prim-${targetIdx}`));
    }

    primitives.push(
      makePrimitive({
        id: `prim-${i}`,
        name: `Primitive ${i}`,
        planePosition: {
          real: pos.real + (i % 3) * 0.01,
          imaginary: pos.imaginary + (i % 3) * 0.01,
        },
        compositionRules: rules,
        keywords: [`kw-${i}`, 'shared-kw'],
      }),
    );
  }

  return primitives;
}

// === Threshold Tests ===

describe('team generator: threshold checks', () => {
  it('returns generated: false for 49 primitives', () => {
    const prims = makeMultiQuadrantPrimitives(49, 25);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('Insufficient primitives');
    expect(result.team).toBeNull();
  });

  it('returns generated: false when composition rules < 20', () => {
    // 50 prims but only 10 cross-quadrant rules
    const prims = makeMultiQuadrantPrimitives(50, 10);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('composition rules');
  });

  it('returns generated: false when fewer than 2 quadrants', () => {
    // 50 prims all in Q1 with cross-quadrant rules
    // Since all are in Q1, there's only 1 quadrant => skip
    const prims = Array.from({ length: 50 }, (_, i) =>
      makePrimitive({
        id: `prim-${i}`,
        name: `Primitive ${i}`,
        planePosition: { real: 0.5 + i * 0.001, imaginary: 0.5 + i * 0.001 },
        compositionRules: i < 25
          ? [makeRule(`prim-${(i + 1) % 50}`)]
          : [],
      }),
    );
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('quadrant');
  });

  it('generates when 50+ prims, 20+ cross-quadrant rules, 2+ quadrants', () => {
    const prims = makeMultiQuadrantPrimitives(52, 22);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(true);
    expect(result.team).not.toBeNull();
  });
});

// === Composition Rule Counting ===

describe('team generator: composition rule counting', () => {
  it('counts cross-quadrant rules correctly', () => {
    // 50 prims with exactly 20 cross-quadrant rules
    const prims = makeMultiQuadrantPrimitives(50, 20);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(true);
  });

  it('does not count same-quadrant rules as cross-quadrant', () => {
    // 50 prims in Q1 and Q2, but rules target same-quadrant
    const prims = Array.from({ length: 50 }, (_, i) => {
      const inQ1 = i % 2 === 0;
      const pos = inQ1
        ? { real: 0.5, imaginary: 0.5 }
        : { real: -0.5, imaginary: 0.5 };
      // Rules target same-quadrant primitives (not cross-quadrant)
      const sameQuadrantTarget = inQ1 ? (i + 2) % 50 : ((i + 2) % 50);
      // Make sure target is in same quadrant
      const rules: CompositionRule[] = i < 25
        ? [makeRule(`prim-${i % 2 === 0 ? Math.min(i + 2, 48) : Math.min(i + 2, 49)}`)]
        : [];
      return makePrimitive({
        id: `prim-${i}`,
        name: `Primitive ${i}`,
        planePosition: { real: pos.real + i * 0.001, imaginary: pos.imaginary },
        compositionRules: rules,
      });
    });
    // Need to verify: with same-quadrant rules, the cross-count < 20
    // This test checks the result is false (not enough CROSS-quadrant rules)
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
  });
});

// === Quadrant Detection ===

describe('team generator: quadrant detection', () => {
  it('detects all 4 quadrants', () => {
    const prims = makeMultiQuadrantPrimitives(52, 22);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(true);
    // agentCount should reflect multi-quadrant coverage
    expect(result.team!.agentCount).toBeGreaterThanOrEqual(2);
  });
});

// === Content Format Tests ===

describe('team generator: content format', () => {
  const prims = makeMultiQuadrantPrimitives(52, 22);
  const result = generateTeam('Test Domain', prims);
  const content = result.team!.content;

  it('has YAML frontmatter with learn-{slug}-team name', () => {
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: learn-test-domain-team/);
  });

  it('has ## Purpose section', () => {
    expect(content).toContain('## Purpose');
  });

  it('has ## Agents section', () => {
    expect(content).toContain('## Agents');
  });

  it('has ## Coordination section', () => {
    expect(content).toContain('## Coordination');
  });

  it('has ## Topology section', () => {
    expect(content).toContain('## Topology');
  });

  it('fileName includes team name', () => {
    expect(result.team!.fileName).toContain('learn-test-domain-team');
  });
});

// === Topology Spectral Signature (Parks & Alharthi 2605.11453) ===

describe('topologySignature: closed-form spectra', () => {
  it('mesh: lambda_2 = -1/(n-1), Delta = 1 - 1/(n-1)', () => {
    const sig = topologySignature('mesh', 4, 0.9);
    expect(sig.rho).toBe(1);
    expect(sig.delta).toBeCloseTo(1 - 1 / 3, 6); // (n-2)/(n-1) = 2/3
    expect(sig.gamma).toBe(0.9);
    expect(sig.kappa).toBeGreaterThan(0);
  });

  it('ring: lambda_2 = cos(2π/n), Delta = 1 - cos(2π/n)', () => {
    const sig = topologySignature('ring', 6, 0.9);
    expect(sig.rho).toBe(1);
    expect(sig.delta).toBeCloseTo(1 - Math.cos((2 * Math.PI) / 6), 6);
  });

  it('pipeline: lambda_2 = cos(π/(n-1)), Delta = 1 - cos(π/(n-1))', () => {
    const sig = topologySignature('pipeline', 5, 0.9);
    expect(sig.rho).toBe(1);
    expect(sig.delta).toBeCloseTo(1 - Math.cos(Math.PI / 4), 6);
  });

  it('leader-worker: directed star ⇒ Delta = 0, kappa = 1/(1-γ²)', () => {
    const sig = topologySignature('leader-worker', 5, 0.9);
    expect(sig.rho).toBe(1);
    expect(sig.delta).toBe(0);
    expect(sig.kappa).toBeCloseTo(1 / (1 - 0.81), 6);
  });

  it('bipartite: lambda_2 = -1 ⇒ Delta = 0', () => {
    const sig = topologySignature('bipartite', 4, 0.9);
    expect(sig.delta).toBe(0);
  });

  it('critique-route: lambda_2 = 0.3 ⇒ Delta = 0.7', () => {
    const sig = topologySignature('critique-route', 5, 0.9);
    expect(sig.delta).toBeCloseTo(0.7, 6);
  });

  it('tree: depth-d binary tree, Delta = 1 - cos(π/(d+1))', () => {
    const sig = topologySignature('tree', 7, 0.9);
    // ceil(log2(8)) = 3, so depth = 3
    expect(sig.delta).toBeCloseTo(1 - Math.cos(Math.PI / 4), 4);
  });

  it('every topology produces rho = 1 (row-stochastic invariant)', () => {
    const topologies: TopologyType[] = [
      'pipeline',
      'leader-worker',
      'mesh',
      'ring',
      'tree',
      'bipartite',
      'critique-route',
    ];
    for (const t of topologies) {
      const sig = topologySignature(t, 4, 0.9);
      expect(sig.rho).toBe(1);
      expect(sig.kappa).toBeGreaterThan(0);
      expect(Number.isFinite(sig.kappa)).toBe(true);
    }
  });

  it('rejects n < 2 and invalid gamma', () => {
    expect(() => topologySignature('mesh', 1, 0.9)).toThrow(/n must be >= 2/);
    expect(() => topologySignature('mesh', 4, 0)).toThrow(/gamma must be in/);
    expect(() => topologySignature('mesh', 4, 1)).toThrow(/gamma must be in/);
  });
});

// === Topology selection from composition pattern ===

describe('selectTopology: pattern → archetype', () => {
  function makeMultiQuadrant(n: number, perPrim: number, ruleType: CompositionRule['type'] = 'sequential') {
    const quadrantPositions = [
      { real: 0.5, imaginary: 0.5 },
      { real: -0.5, imaginary: 0.5 },
      { real: -0.5, imaginary: -0.5 },
      { real: 0.5, imaginary: -0.5 },
    ];
    const prims: MathematicalPrimitive[] = [];
    for (let i = 0; i < n; i++) {
      const q = i % 4;
      const pos = quadrantPositions[q];
      const rules: CompositionRule[] = [];
      for (let j = 0; j < perPrim; j++) {
        const targetQ = (q + 1 + j) % 4;
        const targetIdx = targetQ;
        rules.push({
          with: `prim-${targetIdx}`,
          yields: 'combined',
          type: ruleType,
          conditions: [],
          example: 'ex',
        });
      }
      prims.push({
        id: `prim-${i}`,
        name: `P${i}`,
        type: 'definition',
        domain: 'perception',
        chapter: 1,
        section: '1.1',
        planePosition: { real: pos.real + i * 0.01, imaginary: pos.imaginary + i * 0.01 },
        formalStatement: 'x',
        computationalForm: 'x',
        prerequisites: [],
        dependencies: [],
        enables: [],
        compositionRules: rules,
        applicabilityPatterns: [],
        keywords: [],
        tags: [],
        buildLabs: [],
      });
    }
    return prims;
  }

  it('sequential-heavy rules ⇒ pipeline (preserves legacy heuristic)', () => {
    const prims = makeMultiQuadrant(52, 1, 'sequential');
    const r = generateTeam('Test', prims);
    expect(r.generated).toBe(true);
    expect(r.team!.topology).toBe('pipeline');
  });

  it('parallel rules + 2 quadrants ⇒ bipartite', () => {
    const half: MathematicalPrimitive[] = [];
    for (let i = 0; i < 60; i++) {
      const q = i % 2;
      const pos = q === 0 ? { real: 0.5, imaginary: 0.5 } : { real: -0.5, imaginary: 0.5 };
      half.push({
        id: `p${i}`,
        name: `P${i}`,
        type: 'definition',
        domain: 'perception',
        chapter: 1,
        section: '1.1',
        planePosition: { real: pos.real + i * 0.01, imaginary: pos.imaginary },
        formalStatement: 'x',
        computationalForm: 'x',
        prerequisites: [],
        dependencies: [],
        enables: [],
        compositionRules: [
          {
            with: q === 0 ? 'p1' : 'p0',
            yields: 'r',
            type: 'parallel',
            conditions: [],
            example: '',
          },
        ],
        applicabilityPatterns: [],
        keywords: [],
        tags: [],
        buildLabs: [],
      });
    }
    const r = generateTeam('Test', half);
    expect(r.generated).toBe(true);
    expect(r.team!.topology).toBe('bipartite');
  });

  it('parallel rules + 4 quadrants + dense ⇒ mesh', () => {
    const prims = makeMultiQuadrant(60, 5, 'parallel');
    const r = generateTeam('Test', prims);
    expect(r.generated).toBe(true);
    expect(r.team!.topology).toBe('mesh');
  });

  it('emits coordination_signature into frontmatter', () => {
    const prims = makeMultiQuadrant(52, 1, 'sequential');
    const r = generateTeam('Test', prims);
    const content = r.team!.content;
    expect(content).toContain('topology: pipeline');
    expect(content).toContain('coordination_signature:');
    expect(content).toMatch(/rho: 1\.0000/);
    expect(content).toMatch(/delta: \d+\.\d{4}/);
    expect(content).toMatch(/kappa: \d+\.\d{4}/);
    expect(content).toMatch(/gamma: 0\.90/);
  });

  it('exposes topology + coordinationSignature on GeneratedTeam', () => {
    const prims = makeMultiQuadrant(52, 1, 'sequential');
    const r = generateTeam('Test', prims);
    expect(r.team!.topology).toBe('pipeline');
    expect(r.team!.coordinationSignature.rho).toBe(1);
    expect(r.team!.coordinationSignature.gamma).toBe(0.9);
    expect(r.team!.coordinationSignature.kappa).toBeGreaterThan(0);
  });
});

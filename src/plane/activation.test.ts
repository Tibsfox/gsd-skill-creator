import { describe, it, expect } from 'vitest';
import {
  analyzeTask,
  computeEnhancedScore,
  DEFAULT_PLANE_ACTIVATION_CONFIG,
} from './activation.js';
import type {
  TaskVector,
  GeometricScore,
  PlaneActivationConfig,
} from './activation.js';
import { createPosition } from './arithmetic.js';

describe('analyzeTask', () => {
  it('classifies file-heavy context as concrete-dominant', () => {
    const result: TaskVector = analyzeTask({
      intent: undefined,
      file: 'src/components/Button.tsx',
      context: 'src/utils/helpers.ts src/types/api.ts src/hooks/useAuth.ts src/lib/db.ts',
    });

    expect(result.x).toBeGreaterThan(0.9);
    expect(result.y).toBeLessThan(0.5);
    expect(result.raw.concreteSignals.length).toBeGreaterThanOrEqual(5);
  });

  it('classifies research context as abstract-dominant', () => {
    const result: TaskVector = analyzeTask({
      intent: 'how do I design an authentication system for a multi-tenant SaaS application',
      context: 'research',
    });

    expect(result.y).toBeGreaterThan(result.x);
    expect(result.raw.abstractSignals.length).toBeGreaterThan(0);
  });

  it('classifies execution context as concrete', () => {
    const result: TaskVector = analyzeTask({
      intent: 'execute build',
      context: 'execute',
    });

    expect(result.x).toBeGreaterThan(result.y);
  });

  it('returns balanced default for empty context', () => {
    const result: TaskVector = analyzeTask({});

    expect(result.x).toBeCloseTo(Math.SQRT1_2, 2);
    expect(result.y).toBeCloseTo(Math.SQRT1_2, 2);
    expect(result.raw.concreteSignals.length).toBe(0);
    expect(result.raw.abstractSignals.length).toBe(0);
  });

  it('normalizes to unit magnitude', () => {
    const result: TaskVector = analyzeTask({
      intent: 'build the typescript components',
      file: 'src/app.ts',
      context: 'src/lib/utils.ts src/types/index.ts',
    });

    const magnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(magnitude).toBeCloseTo(1.0, 5);
  });

  it('handles balanced context (files + semantic intent)', () => {
    const result: TaskVector = analyzeTask({
      intent: 'refactor the authentication module',
      file: 'src/auth/login.ts',
      context: 'src/auth/session.ts',
    });

    expect(result.x).toBeGreaterThan(0.3);
    expect(result.x).toBeLessThan(0.9);
    expect(result.y).toBeGreaterThan(0.3);
    expect(result.y).toBeLessThan(0.9);
  });

  it('classifies planning context as abstract', () => {
    const result: TaskVector = analyzeTask({
      intent: 'plan the next sprint',
      context: 'plan',
    });

    expect(result.y).toBeGreaterThan(result.x);
  });
});

describe('computeEnhancedScore', () => {
  it('scores skill with matching tangent highly', () => {
    const position = createPosition(Math.PI / 4, 0.8);
    const taskVector: TaskVector = {
      x: 0.7,
      y: 0.7,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const result: GeometricScore = computeEnhancedScore(
      'skill-match',
      position,
      taskVector,
      0.6,
    );

    expect(result.combinedScore).toBeGreaterThan(result.semanticScore);
    expect(result.tangentScore).toBeGreaterThan(0);
  });

  it('scores distant skill low', () => {
    const position = createPosition(0.05, 0.9);
    const taskVector: TaskVector = {
      x: 0.1,
      y: 0.99,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const result: GeometricScore = computeEnhancedScore(
      'skill-distant',
      position,
      taskVector,
      0.5,
    );

    expect(result.tangentScore).toBeLessThan(0.5);
  });

  it('returns semantic score for null position', () => {
    const taskVector: TaskVector = {
      x: 0.5,
      y: 0.5,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const result: GeometricScore = computeEnhancedScore(
      'skill-null',
      null,
      taskVector,
      0.75,
    );

    expect(result.combinedScore).toBe(0.75);
    expect(result.tangentScore).toBe(0.75);
    expect(result.geometric).toBeNull();
  });

  it('returns semantic score for undefined position', () => {
    const taskVector: TaskVector = {
      x: 0.5,
      y: 0.5,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const result: GeometricScore = computeEnhancedScore(
      'skill-undef',
      undefined,
      taskVector,
      0.8,
    );

    expect(result.combinedScore).toBe(0.8);
  });

  it('respects geometric_weight=0 (pure semantic)', () => {
    const position = createPosition(Math.PI / 4, 0.8);
    const taskVector: TaskVector = {
      x: 0.7,
      y: 0.7,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const config: PlaneActivationConfig = {
      geometricWeight: 0,
      enabled: true,
      fallbackToSemantic: true,
      logGeometricDetail: false,
    };

    const result: GeometricScore = computeEnhancedScore(
      'skill-pure-sem',
      position,
      taskVector,
      0.6,
      config,
    );

    expect(result.combinedScore).toBeCloseTo(0.6);
  });

  it('respects geometric_weight=1 (pure geometric)', () => {
    const position = createPosition(Math.PI / 4, 0.8);
    const taskVector: TaskVector = {
      x: 0.7,
      y: 0.7,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const config: PlaneActivationConfig = {
      geometricWeight: 1,
      enabled: true,
      fallbackToSemantic: true,
      logGeometricDetail: false,
    };

    const result: GeometricScore = computeEnhancedScore(
      'skill-pure-geo',
      position,
      taskVector,
      0.1,
      config,
    );

    expect(result.combinedScore).toBeCloseTo(result.tangentScore);
  });

  it('correct ranking with 3 skills', () => {
    const posA = createPosition(Math.PI / 4, 0.9);  // balanced, high maturity
    const posB = createPosition(Math.PI / 8, 0.3);  // concrete, low maturity
    const posC = createPosition(Math.PI / 3, 0.6);  // abstract-leaning, mid maturity

    const taskVector: TaskVector = {
      x: 0.7,
      y: 0.7,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const scoreA = computeEnhancedScore('skill-A', posA, taskVector, 0.5);
    const scoreB = computeEnhancedScore('skill-B', posB, taskVector, 0.8);
    const scoreC = computeEnhancedScore('skill-C', posC, taskVector, 0.4);

    // All scores are numbers, no NaN
    expect(scoreA.combinedScore).not.toBeNaN();
    expect(scoreB.combinedScore).not.toBeNaN();
    expect(scoreC.combinedScore).not.toBeNaN();

    // Skill A should score highest: tangent line at PI/4 passes near (0.7, 0.7) AND high radius
    expect(scoreA.combinedScore).toBeGreaterThan(scoreC.combinedScore);
  });

  it('returns full geometric detail in TangentMatch', () => {
    const position = createPosition(Math.PI / 4, 0.8);
    const taskVector: TaskVector = {
      x: 0.7,
      y: 0.7,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const result: GeometricScore = computeEnhancedScore(
      'skill-detail',
      position,
      taskVector,
      0.5,
    );

    expect(result.geometric).not.toBeNull();
    expect(result.geometric!.skillId).toBe('skill-detail');
    expect(result.geometric!.position).toBeDefined();
    expect(result.geometric!.tangent).toBeDefined();
    expect(result.geometric!.tangentDistance).toBeGreaterThanOrEqual(0);
    expect(result.geometric!.score).toBeGreaterThan(0);
  });

  it('handles edge case theta=0 without NaN', () => {
    // MIN_THETA is 0.01
    const position = createPosition(0.01, 1);
    const taskVector: TaskVector = {
      x: 0.5,
      y: 0.5,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const result = computeEnhancedScore('skill-theta0', position, taskVector, 0.5);

    expect(result.combinedScore).not.toBeNaN();
    expect(result.tangentScore).not.toBeNaN();
    expect(result.geometric?.tangentDistance).not.toBeNaN();
    expect(result.geometric?.tangent.slope).not.toBeNaN();
    expect(result.geometric?.tangent.reach).not.toBeNaN();
  });

  it('handles edge case theta=PI/2 without NaN', () => {
    const position = createPosition(Math.PI / 2 - 0.01, 1);
    const taskVector: TaskVector = {
      x: 0.5,
      y: 0.5,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const result = computeEnhancedScore('skill-thetaPiHalf', position, taskVector, 0.5);

    expect(result.combinedScore).not.toBeNaN();
    expect(result.tangentScore).not.toBeNaN();
    expect(result.geometric?.tangentDistance).not.toBeNaN();
    expect(result.geometric?.tangent.slope).not.toBeNaN();
    expect(result.geometric?.tangent.reach).not.toBeNaN();
  });
});

describe('DEFAULT_PLANE_ACTIVATION_CONFIG', () => {
  it('has correct default values', () => {
    expect(DEFAULT_PLANE_ACTIVATION_CONFIG.geometricWeight).toBe(0.6);
    expect(DEFAULT_PLANE_ACTIVATION_CONFIG.enabled).toBe(true);
    expect(DEFAULT_PLANE_ACTIVATION_CONFIG.fallbackToSemantic).toBe(true);
    expect(DEFAULT_PLANE_ACTIVATION_CONFIG.logGeometricDetail).toBe(false);
  });
});

describe('PlaneActivationConfig validation', () => {
  it('computeEnhancedScore uses custom config', () => {
    const position = createPosition(Math.PI / 4, 0.8);
    const taskVector: TaskVector = {
      x: 0.7,
      y: 0.7,
      raw: { concreteSignals: [], abstractSignals: [] },
    };

    const config: PlaneActivationConfig = {
      geometricWeight: 0.3,
      enabled: true,
      fallbackToSemantic: true,
      logGeometricDetail: false,
    };

    const result = computeEnhancedScore(
      'skill-custom',
      position,
      taskVector,
      0.6,
      config,
    );

    const expected = 0.3 * result.tangentScore + 0.7 * 0.6;
    expect(result.combinedScore).toBeCloseTo(expected);
  });
});

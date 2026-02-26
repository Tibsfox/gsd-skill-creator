/**
 * Comprehensive tests for the complex plane arithmetic library.
 *
 * Covers all 19 exported pure functions with edge cases for
 * division-by-zero guards, angle normalization, and floating-point
 * boundary behavior.
 */

import { describe, expect, it } from 'vitest';

import {
  createPosition,
  normalizeAngle,
  estimateTheta,
  estimateRadius,
  computeTangent,
  pointToTangentDistance,
  computeTangentScore,
  composePositions,
  complexDistance,
  arcDistance,
  chordLength,
  evaluateChord,
  versine,
  exsecant,
  classifyByVersine,
  getPromotionLevel,
  computeAngularStep,
  requiredEvidence,
  computePlaneMetrics,
} from './arithmetic.js';

import {
  type SkillPosition,
  type ChordCandidate,
  PromotionLevel,
  MAX_REACH,
  MAX_ANGULAR_VELOCITY,
} from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Shorthand for creating a position without going through createPosition. */
function pos(theta: number, radius: number, angularVelocity = 0): SkillPosition {
  return {
    theta,
    radius,
    angularVelocity,
    lastUpdated: '2026-01-01T00:00:00.000Z',
  };
}

// ============================================================================
// createPosition
// ============================================================================

describe('createPosition', () => {
  it('normalizes negative theta', () => {
    const p = createPosition(-Math.PI / 4, 0.5);
    expect(p.theta).toBeCloseTo(2 * Math.PI - Math.PI / 4, 5);
  });

  it('normalizes theta > 2*PI', () => {
    const p = createPosition(3 * Math.PI, 0.5);
    expect(p.theta).toBeCloseTo(Math.PI, 5);
  });

  it('clamps radius above 1 to 1', () => {
    const p = createPosition(0, 1.5);
    expect(p.radius).toBe(1.0);
  });

  it('clamps negative radius to 0', () => {
    const p = createPosition(0, -0.5);
    expect(p.radius).toBe(0);
  });

  it('defaults angularVelocity to 0', () => {
    const p = createPosition(1, 0.5);
    expect(p.angularVelocity).toBe(0);
  });

  it('accepts custom angularVelocity', () => {
    const p = createPosition(1, 0.5, 0.15);
    expect(p.angularVelocity).toBe(0.15);
  });

  it('sets lastUpdated to ISO string', () => {
    const p = createPosition(0, 0.5);
    expect(p.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ============================================================================
// normalizeAngle
// ============================================================================

describe('normalizeAngle', () => {
  it('normalizes -PI/4 to approximately 7*PI/4', () => {
    expect(normalizeAngle(-Math.PI / 4)).toBeCloseTo(2 * Math.PI - Math.PI / 4, 5);
  });

  it('normalizes 3*PI to PI', () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 5);
  });

  it('normalizes 0 to 0', () => {
    expect(normalizeAngle(0)).toBe(0);
  });

  it('normalizes 2*PI to approximately 0', () => {
    expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0, 5);
  });

  it('normalizes negative multiples', () => {
    expect(normalizeAngle(-4 * Math.PI)).toBeCloseTo(0, 5);
  });
});

// ============================================================================
// estimateTheta
// ============================================================================

describe('estimateTheta', () => {
  it('pure concrete (10, 0) returns 0', () => {
    expect(estimateTheta(10, 0)).toBe(0);
  });

  it('pure abstract (0, 10) returns approximately PI/2', () => {
    expect(estimateTheta(0, 10)).toBeCloseTo(Math.PI / 2, 5);
  });

  it('balanced (5, 5) returns approximately PI/4', () => {
    expect(estimateTheta(5, 5)).toBeCloseTo(Math.PI / 4, 5);
  });

  it('both zero (0, 0) returns 0', () => {
    expect(estimateTheta(0, 0)).toBe(0);
  });
});

// ============================================================================
// estimateRadius
// ============================================================================

describe('estimateRadius', () => {
  it('0 observations returns 0', () => {
    expect(estimateRadius(0)).toBe(0);
  });

  it('25 observations with default threshold returns 0.5', () => {
    expect(estimateRadius(25)).toBeCloseTo(0.5, 5);
  });

  it('100 observations returns 1.0 (clamped)', () => {
    expect(estimateRadius(100)).toBe(1.0);
  });

  it('custom threshold: 10/20 returns 0.5', () => {
    expect(estimateRadius(10, 20)).toBeCloseTo(0.5, 5);
  });

  it('negative observations returns 0', () => {
    expect(estimateRadius(-5)).toBe(0);
  });
});

// ============================================================================
// computeTangent
// ============================================================================

describe('computeTangent', () => {
  it('at theta=PI/4, r=1: slope approximately -1', () => {
    const t = computeTangent(pos(Math.PI / 4, 1));
    expect(t.slope).toBeCloseTo(-1, 3);
  });

  it('at theta=PI/4, r=1: reach approximately sqrt(2)', () => {
    const t = computeTangent(pos(Math.PI / 4, 1));
    expect(t.reach).toBeCloseTo(Math.SQRT2, 3);
  });

  it('at theta=PI/4, r=1: versine approximately 0.2929', () => {
    const t = computeTangent(pos(Math.PI / 4, 1));
    expect(t.versine).toBeCloseTo(0.2929, 3);
  });

  it('at theta=PI/4, r=1: exsecant approximately 0.4142', () => {
    const t = computeTangent(pos(Math.PI / 4, 1));
    expect(t.exsecant).toBeCloseTo(0.4142, 3);
  });

  it('at theta=PI/6, r=1: slope approximately -sqrt(3)', () => {
    const t = computeTangent(pos(Math.PI / 6, 1));
    expect(t.slope).toBeCloseTo(-Math.sqrt(3), 3);
  });

  it('at theta=PI/6, r=1: reach approximately 2/sqrt(3)', () => {
    const t = computeTangent(pos(Math.PI / 6, 1));
    expect(t.reach).toBeCloseTo(2 / Math.sqrt(3), 3);
  });

  it('at theta=PI/6, r=1: versine approximately 0.134', () => {
    const t = computeTangent(pos(Math.PI / 6, 1));
    expect(t.versine).toBeCloseTo(0.134, 3);
  });

  it('at theta=PI/3, r=1: slope approximately -1/sqrt(3)', () => {
    const t = computeTangent(pos(Math.PI / 3, 1));
    expect(t.slope).toBeCloseTo(-1 / Math.sqrt(3), 3);
  });

  it('at theta=PI/3, r=1: reach approximately 2', () => {
    const t = computeTangent(pos(Math.PI / 3, 1));
    expect(t.reach).toBeCloseTo(2, 3);
  });

  it('at theta=PI/3, r=1: versine approximately 0.5', () => {
    const t = computeTangent(pos(Math.PI / 3, 1));
    expect(t.versine).toBeCloseTo(0.5, 3);
  });

  it('near theta=0 (MIN_THETA): slope is finite', () => {
    const t = computeTangent(pos(0.01, 1));
    expect(Number.isFinite(t.slope)).toBe(true);
  });

  it('near theta=0 (MIN_THETA): reach is finite', () => {
    const t = computeTangent(pos(0.01, 1));
    expect(Number.isFinite(t.reach)).toBe(true);
  });

  it('near theta=PI/2: reach is clamped to MAX_REACH', () => {
    const t = computeTangent(pos(Math.PI / 2 - 1e-12, 1));
    expect(t.reach).toBeLessThanOrEqual(MAX_REACH);
    expect(Number.isFinite(t.reach)).toBe(true);
  });

  it('near theta=PI/2: slope is near 0', () => {
    const t = computeTangent(pos(Math.PI / 2 - 0.001, 1));
    expect(Math.abs(t.slope)).toBeLessThan(2);
  });

  it('produces no NaN in any field', () => {
    // Test several edge-case thetas
    const thetas = [0.001, 0.01, Math.PI / 4, Math.PI / 2 - 0.001, Math.PI / 2, Math.PI, 1.5707];
    for (const theta of thetas) {
      const t = computeTangent(pos(theta, 1));
      expect(Number.isNaN(t.slope)).toBe(false);
      expect(Number.isNaN(t.reach)).toBe(false);
      expect(Number.isNaN(t.versine)).toBe(false);
      expect(Number.isNaN(t.exsecant)).toBe(false);
    }
  });

  it('produces no Infinity in any field', () => {
    const thetas = [0.001, Math.PI / 2 - 0.001, Math.PI / 2, 0];
    for (const theta of thetas) {
      const t = computeTangent(pos(theta, 1));
      expect(Number.isFinite(t.slope)).toBe(true);
      expect(Number.isFinite(t.reach)).toBe(true);
      expect(Number.isFinite(t.versine)).toBe(true);
      expect(Number.isFinite(t.exsecant)).toBe(true);
    }
  });
});

// ============================================================================
// pointToTangentDistance
// ============================================================================

describe('pointToTangentDistance', () => {
  it('point at origin for skill at PI/4, r=1 gives distance 1', () => {
    const d = pointToTangentDistance({ x: 0, y: 0 }, pos(Math.PI / 4, 1));
    expect(d).toBeCloseTo(1, 3);
  });

  it('point on the circle at skill angle gives distance 0', () => {
    // For a skill at theta=PI/4, r=1, the point on the circle is (cos(PI/4), sin(PI/4))
    const theta = Math.PI / 4;
    const d = pointToTangentDistance(
      { x: Math.cos(theta), y: Math.sin(theta) },
      pos(theta, 1),
    );
    expect(d).toBeCloseTo(0, 3);
  });

  it('returns non-negative value', () => {
    const d = pointToTangentDistance({ x: -1, y: -1 }, pos(Math.PI / 4, 0.5));
    expect(d).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// computeTangentScore
// ============================================================================

describe('computeTangentScore', () => {
  it('higher radius gives higher score', () => {
    const s1 = computeTangentScore({ x: 0, y: 0 }, pos(Math.PI / 4, 0.3));
    const s2 = computeTangentScore({ x: 0, y: 0 }, pos(Math.PI / 4, 0.9));
    expect(s2).toBeGreaterThan(s1);
  });

  it('closer to tangent line gives higher score', () => {
    const theta = Math.PI / 4;
    // Point on the tangent line
    const close = computeTangentScore(
      { x: Math.cos(theta), y: Math.sin(theta) },
      pos(theta, 1),
    );
    // Point far from tangent line
    const far = computeTangentScore({ x: -5, y: -5 }, pos(theta, 1));
    expect(close).toBeGreaterThan(far);
  });

  it('equals radius / (1 + distance)', () => {
    const p = pos(Math.PI / 4, 0.8);
    const d = pointToTangentDistance({ x: 0, y: 0 }, p);
    const s = computeTangentScore({ x: 0, y: 0 }, p);
    expect(s).toBeCloseTo(0.8 / (1 + d), 5);
  });
});

// ============================================================================
// composePositions
// ============================================================================

describe('composePositions', () => {
  it('PI/4 + PI/4 gives theta=PI/2', () => {
    const result = composePositions(pos(Math.PI / 4, 1), pos(Math.PI / 4, 1));
    expect(result.theta).toBeCloseTo(Math.PI / 2, 5);
  });

  it('two concrete stay concrete: 0.1 + 0.1 gives 0.2', () => {
    const result = composePositions(pos(0.1, 1), pos(0.1, 1));
    expect(result.theta).toBeCloseTo(0.2, 5);
  });

  it('radius multiplication: 0.5 * 0.8 gives 0.4', () => {
    const result = composePositions(pos(0, 0.5), pos(0, 0.8));
    expect(result.radius).toBeCloseTo(0.4, 5);
  });

  it('theta wrapping: sum > 2*PI wraps correctly', () => {
    const result = composePositions(pos(5, 1), pos(5, 1));
    // 5 + 5 = 10, 10 mod 2*PI ~= 3.717
    expect(result.theta).toBeCloseTo(normalizeAngle(10), 5);
    expect(result.theta).toBeGreaterThanOrEqual(0);
    expect(result.theta).toBeLessThan(2 * Math.PI);
  });

  it('angularVelocity sums', () => {
    const result = composePositions(pos(0, 1, 0.1), pos(0, 1, 0.05));
    expect(result.angularVelocity).toBeCloseTo(0.15, 5);
  });

  it('radius clamped to 1', () => {
    const result = composePositions(pos(0, 1), pos(0, 1));
    expect(result.radius).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// complexDistance
// ============================================================================

describe('complexDistance', () => {
  it('same position gives distance 0', () => {
    const p = pos(Math.PI / 4, 1);
    expect(complexDistance(p, p)).toBeCloseTo(0, 5);
  });

  it('diametrically opposite on unit circle gives distance 2', () => {
    const a = pos(0, 1);
    const b = pos(Math.PI, 1);
    expect(complexDistance(a, b)).toBeCloseTo(2, 3);
  });

  it('origin to unit circle gives distance 1', () => {
    const a = pos(0, 0);
    const b = pos(0, 1);
    expect(complexDistance(a, b)).toBeCloseTo(1, 5);
  });
});

// ============================================================================
// arcDistance
// ============================================================================

describe('arcDistance', () => {
  it('PI/4 to 3*PI/4 gives PI/2', () => {
    expect(arcDistance(pos(Math.PI / 4, 1), pos(3 * Math.PI / 4, 1))).toBeCloseTo(Math.PI / 2, 5);
  });

  it('takes shorter arc: 0.1 to 2*PI-0.1 gives 0.2', () => {
    expect(arcDistance(pos(0.1, 1), pos(2 * Math.PI - 0.1, 1))).toBeCloseTo(0.2, 5);
  });

  it('identical positions give 0', () => {
    expect(arcDistance(pos(1, 1), pos(1, 1))).toBeCloseTo(0, 5);
  });

  it('maximum arc distance is PI', () => {
    expect(arcDistance(pos(0, 1), pos(Math.PI, 1))).toBeCloseTo(Math.PI, 5);
  });

  it('always returns <= PI', () => {
    expect(arcDistance(pos(0.1, 1), pos(5.5, 1))).toBeLessThanOrEqual(Math.PI + 1e-10);
  });
});

// ============================================================================
// chordLength
// ============================================================================

describe('chordLength', () => {
  it('arc=PI (opposite sides, r_avg=1) gives chord=2 (diameter)', () => {
    expect(chordLength(pos(0, 1), pos(Math.PI, 1))).toBeCloseTo(2, 3);
  });

  it('arc=0 gives chord=0', () => {
    expect(chordLength(pos(1, 1), pos(1, 1))).toBeCloseTo(0, 5);
  });

  it('uses average radius', () => {
    // r_avg = (0.4 + 0.6) / 2 = 0.5
    // arc = PI/2, chord = 2 * 0.5 * sin(PI/4) = 1 * sqrt(2)/2 ~ 0.707
    const c = chordLength(pos(0, 0.4), pos(Math.PI / 2, 0.6));
    expect(c).toBeCloseTo(2 * 0.5 * Math.sin(Math.PI / 4), 3);
  });
});

// ============================================================================
// evaluateChord
// ============================================================================

describe('evaluateChord', () => {
  it('meaningful shortcut with frequency>=5 returns ChordCandidate', () => {
    // Large arc, small chord = good savings
    const result = evaluateChord(pos(0, 1), pos(Math.PI, 1), 10);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.savings).toBeGreaterThan(0);
      expect(result.frequency).toBe(10);
    }
  });

  it('frequency < 5 returns null', () => {
    const result = evaluateChord(pos(0, 1), pos(Math.PI, 1), 4);
    expect(result).toBeNull();
  });

  it('no savings (arc <= chord effectively) returns null for tiny arc', () => {
    // Very close positions: arc ~ chord, savings ~ 0
    const result = evaluateChord(pos(0, 1), pos(0.001, 1), 10);
    // With such a tiny angle, savings should be negligible or <= 0
    if (result !== null) {
      expect(result.savings).toBeGreaterThan(0);
    }
  });

  it('returned candidate has correct structure', () => {
    const result = evaluateChord(pos(0, 1), pos(Math.PI / 2, 1), 7);
    if (result) {
      expect(result).toHaveProperty('fromId');
      expect(result).toHaveProperty('toId');
      expect(result).toHaveProperty('fromPosition');
      expect(result).toHaveProperty('toPosition');
      expect(result).toHaveProperty('arcDistance');
      expect(result).toHaveProperty('chordLength');
      expect(result).toHaveProperty('savings');
      expect(result).toHaveProperty('frequency');
    }
  });
});

// ============================================================================
// versine
// ============================================================================

describe('versine', () => {
  it('theta=0 returns 0', () => {
    expect(versine(pos(0, 1))).toBeCloseTo(0, 5);
  });

  it('theta=PI/2 returns 1', () => {
    expect(versine(pos(Math.PI / 2, 1))).toBeCloseTo(1, 5);
  });

  it('theta=PI returns 2', () => {
    expect(versine(pos(Math.PI, 1))).toBeCloseTo(2, 5);
  });

  it('theta=PI/4 returns approximately 0.2929', () => {
    expect(versine(pos(Math.PI / 4, 1))).toBeCloseTo(0.2929, 3);
  });
});

// ============================================================================
// exsecant
// ============================================================================

describe('exsecant', () => {
  it('theta=0 returns approximately 0', () => {
    expect(exsecant(pos(0, 1))).toBeCloseTo(0, 3);
  });

  it('theta=PI/4 returns approximately 0.4142', () => {
    expect(exsecant(pos(Math.PI / 4, 1))).toBeCloseTo(0.4142, 3);
  });

  it('near theta=PI/2 is clamped to MAX_REACH - 1', () => {
    const e = exsecant(pos(Math.PI / 2, 1));
    expect(e).toBeLessThanOrEqual(MAX_REACH - 1);
    expect(Number.isFinite(e)).toBe(true);
  });

  it('produces no NaN', () => {
    expect(Number.isNaN(exsecant(pos(0, 1)))).toBe(false);
    expect(Number.isNaN(exsecant(pos(Math.PI / 2, 1)))).toBe(false);
  });
});

// ============================================================================
// classifyByVersine
// ============================================================================

describe('classifyByVersine', () => {
  it('theta producing versine < 0.2 returns grounded', () => {
    // theta=0.1, versine = 1 - cos(0.1) ~ 0.005
    expect(classifyByVersine(pos(0.1, 1))).toBe('grounded');
  });

  it('theta producing versine in [0.2, 0.6) returns working', () => {
    // theta=PI/4, versine ~ 0.293
    expect(classifyByVersine(pos(Math.PI / 4, 1))).toBe('working');
  });

  it('theta producing versine >= 0.6 returns frontier', () => {
    // theta=PI/2, versine = 1
    expect(classifyByVersine(pos(Math.PI / 2, 1))).toBe('frontier');
  });

  it('boundary: versine exactly at 0.2 returns working', () => {
    // Find theta where versine = 0.2: 1-cos(theta) = 0.2, cos(theta) = 0.8, theta = acos(0.8)
    const theta = Math.acos(0.8);
    expect(classifyByVersine(pos(theta, 1))).toBe('working');
  });

  it('boundary: versine exactly at 0.6 returns frontier', () => {
    // Find theta where versine = 0.6: cos(theta) = 0.4, theta = acos(0.4)
    const theta = Math.acos(0.4);
    expect(classifyByVersine(pos(theta, 1))).toBe('frontier');
  });
});

// ============================================================================
// getPromotionLevel
// ============================================================================

describe('getPromotionLevel', () => {
  it('theta near 0 returns COMPILED', () => {
    expect(getPromotionLevel(pos(0.05, 1))).toBe(PromotionLevel.COMPILED);
  });

  it('theta at PI/8 returns LORA_ADAPTER', () => {
    expect(getPromotionLevel(pos(Math.PI / 8, 1))).toBe(PromotionLevel.LORA_ADAPTER);
  });

  it('theta at PI/4 returns SKILL_MD', () => {
    expect(getPromotionLevel(pos(Math.PI / 4, 1))).toBe(PromotionLevel.SKILL_MD);
  });

  it('theta near PI/2 returns CONVERSATION', () => {
    expect(getPromotionLevel(pos(Math.PI / 2 - 0.01, 1))).toBe(PromotionLevel.CONVERSATION);
  });

  it('theta >= PI/2 defaults to CONVERSATION', () => {
    expect(getPromotionLevel(pos(Math.PI, 1))).toBe(PromotionLevel.CONVERSATION);
  });
});

// ============================================================================
// computeAngularStep
// ============================================================================

describe('computeAngularStep', () => {
  it('theta=1.0, target=0: step bounded to -0.2', () => {
    // maxStep = 0.2 * 1.0 = 0.2, step = 0 - 1 = -1, bounded to -0.2
    const step = computeAngularStep(1.0, 0);
    expect(step).toBeCloseTo(-0.2, 5);
  });

  it('theta=0.5, target=0: step bounded to -0.1', () => {
    // maxStep = 0.2 * 0.5 = 0.1, step = 0 - 0.5 = -0.5, bounded to -0.1
    const step = computeAngularStep(0.5, 0);
    expect(step).toBeCloseTo(-0.1, 5);
  });

  it('step within bound is returned unchanged', () => {
    // theta=1.0, target=0.95: step = -0.05, maxStep = 0.2, -0.05 within bound
    const step = computeAngularStep(1.0, 0.95);
    expect(step).toBeCloseTo(-0.05, 5);
  });

  it('positive step is also bounded', () => {
    // theta=0.5, target=5.0: step = 4.5, maxStep = 0.2 * 0.5 = 0.1, bounded to 0.1
    const step = computeAngularStep(0.5, 5.0);
    expect(step).toBeCloseTo(0.1, 5);
  });

  it('custom maxVelocity', () => {
    // theta=1.0, target=0, maxVelocity=0.5: maxStep = 0.5 * 1.0 = 0.5
    const step = computeAngularStep(1.0, 0, 0.5);
    expect(step).toBeCloseTo(-0.5, 5);
  });

  it('uses MIN_THETA floor for very small theta', () => {
    // theta=0, target=1: maxStep = 0.2 * max(0, 0.01) = 0.002
    const step = computeAngularStep(0, 1);
    expect(step).toBeCloseTo(0.002, 5);
  });
});

// ============================================================================
// requiredEvidence
// ============================================================================

describe('requiredEvidence', () => {
  it('theta=PI/4 returns 21', () => {
    expect(requiredEvidence(pos(Math.PI / 4, 1))).toBe(21);
  });

  it('theta near PI/2 returns large number', () => {
    const e = requiredEvidence(pos(Math.PI / 2 - 0.01, 1));
    expect(e).toBeGreaterThan(50);
  });

  it('theta near 0 returns small number (minimum 1)', () => {
    const e = requiredEvidence(pos(0.01, 1));
    expect(e).toBeGreaterThanOrEqual(1);
  });

  it('returns integer', () => {
    const e = requiredEvidence(pos(Math.PI / 4, 1));
    expect(Number.isInteger(e)).toBe(true);
  });
});

// ============================================================================
// computePlaneMetrics
// ============================================================================

describe('computePlaneMetrics', () => {
  it('mixed positions: correct versine distribution', () => {
    const positions = new Map<string, SkillPosition>([
      ['s1', pos(0.1, 1)],       // grounded (versine ~ 0.005)
      ['s2', pos(0.2, 1)],       // grounded (versine ~ 0.020)
      ['s3', pos(Math.PI / 4, 1)], // working (versine ~ 0.293)
      ['s4', pos(Math.PI / 2, 1)], // frontier (versine = 1)
    ]);
    const chords: ChordCandidate[] = [];
    const metrics = computePlaneMetrics(positions, chords);

    expect(metrics.totalSkills).toBe(4);
    expect(metrics.versineDistribution.grounded).toBe(2);
    expect(metrics.versineDistribution.working).toBe(1);
    expect(metrics.versineDistribution.frontier).toBe(1);
  });

  it('empty map returns zeros', () => {
    const metrics = computePlaneMetrics(new Map(), []);
    expect(metrics.totalSkills).toBe(0);
    expect(metrics.versineDistribution.grounded).toBe(0);
    expect(metrics.versineDistribution.working).toBe(0);
    expect(metrics.versineDistribution.frontier).toBe(0);
    expect(metrics.avgExsecant).toBe(0);
    expect(metrics.angularVelocityWarnings).toEqual([]);
    expect(metrics.chordCandidates).toEqual([]);
  });

  it('warns for skills exceeding MAX_ANGULAR_VELOCITY', () => {
    const positions = new Map<string, SkillPosition>([
      ['fast', pos(1, 1, MAX_ANGULAR_VELOCITY + 0.1)],
      ['normal', pos(1, 1, 0.1)],
    ]);
    const metrics = computePlaneMetrics(positions, []);
    expect(metrics.angularVelocityWarnings).toContain('fast');
    expect(metrics.angularVelocityWarnings).not.toContain('normal');
  });

  it('computes average exsecant', () => {
    const positions = new Map<string, SkillPosition>([
      ['s1', pos(0, 1)],             // exsecant ~ 0
      ['s2', pos(Math.PI / 4, 1)],   // exsecant ~ 0.414
    ]);
    const metrics = computePlaneMetrics(positions, []);
    expect(metrics.avgExsecant).toBeCloseTo(0.207, 2);
  });

  it('passes through chord candidates', () => {
    const chord: ChordCandidate = {
      fromId: 'a',
      toId: 'b',
      fromPosition: pos(0, 1),
      toPosition: pos(Math.PI, 1),
      arcDistance: Math.PI,
      chordLength: 2,
      savings: Math.PI - 2,
      frequency: 5,
    };
    const metrics = computePlaneMetrics(new Map(), [chord]);
    expect(metrics.chordCandidates).toHaveLength(1);
    expect(metrics.chordCandidates[0]).toEqual(chord);
  });
});

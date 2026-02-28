/**
 * Validation tests for the complex plane type system.
 *
 * Covers all 7 Zod schemas, the PromotionLevel enum, PROMOTION_REGIONS
 * constant, and numeric constants.
 */

import { describe, expect, it } from 'vitest';

import {
  AngularObservationSchema,
  ChordCandidateSchema,
  MATURITY_THRESHOLD,
  MAX_ANGULAR_VELOCITY,
  MAX_REACH,
  MIN_THETA,
  PlaneMetricsSchema,
  PROMOTION_REGIONS,
  PromotionDecisionSchema,
  PromotionLevel,
  SkillPositionSchema,
  TangentContextSchema,
  TangentMatchSchema,
} from './types.js';

// ============================================================================
// Helpers
// ============================================================================

const validPosition = {
  theta: Math.PI / 4,
  radius: 0.5,
  angularVelocity: 0.1,
  lastUpdated: new Date().toISOString(),
};

const validTangent = {
  slope: -1,
  reach: 1.414,
  exsecant: 0.414,
  versine: 0.293,
};

// ============================================================================
// SkillPositionSchema
// ============================================================================

describe('SkillPositionSchema', () => {
  it('accepts a valid position', () => {
    const result = SkillPositionSchema.safeParse(validPosition);
    expect(result.success).toBe(true);
  });

  it('rejects radius > 1', () => {
    const result = SkillPositionSchema.safeParse({ ...validPosition, radius: 1.01 });
    expect(result.success).toBe(false);
  });

  it('rejects radius < 0', () => {
    const result = SkillPositionSchema.safeParse({ ...validPosition, radius: -0.1 });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = SkillPositionSchema.safeParse({ theta: 1.0 });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// TangentContextSchema
// ============================================================================

describe('TangentContextSchema', () => {
  it('accepts a valid context', () => {
    const result = TangentContextSchema.safeParse(validTangent);
    expect(result.success).toBe(true);
  });

  it('rejects missing fields', () => {
    const result = TangentContextSchema.safeParse({ slope: -1 });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// TangentMatchSchema
// ============================================================================

describe('TangentMatchSchema', () => {
  it('accepts a valid match with nested position and tangent', () => {
    const result = TangentMatchSchema.safeParse({
      skillId: 'skill-abc',
      position: validPosition,
      tangent: validTangent,
      tangentDistance: 0.25,
      score: 0.85,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative tangentDistance', () => {
    const result = TangentMatchSchema.safeParse({
      skillId: 'skill-abc',
      position: validPosition,
      tangent: validTangent,
      tangentDistance: -0.1,
      score: 0.85,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative score', () => {
    const result = TangentMatchSchema.safeParse({
      skillId: 'skill-abc',
      position: validPosition,
      tangent: validTangent,
      tangentDistance: 0.25,
      score: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ChordCandidateSchema
// ============================================================================

describe('ChordCandidateSchema', () => {
  it('accepts a valid chord with nested positions', () => {
    const pos2 = { ...validPosition, theta: Math.PI / 3 };
    const result = ChordCandidateSchema.safeParse({
      fromId: 'skill-a',
      toId: 'skill-b',
      fromPosition: validPosition,
      toPosition: pos2,
      arcDistance: 0.5,
      chordLength: 0.48,
      savings: 0.02,
      frequency: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative frequency', () => {
    const result = ChordCandidateSchema.safeParse({
      fromId: 'skill-a',
      toId: 'skill-b',
      fromPosition: validPosition,
      toPosition: validPosition,
      arcDistance: 0.5,
      chordLength: 0.48,
      savings: 0.02,
      frequency: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer frequency', () => {
    const result = ChordCandidateSchema.safeParse({
      fromId: 'skill-a',
      toId: 'skill-b',
      fromPosition: validPosition,
      toPosition: validPosition,
      arcDistance: 0.5,
      chordLength: 0.48,
      savings: 0.02,
      frequency: 2.5,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// PromotionDecisionSchema
// ============================================================================

describe('PromotionDecisionSchema', () => {
  const validDecision = {
    skillId: 'skill-xyz',
    currentTheta: Math.PI / 4,
    targetTheta: Math.PI / 8,
    maxAngularStep: 0.1,
    requiredEvidence: 10,
    versineGap: 0.15,
    exsecantReach: 0.4,
    approved: true,
    reason: 'Sufficient evidence and within angular velocity limit',
  };

  it('accepts a valid approved decision', () => {
    const result = PromotionDecisionSchema.safeParse(validDecision);
    expect(result.success).toBe(true);
  });

  it('accepts a valid denied decision', () => {
    const result = PromotionDecisionSchema.safeParse({
      ...validDecision,
      approved: false,
      reason: 'Insufficient evidence',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative requiredEvidence', () => {
    const result = PromotionDecisionSchema.safeParse({
      ...validDecision,
      requiredEvidence: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// AngularObservationSchema
// ============================================================================

describe('AngularObservationSchema', () => {
  it('accepts observation with multiple patterns', () => {
    const result = AngularObservationSchema.safeParse({
      sessionId: 'session-001',
      timestamp: new Date().toISOString(),
      patterns: [
        {
          patternId: 'pat-a',
          concreteSignals: 5,
          abstractSignals: 3,
          estimatedTheta: Math.PI / 6,
          estimatedRadius: 0.4,
        },
        {
          patternId: 'pat-b',
          concreteSignals: 10,
          abstractSignals: 1,
          estimatedTheta: Math.PI / 12,
          estimatedRadius: 0.7,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts observation with empty patterns array', () => {
    const result = AngularObservationSchema.safeParse({
      sessionId: 'session-002',
      timestamp: new Date().toISOString(),
      patterns: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects pattern with negative concreteSignals', () => {
    const result = AngularObservationSchema.safeParse({
      sessionId: 'session-003',
      timestamp: new Date().toISOString(),
      patterns: [
        {
          patternId: 'pat-c',
          concreteSignals: -1,
          abstractSignals: 3,
          estimatedTheta: 0.5,
          estimatedRadius: 0.3,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// PlaneMetricsSchema
// ============================================================================

describe('PlaneMetricsSchema', () => {
  it('accepts valid metrics with versineDistribution and chord array', () => {
    const result = PlaneMetricsSchema.safeParse({
      totalSkills: 25,
      versineDistribution: {
        grounded: 10,
        working: 10,
        frontier: 5,
      },
      avgExsecant: 0.35,
      angularVelocityWarnings: ['skill-fast is above MAX_ANGULAR_VELOCITY'],
      chordCandidates: [
        {
          fromId: 'skill-a',
          toId: 'skill-b',
          fromPosition: validPosition,
          toPosition: { ...validPosition, theta: Math.PI / 3 },
          arcDistance: 0.5,
          chordLength: 0.48,
          savings: 0.02,
          frequency: 5,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts metrics with empty arrays', () => {
    const result = PlaneMetricsSchema.safeParse({
      totalSkills: 0,
      versineDistribution: {
        grounded: 0,
        working: 0,
        frontier: 0,
      },
      avgExsecant: 0,
      angularVelocityWarnings: [],
      chordCandidates: [],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// PromotionLevel enum
// ============================================================================

describe('PromotionLevel enum', () => {
  it('has exactly 4 members', () => {
    const values = Object.values(PromotionLevel);
    expect(values).toHaveLength(4);
  });

  it('has CONVERSATION, SKILL_MD, LORA_ADAPTER, COMPILED', () => {
    expect(PromotionLevel.CONVERSATION).toBe('conversation');
    expect(PromotionLevel.SKILL_MD).toBe('skill_md');
    expect(PromotionLevel.LORA_ADAPTER).toBe('lora_adapter');
    expect(PromotionLevel.COMPILED).toBe('compiled');
  });

  it('values are lowercase string variants', () => {
    for (const val of Object.values(PromotionLevel)) {
      expect(val).toMatch(/^[a-z_]+$/);
    }
  });
});

// ============================================================================
// PROMOTION_REGIONS constant
// ============================================================================

describe('PROMOTION_REGIONS', () => {
  it('has entry for each PromotionLevel', () => {
    for (const level of Object.values(PromotionLevel)) {
      expect(PROMOTION_REGIONS[level]).toBeDefined();
      expect(PROMOTION_REGIONS[level]).toHaveProperty('thetaMin');
      expect(PROMOTION_REGIONS[level]).toHaveProperty('thetaMax');
    }
  });

  it('each region has thetaMin < thetaMax', () => {
    for (const level of Object.values(PromotionLevel)) {
      const region = PROMOTION_REGIONS[level];
      expect(region.thetaMin).toBeLessThan(region.thetaMax);
    }
  });

  it('COMPILED.thetaMin is 0', () => {
    expect(PROMOTION_REGIONS[PromotionLevel.COMPILED].thetaMin).toBe(0);
  });

  it('CONVERSATION.thetaMax is Math.PI / 2', () => {
    expect(PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMax).toBe(Math.PI / 2);
  });

  it('regions cover [0, pi/2] without gaps', () => {
    // Order: COMPILED -> LORA_ADAPTER -> SKILL_MD -> CONVERSATION
    const ordered = [
      PromotionLevel.COMPILED,
      PromotionLevel.LORA_ADAPTER,
      PromotionLevel.SKILL_MD,
      PromotionLevel.CONVERSATION,
    ];

    for (let i = 0; i < ordered.length - 1; i++) {
      const current = PROMOTION_REGIONS[ordered[i]];
      const next = PROMOTION_REGIONS[ordered[i + 1]];
      expect(current.thetaMax).toBeCloseTo(next.thetaMin, 10);
    }
  });
});

// ============================================================================
// Constants
// ============================================================================

describe('Constants', () => {
  it('MAX_REACH === 100', () => {
    expect(MAX_REACH).toBe(100);
  });

  it('MIN_THETA === 0.01', () => {
    expect(MIN_THETA).toBe(0.01);
  });

  it('MAX_ANGULAR_VELOCITY === 0.2', () => {
    expect(MAX_ANGULAR_VELOCITY).toBe(0.2);
  });

  it('MATURITY_THRESHOLD === 50', () => {
    expect(MATURITY_THRESHOLD).toBe(50);
  });
});

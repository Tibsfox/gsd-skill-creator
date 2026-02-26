/**
 * Test suite for AngularPromotionEvaluator -- 7-check geometric evaluation
 * and executePromotion position update.
 */

import { describe, it, expect } from 'vitest';
import { createPosition } from './arithmetic.js';
import { PromotionLevel, PROMOTION_REGIONS, MAX_ANGULAR_VELOCITY } from './types.js';
import type { SkillPosition } from './types.js';
import {
  AngularPromotionEvaluator,
  isAdjacentLevel,
  CONSTRAINT_MAP,
  type ExistingEvaluationFramework,
  type EvidenceProvider,
  type PositionStorePort,
} from './promotion.js';

// ============================================================================
// Test Factories
// ============================================================================

function createMockPositionStore(
  positions: Map<string, SkillPosition> = new Map(),
): PositionStorePort {
  return {
    get: (id: string) => positions.get(id) ?? null,
    set: (id: string, pos: SkillPosition) => { positions.set(id, pos); },
  };
}

function createMockEvalFramework(
  passed = true,
  reason = 'OK',
): ExistingEvaluationFramework {
  return { evaluate: () => ({ passed, reason }) };
}

function createMockEvidenceProvider(
  overrides: Partial<EvidenceProvider> = {},
): EvidenceProvider {
  return {
    getPatternRepetitions: () => 10,
    getTrainingPairCount: () => 60,
    getDeterministicInvariantCount: () => 20,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('AngularPromotionEvaluator', () => {
  // ---- Direction check ----

  describe('evaluatePromotion - direction check', () => {
    it('approves promotion toward theta=0 (more concrete)', () => {
      // Skill in CONVERSATION region promoting to SKILL_MD (toward theta=0)
      const pos = createPosition(Math.PI / 3, 0.5, 0.01);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      // Direction check should not cause rejection (target is more concrete)
      expect(result.reason).not.toContain('not more concrete');
    });

    it('rejects promotion away from theta=0', () => {
      // Skill at theta=0.1 (compiled region) trying to promote to CONVERSATION
      const pos = createPosition(0.1, 0.5, 0.01);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.CONVERSATION);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('not more concrete');
    });

    it('rejects same-region promotion', () => {
      // Skill deep in SKILL_MD region trying to promote to SKILL_MD
      const midSKILL = (PROMOTION_REGIONS[PromotionLevel.SKILL_MD].thetaMin
        + PROMOTION_REGIONS[PromotionLevel.SKILL_MD].thetaMax) / 2;
      const pos = createPosition(midSKILL, 0.5, 0.01);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(false);
      // Same level should fail either direction or adjacency check
    });
  });

  // ---- Adjacency check ----

  describe('evaluatePromotion - adjacency check', () => {
    it('allows adjacent level promotion', () => {
      // CONVERSATION -> SKILL_MD (adjacent)
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.01;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.reason).not.toContain('Cannot skip levels');
    });

    it('rejects level-skipping promotion (CONVERSATION -> COMPILED)', () => {
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.01;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.COMPILED);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Cannot skip levels');
    });

    it('rejects level-skipping by two (CONVERSATION -> LORA_ADAPTER)', () => {
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.01;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.LORA_ADAPTER);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Cannot skip levels');
    });
  });

  // ---- Angular step & velocity bound ----

  describe('evaluatePromotion - angular step & velocity bound', () => {
    it('rejects step exceeding angular velocity bound', () => {
      // Skill at theta=1.0, target SKILL_MD midpoint ~0.27
      // Step = 1.0 - 0.27 = 0.73, bound = 0.2 * 1.0 = 0.2 -> reject
      const pos = createPosition(1.0, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('exceeds bound');
    });

    it('approves step within velocity bound', () => {
      // Skill just above SKILL_MD max, targeting SKILL_MD
      // Small step well within 20% of current theta
      const justAbove = PROMOTION_REGIONS[PromotionLevel.SKILL_MD].thetaMax + 0.01;
      const pos = createPosition(justAbove, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      // Should not fail on angular step check
      expect(result.reason).not.toContain('exceeds bound');
    });
  });

  // ---- Evidence requirements ----

  describe('evaluatePromotion - evidence requirements', () => {
    it('rejects with insufficient evidence', () => {
      // Skill in CONVERSATION zone promoting to SKILL_MD
      // Use low pattern repetitions
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.05;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider({
          getPatternRepetitions: () => 2,
        }),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('evidence');
    });

    it('approves with sufficient evidence', () => {
      // Provide enough evidence
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.05;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider({
          getPatternRepetitions: () => 200,
        }),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.reason).not.toContain('evidence');
    });
  });

  // ---- Stability check ----

  describe('evaluatePromotion - stability check', () => {
    it('rejects unstable position', () => {
      // angularVelocity = 0.3 (above 0.1 = MAX_ANGULAR_VELOCITY/2)
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.01;
      const pos = createPosition(theta, 0.5, 0.3);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('still shifting');
    });

    it('approves stable position', () => {
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.01;
      const pos = createPosition(theta, 0.5, 0.05);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.reason).not.toContain('still shifting');
    });
  });

  // ---- Existing evaluation ----

  describe('evaluatePromotion - existing evaluation', () => {
    it('rejects when existing evaluation fails', () => {
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.01;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(false, 'F1 below threshold'),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Existing evaluation failed');
      expect(result.reason).toContain('F1 below threshold');
    });

    it('passes when existing evaluation succeeds', () => {
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.01;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(true, 'OK'),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.reason).not.toContain('Existing evaluation failed');
    });
  });

  // ---- Full flow ----

  describe('evaluatePromotion - full flow', () => {
    it('approves when all 7 checks pass', () => {
      // Skill in CONVERSATION region, stable, sufficient evidence, eval passes
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.05;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(true, 'OK'),
        createMockEvidenceProvider({
          getPatternRepetitions: () => 200,
        }),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(true);
      expect(result.reason).toContain('All geometric and evaluation checks passed');
      expect(typeof result.currentTheta).toBe('number');
      expect(typeof result.targetTheta).toBe('number');
      expect(typeof result.maxAngularStep).toBe('number');
      expect(typeof result.requiredEvidence).toBe('number');
      expect(typeof result.versineGap).toBe('number');
      expect(typeof result.exsecantReach).toBe('number');
    });

    it('returns no-position rejection when skill has no position', () => {
      const store = createMockPositionStore(new Map());
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const result = evaluator.evaluatePromotion('missing', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('No plane position assigned');
    });

    it('decision includes geometric fields on approval', () => {
      const theta = PROMOTION_REGIONS[PromotionLevel.CONVERSATION].thetaMin + 0.05;
      const pos = createPosition(theta, 0.5, 0.02);
      const store = createMockPositionStore(new Map([['s1', pos]]));
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(true, 'OK'),
        createMockEvidenceProvider({ getPatternRepetitions: () => 200 }),
      );

      const result = evaluator.evaluatePromotion('s1', PromotionLevel.SKILL_MD);
      expect(result.approved).toBe(true);
      expect(result.versineGap).toBeGreaterThan(0);
      expect(result.exsecantReach).toBeGreaterThan(0);
      expect(result.requiredEvidence).toBeGreaterThanOrEqual(1);
      expect(result.currentTheta).toBeCloseTo(theta, 3);
    });
  });

  // ---- executePromotion ----

  describe('executePromotion', () => {
    it('updates position store with new position', () => {
      const pos = createPosition(Math.PI / 3, 0.5, 0.02);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const targetTheta = (PROMOTION_REGIONS[PromotionLevel.SKILL_MD].thetaMin
        + PROMOTION_REGIONS[PromotionLevel.SKILL_MD].thetaMax) / 2;
      const decision = {
        skillId: 's1',
        currentTheta: pos.theta,
        targetTheta,
        maxAngularStep: 0.2,
        requiredEvidence: 3,
        versineGap: 0.5,
        exsecantReach: 0.3,
        approved: true,
        reason: 'All checks passed',
      };

      evaluator.executePromotion('s1', decision);
      const updated = store.get('s1')!;
      expect(updated).not.toBeNull();
    });

    it('sets theta to targetTheta from decision', () => {
      const pos = createPosition(Math.PI / 3, 0.5, 0.02);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const targetTheta = (PROMOTION_REGIONS[PromotionLevel.SKILL_MD].thetaMin
        + PROMOTION_REGIONS[PromotionLevel.SKILL_MD].thetaMax) / 2;
      const decision = {
        skillId: 's1',
        currentTheta: pos.theta,
        targetTheta,
        maxAngularStep: 0.2,
        requiredEvidence: 3,
        versineGap: 0.5,
        exsecantReach: 0.3,
        approved: true,
        reason: 'All checks passed',
      };

      const newPos = evaluator.executePromotion('s1', decision);
      expect(newPos.theta).toBeCloseTo(targetTheta, 3);
    });

    it('increases radius by 0.1 capped at 1.0', () => {
      // Case 1: 0.5 -> 0.6
      const pos1 = createPosition(Math.PI / 3, 0.5, 0.02);
      const positions = new Map<string, SkillPosition>([['s1', pos1]]);
      const store = createMockPositionStore(positions);
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const decision = {
        skillId: 's1',
        currentTheta: pos1.theta,
        targetTheta: 0.5,
        maxAngularStep: 0.2,
        requiredEvidence: 3,
        versineGap: 0.5,
        exsecantReach: 0.3,
        approved: true,
        reason: 'All checks passed',
      };

      const result1 = evaluator.executePromotion('s1', decision);
      expect(result1.radius).toBeCloseTo(0.6, 3);

      // Case 2: 0.95 -> 1.0 (capped)
      const pos2 = createPosition(Math.PI / 3, 0.95, 0.02);
      positions.set('s2', pos2);

      const decision2 = { ...decision, skillId: 's2', currentTheta: pos2.theta };
      const result2 = evaluator.executePromotion('s2', decision2);
      expect(result2.radius).toBeCloseTo(1.0, 3);
    });

    it('resets angular velocity to 0', () => {
      const pos = createPosition(Math.PI / 3, 0.5, 0.15);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const evaluator = new AngularPromotionEvaluator(
        store,
        createMockEvalFramework(),
        createMockEvidenceProvider(),
      );

      const decision = {
        skillId: 's1',
        currentTheta: pos.theta,
        targetTheta: 0.5,
        maxAngularStep: 0.2,
        requiredEvidence: 3,
        versineGap: 0.5,
        exsecantReach: 0.3,
        approved: true,
        reason: 'All checks passed',
      };

      const newPos = evaluator.executePromotion('s1', decision);
      expect(newPos.angularVelocity).toBe(0);
    });
  });

  // ---- isAdjacentLevel ----

  describe('isAdjacentLevel', () => {
    it('CONVERSATION -> SKILL_MD is adjacent', () => {
      expect(isAdjacentLevel(PromotionLevel.CONVERSATION, PromotionLevel.SKILL_MD)).toBe(true);
    });

    it('SKILL_MD -> LORA_ADAPTER is adjacent', () => {
      expect(isAdjacentLevel(PromotionLevel.SKILL_MD, PromotionLevel.LORA_ADAPTER)).toBe(true);
    });

    it('LORA_ADAPTER -> COMPILED is adjacent', () => {
      expect(isAdjacentLevel(PromotionLevel.LORA_ADAPTER, PromotionLevel.COMPILED)).toBe(true);
    });

    it('CONVERSATION -> LORA_ADAPTER is NOT adjacent', () => {
      expect(isAdjacentLevel(PromotionLevel.CONVERSATION, PromotionLevel.LORA_ADAPTER)).toBe(false);
    });

    it('CONVERSATION -> COMPILED is NOT adjacent', () => {
      expect(isAdjacentLevel(PromotionLevel.CONVERSATION, PromotionLevel.COMPILED)).toBe(false);
    });

    it('COMPILED -> LORA_ADAPTER is NOT adjacent (reverse not allowed)', () => {
      expect(isAdjacentLevel(PromotionLevel.COMPILED, PromotionLevel.LORA_ADAPTER)).toBe(false);
    });
  });

  // ---- CONSTRAINT_MAP ----

  describe('CONSTRAINT_MAP', () => {
    it('preserves existing bounded learning constraints', () => {
      expect(CONSTRAINT_MAP.minCorrections).toBe(3);
      expect(CONSTRAINT_MAP.cooldownDays).toBe(7);
      expect(CONSTRAINT_MAP.maxContentChange).toBeCloseTo(0.20, 3);
    });

    it('adds angular velocity mapping', () => {
      expect(CONSTRAINT_MAP.maxAngularVelocity).toBeCloseTo(0.20, 3);
      expect(CONSTRAINT_MAP.stabilityThreshold).toBeCloseTo(0.10, 3);
    });
  });
});

/**
 * Angular Promotion Evaluator -- 7-check geometric evaluation sequence.
 *
 * Determines whether a skill is ready for promotion by validating direction,
 * adjacency, angular velocity bounds, evidence requirements, stability,
 * velocity limits, and existing evaluation framework checks.
 *
 * Promotions are bounded angular rotation toward the real axis (theta=0).
 * The evaluator wraps and enhances existing promotion logic with geometric
 * constraints, ensuring promotions are mathematically justified and bounded.
 *
 * Dependency injection via PositionStorePort, ExistingEvaluationFramework,
 * and EvidenceProvider enables pure unit testing without real I/O.
 */

import type { SkillPosition, PromotionDecision } from './types.js';
import {
  PromotionLevel,
  PROMOTION_REGIONS,
  MAX_ANGULAR_VELOCITY,
} from './types.js';
import {
  versine,
  exsecant,
  computeAngularStep,
  requiredEvidence,
  getPromotionLevel,
  createPosition,
} from './arithmetic.js';

// ============================================================================
// Dependency Injection Interfaces
// ============================================================================

/** Interface for existing evaluation framework (F1/MCC gatekeeper). */
export interface ExistingEvaluationFramework {
  evaluate(skillId: string): { passed: boolean; reason: string };
}

/** Interface for evidence counting. */
export interface EvidenceProvider {
  getPatternRepetitions(skillId: string): number;
  getTrainingPairCount(skillId: string): number;
  getDeterministicInvariantCount(skillId: string): number;
}

/** Interface for position store (decoupled from concrete PositionStore). */
export interface PositionStorePort {
  get(skillId: string): SkillPosition | null;
  set(skillId: string, position: SkillPosition): void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Mapping of existing bounded learning constraints plus angular velocity
 * parameters. Preserves minCorrections=3, cooldownDays=7, maxContentChange=20%
 * from the existing bounded learning config.
 */
export const CONSTRAINT_MAP = {
  minCorrections: 3,
  cooldownDays: 7,
  maxContentChange: 0.20,
  maxAngularVelocity: 0.20,
  stabilityThreshold: 0.10,
} as const;

// ============================================================================
// Helpers
// ============================================================================

/** Ordered promotion levels from most abstract to most concrete. */
const LEVEL_ORDER: PromotionLevel[] = [
  PromotionLevel.CONVERSATION,
  PromotionLevel.SKILL_MD,
  PromotionLevel.LORA_ADAPTER,
  PromotionLevel.COMPILED,
];

/**
 * Check whether two promotion levels are forward-adjacent (exactly one step
 * toward more concrete).
 *
 * Only forward adjacency is valid: CONVERSATION -> SKILL_MD is adjacent,
 * but COMPILED -> LORA_ADAPTER is not (reverse direction).
 */
export function isAdjacentLevel(from: PromotionLevel, to: PromotionLevel): boolean {
  const fromIdx = LEVEL_ORDER.indexOf(from);
  const toIdx = LEVEL_ORDER.indexOf(to);
  return toIdx === fromIdx + 1;
}

// ============================================================================
// AngularPromotionEvaluator
// ============================================================================

/**
 * Evaluates and executes promotions using a 7-check geometric sequence.
 *
 * Checks are run in order: direction, adjacency, angular step, evidence,
 * stability, velocity bound, and existing evaluation. A promotion is
 * approved only when all 7 checks pass.
 */
export class AngularPromotionEvaluator {
  private readonly positionStore: PositionStorePort;
  private readonly evaluationFramework: ExistingEvaluationFramework;
  private readonly evidenceProvider: EvidenceProvider;

  constructor(
    positionStore: PositionStorePort,
    evaluationFramework: ExistingEvaluationFramework,
    evidenceProvider: EvidenceProvider,
  ) {
    this.positionStore = positionStore;
    this.evaluationFramework = evaluationFramework;
    this.evidenceProvider = evidenceProvider;
  }

  /**
   * Evaluate whether a skill is ready for promotion to the target level.
   *
   * Runs the 7-check geometric evaluation sequence:
   * 1. Direction -- target must be more concrete (lower theta)
   * 2. Adjacency -- can only promote one level at a time
   * 3. Angular step -- step must not exceed velocity bound
   * 4. Evidence -- sufficient evidence for the promotion
   * 5. Stability -- angular velocity must be below threshold
   * 6. Velocity bound -- explicit angular velocity limit
   * 7. Existing evaluation -- delegate to F1/MCC framework
   *
   * @param skillId - The skill to evaluate
   * @param targetLevel - The promotion level to promote to
   * @returns PromotionDecision with approval status and geometric fields
   */
  evaluatePromotion(skillId: string, targetLevel: PromotionLevel): PromotionDecision {
    const position = this.positionStore.get(skillId);

    // No position -> immediate rejection
    if (!position) {
      return this.rejectDecision(skillId, 0, 0, 0, 'No plane position assigned');
    }

    const currentLevel = getPromotionLevel(position);
    const targetRegion = PROMOTION_REGIONS[targetLevel];
    const targetTheta = (targetRegion.thetaMin + targetRegion.thetaMax) / 2;
    const maxStep = MAX_ANGULAR_VELOCITY * position.theta;

    // Check 1 - Direction: target must be more concrete (lower theta)
    if (targetRegion.thetaMax >= position.theta) {
      return this.rejectDecision(
        skillId, position.theta, targetTheta, maxStep,
        'Target is not more concrete than current position',
      );
    }

    // Check 2 - Adjacency: only one level at a time
    if (!isAdjacentLevel(currentLevel, targetLevel)) {
      return this.rejectDecision(
        skillId, position.theta, targetTheta, maxStep,
        `Cannot skip levels: ${currentLevel} -> ${targetLevel}`,
      );
    }

    // Check 3 - Angular step: distance to target region boundary must not
    // exceed maxStep. Uses thetaMax (nearest edge) since promotion is toward
    // theta=0 and the skill must be able to enter the target region in one step.
    const stepToRegion = Math.abs(position.theta - targetRegion.thetaMax);
    if (stepToRegion > maxStep) {
      return this.rejectDecision(
        skillId, position.theta, targetTheta, maxStep,
        `Angular step ${stepToRegion.toFixed(4)} exceeds bound ${maxStep.toFixed(4)}`,
      );
    }

    // Check 4 - Evidence: must meet required evidence threshold
    const required = requiredEvidence(position);
    const available = this.getEvidenceCount(skillId, currentLevel, targetLevel);
    if (available < required) {
      return this.rejectDecision(
        skillId, position.theta, targetTheta, maxStep,
        `Need ${required} evidence items, have ${available}`,
      );
    }

    // Check 5 - Stability: angular velocity must be below threshold
    if (Math.abs(position.angularVelocity) > CONSTRAINT_MAP.stabilityThreshold) {
      return this.rejectDecision(
        skillId, position.theta, targetTheta, maxStep,
        'Skill position still shifting -- wait for angular velocity to stabilize',
      );
    }

    // Check 6 - Velocity bound: explicit check (redundant with check 3 but
    // included as distinct gate per spec)
    const step = computeAngularStep(position.theta, targetTheta);
    if (Math.abs(step) > MAX_ANGULAR_VELOCITY * Math.max(position.theta, 0.01)) {
      return this.rejectDecision(
        skillId, position.theta, targetTheta, maxStep,
        `Computed step violates angular velocity limit`,
      );
    }

    // Check 7 - Existing evaluation: delegate to framework
    const evalResult = this.evaluationFramework.evaluate(skillId);
    if (!evalResult.passed) {
      return this.rejectDecision(
        skillId, position.theta, targetTheta, maxStep,
        `Existing evaluation failed: ${evalResult.reason}`,
      );
    }

    // All checks passed
    return {
      skillId,
      currentTheta: position.theta,
      targetTheta,
      maxAngularStep: maxStep,
      requiredEvidence: required,
      versineGap: versine(position),
      exsecantReach: exsecant(position),
      approved: true,
      reason: 'All geometric and evaluation checks passed',
    };
  }

  /**
   * Execute an approved promotion: update position to target theta,
   * increase maturity (radius), and reset angular velocity.
   *
   * @param skillId - The skill to promote
   * @param decision - An approved PromotionDecision
   * @returns The new SkillPosition after promotion
   */
  executePromotion(skillId: string, decision: PromotionDecision): SkillPosition {
    const currentPosition = this.positionStore.get(skillId)!;
    const newPosition = createPosition(
      decision.targetTheta,
      Math.min(1.0, currentPosition.radius + 0.1),
      0,
    );

    this.positionStore.set(skillId, newPosition);
    return newPosition;
  }

  /**
   * Get the evidence count for a promotion based on target level.
   *
   * - SKILL_MD: pattern repetitions
   * - LORA_ADAPTER: training pair count
   * - COMPILED: deterministic invariant count
   */
  private getEvidenceCount(
    skillId: string,
    _fromLevel: PromotionLevel,
    toLevel: PromotionLevel,
  ): number {
    switch (toLevel) {
      case PromotionLevel.SKILL_MD:
        return this.evidenceProvider.getPatternRepetitions(skillId);
      case PromotionLevel.LORA_ADAPTER:
        return this.evidenceProvider.getTrainingPairCount(skillId);
      case PromotionLevel.COMPILED:
        return this.evidenceProvider.getDeterministicInvariantCount(skillId);
      default:
        return 0;
    }
  }

  /** Build a rejection PromotionDecision with geometric fields zeroed. */
  private rejectDecision(
    skillId: string,
    currentTheta: number,
    targetTheta: number,
    maxAngularStep: number,
    reason: string,
  ): PromotionDecision {
    return {
      skillId,
      currentTheta,
      targetTheta,
      maxAngularStep,
      requiredEvidence: 0,
      versineGap: 0,
      exsecantReach: 0,
      approved: false,
      reason,
    };
  }
}

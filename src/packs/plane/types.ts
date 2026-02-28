/**
 * Complex Plane Learning Framework -- core type system.
 *
 * Zod schemas and inferred TypeScript types for the complex plane skill
 * positioning model. This is the Wave 0 foundation module -- every
 * downstream phase (360-366) imports from here.
 *
 * Defines: SkillPosition, TangentContext, TangentMatch, ChordCandidate,
 * PromotionDecision, PlaneMetrics, AngularObservation, PromotionLevel,
 * PROMOTION_REGIONS, and numeric constants.
 *
 * Only allowed import: zod.
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/** Clamp sec(theta) to prevent infinity near theta=0. */
export const MAX_REACH = 100;

/** Guard against theta=0 division errors (minimum angular position). */
export const MIN_THETA = 0.01;

/** Maximum angular velocity per observation cycle (20% rule). */
export const MAX_ANGULAR_VELOCITY = 0.2;

/** Number of observations before a skill reaches full maturity (r=1.0). */
export const MATURITY_THRESHOLD = 50;

// ============================================================================
// PromotionLevel enum
// ============================================================================

/**
 * Discrete promotion levels mapping to angular regions on the complex plane.
 *
 * - CONVERSATION: theta ~ pi/2, r ~ 0.1 -- ephemeral session knowledge
 * - SKILL_MD: theta ~ pi/4, r ~ 0.5 -- persisted skill file
 * - LORA_ADAPTER: theta ~ pi/8, r ~ 0.8 -- fine-tuned adapter
 * - COMPILED: theta ~ 0, r ~ 1.0 -- fully compiled knowledge
 */
export enum PromotionLevel {
  CONVERSATION = 'conversation',
  SKILL_MD = 'skill_md',
  LORA_ADAPTER = 'lora_adapter',
  COMPILED = 'compiled',
}

// ============================================================================
// PROMOTION_REGIONS
// ============================================================================

/**
 * Angular regions for each promotion level.
 *
 * Defines the [thetaMin, thetaMax) interval on the unit circle where
 * each promotion level resides. Regions tile [0, pi/2] without gaps:
 * COMPILED [0, pi/16) -> LORA_ADAPTER [pi/16, pi/6) -> SKILL_MD [pi/6, 3pi/8) -> CONVERSATION [3pi/8, pi/2].
 */
export const PROMOTION_REGIONS = {
  [PromotionLevel.CONVERSATION]: { thetaMin: Math.PI * 3 / 8, thetaMax: Math.PI / 2 },
  [PromotionLevel.SKILL_MD]: { thetaMin: Math.PI / 6, thetaMax: Math.PI * 3 / 8 },
  [PromotionLevel.LORA_ADAPTER]: { thetaMin: Math.PI / 16, thetaMax: Math.PI / 6 },
  [PromotionLevel.COMPILED]: { thetaMin: 0, thetaMax: Math.PI / 16 },
} as const;

// ============================================================================
// Zod schemas + inferred types
// ============================================================================

/**
 * Position of a skill on the complex plane.
 *
 * theta: angular position in radians [0, 2pi) -- abstraction axis.
 * radius: maturity [0, 1] -- how well the skill is established.
 * angularVelocity: rate of angular change per observation cycle.
 * lastUpdated: ISO 8601 timestamp of the most recent position update.
 */
export const SkillPositionSchema = z.object({
  theta: z.number(),
  radius: z.number().min(0).max(1),
  angularVelocity: z.number(),
  lastUpdated: z.string(),
});
export type SkillPosition = z.infer<typeof SkillPositionSchema>;

/**
 * Tangent-line context derived from a skill's angular position.
 *
 * slope: tangent slope -cot(theta) at the skill's position.
 * reach: sec(theta) clamped to MAX_REACH -- how far the tangent extends.
 * exsecant: sec(theta) - 1 -- excess reach beyond the unit circle.
 * versine: 1 - cos(theta) -- always [0, 2], measures groundedness.
 */
export const TangentContextSchema = z.object({
  slope: z.number(),
  reach: z.number(),
  exsecant: z.number(),
  versine: z.number(),
});
export type TangentContext = z.infer<typeof TangentContextSchema>;

/**
 * A skill matched via tangent-line proximity.
 *
 * Combines a skill's position with its tangent context and a
 * perpendicular distance metric for ranking relevance.
 */
export const TangentMatchSchema = z.object({
  skillId: z.string(),
  position: SkillPositionSchema,
  tangent: TangentContextSchema,
  tangentDistance: z.number().min(0),
  score: z.number().min(0),
});
export type TangentMatch = z.infer<typeof TangentMatchSchema>;

/**
 * A candidate chord connecting two skills on the complex plane.
 *
 * Chords represent potential skill compositions. The savings metric
 * (arcDistance - chordLength) quantifies the shortcut benefit of
 * composing two skills versus traversing the arc between them.
 */
export const ChordCandidateSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
  fromPosition: SkillPositionSchema,
  toPosition: SkillPositionSchema,
  arcDistance: z.number().min(0),
  chordLength: z.number().min(0),
  savings: z.number(),
  frequency: z.number().int().min(0),
});
export type ChordCandidate = z.infer<typeof ChordCandidateSchema>;

/**
 * A promotion decision for moving a skill between angular regions.
 *
 * Encapsulates the evidence, thresholds, and outcome of a promotion
 * evaluation. The versineGap and exsecantReach provide geometric
 * context for why promotion was approved or denied.
 */
export const PromotionDecisionSchema = z.object({
  skillId: z.string(),
  currentTheta: z.number(),
  targetTheta: z.number(),
  maxAngularStep: z.number(),
  requiredEvidence: z.number().int().min(0),
  versineGap: z.number(),
  exsecantReach: z.number(),
  approved: z.boolean(),
  reason: z.string(),
});
export type PromotionDecision = z.infer<typeof PromotionDecisionSchema>;

/**
 * A session observation recording angular signal data for pattern detection.
 *
 * Each observation captures one or more patterns with their concrete vs
 * abstract signal counts, enabling theta estimation (the ratio of abstract
 * to total signals determines angular position).
 */
export const AngularObservationSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string(),
  patterns: z.array(z.object({
    patternId: z.string(),
    concreteSignals: z.number().int().min(0),
    abstractSignals: z.number().int().min(0),
    estimatedTheta: z.number(),
    estimatedRadius: z.number().min(0).max(1),
  })),
});
export type AngularObservation = z.infer<typeof AngularObservationSchema>;

/**
 * Aggregate metrics for the entire complex plane.
 *
 * Provides a snapshot of the skill distribution across the plane,
 * including versine-based groundedness buckets, average exsecant reach,
 * angular velocity warnings, and pending chord composition candidates.
 */
export const PlaneMetricsSchema = z.object({
  totalSkills: z.number().int().min(0),
  versineDistribution: z.object({
    grounded: z.number().int().min(0),
    working: z.number().int().min(0),
    frontier: z.number().int().min(0),
  }),
  avgExsecant: z.number().min(0),
  angularVelocityWarnings: z.array(z.string()),
  chordCandidates: z.array(ChordCandidateSchema),
});
export type PlaneMetrics = z.infer<typeof PlaneMetricsSchema>;

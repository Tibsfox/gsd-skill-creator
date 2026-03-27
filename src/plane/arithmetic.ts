/**
 * Complex Plane Arithmetic Library -- pure mathematical functions.
 *
 * 19 exported functions for complex plane geometry: position creation,
 * tangent computation, Euler composition, chord/arc distance, versine/
 * exsecant utilities, promotion geometry, and aggregate metrics.
 *
 * All functions are pure, deterministic, and side-effect-free.
 * Zero dependencies on skill-creator internals.
 * Only import: ./types.js
 */

import {
  type SkillPosition,
  type TangentContext,
  type ChordCandidate,
  type PlaneMetrics,
  PromotionLevel,
  MAX_REACH,
  MIN_THETA,
  MAX_ANGULAR_VELOCITY,
  MATURITY_THRESHOLD,
  PROMOTION_REGIONS,
} from './types.js';

// ============================================================================
// Internal constants
// ============================================================================

/** Guard threshold for division-by-zero in trigonometric functions. */
const EPSILON = 1e-10;

/** Two pi, cached for readability. */
const TWO_PI = 2 * Math.PI;

// ============================================================================
// Position Creation & Normalization
// ============================================================================

/**
 * Create a new SkillPosition with normalized theta and clamped radius.
 *
 * @param theta - Angular position in radians (will be normalized to [0, 2pi))
 * @param radius - Maturity [0, 1] (clamped)
 * @param angularVelocity - Rate of angular change per observation cycle (default 0)
 */
export function createPosition(
  theta: number,
  radius: number,
  angularVelocity = 0,
): SkillPosition {
  return {
    theta: normalizeAngle(theta),
    radius: Math.max(0, Math.min(1, radius)),
    angularVelocity,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Normalize an angle to the range [0, 2pi).
 *
 * Handles negative angles, multiples of 2pi, and arbitrary values.
 */
export function normalizeAngle(theta: number): number {
  const normalized = ((theta % TWO_PI) + TWO_PI) % TWO_PI;
  return normalized;
}

/**
 * Estimate theta from concrete and abstract signal counts.
 *
 * Uses atan2(abstract, concrete) so pure concrete maps to 0
 * and pure abstract maps to pi/2.
 *
 * @param concreteSignals - Count of concrete (tool-use, file-edit) signals
 * @param abstractSignals - Count of abstract (reasoning, planning) signals
 */
export function estimateTheta(concreteSignals: number, abstractSignals: number): number {
  if (concreteSignals === 0 && abstractSignals === 0) return 0;
  return Math.atan2(abstractSignals, concreteSignals);
}

/**
 * Estimate radius from observation count relative to maturity threshold.
 *
 * @param observationCount - Number of observations recorded
 * @param threshold - Number of observations for full maturity (default MATURITY_THRESHOLD)
 */
export function estimateRadius(observationCount: number, threshold = MATURITY_THRESHOLD): number {
  return Math.min(1.0, Math.max(0, observationCount / threshold));
}

// ============================================================================
// Tangent Line Computation
// ============================================================================

/**
 * Compute the tangent context for a skill position.
 *
 * The tangent line at point (r*cos(theta), r*sin(theta)) on the circle
 * has slope -cos(theta)/sin(theta) = -cot(theta), and the secant reach
 * is 1/cos(theta).
 *
 * Division-by-zero guards:
 * - sin(theta) near 0: clamp slope to -(1/EPSILON)
 * - cos(theta) near 0: clamp reach to MAX_REACH
 */
export function computeTangent(position: SkillPosition): TangentContext {
  const { theta } = position;
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  // Slope: -cot(theta) = -cos(theta) / sin(theta)
  let slope: number;
  if (Math.abs(sinTheta) < EPSILON) {
    slope = cosTheta >= 0 ? -(1 / EPSILON) : (1 / EPSILON);
    // Clamp to finite range
    slope = Math.max(-MAX_REACH, Math.min(MAX_REACH, slope));
  } else {
    slope = -cosTheta / sinTheta;
  }

  // Reach: sec(theta) = 1 / cos(theta)
  let reach: number;
  if (Math.abs(cosTheta) < EPSILON) {
    reach = MAX_REACH;
  } else {
    reach = Math.abs(1 / cosTheta);
    reach = Math.min(reach, MAX_REACH);
  }

  // Versine: 1 - cos(theta) -- always [0, 2]
  const ver = 1 - cosTheta;

  // Exsecant: sec(theta) - 1 = reach - 1 (using the clamped reach)
  const exs = reach - 1;

  return {
    slope,
    reach,
    exsecant: exs,
    versine: ver,
  };
}

/**
 * Compute perpendicular distance from a task point to a skill's tangent line.
 *
 * The tangent line at (r*cos(theta), r*sin(theta)) has equation:
 *   cos(theta)*x + sin(theta)*y = r
 *
 * Since cos^2 + sin^2 = 1, the distance simplifies to:
 *   |cos(theta)*px + sin(theta)*py - r|
 *
 * @param taskPoint - Point in 2D with x, y coordinates
 * @param skillPosition - The skill whose tangent line to measure against
 */
export function pointToTangentDistance(
  taskPoint: { readonly x: number; readonly y: number },
  skillPosition: SkillPosition,
): number {
  const { theta, radius } = skillPosition;
  return Math.abs(
    Math.cos(theta) * taskPoint.x + Math.sin(theta) * taskPoint.y - radius,
  );
}

/**
 * Score how well a task point matches a skill based on tangent proximity.
 *
 * Higher radius and closer tangent distance produce higher scores.
 * Formula: radius / (1 + tangentDistance)
 */
export function computeTangentScore(
  taskPoint: { readonly x: number; readonly y: number },
  skillPosition: SkillPosition,
): number {
  const distance = pointToTangentDistance(taskPoint, skillPosition);
  return skillPosition.radius / (1 + distance);
}

// ============================================================================
// Euler Composition
// ============================================================================

/**
 * Compose two skill positions using Euler multiplication.
 *
 * Angles add (with normalization), radii multiply, angular velocities sum.
 */
export function composePositions(a: SkillPosition, b: SkillPosition): SkillPosition {
  return {
    theta: normalizeAngle(a.theta + b.theta),
    radius: Math.max(0, Math.min(1, a.radius * b.radius)),
    angularVelocity: a.angularVelocity + b.angularVelocity,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Euclidean distance between two positions in the complex plane.
 *
 * Converts polar to Cartesian, then computes |z_a - z_b|.
 */
export function complexDistance(a: SkillPosition, b: SkillPosition): number {
  const ax = a.radius * Math.cos(a.theta);
  const ay = a.radius * Math.sin(a.theta);
  const bx = b.radius * Math.cos(b.theta);
  const by = b.radius * Math.sin(b.theta);
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ============================================================================
// Chord & Arc
// ============================================================================

/**
 * Compute the shorter arc distance between two angular positions.
 *
 * Always returns a value in [0, pi] (the shorter arc).
 */
export function arcDistance(a: SkillPosition, b: SkillPosition): number {
  const diff = Math.abs(a.theta - b.theta);
  return diff > Math.PI ? TWO_PI - diff : diff;
}

/**
 * Compute chord length between two positions on the plane.
 *
 * Uses the average radius: chord = 2 * r_avg * sin(arc / 2).
 */
export function chordLength(a: SkillPosition, b: SkillPosition): number {
  const rAvg = (a.radius + b.radius) / 2;
  const arc = arcDistance(a, b);
  return 2 * rAvg * Math.sin(arc / 2);
}

/**
 * Evaluate whether two positions form a meaningful chord (composition shortcut).
 *
 * Returns a ChordCandidate if the chord saves arc distance AND the pair
 * has been co-activated at least 5 times. Returns null otherwise.
 *
 * @param a - First skill position
 * @param b - Second skill position
 * @param coActivationCount - Number of times these skills co-activated
 */
export function evaluateChord(
  a: SkillPosition,
  b: SkillPosition,
  coActivationCount: number,
): ChordCandidate | null {
  if (coActivationCount < 5) return null;

  const arc = arcDistance(a, b);
  const chord = chordLength(a, b);
  const savings = arc - chord;

  if (savings <= 0) return null;

  return {
    fromId: '',
    toId: '',
    fromPosition: a,
    toPosition: b,
    arcDistance: arc,
    chordLength: chord,
    savings,
    frequency: coActivationCount,
  };
}

// ============================================================================
// Versine & Exsecant
// ============================================================================

/**
 * Compute the versine of a skill position: 1 - cos(theta).
 *
 * Range: [0, 2]. Measures how "grounded" a skill is (low versine = grounded).
 */
export function versine(position: SkillPosition): number {
  return 1 - Math.cos(position.theta);
}

/**
 * Compute the exsecant of a skill position: sec(theta) - 1.
 *
 * Clamped to [0, MAX_REACH - 1] to prevent infinity near theta = pi/2.
 */
export function exsecant(position: SkillPosition): number {
  const cosTheta = Math.cos(position.theta);
  if (Math.abs(cosTheta) < EPSILON) {
    return MAX_REACH - 1;
  }
  return Math.min(Math.abs(1 / cosTheta) - 1, MAX_REACH - 1);
}

/**
 * Classify a skill by its versine into grounded/working/frontier buckets.
 *
 * - versine < 0.2: 'grounded' (concrete, tool-oriented)
 * - versine < 0.6: 'working' (balanced, skill-file level)
 * - versine >= 0.6: 'frontier' (abstract, exploratory)
 */
export function classifyByVersine(position: SkillPosition): 'grounded' | 'working' | 'frontier' {
  const v = versine(position);
  if (v < 0.2) return 'grounded';
  if (v < 0.6) return 'working';
  return 'frontier';
}

// ============================================================================
// Promotion Geometry
// ============================================================================

/**
 * Determine the promotion level for a skill based on its angular position.
 *
 * Checks PROMOTION_REGIONS in order from COMPILED (smallest theta) to
 * CONVERSATION. Returns CONVERSATION for any theta outside defined regions.
 */
export function getPromotionLevel(position: SkillPosition): PromotionLevel {
  const { theta } = position;

  // Check regions from most concrete (COMPILED) to most abstract (CONVERSATION)
  const orderedLevels = [
    PromotionLevel.COMPILED,
    PromotionLevel.LORA_ADAPTER,
    PromotionLevel.SKILL_MD,
    PromotionLevel.CONVERSATION,
  ] as const;

  for (const level of orderedLevels) {
    const region = PROMOTION_REGIONS[level];
    if (theta >= region.thetaMin && theta < region.thetaMax) {
      return level;
    }
  }

  // Default: anything outside defined regions is CONVERSATION
  return PromotionLevel.CONVERSATION;
}

/**
 * Compute a bounded angular step toward a target theta.
 *
 * The step is limited to maxVelocity * max(currentTheta, MIN_THETA),
 * implementing the 20% movement rule.
 *
 * @param currentTheta - Current angular position
 * @param targetTheta - Target angular position
 * @param maxVelocity - Maximum fractional velocity (default MAX_ANGULAR_VELOCITY = 0.2)
 */
export function computeAngularStep(
  currentTheta: number,
  targetTheta: number,
  maxVelocity: number = MAX_ANGULAR_VELOCITY,
): number {
  const step = targetTheta - currentTheta;
  const maxStep = maxVelocity * Math.max(currentTheta, MIN_THETA);

  if (Math.abs(step) > maxStep) {
    return step > 0 ? maxStep : -maxStep;
  }
  return step;
}

/**
 * Compute the required evidence count for a skill at its current position.
 *
 * Scales with exsecant: skills at higher theta (more abstract) need more
 * evidence. Minimum return value is 1.
 *
 * Formula: ceil(50 * exsecant(position)), minimum 1.
 */
export function requiredEvidence(position: SkillPosition): number {
  const exs = exsecant(position);
  const evidence = Math.ceil(50 * exs);
  return Math.max(1, evidence);
}

// ============================================================================
// Aggregate Metrics
// ============================================================================

/**
 * Compute aggregate metrics for the entire complex plane.
 *
 * Iterates all skill positions to compute versine distribution,
 * average exsecant, and angular velocity warnings.
 *
 * @param positions - Map of skill ID to SkillPosition
 * @param chords - Array of chord candidates to include in metrics
 */
export function computePlaneMetrics(
  positions: Map<string, SkillPosition>,
  chords: ChordCandidate[],
): PlaneMetrics {
  const distribution = { grounded: 0, working: 0, frontier: 0 };
  const warnings: string[] = [];
  let totalExsecant = 0;

  for (const [skillId, position] of positions) {
    // Classify by versine
    const classification = classifyByVersine(position);
    distribution[classification]++;

    // Accumulate exsecant
    totalExsecant += exsecant(position);

    // Check angular velocity
    if (Math.abs(position.angularVelocity) > MAX_ANGULAR_VELOCITY) {
      warnings.push(skillId);
    }
  }

  const totalSkills = positions.size;
  const avgExsecant = totalSkills > 0 ? totalExsecant / totalSkills : 0;

  return {
    totalSkills,
    versineDistribution: distribution,
    avgExsecant,
    angularVelocityWarnings: warnings,
    chordCandidates: chords,
  };
}

/**
 * Skill-Creator Bridge
 *
 * Maps Space Between foundations to the skill-creator complex plane.
 * Every foundation occupies a position (theta, r) on the plane, and
 * trigonometric functions compute activation, projections, arc lengths,
 * chords, and versines for learning analytics.
 */

import type { FoundationId, SkillCreatorMapping, LearnerState } from '@/types';
import { FOUNDATION_ORDER } from '@/types';
import { getFoundation } from '@/core/registry';

// ─── Single Mapping ──────────────────────────────────

/**
 * Return the skill-creator mapping for a given foundation.
 */
export function getMapping(id: FoundationId): SkillCreatorMapping {
  return getFoundation(id).skillCreatorAnalog;
}

/**
 * Return all 8 mappings keyed by foundation id.
 */
export function getAllMappings(): Map<FoundationId, SkillCreatorMapping> {
  const map = new Map<FoundationId, SkillCreatorMapping>();
  for (const id of FOUNDATION_ORDER) {
    map.set(id, getMapping(id));
  }
  return map;
}

/**
 * Return the complex plane position { theta, r } for a foundation.
 */
export function getComplexPlanePosition(id: FoundationId): { theta: number; r: number } {
  const mapping = getMapping(id);
  if (!mapping.complexPlanePosition) {
    throw new Error(`Foundation '${id}' has no complex plane position defined`);
  }
  return mapping.complexPlanePosition;
}

// ─── Complex Plane Computations ──────────────────────

/**
 * Activation = tan(theta) * r
 *
 * Measures how "activated" a foundation is — higher activation means
 * the concrete and abstract components are more strongly coupled.
 */
export function computeActivation(theta: number, r: number): number {
  return Math.tan(theta) * r;
}

/**
 * Concrete projection = sin(theta)
 *
 * How much of the foundation maps to concrete, hands-on understanding.
 */
export function computeConcreteProjection(theta: number): number {
  return Math.sin(theta);
}

/**
 * Abstract projection = cos(theta)
 *
 * How much of the foundation maps to abstract, theoretical understanding.
 */
export function computeAbstractProjection(theta: number): number {
  return Math.cos(theta);
}

/**
 * Arc length between two foundations on the complex plane.
 *
 * arc_length = |theta_to - theta_from| * average_r
 *
 * Measures the "distance traveled" along the circle between positions.
 */
export function computeArcLength(from: FoundationId, to: FoundationId): number {
  const posFrom = getComplexPlanePosition(from);
  const posTo = getComplexPlanePosition(to);
  const averageR = (posFrom.r + posTo.r) / 2;
  return Math.abs(posTo.theta - posFrom.theta) * averageR;
}

/**
 * Chord length between two foundations.
 *
 * chord = 2 * r * sin(|theta_to - theta_from| / 2)
 *
 * Uses the average r for the two positions.
 * Measures the "straight-line" distance between two positions on the circle.
 */
export function computeChord(a: FoundationId, b: FoundationId): number {
  const posA = getComplexPlanePosition(a);
  const posB = getComplexPlanePosition(b);
  const averageR = (posA.r + posB.r) / 2;
  return 2 * averageR * Math.sin(Math.abs(posB.theta - posA.theta) / 2);
}

/**
 * Versine for a learner's engagement with a foundation.
 *
 * versine = 1 - cos(completion_gap)
 *
 * completion_gap maps the fraction of incomplete phases (0 = fully complete,
 * pi = no phases complete) so versine ranges from 0 (fully engaged) to
 * 2 (no engagement).
 */
export function computeVersine(learnerState: LearnerState, id: FoundationId): number {
  const completed = learnerState.completedPhases[id] ?? [];
  const totalPhases = 6; // wonder, see, touch, understand, connect, create
  const incompleteFraction = 1 - completed.length / totalPhases;
  const completionGap = incompleteFraction * Math.PI;
  return 1 - Math.cos(completionGap);
}

/**
 * Export the full skill-creator configuration as a plain object.
 */
export function toSkillCreatorConfig(): Record<string, unknown> {
  const foundations: Record<string, unknown> = {};

  for (const id of FOUNDATION_ORDER) {
    const pos = getComplexPlanePosition(id);
    const mapping = getMapping(id);
    foundations[id] = {
      mathConcept: mapping.mathConcept,
      skillCreatorFunction: mapping.skillCreatorFunction,
      explanation: mapping.explanation,
      position: pos,
      activation: computeActivation(pos.theta, pos.r),
      concreteProjection: computeConcreteProjection(pos.theta),
      abstractProjection: computeAbstractProjection(pos.theta),
    };
  }

  return {
    version: '1.0.0',
    foundations,
    foundationOrder: [...FOUNDATION_ORDER],
  };
}

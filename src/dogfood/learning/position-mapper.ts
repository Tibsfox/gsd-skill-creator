/**
 * Position mapper — assigns complex plane coordinates (theta, radius)
 * based on part angular regions and progressive depth tracking.
 */

import type {
  LearnedConcept,
  PositionAssignment,
} from './types.js';
import { PART_ANGULAR_REGIONS, INITIAL_RADIUS, MAX_ANGULAR_VELOCITY } from './types.js';

/**
 * Assign a position on the complex plane for a newly detected concept.
 * Theta is based on the part's angular region with a small offset for
 * uniqueness within the part. Radius starts at INITIAL_RADIUS.
 */
export function assignPosition(
  concept: LearnedConcept,
  part: number,
): PositionAssignment {
  const baseTheta = PART_ANGULAR_REGIONS[part] ?? 0;
  // Small deterministic offset based on concept name hash
  const nameHash = hashString(concept.name);
  const offset = ((nameHash % 1000) / 1000) * (Math.PI / 16) - (Math.PI / 32);
  const theta = normalizeTheta(baseTheta + offset);

  return {
    theta,
    radius: INITIAL_RADIUS + concept.confidence * 0.05,
    angularVelocity: Math.min(concept.mathDensity * 0.15, MAX_ANGULAR_VELOCITY),
    abstractionLevel: concept.abstractionLevel,
  };
}

/**
 * Update an existing position when the same concept is re-encountered,
 * increasing radius to reflect progressive depth understanding.
 * Radius increases by 0.1 * newConfidence, clamped to 1.0.
 */
export function updatePositionForDepth(
  existing: PositionAssignment,
  newConfidence: number,
): PositionAssignment {
  const newRadius = Math.min(existing.radius + 0.1 * newConfidence, 1.0);
  const newVelocity = Math.min(
    existing.angularVelocity + 0.02 * newConfidence,
    MAX_ANGULAR_VELOCITY,
  );

  return {
    theta: existing.theta,
    radius: newRadius,
    angularVelocity: newVelocity,
    abstractionLevel: existing.abstractionLevel,
  };
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeTheta(theta: number): number {
  const TWO_PI = 2 * Math.PI;
  return ((theta % TWO_PI) + TWO_PI) % TWO_PI;
}

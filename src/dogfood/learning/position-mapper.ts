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
 *
 * - Theta is based on the part's angular region, adjusted by up to +/- pi/16
 *   based on the concept's abstractionLevel.
 * - Radius starts at INITIAL_RADIUS (0.1).
 * - Angular velocity is 0 for first detection.
 * - abstractionLevel = theta / (2 * PI), clamped to [0, 1].
 */
export function assignPosition(
  concept: LearnedConcept,
  part: number,
): PositionAssignment {
  const baseTheta = PART_ANGULAR_REGIONS[part] ?? 0;

  // Adjust theta by up to +/- pi/16 based on abstraction level
  // More abstract = slightly higher theta within the part range
  const abstractionOffset = (concept.abstractionLevel - 0.5) * (Math.PI / 16);
  const theta = Math.max(0, baseTheta + abstractionOffset);

  // Compute abstractionLevel from final theta
  const abstractionLevel = Math.min(1, Math.max(0, theta / (2 * Math.PI)));

  return {
    theta,
    radius: INITIAL_RADIUS,
    angularVelocity: 0,
    abstractionLevel,
  };
}

/**
 * Update an existing position when the same concept is re-encountered,
 * increasing radius to reflect progressive depth understanding.
 *
 * - Radius increases by 0.1 * newConfidence, clamped to max 1.0.
 * - Angular velocity is the change rate, clamped to MAX_ANGULAR_VELOCITY (0.2).
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

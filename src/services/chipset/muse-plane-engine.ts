/**
 * Complex plane engine for muse activation scoring.
 *
 * Positions muses on the complex plane, computes distances, and uses
 * activation scoring to determine which muses should activate for a given context.
 *
 * Scoring formula:
 *   αp = 1 - |θm - θc| / π       (angular proximity)
 *   mw = 1 - |rm - rc|            (magnitude weight)
 *   score = αp × 0.7 + mw × 0.3  (weighted composite)
 *
 * Special cases:
 *   Cedar (r=0, origin): score = 0.5 constant
 *   Direct invocation: score = 1.0
 */

import type { MuseId } from './muse-schema-validator.js';
import type { MusePlanePosition, MuseDistance, MuseActivation, CartesianPosition } from './muse-plane-types.js';

export class MusePlaneEngine {
  toCartesian(pos: MusePlanePosition): CartesianPosition {
    return {
      real: pos.magnitude * Math.cos(pos.angle),
      imaginary: pos.magnitude * Math.sin(pos.angle),
    };
  }

  toPolar(pos: CartesianPosition): MusePlanePosition {
    const magnitude = Math.sqrt(pos.real ** 2 + pos.imaginary ** 2);
    const rawAngle = Math.atan2(pos.imaginary, pos.real);
    return {
      angle: rawAngle < 0 ? rawAngle + 2 * Math.PI : rawAngle,
      magnitude,
    };
  }

  distance(a: MusePlanePosition, b: MusePlanePosition): number {
    const ac = this.toCartesian(a);
    const bc = this.toCartesian(b);
    return Math.sqrt((ac.real - bc.real) ** 2 + (ac.imaginary - bc.imaginary) ** 2);
  }

  angularDistance(a: MusePlanePosition, b: MusePlanePosition): number {
    const diff = Math.abs(a.angle - b.angle);
    return diff > Math.PI ? 2 * Math.PI - diff : diff;
  }

  findComplementary(muse: MusePlanePosition, museId: MuseId, others: Map<MuseId, MusePlanePosition>): MuseDistance[] {
    const result: MuseDistance[] = [];
    for (const [id, pos] of others) {
      if (id === museId) continue;
      const dist = this.distance(muse, pos);
      const angDist = this.angularDistance(muse, pos);
      result.push({
        museId: id,
        distance: dist,
        angularDistance: angDist,
        isComplementary: angDist > Math.PI / 3,
      });
    }
    return result.filter(d => d.isComplementary);
  }

  activationScore(muse: MusePlanePosition, context: CartesianPosition, options?: { directInvocation?: boolean }): number {
    if (options?.directInvocation) return 1.0;
    if (muse.magnitude === 0) return 0.5;

    const contextPolar = this.toPolar(context);
    const angularProximity = 1 - this.angularDistance(muse, contextPolar) / Math.PI;
    const magnitudeWeight = 1 - Math.abs(muse.magnitude - contextPolar.magnitude);
    return Math.max(0, Math.min(1, angularProximity * 0.7 + magnitudeWeight * 0.3));
  }

  rankForContext(muses: Map<MuseId, MusePlanePosition>, context: CartesianPosition): MuseActivation[] {
    const activations: MuseActivation[] = [];
    for (const [id, pos] of muses) {
      const score = this.activationScore(pos, context);
      activations.push({
        museId: id,
        score,
        reason: `activation for context (${context.real.toFixed(2)}, ${context.imaginary.toFixed(2)})`,
      });
    }
    return activations.sort((a, b) => b.score - a.score);
  }
}

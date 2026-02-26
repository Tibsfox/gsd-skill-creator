/**
 * ObserverAngularBridge -- connects SessionObserver output to angular measurement.
 *
 * Processes session signals into AngularObservation records, updates existing
 * skill positions with velocity-bounded weighted averaging, and assigns
 * initial positions to newly suggested skills.
 *
 * This bridge is the integration layer between skill-creator's existing
 * observation pipeline and the Complex Plane framework. Every new skill is
 * "born" with a complex plane position from the moment it's observed.
 *
 * Fault isolation (OBSERVE-06): All public methods catch errors internally
 * and return null rather than throwing to callers.
 */

import type { SkillPosition, AngularObservation } from './types.js';
import { MAX_ANGULAR_VELOCITY, MATURITY_THRESHOLD } from './types.js';
import { createPosition, estimateRadius, normalizeAngle } from './arithmetic.js';
import { classifySignals } from './signal-classification.js';
import type { ObservationSignal } from './signal-classification.js';
import type { PositionStore } from './position-store.js';

// ============================================================================
// Types
// ============================================================================

/** A group of signals associated with a detected pattern. */
export interface PatternGroup {
  patternId: string;
  signals: ObservationSignal[];
  /** How many times the pattern has been observed (default 1). */
  repetitionCount?: number;
}

// ============================================================================
// ObserverAngularBridge
// ============================================================================

/**
 * Bridge between session observation output and the complex plane positioning system.
 *
 * Converts raw session patterns into geometric positions. Uses weighted
 * averaging to update positions (high-radius skills resist movement).
 * Angular velocity is clamped to MAX_ANGULAR_VELOCITY on every update.
 */
export class ObserverAngularBridge {
  private readonly positionStore: PositionStore;

  constructor(positionStore: PositionStore) {
    this.positionStore = positionStore;
  }

  /**
   * Process a session's pattern groups into an AngularObservation.
   *
   * Each PatternGroup is classified independently, producing per-pattern
   * theta/radius estimates. Does not modify the position store.
   *
   * @param sessionId - Unique session identifier
   * @param patternGroups - Grouped signals from session observation
   * @returns AngularObservation, or null on error (OBSERVE-06)
   */
  processSession(
    sessionId: string,
    patternGroups: PatternGroup[],
  ): AngularObservation | null {
    try {
      const groups = patternGroups ?? [];

      const patterns = groups.map((group) => {
        const classification = classifySignals(group.signals);
        return {
          patternId: group.patternId,
          concreteSignals: classification.totalConcrete,
          abstractSignals: classification.totalAbstract,
          estimatedTheta: classification.theta,
          estimatedRadius: estimateRadius(
            group.repetitionCount ?? 1,
            MATURITY_THRESHOLD,
          ),
        };
      });

      return {
        sessionId,
        timestamp: new Date().toISOString(),
        patterns,
      };
    } catch {
      return null;
    }
  }

  /**
   * Update a skill's position based on an angular observation.
   *
   * For new skills, creates a position from the observation.
   * For existing skills, computes a weighted average where higher-radius
   * skills resist movement (inertia). Angular velocity is clamped to
   * MAX_ANGULAR_VELOCITY on every update.
   *
   * @param skillId - The skill to update
   * @param observation - Angular observation from processSession
   * @returns Updated SkillPosition, or null on error/empty observation (OBSERVE-06)
   */
  async updatePosition(
    skillId: string,
    observation: AngularObservation,
  ): Promise<SkillPosition | null> {
    try {
      if (!observation?.patterns?.length) {
        return null;
      }

      // Aggregate theta and radius from all patterns
      const { observedTheta, observedRadius } =
        this.aggregateObservation(observation);

      const existing = this.positionStore.get(skillId);

      if (!existing) {
        // New skill: create position directly from observation
        const newPosition = createPosition(observedTheta, observedRadius, 0);
        this.positionStore.set(skillId, newPosition);
        await this.positionStore.save();
        return newPosition;
      }

      // Existing skill: weighted average with inertia
      const totalWeight = existing.radius + observedRadius;
      let newTheta: number;

      if (totalWeight === 0) {
        newTheta = observedTheta;
      } else {
        newTheta =
          (existing.radius * existing.theta +
            observedRadius * observedTheta) /
          totalWeight;
      }

      // Compute angular velocity
      let angVel = Math.abs(newTheta - existing.theta);

      // Velocity clamping (OBSERVE-05)
      if (angVel > MAX_ANGULAR_VELOCITY) {
        const clampedStep =
          MAX_ANGULAR_VELOCITY * Math.sign(newTheta - existing.theta);
        newTheta = normalizeAngle(existing.theta + clampedStep);
        angVel = MAX_ANGULAR_VELOCITY;
      }

      // Radius growth: small increment per observation, capped at 1.0
      const newRadius = Math.min(1.0, existing.radius + 0.01);

      const updatedPosition = createPosition(newTheta, newRadius, angVel);
      this.positionStore.set(skillId, updatedPosition);
      await this.positionStore.save();

      return updatedPosition;
    } catch {
      return null;
    }
  }

  /**
   * Assign an initial position for a newly discovered pattern.
   *
   * Pure function -- does not persist. The caller is responsible for
   * saving via the position store.
   *
   * @param patternGroup - The pattern to position
   * @returns A fresh SkillPosition with angularVelocity=0
   */
  assignInitialPosition(patternGroup: PatternGroup): SkillPosition {
    const classification = classifySignals(patternGroup.signals);
    const theta = classification.theta;
    const radius = estimateRadius(
      patternGroup.repetitionCount ?? 1,
      MATURITY_THRESHOLD,
    );

    return createPosition(theta, radius, 0);
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  /**
   * Aggregate theta and radius from all patterns in an observation.
   *
   * Theta is a radius-weighted average (stronger signals have more influence).
   * Radius is the maximum across all patterns (take strongest signal).
   */
  private aggregateObservation(observation: AngularObservation): {
    observedTheta: number;
    observedRadius: number;
  } {
    const patterns = observation.patterns;

    const totalRadiusWeight = patterns.reduce(
      (sum, p) => sum + p.estimatedRadius,
      0,
    );

    let observedTheta: number;
    if (totalRadiusWeight === 0) {
      // Simple average if no radius weight
      observedTheta =
        patterns.reduce((sum, p) => sum + p.estimatedTheta, 0) /
        patterns.length;
    } else {
      observedTheta =
        patterns.reduce(
          (sum, p) => sum + p.estimatedTheta * p.estimatedRadius,
          0,
        ) / totalRadiusWeight;
    }

    const observedRadius = Math.max(
      ...patterns.map((p) => p.estimatedRadius),
    );

    return { observedTheta, observedRadius };
  }
}

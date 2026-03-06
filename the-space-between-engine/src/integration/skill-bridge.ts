// Skill-Creator Bridge — Maps each mathematical foundation to its analog in
// gsd-skill-creator's architecture. All trig computations use the complex plane
// model: each foundation lives at (theta, r) and the trig functions on that
// position have operational meaning in the skill-creator ecosystem.

import type {
  FoundationId,
  LearnerState,
  SkillCreatorMapping,
} from '../types/index';

import { FOUNDATION_ORDER, PHASE_ORDER } from '../types/index';
import { getFoundation, getSkillCreatorMapping } from '../core/registry';

// ─── SkillCreatorBridge ─────────────────────────────────────

export class SkillCreatorBridge {

  // ── Per-Foundation Mappings ─────────────────────────────

  /**
   * Returns the SkillCreatorMapping for a single foundation.
   */
  getMapping(id: FoundationId): SkillCreatorMapping {
    return getSkillCreatorMapping(id);
  }

  /**
   * Returns all 8 foundation mappings keyed by FoundationId.
   */
  getAllMappings(): Map<FoundationId, SkillCreatorMapping> {
    const map = new Map<FoundationId, SkillCreatorMapping>();
    for (const id of FOUNDATION_ORDER) {
      map.set(id, this.getMapping(id));
    }
    return map;
  }

  // ── Complex Plane Operations ───────────────────────────

  /**
   * Returns the (theta, r) position for a foundation on the complex plane.
   * Falls back to (0, 1) if the mapping lacks a position (should not happen
   * for the canonical 8 foundations).
   */
  getComplexPlanePosition(id: FoundationId): { theta: number; r: number } {
    const mapping = this.getMapping(id);
    if (mapping.complexPlanePosition) {
      return { ...mapping.complexPlanePosition };
    }
    return { theta: 0, r: 1.0 };
  }

  /**
   * Activation = tan(theta) x r.
   * Measures how "activated" a skill is given its abstract/concrete position
   * and maturity. Near theta=PI/2 or 3PI/2, activation spikes (pure-concrete
   * or pure-abstract extremes). Near theta=0 or PI, activation is moderate.
   */
  computeActivation(theta: number, r: number): number {
    return Math.tan(theta) * r;
  }

  /**
   * Concrete projection = sin(theta).
   * How much of the skill is hands-on/concrete.
   */
  computeConcreteProjection(theta: number): number {
    return Math.sin(theta);
  }

  /**
   * Abstract projection = cos(theta).
   * How much of the skill is conceptual/theoretical.
   */
  computeAbstractProjection(theta: number): number {
    return Math.cos(theta);
  }

  // ── Learning Path Computation ──────────────────────────

  /**
   * Arc length between two foundations on the complex plane.
   * arc = |theta2 - theta1| x r_bar, where r_bar = (r1 + r2) / 2.
   * Measures the "long way around" through the prerequisite chain.
   */
  computeArcLength(from: FoundationId, to: FoundationId): number {
    const posFrom = this.getComplexPlanePosition(from);
    const posTo = this.getComplexPlanePosition(to);
    const rBar = (posFrom.r + posTo.r) / 2;
    const deltaTheta = Math.abs(posTo.theta - posFrom.theta);
    return deltaTheta * rBar;
  }

  /**
   * Chord between two foundations on the complex plane.
   * chord = 2 x r_bar x sin(|theta2 - theta1| / 2).
   * The straight-line distance — a shortcut that skips prerequisites.
   */
  computeChord(a: FoundationId, b: FoundationId): number {
    const posA = this.getComplexPlanePosition(a);
    const posB = this.getComplexPlanePosition(b);
    const rBar = (posA.r + posB.r) / 2;
    const deltaTheta = Math.abs(posB.theta - posA.theta);
    return 2 * rBar * Math.sin(deltaTheta / 2);
  }

  /**
   * Versine gap analysis for a learner's progress through a foundation.
   *
   * theta = 2*PI * (completedPhases / totalPhases)
   * gap = (1 - cos(theta)) / 2
   *
   * At 0 phases complete:  gap = (1 - cos(0)) / 2       = 0   (no expectation, no gap)
   * At 3/6 phases (halfway): gap = (1 - cos(PI)) / 2    = 1.0 (maximum tension)
   * At 6/6 phases (complete): gap = (1 - cos(2*PI)) / 2 = 0   (full circle, no gap)
   *
   * Returns 0-1 normalized.
   */
  computeVersine(learnerState: LearnerState, id: FoundationId): number {
    const completed = learnerState.completedPhases[id] ?? [];
    const totalPhases = PHASE_ORDER.length; // 6
    const completedCount = completed.length;
    const theta = 2 * Math.PI * (completedCount / totalPhases);
    return (1 - Math.cos(theta)) / 2;
  }

  // ── Integration Export ─────────────────────────────────

  /**
   * Generates a chipset-compatible configuration object containing all 8
   * foundation mappings with their complex plane positions, trig projections,
   * and skill-creator function analogs.
   */
  toSkillCreatorConfig(): object {
    const mappings: Record<string, object> = {};

    for (const id of FOUNDATION_ORDER) {
      const mapping = this.getMapping(id);
      const pos = this.getComplexPlanePosition(id);
      const foundation = getFoundation(id);

      mappings[id] = {
        foundation: foundation.name,
        order: foundation.order,
        mathConcept: mapping.mathConcept,
        skillCreatorFunction: mapping.skillCreatorFunction,
        explanation: mapping.explanation,
        codeParallel: mapping.codeParallel ?? null,
        complexPlane: {
          theta: pos.theta,
          r: pos.r,
          concreteProjection: this.computeConcreteProjection(pos.theta),
          abstractProjection: this.computeAbstractProjection(pos.theta),
        },
      };
    }

    return {
      type: 'space-between-bridge',
      version: '1.0.0',
      description: 'Skill-Creator Bridge — maps 8 mathematical foundations to gsd-skill-creator functions via the complex plane',
      foundations: mappings,
    };
  }
}

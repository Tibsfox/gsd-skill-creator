/**
 * JP-036 — Co-occurrence-MIQP cartridge bundling.
 *
 * Uses the JP-016 CoOccurrenceMatrix and the JP-017 MIQP+CP scheduler to emit
 * co-occurrence-aware cartridge bundles. Skills that co-occur frequently are
 * grouped into the same bundle slot to reduce cold-start latency and improve
 * cache locality.
 *
 * Anti-pattern guard: co-occurrence data is ALWAYS read via the JP-016 schema
 * types — never via direct trace-event reads. The scheduler output is the
 * canonical grouping source for bundle construction.
 *
 * Anchor: arXiv:2604.21029 (RL-MPC + co-occurrence + MIQP packing).
 *
 * Phase 838, Wave 3 (JP-036).
 *
 * @module cartridge/co-occurrence-bundle
 */

import type { CoOccurrenceMatrix } from '../traces/co-occurrence-schema.js';
import {
  schedule,
  buildFormulation,
  type MiqpSchedulerInput,
  type MiqpSchedulerOutput,
} from '../orchestration/miqp-cp-scheduler.js';

// ─── Bundle types ──────────────────────────────────────────────────────────────

/**
 * A skill entry inside a co-occurrence bundle slot.
 */
export interface BundledSkill {
  /** The skill's opaque identifier (matches CoOccurrenceMatrix skillId). */
  skillId: string;
  /**
   * The relative load priority within this slot.
   * Higher values load first. Derived from the inverse of scheduler cost.
   */
  loadPriority: number;
}

/**
 * A single bundle slot: a group of skills that should be pre-loaded together.
 */
export interface BundleSlot {
  /** Opaque slot identifier (matches the MIQP machine id). */
  slotId: string;
  /** Skills assigned to this slot, ordered by descending loadPriority. */
  skills: BundledSkill[];
  /**
   * Aggregate affinity reward for this slot — sum of co-occurrence rewards
   * among co-located skills. Higher = stronger co-occurrence justification.
   */
  coOccurrenceScore: number;
}

/**
 * The emitted co-occurrence-aware cartridge bundle.
 */
export interface CoOccurrenceBundle {
  /** Slots ordered by descending coOccurrenceScore. */
  slots: BundleSlot[];
  /** Total objective value from the MIQP solver (lower = better packing). */
  schedulerObjective: number;
  /** Whether the MIQP solution is provably optimal. */
  optimal: boolean;
  /**
   * The raw MIQP scheduler output for downstream consumers that need the
   * full assignment detail (e.g. cost-per-job breakdown).
   */
  schedulerOutput: MiqpSchedulerOutput;
}

// ─── Bundle options ────────────────────────────────────────────────────────────

/**
 * Options controlling bundle emission.
 */
export interface CoOccurrenceBundleOptions {
  /**
   * Maximum number of bundle slots (machines in MIQP terms).
   * Defaults to 2.
   */
  maxSlots?: number;
  /**
   * Maximum skills per slot (machine capacity in MIQP terms).
   * Defaults to the total number of skills (unconstrained).
   */
  maxSkillsPerSlot?: number;
  /**
   * λ — affinity weight passed to the MIQP scheduler.
   * Defaults to 1.0.
   */
  affinityWeight?: number;
  /**
   * Base cost to assign when a skill has no explicit cost signal.
   * Defaults to 1.0. All skills in the same slot share the same base cost
   * unless overridden via `skillCosts`.
   */
  defaultBaseCost?: number;
  /**
   * Optional per-skill base cost overrides. Key = skillId, value = cost
   * vector (one entry per slot). If omitted, `defaultBaseCost` is used for
   * all slot positions.
   */
  skillCosts?: Record<string, number[]>;
}

// ─── Co-occurrence score per slot helper ──────────────────────────────────────

/**
 * Compute the aggregate co-occurrence score for a group of skill ids on the
 * same slot. Sums affinityMatrix values for all within-slot pairs (once each).
 */
function slotCoOccurrenceScore(
  skillIds: string[],
  affinityMatrix: number[][],
  jobIndex: Map<string, number>,
): number {
  let score = 0;
  for (let i = 0; i < skillIds.length; i++) {
    for (let j = i + 1; j < skillIds.length; j++) {
      const ia = jobIndex.get(skillIds[i]);
      const ib = jobIndex.get(skillIds[j]);
      if (ia !== undefined && ib !== undefined) {
        score += affinityMatrix[ia][ib];
      }
    }
  }
  return score;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a co-occurrence-aware cartridge bundle from a set of skill ids and a
 * co-occurrence matrix.
 *
 * Steps:
 *   1. Construct the MIQP scheduler input from skillIds + coOccurrence.
 *   2. Run the JP-017 scheduler to get optimal group assignments.
 *   3. Emit BundleSlot objects with per-slot co-occurrence scores.
 *
 * @param skillIds   Ordered list of skill ids to bundle (must be non-empty).
 * @param coOccurrence  JP-016 co-occurrence matrix.
 * @param options    Optional tuning knobs.
 */
export function buildCoOccurrenceBundle(
  skillIds: string[],
  coOccurrence: CoOccurrenceMatrix,
  options: CoOccurrenceBundleOptions = {},
): CoOccurrenceBundle {
  if (skillIds.length === 0) {
    throw new Error('skillIds must contain at least one skill');
  }

  const maxSlots = options.maxSlots ?? 2;
  const maxSkillsPerSlot =
    options.maxSkillsPerSlot ?? Math.ceil(skillIds.length / maxSlots) + 1;
  const affinityWeight = options.affinityWeight ?? 1.0;
  const defaultBaseCost = options.defaultBaseCost ?? 1.0;

  // Build MIQP jobs — one per skill
  const jobs: MiqpSchedulerInput['jobs'] = skillIds.map((id) => {
    const costs =
      options.skillCosts?.[id] ??
      new Array<number>(maxSlots).fill(defaultBaseCost);
    if (costs.length !== maxSlots) {
      throw new Error(
        `Skill "${id}" has ${costs.length} cost entries but maxSlots=${maxSlots}`,
      );
    }
    return { id, baseCost: costs };
  });

  // Build MIQP machines — one per slot
  const machines: MiqpSchedulerInput['machines'] = Array.from(
    { length: maxSlots },
    (_, i) => ({ id: `bundle-slot-${i}`, capacity: maxSkillsPerSlot }),
  );

  const schedulerInput: MiqpSchedulerInput = {
    jobs,
    machines,
    coOccurrence,
    affinityWeight,
  };

  const schedulerOutput = schedule(schedulerInput);

  // Build a job-index map for co-occurrence score computation
  const jobIndex = new Map<string, number>(skillIds.map((id, i) => [id, i]));

  // Build affinity matrix (reuse the formulation helper)
  const formulation = buildFormulation(schedulerInput);

  // Group assignments by slot
  const slotMap = new Map<string, string[]>();
  for (const assignment of schedulerOutput.assignments) {
    const list = slotMap.get(assignment.machineId) ?? [];
    list.push(assignment.jobId);
    slotMap.set(assignment.machineId, list);
  }

  // Build BundleSlot list
  const slots: BundleSlot[] = [];
  for (const [slotId, slotSkillIds] of slotMap.entries()) {
    const coScore = slotCoOccurrenceScore(
      slotSkillIds,
      formulation.affinityMatrix,
      jobIndex,
    );

    // loadPriority = inverse of first-machine base cost (higher cost → lower priority)
    const skills: BundledSkill[] = slotSkillIds.map((sid) => {
      const assignment = schedulerOutput.assignments.find(
        (a) => a.jobId === sid,
      )!;
      const loadPriority =
        assignment.cost > 0 ? 1 / assignment.cost : Number.MAX_SAFE_INTEGER;
      return { skillId: sid, loadPriority };
    });

    // Sort by descending loadPriority
    skills.sort((a, b) => b.loadPriority - a.loadPriority);

    slots.push({ slotId, skills, coOccurrenceScore: coScore });
  }

  // Sort slots by descending coOccurrenceScore
  slots.sort((a, b) => b.coOccurrenceScore - a.coOccurrenceScore);

  return {
    slots,
    schedulerObjective: schedulerOutput.objectiveValue,
    optimal: schedulerOutput.optimal,
    schedulerOutput,
  };
}

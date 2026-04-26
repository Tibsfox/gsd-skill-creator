/**
 * JP-017 — MIQP+CP scheduler skeleton (resource-aware mission scheduling).
 *
 * Consumes the JP-016 CoOccurrenceMatrix to build a Mixed-Integer Quadratic
 * Program (MIQP) formulation for scheduling skills (jobs) onto execution slots
 * (machines). The co-occurrence probability is used as an affinity weight: a
 * higher co-occurrence probability for a pair reduces the cost of placing both
 * skills in the same bundle slot.
 *
 * Formulation (MIQP sketch):
 *   Variables:  x[j][m] ∈ {0,1}  — assign job j to machine m
 *   Objective:  min Σ_j cost[j][m] * x[j][m]
 *                 − λ Σ_(a,b) p(a,b) * Σ_m x[a][m] * x[b][m]   (affinity reward)
 *   Constraints:
 *     (C1) Σ_m x[j][m] = 1          — each job assigned to exactly one machine
 *     (C2) Σ_j x[j][m] ≤ cap[m]     — machine capacity
 *
 * For the skeleton we implement a small-instance exact solver via exhaustive
 * branch-and-bound (B&B). The anti-pattern spec explicitly says NOT to ship a
 * heavyweight solver; the 3-job × 2-machine test instance is the acceptance
 * target (arXiv:2604.21029 §4).
 *
 * Anchor: arXiv:2604.21029 (RL-MPC + co-occurrence + MIQP).
 *
 * Phase 838, Wave 3 (JP-017).
 *
 * @module orchestration/miqp-cp-scheduler
 */

import type { CoOccurrenceMatrix } from '../traces/co-occurrence-schema.js';

// ─── Input/output types ────────────────────────────────────────────────────────

/**
 * A job represents a skill that must be assigned to a machine (execution slot).
 */
export interface SchedulerJob {
  /** Unique job / skill identifier. */
  id: string;
  /** Base cost vector — cost[m] is the cost of placing this job on machine m. */
  baseCost: number[];
}

/**
 * A machine represents an execution slot with a maximum job capacity.
 */
export interface SchedulerMachine {
  /** Unique machine / slot identifier. */
  id: string;
  /** Maximum number of jobs this machine can hold simultaneously. */
  capacity: number;
}

/**
 * Input to the MIQP+CP scheduler.
 */
export interface MiqpSchedulerInput {
  jobs: SchedulerJob[];
  machines: SchedulerMachine[];
  /**
   * Co-occurrence matrix from JP-016. Used to derive pairwise affinity
   * rewards: pairs with high co-occurrence probability are rewarded for
   * co-placement on the same machine.
   */
  coOccurrence: CoOccurrenceMatrix;
  /**
   * λ — affinity weight that trades off base cost reduction vs. co-occurrence
   * reward. Default: 1.0.
   */
  affinityWeight?: number;
}

/**
 * One job→machine assignment in the solution.
 */
export interface JobAssignment {
  jobId: string;
  machineId: string;
  /** Effective cost for this assignment (base cost component only). */
  cost: number;
}

/**
 * Output from the MIQP+CP scheduler.
 */
export interface MiqpSchedulerOutput {
  assignments: JobAssignment[];
  /** Total objective value (lower is better). */
  objectiveValue: number;
  /** Affinity reward component (subtracted from base cost sum). */
  affinityReward: number;
  /** Whether the solution is provably optimal for the given instance. */
  optimal: boolean;
}

// ─── MIQP formulation builder ─────────────────────────────────────────────────

/**
 * The intermediate MIQP formulation produced before solving.
 * Callers can inspect this for debugging or pass it to an external solver.
 */
export interface MiqpFormulation {
  /** Number of jobs. */
  numJobs: number;
  /** Number of machines. */
  numMachines: number;
  /**
   * Cost matrix [numJobs][numMachines].
   * costMatrix[j][m] = baseCost of job j on machine m.
   */
  costMatrix: number[][];
  /**
   * Affinity matrix [numJobs][numJobs].
   * affinityMatrix[a][b] = λ * P(a,b) co-occurrence probability.
   * Symmetric; diagonal is 0.
   */
  affinityMatrix: number[][];
  /** Machine capacities indexed by machine position. */
  capacities: number[];
  /** Job ids in row order. */
  jobIds: string[];
  /** Machine ids in column order. */
  machineIds: string[];
}

/**
 * Build the MIQP formulation from the scheduler input.
 * Does NOT solve — returns the problem structure only.
 */
export function buildFormulation(input: MiqpSchedulerInput): MiqpFormulation {
  const { jobs, machines, coOccurrence } = input;
  const lambda = input.affinityWeight ?? 1.0;

  const numJobs = jobs.length;
  const numMachines = machines.length;

  // Cost matrix
  const costMatrix: number[][] = jobs.map((job) => {
    if (job.baseCost.length !== numMachines) {
      throw new Error(
        `Job "${job.id}" has ${job.baseCost.length} base costs but there are ${numMachines} machines`,
      );
    }
    return [...job.baseCost];
  });

  // Build job-id → index map for affinity lookup
  const jobIndex = new Map<string, number>(jobs.map((j, i) => [j.id, i]));

  // Affinity matrix — start at zero, fill from co-occurrence pairs
  const affinityMatrix: number[][] = Array.from({ length: numJobs }, () =>
    new Array<number>(numJobs).fill(0),
  );

  for (const pair of coOccurrence.pairs) {
    const ia = jobIndex.get(pair.event_a.skillId);
    const ib = jobIndex.get(pair.event_b.skillId);
    if (ia !== undefined && ib !== undefined && ia !== ib) {
      const weight = lambda * pair.probability;
      // Symmetric: reward same-machine placement for both (a→b) and (b→a)
      affinityMatrix[ia][ib] = Math.max(affinityMatrix[ia][ib], weight);
      affinityMatrix[ib][ia] = Math.max(affinityMatrix[ib][ia], weight);
    }
  }

  return {
    numJobs,
    numMachines,
    costMatrix,
    affinityMatrix,
    capacities: machines.map((m) => m.capacity),
    jobIds: jobs.map((j) => j.id),
    machineIds: machines.map((m) => m.id),
  };
}

// ─── Small-instance B&B solver ────────────────────────────────────────────────

/**
 * Compute the objective value for a given assignment vector.
 *
 * @param assign assign[j] = machine index for job j
 */
function computeObjective(
  assign: number[],
  formulation: MiqpFormulation,
): number {
  const { numJobs, costMatrix, affinityMatrix } = formulation;

  // Base cost sum
  let baseCost = 0;
  for (let j = 0; j < numJobs; j++) {
    baseCost += costMatrix[j][assign[j]];
  }

  // Affinity reward: for each pair (a, b) on the same machine, subtract
  // affinityMatrix[a][b] once (avoid double-counting with a < b).
  let reward = 0;
  for (let a = 0; a < numJobs; a++) {
    for (let b = a + 1; b < numJobs; b++) {
      if (assign[a] === assign[b]) {
        reward += affinityMatrix[a][b];
      }
    }
  }

  return baseCost - reward;
}

/**
 * Check capacity constraints for a partial/complete assignment.
 * Returns false if any machine exceeds its capacity.
 */
function capacityFeasible(assign: number[], formulation: MiqpFormulation): boolean {
  const counts = new Array<number>(formulation.numMachines).fill(0);
  for (const m of assign) {
    counts[m]++;
    if (counts[m] > formulation.capacities[m]) return false;
  }
  return true;
}

/**
 * Exact branch-and-bound solver for the MIQP formulation.
 * Suitable for small instances (≤ ~10 jobs × ≤ ~5 machines).
 * Returns the globally optimal assignment.
 */
export function solveExact(formulation: MiqpFormulation): MiqpSchedulerOutput {
  const { numJobs, numMachines, jobIds, machineIds, costMatrix, affinityMatrix } =
    formulation;

  let bestAssign: number[] | null = null;
  let bestObj = Infinity;

  // Iterative DFS via explicit stack to avoid recursion limits
  // Stack frame: current partial assignment (length ≤ numJobs)
  const stack: number[][] = [[]];

  while (stack.length > 0) {
    const partial = stack.pop()!;
    const depth = partial.length;

    if (depth === numJobs) {
      // Complete assignment — check feasibility and evaluate
      if (capacityFeasible(partial, formulation)) {
        const obj = computeObjective(partial, formulation);
        if (obj < bestObj) {
          bestObj = obj;
          bestAssign = [...partial];
        }
      }
      continue;
    }

    // Branch: try all machine assignments for job at `depth`
    for (let m = numMachines - 1; m >= 0; m--) {
      const next = [...partial, m];
      // Prune by capacity (partial check)
      const counts = new Array<number>(numMachines).fill(0);
      let feasible = true;
      for (const assigned of next) {
        counts[assigned]++;
        if (counts[assigned] > formulation.capacities[assigned]) {
          feasible = false;
          break;
        }
      }
      if (feasible) {
        stack.push(next);
      }
    }
  }

  if (bestAssign === null) {
    throw new Error('No feasible assignment found — check machine capacities');
  }

  // Build output
  const assignments: JobAssignment[] = bestAssign.map((m, j) => ({
    jobId: jobIds[j],
    machineId: machineIds[m],
    cost: costMatrix[j][m],
  }));

  // Recompute reward for output
  let affinityReward = 0;
  for (let a = 0; a < numJobs; a++) {
    for (let b = a + 1; b < numJobs; b++) {
      if (bestAssign[a] === bestAssign[b]) {
        affinityReward += affinityMatrix[a][b];
      }
    }
  }

  return {
    assignments,
    objectiveValue: bestObj,
    affinityReward,
    optimal: true,
  };
}

// ─── Public entry point ────────────────────────────────────────────────────────

/**
 * Schedule jobs onto machines using the MIQP+CP formulation.
 *
 * Builds the formulation from `input` then solves with the small-instance
 * exact B&B solver. For production-scale instances, replace `solveExact`
 * with a call to an external MIQP solver (e.g. Gurobi, CPLEX, HiGHS).
 */
export function schedule(input: MiqpSchedulerInput): MiqpSchedulerOutput {
  const formulation = buildFormulation(input);
  return solveExact(formulation);
}

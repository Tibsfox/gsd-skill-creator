/**
 * JP-017 — MIQP+CP scheduler tests.
 *
 * Test plan:
 *   - Schema acceptance: buildFormulation returns a well-shaped MiqpFormulation
 *   - 3-job × 2-machine optimality: known-optimal solution for a hand-designed
 *     instance with co-occurrence affinity
 *   - No-affinity baseline: without co-occurrence pairs, objective = pure base cost
 *   - Infeasible detection: capacity-violating instance throws
 */

import { describe, it, expect } from 'vitest';
import {
  buildFormulation,
  schedule,
  type MiqpSchedulerInput,
} from '../miqp-cp-scheduler.js';
import type { CoOccurrenceMatrix } from '../../traces/co-occurrence-schema.js';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

/** Empty co-occurrence matrix (no affinity signal). */
function emptyMatrix(): CoOccurrenceMatrix {
  return {
    generatedAt: 1_700_000_000_000,
    traceWindowStart: 1_699_990_000_000,
    traceWindowEnd: 1_700_000_000_000,
    pairs: [],
  };
}

/**
 * 3-job × 2-machine fixture with a co-occurrence affinity between job-0 and
 * job-1. The hand-derived optimal is:
 *
 *   job-0 → machine-0 (cost 1)
 *   job-1 → machine-0 (cost 2)   ← same machine as job-0; affinity reward 0.9
 *   job-2 → machine-1 (cost 1)
 *
 *   objective = (1 + 2 + 1) − 0.9 = 3.1
 *
 * Alternative placing job-0 and job-1 on different machines:
 *   job-0→m0(1) + job-1→m1(3) + job-2→m1(1) = 5 − 0 = 5  [worse]
 *   job-0→m0(1) + job-1→m1(3) + job-2→m0(1) = 5 − 0 = 5  [worse; also cap-violates m0]
 *   ... any split gives no reward and higher base cost.
 */
function threeJobTwoMachineInput(): MiqpSchedulerInput {
  const coOccurrence: CoOccurrenceMatrix = {
    generatedAt: 1_700_000_000_000,
    traceWindowStart: 1_699_990_000_000,
    traceWindowEnd: 1_700_000_000_000,
    pairs: [
      {
        event_a: { skillId: 'job-0', eventType: 'activation' },
        event_b: { skillId: 'job-1', eventType: 'activation' },
        probability: 0.9,
        temporalLagMs: 50,
        observationCount: 30,
        windowMs: 30_000,
      },
    ],
  };

  return {
    jobs: [
      { id: 'job-0', baseCost: [1, 4] },   // cheap on m0
      { id: 'job-1', baseCost: [2, 3] },   // m0 is still cheaper after affinity
      { id: 'job-2', baseCost: [5, 1] },   // cheap on m1
    ],
    machines: [
      { id: 'machine-0', capacity: 2 },
      { id: 'machine-1', capacity: 2 },
    ],
    coOccurrence,
    affinityWeight: 1.0,
  };
}

// ─── buildFormulation — schema acceptance ─────────────────────────────────────

describe('buildFormulation', () => {
  it('returns a formulation with correct dimensions', () => {
    const input = threeJobTwoMachineInput();
    const f = buildFormulation(input);

    expect(f.numJobs).toBe(3);
    expect(f.numMachines).toBe(2);
    expect(f.costMatrix).toHaveLength(3);
    expect(f.costMatrix[0]).toHaveLength(2);
    expect(f.affinityMatrix).toHaveLength(3);
    expect(f.affinityMatrix[0]).toHaveLength(3);
    expect(f.jobIds).toEqual(['job-0', 'job-1', 'job-2']);
    expect(f.machineIds).toEqual(['machine-0', 'machine-1']);
    expect(f.capacities).toEqual([2, 2]);
  });

  it('populates co-occurrence affinity symmetrically', () => {
    const input = threeJobTwoMachineInput();
    const f = buildFormulation(input);

    // job-0 and job-1 should have non-zero symmetric affinity (0.9 * 1.0)
    expect(f.affinityMatrix[0][1]).toBeCloseTo(0.9, 10);
    expect(f.affinityMatrix[1][0]).toBeCloseTo(0.9, 10);

    // job-2 has no co-occurrence pair → all affinity entries are 0
    expect(f.affinityMatrix[0][2]).toBe(0);
    expect(f.affinityMatrix[2][0]).toBe(0);
    expect(f.affinityMatrix[1][2]).toBe(0);
    expect(f.affinityMatrix[2][1]).toBe(0);
  });

  it('diagonal of affinity matrix is zero', () => {
    const input = threeJobTwoMachineInput();
    const f = buildFormulation(input);
    for (let i = 0; i < f.numJobs; i++) {
      expect(f.affinityMatrix[i][i]).toBe(0);
    }
  });

  it('throws when baseCost length mismatches machine count', () => {
    const input = threeJobTwoMachineInput();
    input.jobs[0].baseCost = [1]; // only 1 entry for 2 machines
    expect(() => buildFormulation(input)).toThrow();
  });
});

// ─── schedule — 3-job × 2-machine optimality ──────────────────────────────────

describe('schedule — 3-job × 2-machine optimality', () => {
  it('finds the known optimal assignment', () => {
    const result = schedule(threeJobTwoMachineInput());

    // job-0 and job-1 should be co-located on machine-0 (affinity reward)
    const a0 = result.assignments.find((a) => a.jobId === 'job-0')!;
    const a1 = result.assignments.find((a) => a.jobId === 'job-1')!;
    const a2 = result.assignments.find((a) => a.jobId === 'job-2')!;

    expect(a0.machineId).toBe('machine-0');
    expect(a1.machineId).toBe('machine-0');
    expect(a2.machineId).toBe('machine-1');
  });

  it('objective value matches expected 3.1', () => {
    const result = schedule(threeJobTwoMachineInput());
    expect(result.objectiveValue).toBeCloseTo(3.1, 8);
  });

  it('marks solution as optimal', () => {
    const result = schedule(threeJobTwoMachineInput());
    expect(result.optimal).toBe(true);
  });

  it('affinity reward is non-zero', () => {
    const result = schedule(threeJobTwoMachineInput());
    expect(result.affinityReward).toBeCloseTo(0.9, 8);
  });
});

// ─── No-affinity baseline ─────────────────────────────────────────────────────

describe('schedule — no affinity (pure base cost)', () => {
  it('minimises base cost when there are no co-occurrence pairs', () => {
    const input: MiqpSchedulerInput = {
      jobs: [
        { id: 'skill-a', baseCost: [1, 5] },
        { id: 'skill-b', baseCost: [4, 2] },
      ],
      machines: [
        { id: 'slot-0', capacity: 2 },
        { id: 'slot-1', capacity: 2 },
      ],
      coOccurrence: emptyMatrix(),
    };
    const result = schedule(input);

    const a = result.assignments.find((x) => x.jobId === 'skill-a')!;
    const b = result.assignments.find((x) => x.jobId === 'skill-b')!;

    expect(a.machineId).toBe('slot-0'); // cost 1
    expect(b.machineId).toBe('slot-1'); // cost 2
    expect(result.objectiveValue).toBeCloseTo(3, 10);
    expect(result.affinityReward).toBe(0);
  });
});

// ─── Capacity violation ───────────────────────────────────────────────────────

describe('schedule — infeasible capacity', () => {
  it('throws when no feasible assignment exists', () => {
    const input: MiqpSchedulerInput = {
      jobs: [
        { id: 'j0', baseCost: [1, 1] },
        { id: 'j1', baseCost: [1, 1] },
        { id: 'j2', baseCost: [1, 1] },
      ],
      machines: [
        { id: 'm0', capacity: 1 },
        { id: 'm1', capacity: 1 },
        // only 2 slots for 3 jobs → infeasible
      ],
      coOccurrence: emptyMatrix(),
    };
    expect(() => schedule(input)).toThrow();
  });
});

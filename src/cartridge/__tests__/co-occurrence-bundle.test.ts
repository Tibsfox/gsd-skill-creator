/**
 * JP-036 — Co-occurrence-MIQP cartridge bundling tests.
 *
 * Test plan:
 *   - Bundle emission smoke test: 3-skill co-occurring fixture emits slots
 *   - Co-located skills appear in the same slot
 *   - Slots are ordered by descending coOccurrenceScore
 *   - BundledSkill loadPriority ordering is correct
 *   - Empty skillIds throws
 *   - Bundle with no co-occurrence pairs still emits valid slots
 */

import { describe, it, expect } from 'vitest';
import {
  buildCoOccurrenceBundle,
  type CoOccurrenceBundleOptions,
} from '../co-occurrence-bundle.js';
import type { CoOccurrenceMatrix } from '../../traces/co-occurrence-schema.js';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function emptyMatrix(): CoOccurrenceMatrix {
  return {
    generatedAt: 1_700_000_000_000,
    traceWindowStart: 1_699_990_000_000,
    traceWindowEnd: 1_700_000_000_000,
    pairs: [],
  };
}

/**
 * 3-skill fixture: skill-planner + skill-executor co-occur strongly (p=0.9);
 * skill-verifier has no co-occurrence signal.
 *
 * With 2 slots and default uniform base costs, the MIQP solver should place
 * skill-planner and skill-executor together to capture the 0.9 affinity reward.
 */
function threeSkillMatrix(): CoOccurrenceMatrix {
  return {
    generatedAt: 1_700_000_000_000,
    traceWindowStart: 1_699_990_000_000,
    traceWindowEnd: 1_700_000_000_000,
    pairs: [
      {
        event_a: { skillId: 'skill-planner', eventType: 'activation' },
        event_b: { skillId: 'skill-executor', eventType: 'activation' },
        probability: 0.9,
        temporalLagMs: 80,
        observationCount: 40,
        windowMs: 30_000,
      },
    ],
  };
}

// ─── Smoke test ───────────────────────────────────────────────────────────────

describe('buildCoOccurrenceBundle — smoke test (3-skill fixture)', () => {
  it('emits a bundle with at least one slot', () => {
    const bundle = buildCoOccurrenceBundle(
      ['skill-planner', 'skill-executor', 'skill-verifier'],
      threeSkillMatrix(),
    );

    expect(bundle.slots.length).toBeGreaterThanOrEqual(1);
  });

  it('every input skill appears exactly once across all slots', () => {
    const skillIds = ['skill-planner', 'skill-executor', 'skill-verifier'];
    const bundle = buildCoOccurrenceBundle(skillIds, threeSkillMatrix());

    const allBundled = bundle.slots.flatMap((s) =>
      s.skills.map((sk) => sk.skillId),
    );

    // Each input skill exactly once
    for (const id of skillIds) {
      expect(allBundled.filter((x) => x === id)).toHaveLength(1);
    }
    // No extra skills
    expect(allBundled).toHaveLength(skillIds.length);
  });

  it('skill-planner and skill-executor are co-located in the same slot', () => {
    const bundle = buildCoOccurrenceBundle(
      ['skill-planner', 'skill-executor', 'skill-verifier'],
      threeSkillMatrix(),
    );

    const plannerSlot = bundle.slots.find((s) =>
      s.skills.some((sk) => sk.skillId === 'skill-planner'),
    )!;
    const executorSlot = bundle.slots.find((s) =>
      s.skills.some((sk) => sk.skillId === 'skill-executor'),
    )!;

    expect(plannerSlot.slotId).toBe(executorSlot.slotId);
  });

  it('the co-located slot has a positive coOccurrenceScore', () => {
    const bundle = buildCoOccurrenceBundle(
      ['skill-planner', 'skill-executor', 'skill-verifier'],
      threeSkillMatrix(),
    );

    const coSlot = bundle.slots.find((s) => s.coOccurrenceScore > 0);
    expect(coSlot).toBeDefined();
    expect(coSlot!.coOccurrenceScore).toBeGreaterThan(0);
  });

  it('solution is marked optimal', () => {
    const bundle = buildCoOccurrenceBundle(
      ['skill-planner', 'skill-executor', 'skill-verifier'],
      threeSkillMatrix(),
    );
    expect(bundle.optimal).toBe(true);
  });
});

// ─── Slot ordering ────────────────────────────────────────────────────────────

describe('buildCoOccurrenceBundle — slot ordering', () => {
  it('slots are ordered by descending coOccurrenceScore', () => {
    const bundle = buildCoOccurrenceBundle(
      ['skill-planner', 'skill-executor', 'skill-verifier'],
      threeSkillMatrix(),
    );

    for (let i = 1; i < bundle.slots.length; i++) {
      expect(bundle.slots[i - 1].coOccurrenceScore).toBeGreaterThanOrEqual(
        bundle.slots[i].coOccurrenceScore,
      );
    }
  });
});

// ─── No co-occurrence signal ──────────────────────────────────────────────────

describe('buildCoOccurrenceBundle — no co-occurrence pairs', () => {
  it('still emits valid slots covering all input skills', () => {
    const skillIds = ['skill-a', 'skill-b', 'skill-c'];
    const bundle = buildCoOccurrenceBundle(skillIds, emptyMatrix());

    const allBundled = bundle.slots.flatMap((s) =>
      s.skills.map((sk) => sk.skillId),
    );
    expect(allBundled.sort()).toEqual([...skillIds].sort());
  });

  it('all slot coOccurrenceScores are zero when no pairs', () => {
    const bundle = buildCoOccurrenceBundle(
      ['skill-a', 'skill-b'],
      emptyMatrix(),
    );
    for (const slot of bundle.slots) {
      expect(slot.coOccurrenceScore).toBe(0);
    }
  });
});

// ─── Custom options ───────────────────────────────────────────────────────────

describe('buildCoOccurrenceBundle — custom options', () => {
  it('respects maxSlots=1 (all skills in one slot)', () => {
    const options: CoOccurrenceBundleOptions = { maxSlots: 1 };
    const bundle = buildCoOccurrenceBundle(
      ['skill-a', 'skill-b', 'skill-c'],
      emptyMatrix(),
      options,
    );
    expect(bundle.slots).toHaveLength(1);
    expect(bundle.slots[0].skills).toHaveLength(3);
  });

  it('applies affinityWeight correctly (weight=0 gives same result as empty matrix)', () => {
    const skillIds = ['skill-planner', 'skill-executor', 'skill-verifier'];

    const withAffinity = buildCoOccurrenceBundle(skillIds, threeSkillMatrix(), {
      affinityWeight: 1.0,
    });
    const withZeroWeight = buildCoOccurrenceBundle(skillIds, threeSkillMatrix(), {
      affinityWeight: 0,
    });

    // With zero weight, the affinity reward in the objective should be 0
    expect(withZeroWeight.schedulerOutput.affinityReward).toBe(0);
    // With non-zero weight, it should be positive
    expect(withAffinity.schedulerOutput.affinityReward).toBeGreaterThan(0);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('buildCoOccurrenceBundle — error handling', () => {
  it('throws when skillIds is empty', () => {
    expect(() => buildCoOccurrenceBundle([], emptyMatrix())).toThrow(
      /skillIds must contain at least one skill/,
    );
  });

  it('throws when skillCosts length mismatches maxSlots', () => {
    expect(() =>
      buildCoOccurrenceBundle(['skill-a', 'skill-b'], emptyMatrix(), {
        maxSlots: 2,
        skillCosts: { 'skill-a': [1] }, // only 1 entry for 2 slots
      }),
    ).toThrow();
  });
});

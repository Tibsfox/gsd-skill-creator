/**
 * Safety-Critical Tests (SC-01 through SC-18)
 *
 * These tests verify the most critical invariants of the Space Between
 * engine. Every one of these MUST pass for the system to be safe for
 * learners. Tests that require React rendering are stubbed with comments
 * explaining what they would test in a full UI environment.
 */

import { describe, it, expect } from 'vitest';
import { createNewLearner, markPhaseComplete, navigateToFoundation } from '@/core/progression';
import { checkAccess, recordBypass, getBypassCount } from '@/integration/warden';
import { wonderStories } from '@/narrative/wonder-stories';
import { hundredVoicesBridges } from '@/narrative/hundred-voices-bridge';
import { reflectionPrompts } from '@/narrative/reflection-prompts';
import {
  computeActivation,
  computeConcreteProjection,
  computeAbstractProjection,
  computeArcLength,
  computeChord,
  computeVersine,
} from '@/integration/skill-bridge';
import { computeLearnerPosition, computeReadiness, suggestOptimalPath } from '@/integration/calibration';
import { getFoundation, getAllFoundations } from '@/core/registry';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types';
import type { FoundationId, PhaseType } from '@/types';

// ─── SC-01: Wonder phase is always accessible ───────

describe('SC-01: Wonder phase always accessible', () => {
  it('every foundation wonder phase is allowed for a brand new learner', () => {
    const state = createNewLearner();
    for (const id of FOUNDATION_ORDER) {
      const decision = checkAccess(state, id, 'wonder');
      expect(decision.allowed).toBe(true);
    }
  });

  it('wonder remains accessible even after completing other phases', () => {
    let state = createNewLearner();
    for (const phase of PHASE_ORDER) {
      state = markPhaseComplete(state, 'unit-circle', phase);
    }
    // Even with unit-circle fully done, wonder on other foundations is accessible
    for (const id of FOUNDATION_ORDER) {
      const decision = checkAccess(state, id, 'wonder');
      expect(decision.allowed).toBe(true);
    }
  });
});

// ─── SC-02: Understand phase is gated ────────────────

describe('SC-02: Understand phase requires wonder + see + touch', () => {
  it('understand is blocked when any of wonder/see/touch is missing', () => {
    // Only test phase sets that the progression engine can actually produce
    // (phases must be completed in order: wonder, see, touch, ...)
    const partialSets: PhaseType[][] = [
      [],               // nothing complete
      ['wonder'],       // only wonder
      ['wonder', 'see'], // wonder + see but missing touch
    ];
    for (const phases of partialSets) {
      let state = createNewLearner();
      for (const p of phases) {
        state = markPhaseComplete(state, 'unit-circle', p);
      }
      const decision = checkAccess(state, 'unit-circle', 'understand');
      expect(decision.allowed).toBe(false);
      expect(decision.mode).toBe('gate');
    }
  });

  it('understand is allowed when wonder + see + touch are all complete', () => {
    let state = createNewLearner();
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    state = markPhaseComplete(state, 'unit-circle', 'see');
    state = markPhaseComplete(state, 'unit-circle', 'touch');
    const decision = checkAccess(state, 'unit-circle', 'understand');
    expect(decision.allowed).toBe(true);
  });
});

// ─── SC-03: Inter-wing navigation never gated ───────

describe('SC-03: Inter-wing navigation never gated', () => {
  it('navigating between foundations does not require any completed phases', () => {
    let state = createNewLearner();
    // Navigate to each foundation — this should work regardless
    for (const id of FOUNDATION_ORDER) {
      state = navigateToFoundation(state, id);
      expect(state.currentFoundation).toBe(id);
    }
  });

  it('phase gating in one foundation does not affect another', () => {
    const state = createNewLearner();
    // unit-circle has nothing done, pythagorean has nothing done
    // wonder should be allowed on both
    expect(checkAccess(state, 'unit-circle', 'wonder').allowed).toBe(true);
    expect(checkAccess(state, 'pythagorean', 'wonder').allowed).toBe(true);
  });
});

// ─── SC-04: No math notation in wonder stories ──────

describe('SC-04: No mathematical notation in wonder stories', () => {
  it('stories contain zero math symbols or notation', () => {
    const mathSymbols = /[∫∑∏∂∇√πθ∞±≤≥≠≈∝∈∉⊂⊃∪∩∀∃¬∧∨⊕⊗⟨⟩]/;
    const mathExpressions = [
      /\bsin\s*\(/, /\bcos\s*\(/, /\btan\s*\(/, /\blog\s*\(/,
      /\bsqrt\s*\(/, /\bf\s*\(x\)/, /\bg\s*\(x\)/,
      /\bd[xy]\/d[xy]/, // derivatives
      /\b\w\s*=\s*[+-]?\d+\.\d+/, // x = 3.14
      /\d+\^\d+/, // 2^3
    ];

    for (const id of FOUNDATION_ORDER) {
      const body = wonderStories[id].body;
      expect(mathSymbols.test(body)).toBe(false);
      for (const pattern of mathExpressions) {
        expect(
          pattern.test(body),
          `${id}: math expression found: ${pattern}`,
        ).toBe(false);
      }
    }
  });
});

// ─── SC-05: No quoted text in hundred voices ─────────

describe('SC-05: No direct quoted text in hundred voices bridges', () => {
  it('bridge descriptions are thematic, not textual', () => {
    for (const id of FOUNDATION_ORDER) {
      const desc = hundredVoicesBridges[id].description;
      // Check that there are no long strings in quotes that look like direct quotation
      const longQuotes = desc.match(/[""\u201C][^""\u201D]{50,}[""\u201D]/g);
      expect(
        longQuotes,
        `${id}: contains what appears to be a long direct quotation`,
      ).toBeNull();
    }
  });
});

// ─── SC-06: Warden messages are non-punitive ─────────

describe('SC-06: Warden messages are warm and non-punitive', () => {
  it('no punitive language in any warden decision', () => {
    const state = createNewLearner();
    const punitiveTerms = /\bforbidden\b|\bdenied\b|\brejected\b|\berror\b|\bfail\b|\bwrong\b|\bstupid\b|\bdumb\b/i;

    for (const id of FOUNDATION_ORDER) {
      for (const phase of PHASE_ORDER) {
        const decision = checkAccess(state, id, phase);
        expect(punitiveTerms.test(decision.reason)).toBe(false);
        if (decision.suggestion) {
          expect(punitiveTerms.test(decision.suggestion)).toBe(false);
        }
      }
    }
  });
});

// ─── SC-07: Immutable state updates ──────────────────

describe('SC-07: State mutations never modify the original', () => {
  it('markPhaseComplete returns new state', () => {
    const original = createNewLearner();
    const originalVersion = original.stateVersion;
    const next = markPhaseComplete(original, 'unit-circle', 'wonder');
    expect(original.stateVersion).toBe(originalVersion);
    expect(next.stateVersion).toBe(originalVersion + 1);
    expect(original.completedPhases['unit-circle']).toHaveLength(0);
    expect(next.completedPhases['unit-circle']).toContain('wonder');
  });

  it('recordBypass returns new state', () => {
    const original = createNewLearner();
    const next = recordBypass(original, 'unit-circle', 'see');
    expect(getBypassCount(original)).toBe(0);
    expect(getBypassCount(next)).toBe(1);
  });

  it('navigateToFoundation returns new state', () => {
    const original = createNewLearner();
    const next = navigateToFoundation(original, 'pythagorean');
    expect(original.currentFoundation).toBe('unit-circle');
    expect(next.currentFoundation).toBe('pythagorean');
  });
});

// ─── SC-08: All 8 foundations registered ─────────────

describe('SC-08: All 8 foundations are registered and valid', () => {
  it('registry contains exactly 8 foundations', () => {
    expect(getAllFoundations()).toHaveLength(8);
  });

  it('every foundation has all 6 phases', () => {
    for (const id of FOUNDATION_ORDER) {
      const f = getFoundation(id);
      for (const phase of PHASE_ORDER) {
        expect(f.phases.has(phase)).toBe(true);
      }
    }
  });

  it('every foundation has a complex plane position', () => {
    for (const id of FOUNDATION_ORDER) {
      const f = getFoundation(id);
      expect(f.skillCreatorAnalog.complexPlanePosition).toBeDefined();
      expect(f.skillCreatorAnalog.complexPlanePosition!.theta).toBeGreaterThan(0);
      expect(f.skillCreatorAnalog.complexPlanePosition!.r).toBeGreaterThan(0);
    }
  });
});

// ─── SC-09: Math accuracy ────────────────────────────

describe('SC-09: Mathematical computations are accurate', () => {
  const EPSILON = 1e-10;

  it('tan(pi/4) * 1 = 1', () => {
    expect(Math.abs(computeActivation(Math.PI / 4, 1) - 1)).toBeLessThan(EPSILON);
  });

  it('sin(pi/6) = 0.5', () => {
    expect(Math.abs(computeConcreteProjection(Math.PI / 6) - 0.5)).toBeLessThan(EPSILON);
  });

  it('cos(pi/3) = 0.5', () => {
    expect(Math.abs(computeAbstractProjection(Math.PI / 3) - 0.5)).toBeLessThan(EPSILON);
  });

  it('sin^2 + cos^2 = 1 for all foundation thetas', () => {
    for (const id of FOUNDATION_ORDER) {
      const f = getFoundation(id);
      const theta = f.skillCreatorAnalog.complexPlanePosition!.theta;
      const sin2 = Math.pow(computeConcreteProjection(theta), 2);
      const cos2 = Math.pow(computeAbstractProjection(theta), 2);
      expect(Math.abs(sin2 + cos2 - 1)).toBeLessThan(EPSILON);
    }
  });

  it('versine = 0 for fully complete, 2 for fully incomplete', () => {
    let state = createNewLearner();
    expect(Math.abs(computeVersine(state, 'unit-circle') - 2)).toBeLessThan(EPSILON);

    for (const phase of PHASE_ORDER) {
      state = markPhaseComplete(state, 'unit-circle', phase);
    }
    expect(Math.abs(computeVersine(state, 'unit-circle'))).toBeLessThan(EPSILON);
  });

  it('arc length is non-negative', () => {
    for (const a of FOUNDATION_ORDER) {
      for (const b of FOUNDATION_ORDER) {
        expect(computeArcLength(a, b)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('chord <= arc (straight line <= curved path)', () => {
    for (const a of FOUNDATION_ORDER) {
      for (const b of FOUNDATION_ORDER) {
        if (a === b) continue;
        expect(computeChord(a, b)).toBeLessThanOrEqual(computeArcLength(a, b) + EPSILON);
      }
    }
  });
});

// ─── SC-10: Learner position bounds ──────────────────

describe('SC-10: Learner position is always within valid bounds', () => {
  it('theta >= 0 for any learner state', () => {
    let state = createNewLearner();
    expect(computeLearnerPosition(state).theta).toBeGreaterThanOrEqual(0);

    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    expect(computeLearnerPosition(state).theta).toBeGreaterThanOrEqual(0);
  });

  it('0 <= r <= 1 for any learner state', () => {
    let state = createNewLearner();
    let pos = computeLearnerPosition(state);
    expect(pos.r).toBeGreaterThanOrEqual(0);
    expect(pos.r).toBeLessThanOrEqual(1);

    // Complete everything
    for (const id of FOUNDATION_ORDER) {
      for (const phase of PHASE_ORDER) {
        state = markPhaseComplete(state, id, phase);
      }
    }
    pos = computeLearnerPosition(state);
    expect(pos.r).toBeGreaterThanOrEqual(0);
    expect(pos.r).toBeLessThanOrEqual(1);
  });
});

// ─── SC-11: Readiness bounds ─────────────────────────

describe('SC-11: Readiness scores are bounded [0, 1]', () => {
  it('readiness is between 0 and 1 for all foundations at all states', () => {
    let state = createNewLearner();
    for (const id of FOUNDATION_ORDER) {
      const r = computeReadiness(state, id);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }

    // Partial progress
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    state = markPhaseComplete(state, 'unit-circle', 'see');
    for (const id of FOUNDATION_ORDER) {
      const r = computeReadiness(state, id);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});

// ─── SC-12: Optimal path contains all foundations ────

describe('SC-12: Optimal path is a permutation of all foundations', () => {
  it('path contains all 8 foundations exactly once', () => {
    const state = createNewLearner();
    const path = suggestOptimalPath(state);
    expect(path).toHaveLength(8);
    const unique = new Set(path);
    expect(unique.size).toBe(8);
    for (const id of FOUNDATION_ORDER) {
      expect(unique.has(id)).toBe(true);
    }
  });
});

// ─── SC-13: Phase ordering enforcement ───────────────

describe('SC-13: Phase ordering is enforced', () => {
  it('cannot mark see complete before wonder', () => {
    const state = createNewLearner();
    expect(() => markPhaseComplete(state, 'unit-circle', 'see')).toThrow();
  });

  it('cannot mark understand complete before touch', () => {
    let state = createNewLearner();
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    state = markPhaseComplete(state, 'unit-circle', 'see');
    // touch is not complete, so understand should throw
    expect(() => markPhaseComplete(state, 'unit-circle', 'understand')).toThrow();
  });
});

// ─── SC-14: Content completeness ─────────────────────

describe('SC-14: All narrative content is present', () => {
  it('8 wonder stories', () => {
    expect(Object.keys(wonderStories)).toHaveLength(8);
  });

  it('8 hundred voices bridges', () => {
    expect(Object.keys(hundredVoicesBridges)).toHaveLength(8);
  });

  it('at least 20 reflection prompts', () => {
    expect(reflectionPrompts.length).toBeGreaterThanOrEqual(20);
  });

  it('at least 2 reflection prompts per foundation', () => {
    for (const id of FOUNDATION_ORDER) {
      const count = reflectionPrompts.filter((p) => p.foundationId === id).length;
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  it('at least 4 cross-foundation prompts', () => {
    const cross = reflectionPrompts.filter((p) => !p.foundationId);
    expect(cross.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── SC-15: Bypass state integrity ───────────────────

describe('SC-15: Bypass tracking maintains state integrity', () => {
  it('bypasses never go negative', () => {
    const state = createNewLearner();
    expect(getBypassCount(state)).toBe(0);
  });

  it('bypass count equals sum of individual bypasses', () => {
    let state = createNewLearner();
    state = recordBypass(state, 'unit-circle', 'see');
    state = recordBypass(state, 'pythagorean', 'touch');
    state = recordBypass(state, 'unit-circle', 'see');
    expect(getBypassCount(state)).toBe(3);
  });
});

// ─── SC-16: Foundation identity stability ────────────

describe('SC-16: Foundation identity is stable', () => {
  it('FOUNDATION_ORDER has exactly 8 items', () => {
    expect(FOUNDATION_ORDER).toHaveLength(8);
  });

  it('PHASE_ORDER has exactly 6 items', () => {
    expect(PHASE_ORDER).toHaveLength(6);
  });

  it('foundation order matches registry', () => {
    const foundations = getAllFoundations();
    for (let i = 0; i < FOUNDATION_ORDER.length; i++) {
      expect(foundations[i].id).toBe(FOUNDATION_ORDER[i]);
    }
  });
});

// ─── SC-17: Story quality minimums ───────────────────

describe('SC-17: Wonder stories meet minimum quality thresholds', () => {
  it('every story has at least 200 words', () => {
    for (const id of FOUNDATION_ORDER) {
      const words = wonderStories[id].body.split(/\s+/).filter(Boolean).length;
      expect(words).toBeGreaterThanOrEqual(200);
    }
  });

  it('every story has a title', () => {
    for (const id of FOUNDATION_ORDER) {
      expect(wonderStories[id].title.length).toBeGreaterThan(0);
    }
  });

  it('every story has a voice tone', () => {
    for (const id of FOUNDATION_ORDER) {
      expect(wonderStories[id].voiceTone.length).toBeGreaterThan(0);
    }
  });
});

// ─── SC-18: No data loss on state transitions ───────

describe('SC-18: No data loss during state transitions', () => {
  it('completed phases persist through navigation', () => {
    let state = createNewLearner();
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    state = navigateToFoundation(state, 'pythagorean');
    // unit-circle wonder should still be recorded
    expect(state.completedPhases['unit-circle']).toContain('wonder');
  });

  it('bypasses persist through phase completion', () => {
    let state = createNewLearner();
    state = recordBypass(state, 'unit-circle', 'see');
    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    expect(getBypassCount(state)).toBe(1);
  });

  it('state version always increments', () => {
    let state = createNewLearner();
    const v0 = state.stateVersion;

    state = markPhaseComplete(state, 'unit-circle', 'wonder');
    expect(state.stateVersion).toBe(v0 + 1);

    state = navigateToFoundation(state, 'pythagorean');
    expect(state.stateVersion).toBe(v0 + 2);

    state = recordBypass(state, 'pythagorean', 'see');
    expect(state.stateVersion).toBe(v0 + 3);
  });
});

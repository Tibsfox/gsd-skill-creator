/**
 * Regression test: DriftScore assembler vs analyzer divergence.
 *
 * The assembler (types.ts) and retrospective analyzer (retrospective/drift.ts)
 * intentionally use different weight sets and threshold bands for
 * calculateDriftScore. This test prevents accidental unification.
 *
 * @see src/dacp/types.ts -- assembler weights 35/25/25/15, thresholds 0.6/0.2
 * @see src/dacp/retrospective/drift.ts -- analyzer weights 40/30/20/10, thresholds 0.3/0.05
 */

import { describe, it, expect } from 'vitest';
import { calculateDriftScore as assemblerDriftScore } from '../../src/dacp/types.js';
import { calculateDriftScore as analyzerDriftScore } from '../../src/dacp/retrospective/drift.js';
import type { HandoffOutcome } from '../../src/dacp/types.js';

/** Shared test fixture: moderate-drift handoff outcome */
const MODERATE_DRIFT_OUTCOME: HandoffOutcome = {
  bundle_id: 'test-bundle-001',
  fidelity_level: 2,
  intent_alignment: 0.6,     // 40% misalignment
  rework_required: true,      // triggers rework penalty
  tokens_spent_interpreting: 500,
  code_modifications: 3,      // moderate modifications
  verification_pass: true,    // no verification penalty
  timestamp: '2026-03-01T00:00:00Z',
};

/** Low-drift handoff outcome: near-perfect alignment */
const LOW_DRIFT_OUTCOME: HandoffOutcome = {
  bundle_id: 'test-bundle-002',
  fidelity_level: 1,
  intent_alignment: 0.98,     // near-perfect alignment
  rework_required: false,     // no rework needed
  tokens_spent_interpreting: 50,
  code_modifications: 0,      // no modifications
  verification_pass: true,    // verification passed
  timestamp: '2026-03-01T00:00:00Z',
};

describe('DriftScore divergence: assembler vs analyzer', () => {
  it('assembler and analyzer produce different scores for identical input', () => {
    const assemblerResult = assemblerDriftScore(MODERATE_DRIFT_OUTCOME);
    const analyzerResult = analyzerDriftScore(MODERATE_DRIFT_OUTCOME);

    // Both should produce valid scores in 0-1 range
    expect(assemblerResult.score).toBeGreaterThanOrEqual(0);
    expect(assemblerResult.score).toBeLessThanOrEqual(1);
    expect(analyzerResult.score).toBeGreaterThanOrEqual(0);
    expect(analyzerResult.score).toBeLessThanOrEqual(1);

    // Scores must NOT be equal -- different weight sets produce different results
    expect(assemblerResult.score).not.toEqual(analyzerResult.score);
  });

  it('analyzer has tighter threshold bands than assembler: moderate-drift input produces different recommendations', () => {
    const assemblerResult = assemblerDriftScore(MODERATE_DRIFT_OUTCOME);
    const analyzerResult = analyzerDriftScore(MODERATE_DRIFT_OUTCOME);

    // The analyzer's tighter promote threshold (>0.3) means it should
    // recommend 'promote' more readily than the assembler (>0.6).
    // With moderate drift, the analyzer should promote while the assembler
    // may maintain or have a different recommendation.
    //
    // Key insight: the analyzer's promote threshold (0.3) is lower than the
    // assembler's (0.6), so moderate drift that falls between 0.3 and 0.6
    // will get 'promote' from the analyzer but 'maintain' from the assembler.
    expect(assemblerResult.recommendation).not.toEqual(analyzerResult.recommendation);
  });

  it('both produce demote for near-zero drift, but analyzer requires stricter threshold', () => {
    const assemblerResult = assemblerDriftScore(LOW_DRIFT_OUTCOME);
    const analyzerResult = analyzerDriftScore(LOW_DRIFT_OUTCOME);

    // Both should produce low scores for near-perfect alignment
    expect(assemblerResult.score).toBeLessThan(0.2);
    expect(analyzerResult.score).toBeLessThan(0.1);

    // Assembler demotes below 0.2; analyzer demotes below 0.05
    // A near-zero score should get 'demote' from assembler (threshold < 0.2)
    // but the analyzer requires currentLevel > 0 AND score < 0.05
    // With intent_alignment=0.98, the analyzer score should be very close to 0
    // Both should demote in this case (fidelity_level > 0 for both)
    expect(assemblerResult.recommendation).toBe('demote');
    expect(analyzerResult.recommendation).toBe('demote');

    // But the scores themselves should still differ
    expect(assemblerResult.score).not.toEqual(analyzerResult.score);
  });
});

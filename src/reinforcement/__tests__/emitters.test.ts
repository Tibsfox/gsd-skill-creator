/**
 * MA-6: emitter tests — one block per channel.  Verifies sign invariants,
 * magnitude clamping, and metadata pass-through.
 */

import { describe, it, expect } from 'vitest';
import {
  emitExplicitCorrection,
  emitOutcomeObserved,
  emitBranchResolved,
  emitSurpriseTriggered,
  emitQuintessenceUpdated,
  DEFAULT_CORRECTION_MAGNITUDE,
  BRANCH_COMMIT_MAGNITUDE,
  BRANCH_ABORT_MAGNITUDE,
  DEFAULT_SURPRISE_MAGNITUDE,
  DEFAULT_QUINTESSENCE_MAGNITUDE,
} from '../emitters.js';

describe('emitExplicitCorrection', () => {
  it('produces a non-positive magnitude by default', () => {
    const e = emitExplicitCorrection({
      actor: 'teach',
      metadata: { teachEntryId: 't1' },
    });
    expect(e.channel).toBe('explicit_correction');
    expect(e.value.magnitude).toBe(DEFAULT_CORRECTION_MAGNITUDE);
    expect(e.value.direction).toBe('negative');
  });

  it('coerces a caller-supplied positive magnitude to 0', () => {
    const e = emitExplicitCorrection({
      actor: 'teach',
      metadata: {},
      magnitude: 0.5,
    });
    expect(e.value.magnitude).toBe(0);
    expect(e.value.direction).toBe('neutral');
  });

  it('clamps magnitude to [-1, 1]', () => {
    const e = emitExplicitCorrection({
      actor: 'teach',
      metadata: {},
      magnitude: -5,
    });
    expect(e.value.magnitude).toBe(-1);
  });

  it('preserves metadata fields', () => {
    const e = emitExplicitCorrection({
      actor: 'teach',
      metadata: { teachEntryId: 't1', category: 'correction', skillId: 's1' },
    });
    expect(e.metadata).toEqual({ teachEntryId: 't1', category: 'correction', skillId: 's1' });
  });
});

describe('emitOutcomeObserved', () => {
  it('is bipolar — accepts positive magnitude (test-pass)', () => {
    const e = emitOutcomeObserved({
      actor: 'ci',
      metadata: { outcomeKind: 'test-pass', count: 10 },
      magnitude: 0.8,
    });
    expect(e.value.magnitude).toBe(0.8);
    expect(e.value.direction).toBe('positive');
  });

  it('is bipolar — accepts negative magnitude (test-fail)', () => {
    const e = emitOutcomeObserved({
      actor: 'ci',
      metadata: { outcomeKind: 'test-fail' },
      magnitude: -0.6,
    });
    expect(e.value.magnitude).toBe(-0.6);
    expect(e.value.direction).toBe('negative');
  });
});

describe('emitBranchResolved', () => {
  it('sign is +1 for committed', () => {
    const e = emitBranchResolved({
      actor: 'branches',
      metadata: { branchId: 'b1', resolution: 'committed' },
    });
    expect(e.value.magnitude).toBe(BRANCH_COMMIT_MAGNITUDE);
  });

  it('sign is -1 for aborted', () => {
    const e = emitBranchResolved({
      actor: 'branches',
      metadata: { branchId: 'b1', resolution: 'aborted' },
    });
    expect(e.value.magnitude).toBe(BRANCH_ABORT_MAGNITUDE);
  });
});

describe('emitSurpriseTriggered', () => {
  it('defaults to -1 magnitude', () => {
    const e = emitSurpriseTriggered({
      actor: 'umwelt',
      metadata: { sigma: 4.5, klDivergence: 1.2, threshold: 3 },
    });
    expect(e.value.magnitude).toBe(DEFAULT_SURPRISE_MAGNITUDE);
    expect(e.value.direction).toBe('negative');
  });

  it('coerces a positive override to 0', () => {
    const e = emitSurpriseTriggered({
      actor: 'umwelt',
      metadata: { sigma: 4, klDivergence: 1, threshold: 3 },
      magnitude: 0.4,
    });
    expect(e.value.magnitude).toBe(0);
  });
});

describe('emitQuintessenceUpdated', () => {
  it('defaults to the low positive structural signal', () => {
    const e = emitQuintessenceUpdated({
      actor: 'symbiosis',
      metadata: {
        axes: {
          selfVsNonSelf: 0.6,
          essentialTensions: 0.2,
          growthAndEnergyFlow: 1200,
          stabilityVsNovelty: 0.7,
          fatefulEncounters: 4,
        },
      },
    });
    expect(e.value.magnitude).toBe(DEFAULT_QUINTESSENCE_MAGNITUDE);
    expect(e.value.direction).toBe('positive');
  });

  it('coerces a negative override to 0', () => {
    const e = emitQuintessenceUpdated({
      actor: 'symbiosis',
      metadata: {
        axes: {
          selfVsNonSelf: 0,
          essentialTensions: 0,
          growthAndEnergyFlow: 0,
          stabilityVsNovelty: 0,
          fatefulEncounters: 0,
        },
      },
      magnitude: -0.5,
    });
    expect(e.value.magnitude).toBe(0);
  });
});

describe('emitter id/ts defaults', () => {
  it('assigns a UUID id when omitted', () => {
    const e = emitExplicitCorrection({ actor: 'a', metadata: {} });
    expect(e.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
  it('assigns a timestamp when omitted', () => {
    const before = Date.now();
    const e = emitExplicitCorrection({ actor: 'a', metadata: {} });
    const after = Date.now();
    expect(e.ts).toBeGreaterThanOrEqual(before);
    expect(e.ts).toBeLessThanOrEqual(after);
  });
  it('honours an explicit id and ts', () => {
    const e = emitExplicitCorrection({
      actor: 'a',
      metadata: {},
      id: 'fixed-id',
      ts: 42,
    });
    expect(e.id).toBe('fixed-id');
    expect(e.ts).toBe(42);
  });
});

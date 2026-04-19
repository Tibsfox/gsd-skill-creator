/**
 * MA-1 Eligibility-Trace Layer — api.ts unit tests.
 *
 * Coverage:
 *   - getTraceFor() returns correct activation or null.
 *   - getAllTracesAt() returns traces decayed to the target timestamp.
 *   - EligibilityReader clones the source store (no shared mutation).
 *   - buildReaderFromEvents() builds a correct reader from an event array.
 *   - Standalone getTraceFor / getAllTracesAt helpers work correctly.
 */

import { describe, it, expect } from 'vitest';
import {
  EligibilityReader,
  buildReaderFromEvents,
  getTraceFor,
  getAllTracesAt,
} from '../api.js';
import { EligibilityStore } from '../traces.js';
import type { ReinforcementEvent } from '../../types/reinforcement.js';
import { decayForChannel } from '../decay-kernels.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  channel: ReinforcementEvent['channel'],
  ts: number,
  actor: string,
  magnitude: number,
): ReinforcementEvent {
  const direction = magnitude > 0 ? 'positive' : magnitude < 0 ? 'negative' : 'neutral';
  switch (channel) {
    case 'explicit_correction':
      return { id: 'e1', ts, channel, actor, value: { magnitude, direction }, metadata: { skillId: actor } };
    case 'outcome_observed':
      return { id: 'e2', ts, channel, actor, value: { magnitude, direction }, metadata: { outcomeKind: 'test-pass' } };
    case 'branch_resolved':
      return {
        id: 'e3', ts, channel, actor, value: { magnitude, direction },
        metadata: { branchId: 'b1', resolution: magnitude > 0 ? 'committed' : 'aborted' },
      };
    case 'surprise_triggered':
      return { id: 'e4', ts, channel, actor, value: { magnitude, direction }, metadata: { sigma: 2.0, klDivergence: 0.3, threshold: 1.5 } };
    case 'quintessence_updated':
      return {
        id: 'e5', ts, channel, actor, value: { magnitude, direction },
        metadata: { axes: { selfVsNonSelf: 0.5, essentialTensions: 0.4, growthAndEnergyFlow: 0.5, stabilityVsNovelty: 0.3, fatefulEncounters: 0.6 } },
      };
  }
}

// ─── EligibilityReader tests ──────────────────────────────────────────────────

describe('EligibilityReader.getTraceFor', () => {
  it('returns the activation for a known (skillId, channel)', () => {
    const store = new EligibilityStore();
    store.apply('sk', 'outcome_observed', 0.7, 0);
    const reader = new EligibilityReader(store);
    const v = reader.getTraceFor('sk', 'outcome_observed');
    expect(v).not.toBeNull();
    expect(Math.abs(v! - 0.7)).toBeLessThan(1e-12);
  });

  it('returns null for an unknown (skillId, channel)', () => {
    const store = new EligibilityStore();
    const reader = new EligibilityReader(store);
    expect(reader.getTraceFor('nobody', 'explicit_correction')).toBeNull();
  });

  it('reader is independent of source store mutations after construction', () => {
    const store = new EligibilityStore();
    store.apply('sk', 'outcome_observed', 0.7, 0);
    const reader = new EligibilityReader(store);

    // Mutate the source store.
    store.apply('sk', 'outcome_observed', -1.0, 1000);

    // Reader should still have the original value (cloned at construction).
    const v = reader.getTraceFor('sk', 'outcome_observed');
    expect(v).not.toBeNull();
    expect(Math.abs(v! - 0.7)).toBeLessThan(1e-12);
  });
});

describe('EligibilityReader.getAllTracesAt', () => {
  it('decays all traces to the target timestamp', () => {
    const t0 = 0;
    const t1 = 60_000; // 1 minute

    const store = new EligibilityStore();
    store.apply('sk', 'outcome_observed', 1.0, t0);
    const reader = new EligibilityReader(store);

    const tracesAt = reader.getAllTracesAt(t1);
    const delta = decayForChannel('outcome_observed', t1 - t0);
    const expected = delta * 1.0;

    expect(tracesAt.length).toBe(1);
    expect(Math.abs(tracesAt[0]!.activation - expected)).toBeLessThan(1e-12);
  });

  it('does not mutate the internal store (calling multiple times is safe)', () => {
    const store = new EligibilityStore();
    store.apply('sk', 'branch_resolved', 1.0, 0);
    const reader = new EligibilityReader(store);

    const t1 = 3_600_000;
    const traces1 = reader.getAllTracesAt(t1);
    const traces2 = reader.getAllTracesAt(t1);

    // Both calls produce identical results.
    expect(JSON.stringify(traces1)).toBe(JSON.stringify(traces2));
    // Internal reader still has original activation.
    const raw = reader.getTraceFor('sk', 'branch_resolved');
    expect(Math.abs(raw! - 1.0)).toBeLessThan(1e-12);
  });

  it('returns empty array when no traces are live', () => {
    const reader = new EligibilityReader(new EligibilityStore());
    expect(reader.getAllTracesAt(9999)).toHaveLength(0);
  });
});

describe('EligibilityReader.size', () => {
  it('matches the number of live traces in the source store', () => {
    const store = new EligibilityStore();
    store.apply('sk1', 'explicit_correction', -1.0, 0);
    store.apply('sk2', 'outcome_observed', 0.5, 0);
    const reader = new EligibilityReader(store);
    expect(reader.size).toBe(2);
  });
});

// ─── buildReaderFromEvents ────────────────────────────────────────────────────

describe('buildReaderFromEvents', () => {
  it('builds a reader with correct activations for all five channels', () => {
    const t0 = 0;
    const events: ReinforcementEvent[] = [
      makeEvent('explicit_correction', t0, 'sk', -0.8),
      makeEvent('outcome_observed', t0, 'sk', 0.5),
      makeEvent('branch_resolved', t0, 'sk', 1.0),
      makeEvent('surprise_triggered', t0, 'sk', -0.3),
      makeEvent('quintessence_updated', t0, 'sk', 0.25),
    ];

    const reader = buildReaderFromEvents(events);

    // All five channels should have traces.
    for (const ch of [
      'explicit_correction',
      'outcome_observed',
      'branch_resolved',
      'surprise_triggered',
      'quintessence_updated',
    ] as const) {
      expect(reader.getTraceFor('sk', ch)).not.toBeNull();
    }
    expect(reader.size).toBe(5);
  });

  it('respects skillId from metadata.skillId for explicit_correction', () => {
    const events: ReinforcementEvent[] = [
      {
        id: 'e1',
        ts: 1000,
        channel: 'explicit_correction',
        actor: 'teach-engine',
        value: { magnitude: -1.0, direction: 'negative' },
        metadata: { skillId: 'my-special-skill' },
      },
    ];
    const reader = buildReaderFromEvents(events);
    // Should be keyed by skillId='my-special-skill', not 'teach-engine'.
    expect(reader.getTraceFor('my-special-skill', 'explicit_correction')).not.toBeNull();
    expect(reader.getTraceFor('teach-engine', 'explicit_correction')).toBeNull();
  });

  it('falls back to actor when skillId is absent', () => {
    const events: ReinforcementEvent[] = [
      makeEvent('outcome_observed', 1000, 'actor-name', 0.5),
    ];
    const reader = buildReaderFromEvents(events);
    expect(reader.getTraceFor('actor-name', 'outcome_observed')).not.toBeNull();
  });
});

// ─── Standalone helpers ───────────────────────────────────────────────────────

describe('getTraceFor (standalone helper)', () => {
  it('delegates to store.getTrace', () => {
    const store = new EligibilityStore();
    store.apply('sk', 'surprise_triggered', -0.5, 0);
    const v = getTraceFor(store, 'sk', 'surprise_triggered');
    expect(v).not.toBeNull();
    expect(Math.abs(v! - (-0.5))).toBeLessThan(1e-12);
  });

  it('returns null for missing trace', () => {
    const store = new EligibilityStore();
    expect(getTraceFor(store, 'ghost', 'quintessence_updated')).toBeNull();
  });
});

describe('getAllTracesAt (standalone helper)', () => {
  it('decays and returns snapshot without mutating store', () => {
    const store = new EligibilityStore();
    const t0 = 0;
    const t1 = 3_600_000;
    store.apply('sk', 'quintessence_updated', 0.25, t0);

    const traces = getAllTracesAt(store, t1);
    const delta = decayForChannel('quintessence_updated', t1 - t0);
    const expected = delta * 0.25;

    expect(traces.length).toBe(1);
    expect(Math.abs(traces[0]!.activation - expected)).toBeLessThan(1e-12);

    // Store still has original value.
    expect(Math.abs(store.getTrace('sk', 'quintessence_updated')! - 0.25)).toBeLessThan(1e-12);
  });
});

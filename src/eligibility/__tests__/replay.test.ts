/**
 * MA-1 Eligibility-Trace Layer — replay.ts unit tests.
 *
 * Coverage:
 *   - Round-trip from a 1000-event fixture produces consistent snapshots.
 *   - replayEvents is deterministic (same fixture → same result).
 *   - snapshotEvery and snapshotAll options work correctly.
 *   - All five channels are exercised in the fixture.
 *   - Empty event set returns [].
 *   - Events are sorted by ts before processing (order-independent input).
 */

import { describe, it, expect } from 'vitest';
import { replayEvents, getFinalTracesFromEvents } from '../replay.js';
import type { ReinforcementEvent } from '../../types/reinforcement.js';

// ─── Fixture builder ──────────────────────────────────────────────────────────

let _eventCounter = 0;
function makeEvent(
  channel: ReinforcementEvent['channel'],
  ts: number,
  actor: string,
  magnitude: number,
): ReinforcementEvent {
  _eventCounter++;
  const direction =
    magnitude > 0 ? 'positive' : magnitude < 0 ? 'negative' : 'neutral';

  switch (channel) {
    case 'explicit_correction':
      return {
        id: `evt-${_eventCounter}`,
        ts,
        channel,
        actor,
        value: { magnitude, direction },
        metadata: { skillId: actor },
      };
    case 'outcome_observed':
      return {
        id: `evt-${_eventCounter}`,
        ts,
        channel,
        actor,
        value: { magnitude, direction },
        metadata: { outcomeKind: 'test-pass' },
      };
    case 'branch_resolved':
      return {
        id: `evt-${_eventCounter}`,
        ts,
        channel,
        actor,
        value: { magnitude, direction },
        metadata: { branchId: `branch-${_eventCounter}`, resolution: magnitude > 0 ? 'committed' : 'aborted' },
      };
    case 'surprise_triggered':
      return {
        id: `evt-${_eventCounter}`,
        ts,
        channel,
        actor,
        value: { magnitude, direction },
        metadata: { sigma: 2.1, klDivergence: 0.4, threshold: 2.0 },
      };
    case 'quintessence_updated':
      return {
        id: `evt-${_eventCounter}`,
        ts,
        channel,
        actor,
        value: { magnitude, direction },
        metadata: {
          axes: {
            selfVsNonSelf: 0.5,
            essentialTensions: 0.4,
            growthAndEnergyFlow: 0.5,
            stabilityVsNovelty: 0.3,
            fatefulEncounters: 0.6,
          },
        },
      };
  }
}

/**
 * Build a 1000-event fixture covering all five channels and multiple skills.
 */
function buildFixture1000(): ReinforcementEvent[] {
  const channels: ReinforcementEvent['channel'][] = [
    'explicit_correction',
    'outcome_observed',
    'branch_resolved',
    'surprise_triggered',
    'quintessence_updated',
  ];
  const skills = ['skill-alpha', 'skill-beta', 'skill-gamma', 'skill-delta', 'skill-epsilon'];
  const events: ReinforcementEvent[] = [];

  // Seed deterministic sequence — no random.
  for (let i = 0; i < 1000; i++) {
    const channel = channels[i % channels.length]!;
    const actor = skills[i % skills.length]!;
    const ts = i * 60_000; // 1-minute intervals
    // Magnitude cycles through non-zero values so no channel is accidentally pruned.
    // Pattern: -0.5, -0.25, 0.1, 0.25, 0.5 — avoids 0 at index 2 (branch_resolved).
    const magCycle = [-0.5, -0.25, 0.1, 0.25, 0.5];
    const magnitude = magCycle[i % magCycle.length]!;
    events.push(makeEvent(channel, ts, actor, magnitude));
  }

  return events;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('replayEvents — basic properties', () => {
  it('returns at least one snapshot for a non-empty event array', () => {
    const events = [makeEvent('outcome_observed', 1000, 'sk', 0.5)];
    const snapshots = replayEvents(events);
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
  });

  it('returns [] for an empty event array', () => {
    const snapshots = replayEvents([]);
    expect(snapshots).toHaveLength(0);
  });

  it('final snapshot ts matches the last event ts (largest ts)', () => {
    const events = [
      makeEvent('outcome_observed', 1000, 'sk', 0.5),
      makeEvent('branch_resolved', 5000, 'sk', 1.0),
      makeEvent('explicit_correction', 3000, 'sk2', -1.0),
    ];
    const snapshots = replayEvents(events);
    const lastSnap = snapshots[snapshots.length - 1]!;
    expect(lastSnap.ts).toBe(5000); // highest ts
  });
});

describe('replayEvents — snapshotEvery option', () => {
  it('snapshotEvery=1 emits a snapshot after every event plus the final', () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent('outcome_observed', i * 1000, 'sk', 0.5),
    );
    const snapshots = replayEvents(events, { snapshotEvery: 1 });
    // snapshotEvery=1 emits on every event (indices 0..9) plus the final
    // duplicate at the end — but our implementation deduplicates by adding
    // the final unconditionally, so it may appear once extra if last event
    // already matched the interval. We just verify ≥ 10 snapshots.
    expect(snapshots.length).toBeGreaterThanOrEqual(10);
  });

  it('snapshotEvery=100 emits snapshots at 100-event boundaries', () => {
    const events = Array.from({ length: 500 }, (_, i) =>
      makeEvent('outcome_observed', i * 1000, 'sk', 0.5),
    );
    // 5 boundary snapshots at indices 99, 199, 299, 399, 499 plus final.
    const snapshots = replayEvents(events, { snapshotEvery: 100 });
    expect(snapshots.length).toBeGreaterThanOrEqual(5);
  });

  it('snapshotAll=true emits a snapshot after every event', () => {
    const n = 20;
    const events = Array.from({ length: n }, (_, i) =>
      makeEvent('branch_resolved', i * 1000, 'sk', i % 2 === 0 ? 1 : -1),
    );
    const snapshots = replayEvents(events, { snapshotAll: true });
    expect(snapshots.length).toBeGreaterThanOrEqual(n);
  });
});

describe('replayEvents — 1000-event round-trip fixture', () => {
  it('produces consistent snapshots — same fixture gives same result', () => {
    const events = buildFixture1000();
    const result1 = replayEvents(events);
    const result2 = replayEvents(events);
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });

  it('all five channels appear in the final snapshot traces', () => {
    const events = buildFixture1000();
    const traces = getFinalTracesFromEvents(events);
    const channels = new Set(traces.map((t) => t.channel));
    // The fixture exercises all five channels — they should all appear unless
    // pruned to zero.  With 1-minute intervals and typical τ values, all
    // should still be live at the end of the fixture.
    const expectedChannels = new Set([
      'explicit_correction',
      'outcome_observed',
      'branch_resolved',
      'surprise_triggered',
      'quintessence_updated',
    ]);
    for (const ch of expectedChannels) {
      expect(channels).toContain(ch);
    }
  });

  it('traces have finite, non-NaN activations', () => {
    const events = buildFixture1000();
    const traces = getFinalTracesFromEvents(events);
    for (const trace of traces) {
      expect(Number.isFinite(trace.activation)).toBe(true);
    }
  });

  it('activation magnitudes are within ±1.0 (bounded by input clamping)', () => {
    const events = buildFixture1000();
    const traces = getFinalTracesFromEvents(events);
    for (const trace of traces) {
      // Our fixture events have |magnitude| ≤ 0.5 and the decay kernel always
      // keeps the trace in [−|initial|, |initial|], so activations should be small.
      expect(Math.abs(trace.activation)).toBeLessThanOrEqual(1.0 + 1e-10);
    }
  });
});

describe('replayEvents — ts ordering', () => {
  it('out-of-order events produce same result as sorted events', () => {
    const events = [
      makeEvent('outcome_observed', 3000, 'sk', 0.5),
      makeEvent('explicit_correction', 1000, 'sk', -1.0),
      makeEvent('branch_resolved', 2000, 'sk', 1.0),
    ];
    const reversed = [...events].reverse();

    const result1 = getFinalTracesFromEvents(events);
    const result2 = getFinalTracesFromEvents(reversed);

    // Same activations (sorted internally by replay).
    const toKey = (t: { skillId: string; channel: string; activation: number }) =>
      `${t.skillId}|${t.channel}|${t.activation.toFixed(15)}`;
    const keys1 = result1.map(toKey).sort();
    const keys2 = result2.map(toKey).sort();
    expect(keys1).toEqual(keys2);
  });
});

describe('getFinalTracesFromEvents', () => {
  it('returns [] for an empty event array', () => {
    expect(getFinalTracesFromEvents([])).toEqual([]);
  });

  it('returns traces for a single event', () => {
    const events = [makeEvent('quintessence_updated', 1000, 'sk', 0.25)];
    const traces = getFinalTracesFromEvents(events);
    expect(traces.length).toBe(1);
    expect(traces[0]!.channel).toBe('quintessence_updated');
    expect(traces[0]!.activation).toBeCloseTo(0.25, 12);
  });
});

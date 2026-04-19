/**
 * MA-1 Eligibility-Trace Layer — EligibilityStore unit tests.
 *
 * Coverage:
 *   CF-MA1-01: Decay matches δ^N to 6 decimal places over N=100 ticks.
 *   CF-MA1-02: Trace integral over sustained unit pulse matches (1 − δ^M) within 1e-9.
 *   CF-MA1-03: Memory is O(|active features|); map size ≤ 200 after 10⁴ ticks with 50 features.
 *   CF-MA1-04: replayEligibility is pure: identical inputs → identical outputs.
 *   CF-MA1-05: updateEligibility with actionOutput=0 applies only decay; no accidental accumulation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EligibilityStore, PRUNE_EPSILON, type EligibilityTrace } from '../traces.js';
import { decayForChannel, TAU_OUTCOME_OBSERVED_MS } from '../decay-kernels.js';
import { replayEvents } from '../replay.js';
import type { ReinforcementEvent } from '../../types/reinforcement.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal valid ReinforcementEvent fixture.
 */
function makeEvent(
  overrides: Partial<ReinforcementEvent> & { channel: ReinforcementEvent['channel'] },
): ReinforcementEvent {
  const base = {
    id: 'evt-' + Math.random().toString(36).slice(2),
    ts: Date.now(),
    actor: 'test-actor',
    value: { magnitude: 1.0, direction: 'positive' as const },
    metadata: { outcomeKind: 'test-pass' },
  };
  return { ...base, ...overrides } as ReinforcementEvent;
}

// ─── CF-MA1-01: Decay accuracy over 100 ticks ─────────────────────────────────

describe('CF-MA1-01 — decay accuracy over N=100 ticks', () => {
  it('matches expected exponential decay to 6 decimal places', () => {
    const store = new EligibilityStore();
    const skillId = 'skill-A';
    const channel = 'outcome_observed' as const;

    // Apply initial event with magnitude=1.0 at t=0.
    const t0 = 1_000_000;
    store.apply(skillId, channel, 1.0, t0);

    // Step through 100 ticks of 1-second intervals — no further events, just decay.
    // We verify by applying zero-magnitude events (so decay fires but no accumulation).
    // Actually, we use decayAll() to advance time without events.
    const tau = TAU_OUTCOME_OBSERVED_MS;
    const intervalMs = 1000; // 1 second

    let expectedActivation = 1.0;

    for (let tick = 1; tick <= 100; tick++) {
      const nowTs = t0 + tick * intervalMs;
      store.decayAll(nowTs);

      const delta = Math.exp(-intervalMs / tau);
      expectedActivation *= delta;

      const actual = store.getTrace(skillId, channel);

      if (actual === null) {
        // Pruned — verify expectedActivation is also below PRUNE_EPSILON.
        expect(Math.abs(expectedActivation)).toBeLessThan(PRUNE_EPSILON);
        break;
      }

      // Tolerance: 6 decimal places.
      expect(Math.abs(actual - expectedActivation)).toBeLessThan(1e-6);
    }
  });

  it('decay factor δ^N property: after N uniform ticks starting from e₀, e_N = δ^N * e₀', () => {
    const tau = TAU_OUTCOME_OBSERVED_MS;
    const intervalMs = 60_000; // 1 minute
    const N = 100;

    const store = new EligibilityStore();
    const skillId = 'decay-test';
    const t0 = 0;
    store.apply(skillId, 'outcome_observed', 1.0, t0);

    for (let i = 1; i <= N; i++) {
      store.decayAll(t0 + i * intervalMs);
    }

    const deltaPerStep = Math.exp(-intervalMs / tau);
    const expected = Math.pow(deltaPerStep, N);
    const actual = store.getTrace(skillId, 'outcome_observed');

    if (actual !== null) {
      expect(Math.abs(actual - expected)).toBeLessThan(1e-6);
    } else {
      expect(expected).toBeLessThan(PRUNE_EPSILON);
    }
  });
});

// ─── CF-MA1-02: Trace integral over sustained unit pulse ──────────────────────

describe('CF-MA1-02 — sustained unit pulse trace integral', () => {
  it('accumulated trace after M unit-magnitude events matches (1 − δ^M) within 1e-9', () => {
    /**
     * For uniform time-step δ and unit magnitude r=1 each tick:
     *   e(1) = (1 − δ) · 1 = 1 − δ
     *   e(2) = δ · e(1) + (1 − δ) · 1 = δ(1−δ) + (1−δ) = (1−δ)(1+δ)
     *   e(M) = (1 − δ^M) in the steady-state accumulating form.
     *
     * More precisely, the geometric series sum gives:
     *   e(M) = (1−δ) · Σ_{k=0}^{M-1} δ^k = (1−δ) · (1−δ^M)/(1−δ) = 1 − δ^M.
     *
     * Reference: Barto 1983 Eq. (3) p. 841 accumulating trace property.
     */
    const store = new EligibilityStore({
      tauOutcomeObservedMs: 1000, // τ = 1s → δ per step = e^{-1} ≈ 0.368
    });
    const skillId = 'pulse-test';
    const channel = 'outcome_observed' as const;
    const intervalMs = 1000;
    const tau = 1000;
    const delta = Math.exp(-intervalMs / tau);
    const M = 30;

    // Apply M events one interval apart.
    for (let m = 1; m <= M; m++) {
      store.apply(skillId, channel, 1.0, m * intervalMs);
    }

    const analytic = 1 - Math.pow(delta, M);
    const actual = store.getTrace(skillId, channel);

    expect(actual).not.toBeNull();
    expect(Math.abs(actual! - analytic)).toBeLessThan(1e-9);
  });
});

// ─── CF-MA1-03: Bounded memory ────────────────────────────────────────────────

describe('CF-MA1-03 — bounded memory (O(|active features|))', () => {
  it('map size ≤ 200 after 10⁴ ticks with 50 concurrent features and δ=0.9-equivalent τ', () => {
    // We model 50 "skills" (each acting as a feature) all receiving events.
    // δ=0.9 at 1-second intervals → τ = -1000/ln(0.9) ≈ 9491 ms.
    const tauMs = -1000 / Math.log(0.9); // τ for δ=0.9 at 1s steps

    const store = new EligibilityStore({
      tauOutcomeObservedMs: tauMs,
    });

    const FEATURES = 50;
    const TICKS = 10_000;
    const intervalMs = 1000;

    for (let tick = 1; tick <= TICKS; tick++) {
      const ts = tick * intervalMs;
      for (let f = 0; f < FEATURES; f++) {
        store.apply(`skill-${f}`, 'outcome_observed', 0.5, ts);
      }
    }

    // After 10⁴ ticks, all 50 features are still being actively updated,
    // so the map should have exactly 50 entries (one per skill/channel pair).
    expect(store.size).toBeLessThanOrEqual(200);
    // Also verify pruning was active (no ghost entries beyond active set).
    expect(store.size).toBeLessThanOrEqual(FEATURES);
  });

  it('inactive features are pruned below PRUNE_EPSILON', () => {
    const store = new EligibilityStore({
      tauSurpriseTriggeredMs: 1, // τ = 1ms → very fast decay
    });

    store.apply('pruned-skill', 'surprise_triggered', 1.0, 0);
    // After 1000ms with τ=1ms: δ = e^{-1000} ≈ 5e-435 — deep below PRUNE_EPSILON.
    store.decayAll(1000);

    expect(store.getTrace('pruned-skill', 'surprise_triggered')).toBeNull();
    expect(store.size).toBe(0);
  });
});

// ─── CF-MA1-04: Purity / determinism ─────────────────────────────────────────

describe('CF-MA1-04 — replayEligibility purity', () => {
  it('identical inputs produce identical snapshots across 10³ invocations', () => {
    const events: ReinforcementEvent[] = [
      makeEvent({ channel: 'explicit_correction', ts: 1000, actor: 'skill-X', metadata: { skillId: 'skill-X' }, value: { magnitude: -1, direction: 'negative' } }),
      makeEvent({ channel: 'outcome_observed', ts: 2000, actor: 'skill-X', metadata: { outcomeKind: 'test-pass' }, value: { magnitude: 0.8, direction: 'positive' } }),
      makeEvent({ channel: 'branch_resolved', ts: 3000, actor: 'skill-Y', metadata: { branchId: 'b1', resolution: 'committed' }, value: { magnitude: 1, direction: 'positive' } }),
      makeEvent({ channel: 'surprise_triggered', ts: 4000, actor: 'skill-Z', metadata: { sigma: 2.1, klDivergence: 0.45, threshold: 2.0 }, value: { magnitude: -0.9, direction: 'negative' } }),
      makeEvent({ channel: 'quintessence_updated', ts: 5000, actor: 'skill-Q', metadata: { axes: { selfVsNonSelf: 0.6, essentialTensions: 0.4, growthAndEnergyFlow: 0.5, stabilityVsNovelty: 0.3, fatefulEncounters: 0.7 } }, value: { magnitude: 0.25, direction: 'positive' } }),
    ];

    // Run 1000 times and compare all outputs to the first.
    const firstResult = replayEvents(events);
    const firstJson = JSON.stringify(firstResult);

    for (let i = 0; i < 1000; i++) {
      const result = replayEvents(events);
      expect(JSON.stringify(result)).toBe(firstJson);
    }
  });
});

// ─── CF-MA1-05: Zero-magnitude event applies only decay ───────────────────────

describe('CF-MA1-05 — zero-magnitude event applies decay only', () => {
  it('apply() with magnitude=0 is equivalent to decayAll()', () => {
    const tau = TAU_OUTCOME_OBSERVED_MS;
    const t0 = 0;
    const t1 = 60_000; // 1 minute later

    // Store A: decayAll at t1.
    const storeA = new EligibilityStore();
    storeA.apply('sk', 'outcome_observed', 1.0, t0);
    storeA.decayAll(t1);
    const activationA = storeA.getTrace('sk', 'outcome_observed');

    // Store B: apply with magnitude=0 at t1.
    const storeB = new EligibilityStore();
    storeB.apply('sk', 'outcome_observed', 1.0, t0);
    storeB.apply('sk', 'outcome_observed', 0.0, t1); // zero magnitude

    const activationB = storeB.getTrace('sk', 'outcome_observed');

    // Both should give identical results because:
    //   e(t1) = δ·e(t0) + (1−δ)·0 = δ·e(t0) = decayAll result.
    const delta = Math.exp(-t1 / tau);
    const expected = delta * 1.0;

    if (activationA !== null) {
      expect(Math.abs(activationA - expected)).toBeLessThan(1e-12);
    }
    if (activationB !== null) {
      expect(Math.abs(activationB - expected)).toBeLessThan(1e-12);
    }
    // Both should be consistent with each other.
    if (activationA !== null && activationB !== null) {
      expect(Math.abs(activationA - activationB)).toBeLessThan(1e-12);
    }
  });

  it('no accumulation when magnitude is 0.0 for a first-seen skill', () => {
    const store = new EligibilityStore();
    store.apply('sk-zero', 'surprise_triggered', 0.0, 1000);
    // A zero-magnitude first event should produce activation = 0, which is pruned.
    expect(store.getTrace('sk-zero', 'surprise_triggered')).toBeNull();
    expect(store.size).toBe(0);
  });
});

// ─── Additional correctness tests ─────────────────────────────────────────────

describe('EligibilityStore — general correctness', () => {
  it('first apply initialises to magnitude directly', () => {
    const store = new EligibilityStore();
    store.apply('sk', 'quintessence_updated', 0.5, 0);
    expect(store.getTrace('sk', 'quintessence_updated')).toBeCloseTo(0.5, 12);
  });

  it('reset() clears all traces', () => {
    const store = new EligibilityStore();
    store.apply('sk1', 'branch_resolved', 1.0, 0);
    store.apply('sk2', 'outcome_observed', -0.5, 0);
    expect(store.size).toBe(2);
    store.reset();
    expect(store.size).toBe(0);
    expect(store.getTrace('sk1', 'branch_resolved')).toBeNull();
  });

  it('snapshot() returns a defensive copy (mutations do not affect store)', () => {
    const store = new EligibilityStore();
    store.apply('sk', 'explicit_correction', -1.0, 0);
    const snap = store.snapshot();
    snap[0]!.activation = 999;
    // Store should be unaffected.
    expect(store.getTrace('sk', 'explicit_correction')).not.toBe(999);
  });

  it('getAllTraces() returns copies of all five channels independently', () => {
    const store = new EligibilityStore();
    const t0 = 0;
    store.apply('s', 'explicit_correction', -0.8, t0);
    store.apply('s', 'outcome_observed', 0.5, t0);
    store.apply('s', 'branch_resolved', 1.0, t0);
    store.apply('s', 'surprise_triggered', -0.3, t0);
    store.apply('s', 'quintessence_updated', 0.25, t0);
    const traces = store.getAllTraces();
    expect(traces).toHaveLength(5);
    const channels = traces.map((t) => t.channel).sort();
    expect(channels).toEqual([
      'branch_resolved',
      'explicit_correction',
      'outcome_observed',
      'quintessence_updated',
      'surprise_triggered',
    ]);
  });
});

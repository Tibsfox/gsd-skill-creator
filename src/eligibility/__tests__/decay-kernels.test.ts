/**
 * MA-1 Eligibility-Trace Layer — decay-kernels unit tests.
 *
 * Verifies the per-channel exponential decay functions match the
 * continuous-time extension of Barto 1983 Eq. 3 (p. 841).
 */

import { describe, it, expect } from 'vitest';
import {
  decayForChannel,
  decayFromTau,
  tauForChannel,
  pruneHorizonMs,
  TAU_EXPLICIT_CORRECTION_MS,
  TAU_OUTCOME_OBSERVED_MS,
  TAU_BRANCH_RESOLVED_MS,
  TAU_SURPRISE_TRIGGERED_MS,
  TAU_QUINTESSENCE_UPDATED_MS,
} from '../decay-kernels.js';
import type { ReinforcementChannel } from '../../types/reinforcement.js';
import { PRUNE_EPSILON } from '../traces.js';

const ALL_CHANNELS: ReinforcementChannel[] = [
  'explicit_correction',
  'outcome_observed',
  'branch_resolved',
  'surprise_triggered',
  'quintessence_updated',
];

// ─── τ defaults ───────────────────────────────────────────────────────────────

describe('tauForChannel — default values', () => {
  it('explicit_correction τ = 7 days', () => {
    expect(tauForChannel('explicit_correction')).toBe(TAU_EXPLICIT_CORRECTION_MS);
    expect(TAU_EXPLICIT_CORRECTION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('outcome_observed τ = 1 hour', () => {
    expect(tauForChannel('outcome_observed')).toBe(TAU_OUTCOME_OBSERVED_MS);
    expect(TAU_OUTCOME_OBSERVED_MS).toBe(60 * 60 * 1000);
  });

  it('branch_resolved τ = 24 hours', () => {
    expect(tauForChannel('branch_resolved')).toBe(TAU_BRANCH_RESOLVED_MS);
    expect(TAU_BRANCH_RESOLVED_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('surprise_triggered τ = 10 minutes', () => {
    expect(tauForChannel('surprise_triggered')).toBe(TAU_SURPRISE_TRIGGERED_MS);
    expect(TAU_SURPRISE_TRIGGERED_MS).toBe(10 * 60 * 1000);
  });

  it('quintessence_updated τ = 3 days', () => {
    expect(tauForChannel('quintessence_updated')).toBe(TAU_QUINTESSENCE_UPDATED_MS);
    expect(TAU_QUINTESSENCE_UPDATED_MS).toBe(3 * 24 * 60 * 60 * 1000);
  });

  it('τ override is respected', () => {
    expect(tauForChannel('outcome_observed', { tauOutcomeObservedMs: 9999 })).toBe(9999);
    expect(tauForChannel('surprise_triggered', { tauSurpriseTriggeredMs: 42 })).toBe(42);
  });
});

// ─── decayForChannel ──────────────────────────────────────────────────────────

describe('decayForChannel — exponential decay properties', () => {
  it('δ(0) = 1 for all channels (no elapsed time → no decay)', () => {
    for (const ch of ALL_CHANNELS) {
      expect(decayForChannel(ch, 0)).toBe(1.0);
    }
  });

  it('δ(τ) ≈ 0.3679 for all channels (one time-constant elapsed)', () => {
    for (const ch of ALL_CHANNELS) {
      const tau = tauForChannel(ch);
      const delta = decayForChannel(ch, tau);
      // exp(-1) ≈ 0.36787944117...
      expect(Math.abs(delta - Math.exp(-1))).toBeLessThan(1e-12);
    }
  });

  it('δ(2τ) ≈ e^{-2} for all channels', () => {
    for (const ch of ALL_CHANNELS) {
      const tau = tauForChannel(ch);
      const delta = decayForChannel(ch, 2 * tau);
      expect(Math.abs(delta - Math.exp(-2))).toBeLessThan(1e-12);
    }
  });

  it('δ ∈ [0, 1] for non-negative Δt', () => {
    for (const ch of ALL_CHANNELS) {
      for (const dt of [0, 1, 1000, 1e9]) {
        const delta = decayForChannel(ch, dt);
        expect(delta).toBeGreaterThanOrEqual(0);
        expect(delta).toBeLessThanOrEqual(1);
      }
    }
  });

  it('δ is monotonically decreasing in Δt', () => {
    const ch = 'outcome_observed' as const;
    const deltas = [0, 1000, 60_000, 3_600_000].map((dt) => decayForChannel(ch, dt));
    for (let i = 1; i < deltas.length; i++) {
      expect(deltas[i]).toBeLessThan(deltas[i - 1]!);
    }
  });

  it('τ override changes the decay rate proportionally', () => {
    // Halving τ should square the decay factor at Δt=τ_original.
    const tau = TAU_OUTCOME_OBSERVED_MS;
    const normal = decayForChannel('outcome_observed', tau);
    const fast = decayForChannel('outcome_observed', tau, { tauOutcomeObservedMs: tau / 2 });
    // fast = exp(-tau / (tau/2)) = exp(-2) ≈ normal^2.
    expect(Math.abs(fast - normal * normal)).toBeLessThan(1e-12);
  });
});

// ─── decayFromTau ─────────────────────────────────────────────────────────────

describe('decayFromTau — raw kernel', () => {
  it('matches decayForChannel for the same τ values', () => {
    for (const ch of ALL_CHANNELS) {
      const tau = tauForChannel(ch);
      const dt = tau * 0.5;
      const expected = decayForChannel(ch, dt);
      const actual = decayFromTau(tau, dt);
      expect(Math.abs(actual - expected)).toBeLessThan(1e-15);
    }
  });

  it('τ=0 returns 0.0 for any Δt > 0 (instantaneous full decay)', () => {
    expect(decayFromTau(0, 1000)).toBe(0.0);
  });

  it('Δt=0 returns 1.0 regardless of τ', () => {
    expect(decayFromTau(1e9, 0)).toBe(1.0);
    expect(decayFromTau(1, 0)).toBe(1.0);
  });
});

// ─── pruneHorizonMs ───────────────────────────────────────────────────────────

describe('pruneHorizonMs', () => {
  it('activation decays below PRUNE_EPSILON after pruneHorizonMs for all channels', () => {
    for (const ch of ALL_CHANNELS) {
      const horizonMs = pruneHorizonMs(ch);
      const decay = decayForChannel(ch, horizonMs);
      // Starting activation of 1.0, after horizon the decayed value is:
      //   decay * 1.0 = exp(-horizon / τ) = exp(-ln(1e12)) = 1e-12 = PRUNE_EPSILON
      expect(decay * 1.0).toBeCloseTo(PRUNE_EPSILON, 15);
    }
  });

  it('pruneHorizonMs respects τ overrides', () => {
    const smallTau = 100; // 100ms
    const horizon = pruneHorizonMs('outcome_observed', { tauOutcomeObservedMs: smallTau });
    expect(horizon).toBeCloseTo(smallTau * Math.log(1e12), 5);
  });
});

// ─── All 5 channels exercised with their own τ ─────────────────────────────────

describe('all 5 channels — independent τ verification', () => {
  const channelTaus: Array<[ReinforcementChannel, number]> = [
    ['explicit_correction', TAU_EXPLICIT_CORRECTION_MS],
    ['outcome_observed', TAU_OUTCOME_OBSERVED_MS],
    ['branch_resolved', TAU_BRANCH_RESOLVED_MS],
    ['surprise_triggered', TAU_SURPRISE_TRIGGERED_MS],
    ['quintessence_updated', TAU_QUINTESSENCE_UPDATED_MS],
  ];

  for (const [channel, tau] of channelTaus) {
    it(`${channel}: δ at Δt=τ/2 matches exp(-0.5)`, () => {
      const delta = decayForChannel(channel, tau / 2);
      expect(Math.abs(delta - Math.exp(-0.5))).toBeLessThan(1e-12);
    });
  }

  it('channels have distinct τ values (no accidental equality)', () => {
    const taus = channelTaus.map(([, tau]) => tau);
    const uniqueTaus = new Set(taus);
    expect(uniqueTaus.size).toBe(5);
  });
});

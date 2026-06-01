/**
 * CF3-elig — real MA-6 reinforcement log drives the MA-1 eligibility-trace layer.
 *
 * `src/eligibility` (MA-1) is a dormant substrate: ZERO non-test importers. Its
 * unit tests prove the TD(λ) recurrence and per-channel decay against hand-built
 * event literals, but nobody exercises the DESIGNED end-to-end boundary: real MA-6
 * emitters → `writeReinforcementEvents` (real JSONL on disk) → `replayReinforcementLog`
 * / `getFinalTraces` → `EligibilityReader.getAllTracesAt` (the MA-2 consumer
 * read-surface). The JSONL serialize/round-trip AND the decayed read API are
 * unproven together at the boundary.
 *
 * This is the #10438 verify-axis proof (v929 "composition-root N/A" pattern): the
 * trace layer ends at its read surface because MA-1 has zero production consumers;
 * the integration test IS that consume-axis closure, driving real events through
 * the real disk writer, not hand-built literals.
 *
 * Coverage:
 *   1. a single outcome spike round-trips through real JSONL to activation 1.0.
 *   2. the read API decays the replayed spike geometrically (e^-1 at +τ, e^-2 at +2τ).
 *   3. accumulation matches the closed-form TD(λ) recurrence e = δ·e + (1−δ)·r.
 *   4. distinct channels decay at distinct τ (surprise faster than outcome).
 *   5. a multi-skill multi-channel real-disk log yields one trace per (skill,channel).
 *
 * @module tests/integration/eligibility-reinforcement-replay-wire
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { emitOutcomeObserved, emitSurpriseTriggered } from '../../src/reinforcement/emitters.js';
import { writeReinforcementEvents } from '../../src/reinforcement/writer.js';
import {
  EligibilityStore,
  EligibilityReader,
  getFinalTraces,
  getFinalTracesFromEvents,
  TAU_OUTCOME_OBSERVED_MS,
  TAU_SURPRISE_TRIGGERED_MS,
  decayForChannel,
} from '../../src/eligibility/index.js';

describe('CF3-elig — real MA-6 log drives the MA-1 eligibility-trace layer', () => {
  const T0 = 1_700_000_000_000; // integer ms ⇒ byte-exact decay

  let tmpDir: string;
  let logPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'elig-'));
    logPath = join(tmpDir, 'reinforcement.jsonl');
  });
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('a single outcome spike round-trips through the real JSONL log to activation 1.0', async () => {
    const spike = emitOutcomeObserved({
      actor: 'sk-1', magnitude: 1.0, ts: T0, metadata: { outcomeKind: 'test-pass' }, id: 'spike',
    });
    await writeReinforcementEvents([spike], logPath);

    const traces = await getFinalTraces(logPath);
    expect(traces).toHaveLength(1);
    expect(traces[0].activation).toBe(1);
    expect(traces[0].skillId).toBe('sk-1');
    expect(traces[0].channel).toBe('outcome_observed');
  });

  it('the read API decays a replayed spike geometrically (e^-1 at +τ, e^-2 at +2τ)', async () => {
    const spike = emitOutcomeObserved({
      actor: 'sk-1', magnitude: 1.0, ts: T0, metadata: { outcomeKind: 'test-pass' }, id: 'spike',
    });
    await writeReinforcementEvents([spike], logPath);
    const traces = await getFinalTraces(logPath);

    // Reconstruct a store from the replayed final trace, then read it decayed-to-ts
    // through the MA-2 consumer surface (EligibilityReader, non-mutating).
    const store = new EligibilityStore();
    for (const t of traces) store.apply(t.skillId, t.channel, t.activation, t.lastUpdatedTs);
    const reader = new EligibilityReader(store);

    const atTau = reader.getAllTracesAt(T0 + TAU_OUTCOME_OBSERVED_MS);
    const at2Tau = reader.getAllTracesAt(T0 + 2 * TAU_OUTCOME_OBSERVED_MS);
    expect(atTau).toHaveLength(1);
    expect(atTau[0].activation).toBeCloseTo(Math.exp(-1), 12);
    expect(at2Tau[0].activation).toBeCloseTo(Math.exp(-2), 12);
  });

  it('accumulation matches the closed-form TD(λ) recurrence e = δ·e + (1−δ)·r', () => {
    const dt = 1_800_000; // 30 min, exact integer ms
    const delta = Math.exp(-dt / TAU_OUTCOME_OBSERVED_MS); // analytic δ for this Δt
    const e1 = emitOutcomeObserved({
      actor: 'sk-2', magnitude: 1.0, ts: T0, metadata: { outcomeKind: 'test-pass' }, id: 'a0',
    });
    const e2 = emitOutcomeObserved({
      actor: 'sk-2', magnitude: 0.4, ts: T0 + dt, metadata: { outcomeKind: 'test-pass' }, id: 'a1',
    });
    const traces = getFinalTracesFromEvents([e1, e2]);
    const expected = delta * 1.0 + (1 - delta) * 0.4;
    expect(traces).toHaveLength(1);
    expect(traces[0].activation).toBeCloseTo(expected, 9);
  });

  it('distinct channels decay at distinct τ (surprise faster than outcome)', () => {
    const dt = TAU_SURPRISE_TRIGGERED_MS; // 600_000 ⇒ one surprise time-constant
    expect(decayForChannel('surprise_triggered', dt)).toBeCloseTo(Math.exp(-1), 12);
    expect(decayForChannel('surprise_triggered', dt)).toBeLessThan(
      decayForChannel('outcome_observed', dt),
    );
  });

  it('a multi-skill multi-channel real-disk log yields one independent trace per (skill,channel)', async () => {
    const events = [
      emitOutcomeObserved({ actor: 'sk-1', magnitude: 0.8, ts: T0, metadata: { outcomeKind: 'test-pass' }, id: 'm0' }),
      emitSurpriseTriggered({ actor: 'sk-1', magnitude: -0.5, ts: T0, metadata: { sigma: 3, klDivergence: 0.5, threshold: 2 }, id: 'm1' }),
      emitOutcomeObserved({ actor: 'sk-2', magnitude: 0.6, ts: T0, metadata: { outcomeKind: 'test-pass' }, id: 'm2' }),
    ];
    await writeReinforcementEvents(events, logPath);

    const traces = await getFinalTraces(logPath);
    expect(traces).toHaveLength(3); // (sk-1,outcome) (sk-1,surprise) (sk-2,outcome)
    for (const t of traces) {
      expect(Number.isFinite(t.activation)).toBe(true);
      expect(Math.abs(t.activation)).toBeLessThanOrEqual(1 + 1e-10);
    }
    expect(new Set(traces.map((t) => t.channel))).toEqual(
      new Set(['outcome_observed', 'surprise_triggered']),
    );
  });
});

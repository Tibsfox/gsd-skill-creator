/**
 * MA-2 ACE — integration.test.ts
 *
 * IT-W1-MA2: end-to-end wire — reinforcement event from any of 5 channels
 * produces a measurable actor-signal change within 3 ticks.
 *
 * Wires:  MA-6 reinforcement event → MA-1 eligibility trace → MA-2 δ →
 *         ActorSignal → M5 selector.
 *
 * @module ace/__tests__/integration.test
 */

import { describe, it, expect } from 'vitest';
import { AceLoop } from '../loop.js';
import { readingsFromMap } from '../td-error.js';
import { EligibilityStore } from '../../eligibility/traces.js';
import {
  REINFORCEMENT_CHANNELS,
  type ReinforcementChannel,
  type ReinforcementEvent,
} from '../../types/reinforcement.js';

// Helper: construct a minimal ReinforcementEvent for a given channel.
function evt(
  channel: ReinforcementChannel,
  magnitude: number,
  ts: number,
): ReinforcementEvent {
  const value = {
    magnitude,
    direction:
      magnitude > 0
        ? ('positive' as const)
        : magnitude < 0
          ? ('negative' as const)
          : ('neutral' as const),
  };
  const common = { id: `e-${channel}-${ts}`, ts, actor: 'skill-alpha', value };
  switch (channel) {
    case 'explicit_correction':
      return { ...common, channel, metadata: { skillId: 'skill-alpha' } };
    case 'outcome_observed':
      return { ...common, channel, metadata: { outcomeKind: 'test-pass' } };
    case 'branch_resolved':
      return {
        ...common,
        channel,
        metadata: { branchId: 'b1', resolution: 'committed' },
      };
    case 'surprise_triggered':
      return {
        ...common,
        channel,
        metadata: { sigma: 3, klDivergence: 1.2, threshold: 2 },
      };
    case 'quintessence_updated':
      return {
        ...common,
        channel,
        metadata: {
          axes: {
            selfVsNonSelf: 0,
            essentialTensions: 0,
            growthAndEnergyFlow: 0,
            stabilityVsNovelty: 0,
            fatefulEncounters: 0,
          },
        },
      };
    default: {
      const _x: never = channel;
      void _x;
      throw new Error('unreachable');
    }
  }
}

describe('IT-W1-MA2 — end-to-end actor-critic wire', () => {
  for (const ch of REINFORCEMENT_CHANNELS) {
    it(`reinforcement event on "${ch}" produces a measurable actor-signal change within 3 ticks`, () => {
      const skillId = 'skill-alpha';
      const store = new EligibilityStore();
      const t0 = 1_000_000;

      // Baseline loop: 3 quiet ticks (no events, constant negF). Record final δ.
      const quietLoop = new AceLoop({
        enabledOverride: true,
        tdOptions: { tractabilityClass: 'tractable' },
      });
      for (let t = 1; t <= 3; t++) {
        quietLoop.tick({ readings: [], negFCurr: 0 });
      }
      const quietDelta = quietLoop.criticRef.cumulativeDelta;

      // Live loop: apply a reinforcement event via EligibilityStore, read
      // the eligibility trace, and feed it to the loop along with a non-zero
      // negF shift reflecting M7's response.
      store.apply(skillId, ch, -1, t0);
      const liveLoop = new AceLoop({
        enabledOverride: true,
        tdOptions: { tractabilityClass: 'tractable' },
      });

      let lastDelta = 0;
      for (let t = 1; t <= 3; t++) {
        const ts = t0 + t * 1_000;
        // eligibility value decays; we query the store as of ts.
        const elig = store.getTrace(skillId, ch) ?? 0;
        const readings = readingsFromMap({
          [ch]: { eligibility: elig, reinforcement: t === 1 ? -1 : 0 },
        });
        const r = liveLoop.tick({ readings, negFCurr: 0.1 * t });
        expect(r).not.toBeNull();
        lastDelta = r!.delta;
      }

      // Measurable change: at least one tick produced a non-zero δ.
      expect(liveLoop.criticRef.cumulativeDelta).not.toBe(quietDelta);
      expect(Math.abs(lastDelta)).toBeGreaterThan(0);
    });
  }

  it('end-to-end: reinforcement → eligibility → δ → signal (cumulative trace)', () => {
    const store = new EligibilityStore();
    const loop = new AceLoop({
      enabledOverride: true,
      tdOptions: { tractabilityClass: 'tractable' },
    });

    const skill = 'skill-alpha';
    store.apply(skill, 'outcome_observed', 1, 1_000);

    const elig = store.getTrace(skill, 'outcome_observed')!;
    expect(elig).toBeGreaterThan(0);

    const readings = readingsFromMap({
      outcome_observed: { eligibility: elig, reinforcement: 1 },
    });
    const r = loop.tick({ readings, negFCurr: 0.2 });
    expect(r).not.toBeNull();
    expect(r!.signal.delta).not.toBe(0);
    // Signal carries the eligibility through to the actor side.
    expect(r!.signal.perChannelEligibility.outcome_observed).toBe(elig);
  });
});

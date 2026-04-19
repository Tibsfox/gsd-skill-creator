/**
 * CF-M7-06 + CF-M7-07 + SC-DARK — action-policy tests.
 */

import { describe, it, expect } from 'vitest';
import { actPerceptionTick, rankActions, type CandidateAction } from '../actionPolicy.js';
import { makeUniformModel } from '../generativeModel.js';
import { minimiseFreeEnergy } from '../freeEnergy.js';
import type { GenerativeModel } from '../../types/umwelt.js';

function buildBaseline(): GenerativeModel {
  // 2 intents, 3 observation types. i0 -> o0 heavy, i1 -> o2 heavy.
  return {
    intentClasses: ['i0', 'i1'],
    condProbTable: [
      [0.7, 0.2, 0.1],
      [0.1, 0.2, 0.7],
    ],
    priors: [0.5, 0.5],
  };
}

describe('CF-M7-06 — expected-F-reduction ranking matches hand-computed ground truth', () => {
  // Hand computation (no epistemic bonus, preferred = [1, 0, 0]):
  //   q = [0.5, 0.5]
  //   predicted_baseline = [0.4, 0.2, 0.4]
  //   KL(predicted_baseline || preferred=[1,0,0])  = +∞ (preferred has 0 mass on obs 1,2)
  //
  // To get finite hand-computed values we use a smoothed preferred
  // distribution and drop the epistemic bonus (epistemicWeight = 0).
  const preferred = [0.98, 0.01, 0.01];

  function kl(p: number[], q: number[]): number {
    let s = 0;
    for (let j = 0; j < p.length; j++) {
      if (p[j] > 0) s += p[j] * (Math.log(p[j]) - Math.log(q[j]));
    }
    return s;
  }

  it('ranks a preferred-biased action above the baseline action', () => {
    const baseline = buildBaseline();
    const q = [0.5, 0.5];
    const biasedTable = [
      [0.95, 0.03, 0.02],
      [0.9, 0.05, 0.05],
    ]; // deterministically steers toward o0 regardless of intent

    const baselinePred = [0.4, 0.2, 0.4];
    const biasedPred = [0.925, 0.04, 0.035];
    const baselineKL = kl(baselinePred, preferred);
    const biasedKL = kl(biasedPred, preferred);

    const ranked = rankActions(
      q,
      baseline,
      [
        { id: 'baseline', activity: 1 },
        { id: 'biased', condProbTable: biasedTable, activity: 1 },
      ],
      { preferred, epistemicWeight: 0 },
    );

    expect(ranked[0].id).toBe('biased');
    expect(ranked[1].id).toBe('baseline');
    expect(ranked[0].pragmatic).toBeCloseTo(biasedKL, 6);
    expect(ranked[1].pragmatic).toBeCloseTo(baselineKL, 6);
  });

  it('20-fixture scenarios: hand-computed ranking matches implementation', () => {
    const baseline = buildBaseline();
    let matches = 0;
    for (let t = 0; t < 20; t++) {
      // Fixture scenario: action A's table skews to one observation type
      // chosen by t % 3. Action B is the baseline. Correct winner is the
      // action whose predicted distribution has lower KL to the preferred.
      const skew = t % 3;
      const bias = 0.8 + ((t * 0.01) % 0.1);
      const rest = (1 - bias) / 2;
      const tableA: number[][] = [
        [rest, rest, rest],
        [rest, rest, rest],
      ];
      for (let i = 0; i < 2; i++) tableA[i][skew] = bias;

      const pref = [0.01, 0.01, 0.01];
      pref[skew] = 0.98;

      const actions: CandidateAction[] = [
        { id: 'A', condProbTable: tableA, activity: 1 },
        { id: 'B', activity: 1 },
      ];
      const ranked = rankActions([0.5, 0.5], baseline, actions, {
        preferred: pref,
        epistemicWeight: 0,
      });

      // Compute predicted distributions by hand for both.
      const predA = [
        0.5 * tableA[0][0] + 0.5 * tableA[1][0],
        0.5 * tableA[0][1] + 0.5 * tableA[1][1],
        0.5 * tableA[0][2] + 0.5 * tableA[1][2],
      ];
      const predB = [
        0.5 * baseline.condProbTable[0][0] + 0.5 * baseline.condProbTable[1][0],
        0.5 * baseline.condProbTable[0][1] + 0.5 * baseline.condProbTable[1][1],
        0.5 * baseline.condProbTable[0][2] + 0.5 * baseline.condProbTable[1][2],
      ];
      const klA = kl(predA, pref);
      const klB = kl(predB, pref);
      const groundTruthWinner = klA < klB ? 'A' : 'B';
      if (ranked[0].id === groundTruthWinner) matches++;
    }
    expect(matches).toBe(20);
  });
});

describe('CF-M7-07 — perception-action alternation per tick', () => {
  it('actPerceptionTick exposes both a perception size and an action winner', () => {
    const baseline = buildBaseline();
    const fe = minimiseFreeEnergy(baseline, [0]);
    const tick = actPerceptionTick(
      fe.q,
      baseline,
      [
        { id: 'noop', activity: 1 },
        { id: 'nudge', activity: 1 },
      ],
      { preferred: [0.8, 0.1, 0.1], epistemicWeight: 0 },
    );
    expect(tick.perceptionSize).toBe(baseline.intentClasses.length);
    expect(tick.winner).toBeDefined();
    expect(tick.ranked).toHaveLength(2);
  });

  it('throws when the action set is empty', () => {
    const baseline = buildBaseline();
    const fe = minimiseFreeEnergy(baseline, [0]);
    expect(() =>
      actPerceptionTick(fe.q, baseline, [], {
        preferred: [1, 0, 0],
      }),
    ).toThrow(/at least one/);
  });
});

describe('SC-DARK — dark-room guard triggers minimum-activity floor', () => {
  it('penalises a zero-activity action and prefers a non-zero activity alternative', () => {
    const baseline = buildBaseline();
    // "Silence" preferred distribution — everything concentrated on one
    // observation type (representing silence / no-op outcome).
    const preferred = [0.98, 0.01, 0.01];
    const idleTable: number[][] = [
      [0.98, 0.01, 0.01],
      [0.98, 0.01, 0.01],
    ];
    // This action matches the preferred distribution perfectly; WITHOUT
    // the guard it would win. With the guard (activity=0, below the floor)
    // it gets penalised and the non-idle alternative wins.
    const actions: CandidateAction[] = [
      {
        id: 'idle',
        condProbTable: idleTable,
        activity: 0,
      },
      {
        id: 'active',
        condProbTable: baseline.condProbTable,
        activity: 1,
      },
    ];
    const ranked = rankActions([0.5, 0.5], baseline, actions, {
      preferred,
      epistemicWeight: 0,
      minActivity: 0.1,
    });
    expect(ranked[0].id).toBe('active');
    const idle = ranked.find((r) => r.id === 'idle')!;
    expect(idle.darkRoomFlagged).toBe(true);
  });

  it('without guard (minActivity=0) the silence-minimising action wins', () => {
    // Sanity check that the test scenario above actually depends on the
    // guard — i.e. the idle action genuinely has lower un-guarded EFE.
    const baseline = buildBaseline();
    const preferred = [0.98, 0.01, 0.01];
    const idleTable: number[][] = [
      [0.98, 0.01, 0.01],
      [0.98, 0.01, 0.01],
    ];
    const actions: CandidateAction[] = [
      { id: 'idle', condProbTable: idleTable, activity: 0 },
      { id: 'active', condProbTable: baseline.condProbTable, activity: 1 },
    ];
    const ranked = rankActions([0.5, 0.5], baseline, actions, {
      preferred,
      epistemicWeight: 0,
      minActivity: 0, // guard disabled
    });
    expect(ranked[0].id).toBe('idle');
  });

  it('activity above the floor is not flagged', () => {
    const baseline = buildBaseline();
    const preferred = [0.5, 0.25, 0.25];
    const actions: CandidateAction[] = [
      { id: 'steady', activity: 1 },
      { id: 'fast', activity: 5 },
    ];
    const ranked = rankActions([0.5, 0.5], baseline, actions, {
      preferred,
      minActivity: 0.1,
    });
    for (const r of ranked) expect(r.darkRoomFlagged).toBe(false);
  });
});

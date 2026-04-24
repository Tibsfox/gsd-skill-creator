/**
 * Cross-Entropy Method planner — latent-space wave rehearsal.
 *
 * Ports LeWM's CEM-in-latent-space approach. Sample K random action sequences,
 * roll them out through the predictor, keep the top-N elite by predicted cost,
 * refit the sampling distribution on the elite set, repeat. Returns the best
 * advisory action sequence found.
 *
 * HARD CAPCOM PRESERVATION: the returned `AdvisoryPlan` carries
 * `advisoryOnly: true` as a compile-time-const tag. Nothing in this module
 * dispatches a wave, activates a skill, or writes CAPCOM state. The plan is
 * data — a recommendation for the orchestrator's human-gate to consider or
 * ignore.
 *
 * @module mission-world-model/cem
 */

import type {
  AdvisoryPlan,
  MissionAction,
  MissionLatent,
  MissionWorldModelConfig,
} from './types.js';
import { rollout } from './predictor.js';

const ACTION_POOL: ReadonlyArray<MissionAction> = [
  'dispatch-wave',
  'allocate-model',
  'activate-skill',
  'request-capcom-review',
  'no-op',
];

/** Deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function euclidean(a: ReadonlyArray<number>, b: ReadonlyArray<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

function sampleAction(probs: ReadonlyArray<number>, rand: () => number): number {
  const r = rand();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r <= acc) return i;
  }
  return probs.length - 1;
}

/**
 * Plan a wave rollout with CEM. Returns the best advisory action sequence.
 * Pure + deterministic when `config.seed` is set.
 */
export function planWaveAdvisory(
  startLatent: MissionLatent,
  goalLatent: MissionLatent,
  config: MissionWorldModelConfig,
): AdvisoryPlan {
  const rand = config.seed === undefined ? Math.random : mulberry32(config.seed);
  const numActions = ACTION_POOL.length;
  // Per-step categorical distribution over actions, initialized uniform.
  let dist: number[][] = new Array(config.planningHorizon)
    .fill(0)
    .map(() => new Array<number>(numActions).fill(1 / numActions));

  let bestActions: MissionAction[] = [];
  let bestCost = Infinity;
  let bestFinalLatent: MissionLatent = startLatent;

  for (let iter = 0; iter < config.cemIterations; iter++) {
    const samples: Array<{ actions: MissionAction[]; cost: number; final: MissionLatent }> = [];
    for (let s = 0; s < config.cemSamples; s++) {
      const actions: MissionAction[] = [];
      for (let h = 0; h < config.planningHorizon; h++) {
        const idx = sampleAction(dist[h], rand);
        actions.push(ACTION_POOL[idx]);
      }
      const finalLatent = rollout(startLatent, actions);
      const cost = euclidean(finalLatent, goalLatent);
      samples.push({ actions, cost, final: finalLatent });
      if (cost < bestCost) {
        bestCost = cost;
        bestActions = actions;
        bestFinalLatent = finalLatent;
      }
    }
    // Refit distribution from the elite set.
    samples.sort((a, b) => a.cost - b.cost);
    const eliteCount = Math.max(1, Math.floor(config.cemSamples * config.cemEliteFraction));
    const elite = samples.slice(0, eliteCount);
    const newDist: number[][] = new Array(config.planningHorizon)
      .fill(0)
      .map(() => new Array<number>(numActions).fill(0));
    for (const e of elite) {
      for (let h = 0; h < config.planningHorizon; h++) {
        const idx = ACTION_POOL.indexOf(e.actions[h]);
        if (idx >= 0) newDist[h][idx] += 1;
      }
    }
    // Normalize + smooth with a tiny uniform floor to avoid collapse.
    const smooth = 0.05;
    for (let h = 0; h < config.planningHorizon; h++) {
      let sum = 0;
      for (let i = 0; i < numActions; i++) sum += newDist[h][i];
      if (sum === 0) sum = 1;
      for (let i = 0; i < numActions; i++) {
        newDist[h][i] = (newDist[h][i] / sum) * (1 - smooth) + smooth / numActions;
      }
    }
    dist = newDist;
  }

  return {
    actions: bestActions,
    predictedFinalLatent: bestFinalLatent,
    predictedCost: bestCost,
    iterationsRun: config.cemIterations,
    advisoryOnly: true,
    runTag:
      `cem|H=${config.planningHorizon}|K=${config.cemSamples}|elite=${config.cemEliteFraction}|` +
      `iter=${config.cemIterations}|d=${config.latentDim}|` +
      (config.seed === undefined ? 'rand' : `s${config.seed}`),
  };
}

/**
 * Mission-state encoder — pure deterministic feature-hashing encoder.
 *
 * Produces a ≤192-dim latent from raw MissionState. Intentionally simple:
 * random-projected feature hash with a small set of normalized base features.
 * No learned parameters this phase — Phase 732 ships the *architecture*; a
 * future phase may train the encoder.
 *
 * @module mission-world-model/encoder
 */

import type { MissionLatent, MissionState, MissionWorldModelConfig } from './types.js';

/** Deterministic FNV-1a 32-bit hash. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Encode a MissionState into a deterministic compact latent. */
export function encodeMissionState(
  state: MissionState,
  config: MissionWorldModelConfig,
): MissionLatent {
  if (config.latentDim <= 0 || config.latentDim > 192) {
    throw new Error(
      `latentDim must be in (0, 192]; LeWM reference is 192. Got ${config.latentDim}.`,
    );
  }
  const dim = config.latentDim;
  const v = new Array<number>(dim).fill(0);
  // Base normalized features — bounded in [-1, 1] by construction.
  const base: Array<[string, number]> = [
    ['phase', Math.tanh(state.currentPhase / 1000)],
    ['completed', Math.tanh(state.completedTaskCount / 100)],
    ['gates', Math.tanh(state.openCapcomGateCount / 8)],
    ['budget', state.budgetFraction * 2 - 1],
    ['skills', Math.tanh(state.activeSkillCount / 50)],
  ];
  if (state.auxiliary) {
    for (const [k, val] of Object.entries(state.auxiliary)) {
      if (Number.isFinite(val)) base.push([`aux:${k}`, Math.tanh(val)]);
    }
  }
  // Feature-hash into the latent.
  for (const [key, val] of base) {
    const h = fnv1a(key);
    const idx = h % dim;
    const sign = (h & 0x80000000) !== 0 ? -1 : 1;
    v[idx] += sign * val;
  }
  // Normalize to unit length so downstream distances are comparable across states.
  let sumSq = 0;
  for (const x of v) sumSq += x * x;
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < dim; i++) v[i] /= norm;
  return v;
}

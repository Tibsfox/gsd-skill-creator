/**
 * MD-5 — Per-(skill, task-type) Learnable K_H barrel.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-5-learnable-K_H.md
 *
 * @module learnable-k_h
 */

export {
  createHead,
  forward,
  gradient,
  applyUpdateInPlace,
  cloneHead,
  sigmoid,
  type LearnableKHHead,
  type ForwardResult,
  type HeadGradient,
} from './head.js';

export {
  train,
  type TrainOptions,
  type TrainResult,
  type TrainRejectionReason,
  type LyapunovFixtureSample,
} from './trainer.js';

export {
  createStore,
  get,
  has,
  getOrCreate,
  put,
  remove,
  clear,
  size,
  serialize,
  deserialize,
  STORE_FORMAT_VERSION,
  type LearnableKHStore,
} from './store.js';

export {
  resolveKH,
  resolveKHScalar,
  type ResolveKHOptions,
  type ResolveKHResult,
} from './api.js';

export {
  verifyHeadPreservesDescent,
  composesWithLyapunov,
} from './lyapunov-composer.js';

export { readLearnableKHEnabledFlag } from './settings.js';

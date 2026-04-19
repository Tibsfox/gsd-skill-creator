/**
 * MB-2 — Smooth Projection Operators — barrel.
 *
 * Exports:
 *   - `smoothProject`, `projectToSimplex`, `projectedGradientUpdate`,
 *     `SIMPLEX_EPSILON` (core smooth-projection primitives)
 *   - `getBounds`, `isAdmissible`, `allParameterTypes`,
 *     `getTractabilityBoundScale` (parameter-bounds registry)
 *   - `projectKH`, `projectKHCandidate` (K_H projector adapter)
 *   - `projectModelRow`, `projectModel`, `verifySimplex` (M7 row projector)
 *   - `readProjectionEnabledFlag` (settings reader)
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-2-projection-operators.md
 *
 * @module projection
 */

export {
  smoothProject,
  projectToSimplex,
  projectedGradientUpdate,
  SIMPLEX_EPSILON,
  type SmoothProjectionResult,
  type SimplexProjectionResult,
  type ProjectedUpdateResult,
} from './smooth-projection.js';

export {
  getBounds,
  isAdmissible,
  allParameterTypes,
  getTractabilityBoundScale,
  type ParameterType,
  type ParameterBounds,
  type GetBoundsOptions,
} from './parameter-bounds.js';

export {
  projectKH,
  projectKHCandidate,
  type KHProjectorOptions,
  type KHProjectorResult,
} from './k_h-projector.js';

export {
  projectModelRow,
  projectModel,
  verifySimplex,
  type RowProjectionOptions,
  type RowProjectionResult,
  type ModelProjectionResult,
} from './generative-model-projector.js';

export { readProjectionEnabledFlag } from './settings.js';

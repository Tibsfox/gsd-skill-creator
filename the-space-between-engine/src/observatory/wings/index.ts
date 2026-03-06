/**
 * Observatory Wings — Barrel Export
 *
 * Wings 1-4: Geometry through Calculus
 * Each wing teaches one mathematical foundation through 6 phases:
 * Wonder -> See -> Touch -> Understand -> Connect -> Create
 */

// Wing 1: Unit Circle — "Seeing"
export {
  UnitCircleWing,
  wingMeta as unitCircleWingMeta,
  WING_ID as UNIT_CIRCLE_WING_ID,
  WING_NAME as UNIT_CIRCLE_WING_NAME,
} from './01-unit-circle/index.js';
export type { UnitCircleWingProps } from './01-unit-circle/index.js';

// Wing 2: Pythagorean Theorem — "Relationship"
export {
  PythagoreanWing,
  wingMeta as pythagoreanWingMeta,
  WING_ID as PYTHAGOREAN_WING_ID,
  WING_NAME as PYTHAGOREAN_WING_NAME,
} from './02-pythagorean/index.js';
export type { PythagoreanWingProps } from './02-pythagorean/index.js';

// Wing 3: Trigonometry — "Motion"
export {
  TrigonometryWing,
  wingMeta as trigonometryWingMeta,
  WING_ID as TRIGONOMETRY_WING_ID,
  WING_NAME as TRIGONOMETRY_WING_NAME,
} from './03-trigonometry/index.js';
export type { TrigonometryWingProps } from './03-trigonometry/index.js';

// Wing 4: Vector Calculus — "Fields"
export {
  VectorCalculusWing,
  wingMeta as vectorCalculusWingMeta,
  WING_ID as VECTOR_CALCULUS_WING_ID,
  WING_NAME as VECTOR_CALCULUS_WING_NAME,
} from './04-vector-calculus/index.js';
export type { VectorCalculusWingProps } from './04-vector-calculus/index.js';

// Aggregated metadata for all wings
import { wingMeta as ucMeta } from './01-unit-circle/index.js';
import { wingMeta as pythMeta } from './02-pythagorean/index.js';
import { wingMeta as trigMeta } from './03-trigonometry/index.js';
import { wingMeta as vcMeta } from './04-vector-calculus/index.js';

export const allWingMetas = [ucMeta, pythMeta, trigMeta, vcMeta] as const;

export type WingMeta = typeof ucMeta;

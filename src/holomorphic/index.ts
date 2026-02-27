export type {
  ComplexNumber,
  Orbit,
  FixedPoint,
  FixedPointClassification,
  JuliaConfig,
  SkillPosition,
  SkillDynamics,
  TopologicalProperty,
  ChangeType,
  ColorScheme,
  RGB,
} from './types';

export {
  add,
  sub,
  mul,
  div,
  magnitude,
  argument,
  conjugate,
  cexp,
  cpow,
  ZERO,
  ONE,
  I,
} from './complex/arithmetic';

export {
  computeOrbit,
  detectPeriod,
  computeMultiplier,
  classifyFixedPoint,
  isRationalMultipleOfPi,
} from './complex/iterate';
export type { IterationFn } from './complex/iterate';

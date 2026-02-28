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
} from './types.js';

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
} from './complex/arithmetic.js';

export {
  computeOrbit,
  detectPeriod,
  computeMultiplier,
  classifyFixedPoint,
  isRationalMultipleOfPi,
} from './complex/iterate.js';
export type { IterationFn } from './complex/iterate.js';

export {
  pixelToComplex,
  mandelbrotEscape,
  juliaEscape,
  colorMap,
  renderMandelbrot,
  renderJulia,
  applyZoom,
} from './renderer/core.js';
export type { Bounds } from './renderer/core.js';

export {
  renderBifurcation,
  renderOrbitPlot,
  renderPhasePortrait,
  colorFromScheme,
} from './renderer/helpers.js';

export {
  classifySkillDynamics,
  computeSkillOrbit,
  detectSkillFixedPoint,
  computeSkillMultiplier,
  classifyFatouJulia,
  clampAngularVelocity,
} from './dynamics/skill-dynamics.js';

export type {
  SnapshotMatrix,
  DMDResult,
  DMDEigenvalueClassification,
  DMDConstraints,
  KoopmanObservable,
} from './dmd/types.js';

export {
  dmd,
  svd,
  classifyDMDEigenvalue,
  reconstructFromDMD,
} from './dmd/dmd-core.js';

export { plotEigenvaluesOnUnitCircle } from './renderer/eigenvalue-plot.js';
export type { EigenvaluePlotData, EigenvaluePoint } from './renderer/eigenvalue-plot.js';

export { dmdc } from './dmd/dmd-control.js';
export type { DMDcResult } from './dmd/dmd-control.js';

export { mrdmd } from './dmd/dmd-multiresolution.js';

export { pidmd } from './dmd/dmd-physics.js';

export { bopdmd } from './dmd/dmd-robust.js';

export { edmd, liftDictionary } from './dmd/koopman.js';
export type { EDMDConfig } from './dmd/koopman.js';

export { bridgeDMDToSkillDynamics } from './dmd/skill-dmd-bridge.js';
export type { SkillDynamicsExtended } from './dmd/skill-dmd-bridge.js';

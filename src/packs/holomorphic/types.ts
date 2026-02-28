/** Complex number representation */
export interface ComplexNumber {
  re: number;
  im: number;
}

/** Orbit of a point under iteration */
export interface Orbit {
  z0: ComplexNumber;
  points: ComplexNumber[];
  escaped: boolean;
  escapeTime: number | null;
  period: number | null;
}

/** Fixed point classification types */
export type FixedPointClassification =
  | 'superattracting'
  | 'attracting'
  | 'repelling'
  | 'rationally_indifferent'
  | 'irrationally_indifferent';

/** Fixed point with multiplier and classification */
export interface FixedPoint {
  z: ComplexNumber;
  multiplier: ComplexNumber;
  classification: FixedPointClassification;
  period: number;
}

/** Julia set rendering configuration */
export interface JuliaConfig {
  c: ComplexNumber;
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  resolution: { width: number; height: number };
  maxIter: number;
  escapeRadius: number;
}

/** Skill position on the complex plane (from unit-circle framework) */
export interface SkillPosition {
  theta: number;
  radius: number;
}

/** Skill dynamics extending position with convergence behavior */
export interface SkillDynamics {
  position: SkillPosition;
  multiplier: ComplexNumber;
  classification: FixedPointClassification;
  fatouDomain: boolean;
  iterationHistory: ComplexNumber[];
  convergenceRate: number;
}

/** Topological property for HD-06 */
export interface TopologicalProperty {
  name: string;
  holds: boolean;
  proof_sketch?: string;
  relevance: string;
}

/** Change type classification for holomorphic dynamics */
export type ChangeType = 'convergent' | 'divergent' | 'periodic' | 'chaotic';

/** Color scheme for rendering */
export type ColorScheme = 'escape_time' | 'smooth' | 'binary';

/** RGB color value */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

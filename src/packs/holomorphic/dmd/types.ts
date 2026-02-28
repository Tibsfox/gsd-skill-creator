import type { ComplexNumber } from '../types.js';

/**
 * A matrix of snapshots from a dynamical system.
 *
 * Each entry in `data` is a column vector (snapshot) of measurements
 * taken at the corresponding timestamp.
 */
export interface SnapshotMatrix {
  /** Each inner array is a snapshot (column of state measurements) */
  data: number[][];
  /** Time values corresponding to each snapshot */
  timestamps: number[];
  /** Human-readable labels for each snapshot */
  labels: string[];
}

/**
 * Result of a Dynamic Mode Decomposition.
 *
 * Contains the modal decomposition of a dynamical system:
 * eigenvalues on the unit circle correspond to persistent modes,
 * inside = decaying (attracting), outside = growing (repelling).
 */
export interface DMDResult {
  /** Dynamic modes: each mode is a vector of complex numbers */
  modes: ComplexNumber[][];
  /** Eigenvalues of the projected operator A-tilde */
  eigenvalues: ComplexNumber[];
  /** Modal amplitudes (initial condition projection) */
  amplitudes: ComplexNumber[];
  /** Frequencies: imaginary part of log(eigenvalue) / dt */
  frequencies: number[];
  /** Growth rates: real part of log(eigenvalue) / dt */
  growthRates: number[];
  /** Rank of the SVD truncation */
  svdRank: number;
  /** Reconstruction residual (Frobenius norm) */
  residual: number;
}

/**
 * Classification of a DMD eigenvalue by its position relative
 * to the unit circle and its oscillatory behavior.
 *
 * - attracting: |lambda| < 1, small angle (decaying, non-oscillatory)
 * - repelling: |lambda| > 1, small angle (growing, non-oscillatory)
 * - neutral: |lambda| approx 1, small angle (persistent)
 * - oscillating_decay: |lambda| < 1, significant angle
 * - oscillating_growth: |lambda| > 1, significant angle
 */
export type DMDEigenvalueClassification =
  | 'attracting'
  | 'repelling'
  | 'neutral'
  | 'oscillating_decay'
  | 'oscillating_growth';

/**
 * Constraints for DMD-based learning, connecting piDMD
 * (physics-informed DMD) to bounded learning principles.
 */
export interface DMDConstraints {
  /** Maximum allowed eigenvalue magnitude (stability bound) */
  stabilityBound: number;
  /** Maximum allowed growth rate */
  maxGrowthRate: number;
  /** Maximum content change per refinement, mirroring skill-creator's 20% rule */
  boundedLearningLimit: number;
}

/**
 * An observable function for Extended DMD (Koopman operator theory).
 *
 * Koopman observables lift the state space into a higher-dimensional
 * function space where nonlinear dynamics become linear.
 */
export interface KoopmanObservable {
  /** Human-readable name for this observable */
  name: string;
  /** Evaluate the observable on a state vector */
  evaluate: (x: number[]) => number;
  /** Basis function type */
  type: 'polynomial' | 'radial_basis' | 'fourier' | 'custom';
}

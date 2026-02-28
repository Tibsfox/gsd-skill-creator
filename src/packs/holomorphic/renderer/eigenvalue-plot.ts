/**
 * Eigenvalue Visualizer — Unit Circle Plot for DMD Eigenvalues
 *
 * Generates structured plot data for visualizing DMD eigenvalues
 * relative to the unit circle in the complex plane. Eigenvalues
 * inside the circle are attracting (decaying), outside are repelling
 * (growing), and on the circle are neutral (persistent).
 */

import type { ComplexNumber } from '../types.js';
import { magnitude } from '../complex/arithmetic.js';

/** A point on the eigenvalue plot with classification metadata */
export interface EigenvaluePoint {
  x: number;
  y: number;
  classification: 'attracting' | 'neutral' | 'repelling';
  magnitude: number;
}

/** Complete plot data for an eigenvalue unit-circle visualization */
export interface EigenvaluePlotData {
  /** Points tracing the unit circle */
  unitCircle: { x: number; y: number }[];
  /** Eigenvalue positions with classification */
  eigenvalues: EigenvaluePoint[];
}

/** Tolerance for unit circle proximity */
const UNIT_CIRCLE_TOLERANCE = 0.001;

/**
 * Generate plot data for eigenvalues on the unit circle.
 *
 * Returns an array of unit circle boundary points and classified
 * eigenvalue positions. The classification uses the same logic as
 * classifyDMDEigenvalue but simplified to the three core categories.
 *
 * @param eigenvalues - Complex eigenvalues to plot
 * @param circlePoints - Number of points to trace the unit circle (default 100)
 */
export function plotEigenvaluesOnUnitCircle(
  eigenvalues: ComplexNumber[],
  circlePoints: number = 100,
): EigenvaluePlotData {
  // Generate unit circle points
  const unitCircle = Array.from({ length: circlePoints }, (_, i) => {
    const angle = (2 * Math.PI * i) / circlePoints;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

  // Classify and map eigenvalues
  const eigPoints: EigenvaluePoint[] = eigenvalues.map(eig => {
    const mag = magnitude(eig);
    let classification: 'attracting' | 'neutral' | 'repelling';
    if (mag < 1 - UNIT_CIRCLE_TOLERANCE) {
      classification = 'attracting';
    } else if (mag > 1 + UNIT_CIRCLE_TOLERANCE) {
      classification = 'repelling';
    } else {
      classification = 'neutral';
    }
    return { x: eig.re, y: eig.im, classification, magnitude: mag };
  });

  return { unitCircle, eigenvalues: eigPoints };
}

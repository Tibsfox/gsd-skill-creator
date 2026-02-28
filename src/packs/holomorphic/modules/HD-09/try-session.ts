import { magnitude, argument } from '../../index.js';
import type { ComplexNumber } from '../../types.js';

/**
 * HD-09 Try Session: Dynamic Mode Decomposition
 *
 * Demonstrates DMD eigenvalue classification by manually constructing
 * eigenvalues and showing how their position relative to the unit circle
 * determines the behavior of the corresponding dynamic mode.
 */
export function runTrySession(): void {
  // Sample eigenvalues representing different dynamic behaviors
  const eigenvalues: ComplexNumber[] = [
    { re: 0.95, im: 0.1 },   // decaying oscillation (inside unit circle)
    { re: 1.0, im: 0.0 },    // persistent / neutral (on unit circle)
    { re: -0.5, im: 0.0 },   // decaying, non-oscillatory (inside, real)
    { re: 1.1, im: 0.2 },    // growing oscillation (outside unit circle)
    { re: 0.0, im: 0.99 },   // near-neutral oscillation (inside, pure imaginary)
  ];

  console.log('=== HD-09: DMD Eigenvalue Classification ===\n');
  console.log('Unit circle rule: |lambda| < 1 = decaying, |lambda| = 1 = persistent, |lambda| > 1 = growing\n');

  for (const eig of eigenvalues) {
    const mag = magnitude(eig);
    const angle = argument(eig);
    const isOscillatory = Math.abs(angle) > 0.1;

    let type: string;
    if (mag < 0.999) {
      type = isOscillatory ? 'oscillating decay' : 'decaying (attracting)';
    } else if (mag > 1.001) {
      type = isOscillatory ? 'oscillating growth' : 'growing (repelling)';
    } else {
      type = 'persistent (neutral)';
    }

    const sign = eig.im >= 0 ? '+' : '-';
    console.log(
      `  lambda = ${eig.re.toFixed(2)} ${sign} ${Math.abs(eig.im).toFixed(2)}i` +
      `  |  |lambda| = ${mag.toFixed(3)}` +
      `  |  angle = ${(angle * 180 / Math.PI).toFixed(1)} deg` +
      `  |  ${type}`
    );
  }

  console.log('\n--- Holomorphic dynamics bridge ---');
  console.log('  Inside unit circle  =>  attracting fixed point (multiplier |lambda| < 1)');
  console.log('  On unit circle      =>  periodic orbit / neutral point');
  console.log('  Outside unit circle =>  repelling fixed point (multiplier |lambda| > 1)');
}

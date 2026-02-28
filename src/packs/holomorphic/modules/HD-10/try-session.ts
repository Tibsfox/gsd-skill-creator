import { magnitude, argument } from '../../index.js';
import type { ComplexNumber } from '../../types.js';
import type { KoopmanObservable } from '../../dmd/types.js';

/**
 * HD-10 Try Session: Koopman Operator Theory
 *
 * Demonstrates Koopman observable lifting on the logistic map.
 * A polynomial dictionary [x, x^2, x^3] lifts the 1D nonlinear
 * state into a 3D observable space where EDMD can approximate the
 * Koopman operator as a finite matrix.
 */
export function runTrySession(): void {
  // Define polynomial observables for the logistic map x -> rx(1-x)
  const observables: KoopmanObservable[] = [
    { name: 'identity', evaluate: (x) => x[0], type: 'polynomial' },
    { name: 'square', evaluate: (x) => x[0] * x[0], type: 'polynomial' },
    { name: 'cube', evaluate: (x) => x[0] * x[0] * x[0], type: 'polynomial' },
  ];

  // Simulate logistic map with r=2.8 (converges to fixed point)
  const r = 2.8;
  const orbit: number[] = [0.5];
  for (let i = 0; i < 50; i++) {
    const x = orbit[orbit.length - 1];
    orbit.push(r * x * (1 - x));
  }

  console.log('=== HD-10: Koopman Observable Lifting ===\n');
  console.log(`Logistic map x -> ${r}x(1-x), starting at x_0 = 0.5\n`);

  // Lift to observable space
  for (const obs of observables) {
    const lifted = orbit.map(x => obs.evaluate([x]));
    console.log(
      `Observable "${obs.name}": first 5 values = ${lifted.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`
    );
  }

  // Show convergence of the orbit
  const fixedPoint = (r - 1) / r;
  console.log(`\nTheoretical fixed point: x* = (r-1)/r = ${fixedPoint.toFixed(4)}`);
  console.log(`Orbit at t=50: ${orbit[50].toFixed(6)}`);
  console.log(`Error: ${Math.abs(orbit[50] - fixedPoint).toExponential(2)}`);

  // Demonstrate Koopman eigenfunction concept
  console.log('\n--- Koopman eigenfunctions for z -> z^2 ---');
  const z: ComplexNumber = { re: 0.5, im: 0.3 };
  for (let n = 1; n <= 4; n++) {
    // z^n is an eigenfunction of the Koopman operator for f(z) = z^2
    // with eigenvalue 2^n (because (z^2)^n = z^{2n} = (z^n)^2)
    const mag_z = magnitude(z);
    const arg_z = argument(z);
    const mag_zn = Math.pow(mag_z, n);
    const eigenvalue = Math.pow(2, n);
    console.log(
      `  phi(z) = z^${n}:  |z^${n}| = ${mag_zn.toFixed(4)}, eigenvalue = ${eigenvalue}`
    );
  }
}

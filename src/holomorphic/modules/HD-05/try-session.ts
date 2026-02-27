import { renderBifurcation, computeOrbit, detectPeriod, mul, add } from '../../index.js';
import type { ComplexNumber } from '../../types.js';

/**
 * HD-05 Try Session: Cycles and Period Doubling
 *
 * Renders a bifurcation diagram for the logistic map and detects periods
 * of orbits for the quadratic map z^2 + c at interesting parameter values.
 */
export function runTrySession(): void {
  // 1. Bifurcation diagram for the logistic map x_{n+1} = r*x*(1-x)
  const grid = renderBifurcation(2.5, 4.0, 20, 100, 500);
  console.log('Bifurcation diagram computed (20 columns, r from 2.5 to 4.0)');
  console.log(`  Column 0  (r=2.5): ${grid[0].length} attractor(s)`);
  console.log(`  Column 10 (r~3.25): ${grid[10].length} attractor(s)`);
  console.log(`  Column 19 (r=4.0): ${grid[19].length} attractor(s)`);

  // 2. Detect period of z^2 + c for c = -1 (period-2 cycle: 0 -> -1 -> 0 -> -1)
  const c1: ComplexNumber = { re: -1, im: 0 };
  const f1 = (z: ComplexNumber): ComplexNumber => add(mul(z, z), c1);
  const orbit1 = computeOrbit({ re: 0, im: 0 }, f1, 1000, 100);
  const period1 = detectPeriod(orbit1, 1e-6);
  console.log(`\nPeriod detection for z^2 + (-1): period = ${period1}`);

  // 3. Detect period for c = -1.25 (period-4 window)
  const c2: ComplexNumber = { re: -1.25, im: 0 };
  const f2 = (z: ComplexNumber): ComplexNumber => add(mul(z, z), c2);
  const orbit2 = computeOrbit({ re: 0, im: 0 }, f2, 1000, 100);
  const period2 = detectPeriod(orbit2, 1e-6);
  console.log(`Period detection for z^2 + (-1.25): period = ${period2}`);

  // 4. Detect period for c = -0.123 + 0.745i (Douady rabbit, period-3)
  const c3: ComplexNumber = { re: -0.123, im: 0.745 };
  const f3 = (z: ComplexNumber): ComplexNumber => add(mul(z, z), c3);
  const orbit3 = computeOrbit({ re: 0, im: 0 }, f3, 1000, 100);
  const period3 = detectPeriod(orbit3, 1e-6);
  console.log(`Period detection for z^2 + (-0.123+0.745i): period = ${period3}`);
}

import { computeMultiplier, classifyFixedPoint, mul, add, magnitude } from '../../index.js';
import type { ComplexNumber } from '../../types.js';

/**
 * HD-02 Try Session: Fixed Points and Stability
 *
 * Demonstrates multiplier computation and fixed point classification
 * for several quadratic maps f(z) = z^2 + c.
 */
export function runTrySession(): void {
  console.log('=== HD-02: Fixed Points and Stability ===\n');

  // Example 1: z^2 has superattracting fixed point at z = 0
  {
    const f = (z: ComplexNumber) => mul(z, z);
    const z_star: ComplexNumber = { re: 0, im: 0 };
    const mult = computeMultiplier(f, z_star);
    const cls = classifyFixedPoint(mult);
    console.log('f(z) = z^2, fixed point z* = 0:');
    console.log(`  multiplier = ${mult.re.toFixed(6)} + ${mult.im.toFixed(6)}i`);
    console.log(`  |lambda| = ${magnitude(mult).toFixed(6)}`);
    console.log(`  classification: ${cls}\n`);
  }

  // Example 2: z^2 + 0.2 has an attracting fixed point
  {
    const c: ComplexNumber = { re: 0.2, im: 0 };
    const f = (z: ComplexNumber) => add(mul(z, z), c);
    // Fixed point from quadratic formula: z = (1 - sqrt(1 - 4c)) / 2
    const disc = Math.sqrt(1 - 4 * c.re);
    const z_star: ComplexNumber = { re: (1 - disc) / 2, im: 0 };
    const mult = computeMultiplier(f, z_star);
    const cls = classifyFixedPoint(mult);
    console.log(`f(z) = z^2 + ${c.re}, fixed point z* = ${z_star.re.toFixed(4)}:`);
    console.log(`  multiplier = ${mult.re.toFixed(6)} + ${mult.im.toFixed(6)}i`);
    console.log(`  |lambda| = ${magnitude(mult).toFixed(6)}`);
    console.log(`  classification: ${cls}\n`);
  }

  // Example 3: z^2 - 2 has a repelling fixed point at z = 2
  {
    const c: ComplexNumber = { re: -2, im: 0 };
    const f = (z: ComplexNumber) => add(mul(z, z), c);
    const z_star: ComplexNumber = { re: 2, im: 0 };
    const mult = computeMultiplier(f, z_star);
    const cls = classifyFixedPoint(mult);
    console.log(`f(z) = z^2 - 2, fixed point z* = 2:`);
    console.log(`  multiplier = ${mult.re.toFixed(6)} + ${mult.im.toFixed(6)}i`);
    console.log(`  |lambda| = ${magnitude(mult).toFixed(6)}`);
    console.log(`  classification: ${cls}\n`);
  }

  // Example 4: z^2 + 0.25 has a parabolic (rationally indifferent) fixed point
  {
    const c: ComplexNumber = { re: 0.25, im: 0 };
    const f = (z: ComplexNumber) => add(mul(z, z), c);
    const z_star: ComplexNumber = { re: 0.5, im: 0 };
    const mult = computeMultiplier(f, z_star);
    const cls = classifyFixedPoint(mult);
    console.log(`f(z) = z^2 + 0.25, fixed point z* = 0.5:`);
    console.log(`  multiplier = ${mult.re.toFixed(6)} + ${mult.im.toFixed(6)}i`);
    console.log(`  |lambda| = ${magnitude(mult).toFixed(6)}`);
    console.log(`  classification: ${cls}\n`);
  }
}

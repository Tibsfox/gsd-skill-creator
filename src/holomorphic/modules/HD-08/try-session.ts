import {
  computeOrbit,
  classifyFixedPoint,
  computeMultiplier,
  magnitude,
} from '../../index.js';
import type { ComplexNumber } from '../../types.js';

/**
 * HD-08 Try Session: Skill Convergence Demo
 *
 * Models skill evolution as a contractive map on the complex plane:
 *   z_{n+1} = alpha * z + beta
 *
 * where alpha < 1 (contraction = learning) and beta is the observation
 * correction term. The fixed point z* = beta / (1 - alpha) is the
 * skill's stable position.
 */
export function runTrySession(): void {
  console.log('=== HD-08: Skill-Creator as a Dynamical System ===\n');

  // Model skill evolution: z_{n+1} = 0.8z + 0.1 (contractive map = learning)
  const learnStep = (z: ComplexNumber): ComplexNumber => ({
    re: 0.8 * z.re + 0.1,
    im: 0.8 * z.im,
  });

  // Start from initial observation at (0, 1) — pure imaginary = maximum uncertainty
  const z0: ComplexNumber = { re: 0, im: 1 };
  const orbit = computeOrbit(z0, learnStep, 50, 100);

  console.log(`Initial position: (${z0.re}, ${z0.im}i)`);
  console.log(`Orbit length: ${orbit.points.length} iterations`);
  console.log(`Escaped: ${orbit.escaped}`);

  // Show convergence: last few points should cluster near z* = 0.5
  const tail = orbit.points.slice(-5);
  console.log('\nLast 5 orbit points (should approach 0.5 + 0i):');
  for (const p of tail) {
    console.log(`  (${p.re.toFixed(6)}, ${p.im.toFixed(6)}i)`);
  }

  // Compute the multiplier at the theoretical fixed point z* = 0.5 + 0i
  const fixedPoint: ComplexNumber = { re: 0.5, im: 0 };
  const mult = computeMultiplier(learnStep, fixedPoint);
  const cls = classifyFixedPoint(mult);

  console.log(`\nFixed point: (${fixedPoint.re}, ${fixedPoint.im}i)`);
  console.log(`Multiplier: (${mult.re.toFixed(6)}, ${mult.im.toFixed(6)}i)`);
  console.log(`|multiplier| = ${magnitude(mult).toFixed(6)}`);
  console.log(`Classification: ${cls}`);
  console.log(
    `\nInterpretation: The skill converges to the real axis (promotion)`,
  );
  console.log(`with an attracting fixed point (reliable activation).`);
}

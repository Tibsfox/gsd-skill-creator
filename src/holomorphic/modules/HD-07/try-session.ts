import { computeOrbit, classifyFixedPoint, computeMultiplier } from '../../index.js';
import type { ComplexNumber } from '../../types.js';

/**
 * HD-07 Try Session: From Dynamics to Deep Learning
 *
 * Models gradient descent as a complex iteration and demonstrates how the
 * learning rate parameter controls convergence, oscillation, and chaos --
 * the same phenomena seen in holomorphic dynamics.
 */
export function runTrySession(): void {
  // Model gradient descent on f(x) = x^2
  // grad(f) = 2x, so the GD update is: x_{n+1} = x - lr * 2x = x(1 - 2*lr)
  // This is a linear map with multiplier (1 - 2*lr)

  console.log('=== Gradient Descent as Dynamical System ===');
  console.log('Loss function: f(x) = x^2, gradient = 2x');
  console.log('GD iteration: x_{n+1} = x * (1 - 2*lr)\n');

  // Case 1: Small learning rate (attracting fixed point)
  const lr1 = 0.3;
  const step1 = (z: ComplexNumber): ComplexNumber => ({
    re: z.re * (1 - 2 * lr1),
    im: z.im * (1 - 2 * lr1),
  });
  const orbit1 = computeOrbit({ re: 1, im: 0 }, step1, 50, 100);
  const last1 = orbit1.points[orbit1.points.length - 1];
  console.log(`lr=${lr1}: multiplier = ${(1 - 2 * lr1).toFixed(2)}`);
  console.log(`  After 50 steps: x = ${last1?.re.toFixed(6)} (converges to 0)`);

  const mult1 = computeMultiplier(step1, { re: 0, im: 0 });
  const cls1 = classifyFixedPoint(mult1);
  console.log(`  Fixed point z=0: class = ${cls1}\n`);

  // Case 2: Learning rate at stability boundary
  const lr2 = 0.5;
  const step2 = (z: ComplexNumber): ComplexNumber => ({
    re: z.re * (1 - 2 * lr2),
    im: z.im * (1 - 2 * lr2),
  });
  const mult2 = computeMultiplier(step2, { re: 0, im: 0 });
  const cls2 = classifyFixedPoint(mult2);
  console.log(`lr=${lr2}: multiplier = ${(1 - 2 * lr2).toFixed(2)}`);
  console.log(`  Fixed point z=0: class = ${cls2} (boundary case)\n`);

  // Case 3: Large learning rate (oscillation / repelling)
  const lr3 = 0.8;
  const step3 = (z: ComplexNumber): ComplexNumber => ({
    re: z.re * (1 - 2 * lr3),
    im: z.im * (1 - 2 * lr3),
  });
  const orbit3 = computeOrbit({ re: 1, im: 0 }, step3, 10, 100);
  console.log(`lr=${lr3}: multiplier = ${(1 - 2 * lr3).toFixed(2)} (oscillating)`);
  console.log('  First 5 iterates:');
  for (let i = 0; i < Math.min(5, orbit3.points.length); i++) {
    console.log(`    step ${i + 1}: x = ${orbit3.points[i].re.toFixed(6)}`);
  }

  // Case 4: Very large learning rate (divergent / chaotic)
  const lr4 = 1.5;
  const step4 = (z: ComplexNumber): ComplexNumber => ({
    re: z.re * (1 - 2 * lr4),
    im: z.im * (1 - 2 * lr4),
  });
  const mult4 = computeMultiplier(step4, { re: 0, im: 0 });
  const cls4 = classifyFixedPoint(mult4);
  console.log(`\nlr=${lr4}: multiplier = ${(1 - 2 * lr4).toFixed(2)}`);
  console.log(`  Fixed point z=0: class = ${cls4} (divergent)`);

  console.log('\n=== Key Insight ===');
  console.log('Learning rate controls stability just like c in z^2+c controls Julia sets.');
  console.log('lr < 0.5 -> attracting (convergence)');
  console.log('lr = 0.5 -> boundary (superattracting)');
  console.log('lr > 0.5 -> repelling (oscillation/divergence)');
}

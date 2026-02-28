import { computeOrbit, mul, add } from '../../index.js';
import type { ComplexNumber } from '../../types.js';

/**
 * HD-01 Try Session: Iteration on the Complex Plane
 *
 * Demonstrates orbit computation for the quadratic map f(z) = z^2 + c
 * with several parameter values showing different behaviors.
 */
export function runTrySession(): void {
  console.log('=== HD-01: Iteration on the Complex Plane ===\n');

  const examples: Array<{ label: string; c: ComplexNumber }> = [
    { label: 'Fixed point (c = 0)', c: { re: 0, im: 0 } },
    { label: 'Period 2 (c = -1)', c: { re: -1, im: 0 } },
    { label: 'Escaping (c = 1)', c: { re: 1, im: 0 } },
    { label: 'Bounded spiral (c = -0.5 + 0.5i)', c: { re: -0.5, im: 0.5 } },
  ];

  for (const { label, c } of examples) {
    const f = (z: ComplexNumber) => add(mul(z, z), c);
    const orbit = computeOrbit({ re: 0, im: 0 }, f, 100, 2);

    console.log(`${label}:`);
    console.log(`  c = ${c.re} + ${c.im}i`);
    console.log(`  Points computed: ${orbit.points.length}`);
    console.log(`  Escaped: ${orbit.escaped}`);

    if (orbit.escapeTime !== null) {
      console.log(`  Escape time: ${orbit.escapeTime}`);
    }

    // Show first few orbit points
    const preview = orbit.points.slice(0, 5);
    for (let i = 0; i < preview.length; i++) {
      const p = preview[i];
      console.log(`  z_${i + 1} = ${p.re.toFixed(4)} + ${p.im.toFixed(4)}i`);
    }

    console.log('');
  }
}

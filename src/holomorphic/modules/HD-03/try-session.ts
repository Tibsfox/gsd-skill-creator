import { renderMandelbrot, mandelbrotEscape } from '../../index.js';

/**
 * HD-03 Try Session: The Mandelbrot Set
 *
 * Demonstrates Mandelbrot set computation: rendering a low-resolution
 * grid and testing membership for several parameter values.
 */
export function runTrySession(): void {
  console.log('=== HD-03: The Mandelbrot Set ===\n');

  // Render a 10x10 grid of the standard view
  const bounds = { xMin: -2, xMax: 1, yMin: -1.5, yMax: 1.5 };
  const maxIter = 100;
  const escapeRadius = 2;
  const grid = renderMandelbrot(10, 10, bounds, maxIter, escapeRadius);

  console.log('10x10 Mandelbrot grid (maxIter=100):');
  for (let y = 0; y < 10; y++) {
    let row = '  ';
    for (let x = 0; x < 10; x++) {
      row += grid[x][y] === maxIter ? '#' : '.';
    }
    console.log(row);
  }
  console.log('  # = in set, . = escaped\n');

  // Test specific parameter values
  const testPoints = [
    { label: 'c = 0 (center of main cardioid)', c: { re: 0, im: 0 } },
    { label: 'c = -1 (center of period-2 bulb)', c: { re: -1, im: 0 } },
    { label: 'c = 0.25 (cusp of main cardioid)', c: { re: 0.25, im: 0 } },
    { label: 'c = -2 (tip of the antenna)', c: { re: -2, im: 0 } },
    { label: 'c = 1 (outside M)', c: { re: 1, im: 0 } },
    { label: 'c = i (inside M)', c: { re: 0, im: 1 } },
  ];

  console.log('Membership tests:');
  for (const { label, c } of testPoints) {
    const escape = mandelbrotEscape(c, maxIter, escapeRadius);
    const inSet = escape === maxIter;
    console.log(`  ${label}: escape=${escape}, in M = ${inSet}`);
  }
}

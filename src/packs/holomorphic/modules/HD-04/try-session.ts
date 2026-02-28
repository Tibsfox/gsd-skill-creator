import { renderJulia } from '../../index.js';
import type { ComplexNumber } from '../../types.js';

/**
 * HD-04 Try Session: Julia Sets and Fatou Sets
 *
 * Renders Julia sets for several famous parameter values and demonstrates
 * the connected/disconnected dichotomy.
 */
export function runTrySession(): void {
  const bounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
  const maxIter = 100;
  const escapeRadius = 2;
  const width = 10;
  const height = 10;
  const totalPixels = width * height;

  // Douady rabbit: connected Julia set (c is in the Mandelbrot set)
  const cRabbit: ComplexNumber = { re: -0.123, im: 0.745 };
  const gridRabbit = renderJulia(width, height, bounds, cRabbit, maxIter, escapeRadius);
  const inSetRabbit = gridRabbit.flat().filter(v => v === maxIter).length;
  console.log('Julia set for Douady rabbit (c = -0.123 + 0.745i) computed');
  console.log(`  Points in set: ${inSetRabbit} / ${totalPixels}`);

  // Basilica: connected Julia set
  const cBasilica: ComplexNumber = { re: -1, im: 0 };
  const gridBasilica = renderJulia(width, height, bounds, cBasilica, maxIter, escapeRadius);
  const inSetBasilica = gridBasilica.flat().filter(v => v === maxIter).length;
  console.log('Julia set for Basilica (c = -1) computed');
  console.log(`  Points in set: ${inSetBasilica} / ${totalPixels}`);

  // Disconnected example: c well outside the Mandelbrot set
  const cCantor: ComplexNumber = { re: 2, im: 0 };
  const gridCantor = renderJulia(width, height, bounds, cCantor, maxIter, escapeRadius);
  const inSetCantor = gridCantor.flat().filter(v => v === maxIter).length;
  console.log('Julia set for c = 2 (disconnected / Cantor dust) computed');
  console.log(`  Points in set: ${inSetCantor} / ${totalPixels} (should be very few)`);
}

/**
 * C02 T11 — Performance test for language analyzers.
 */

import { describe, it, expect } from 'vitest';
import { typescriptAnalyzer } from '../languages/typescript.js';
import type { AnalyzerInput } from '../types.js';

// Generate a ~1000-LOC TypeScript fixture
function generate1000LoCFixture(): string {
  const lines: string[] = [];
  for (let i = 0; i < 100; i++) {
    lines.push(`export function func${i}(x: number, y: number): number {`);
    lines.push(`  if (x > ${i}) {`);
    lines.push(`    return x + y + ${i};`);
    lines.push(`  }`);
    lines.push(`  return y;`);
    lines.push(`}`);
    lines.push('');
    lines.push(`export const value${i} = ${i} * 2;`);
    lines.push('');
    lines.push(`// Line ${i * 10}`);
  }
  return lines.join('\n');
}

const LARGE_SOURCE = generate1000LoCFixture();

describe('language analyzer performance', () => {
  it('1000-LOC TypeScript file analyzed in <100ms (mean across 10 runs)', async () => {
    const input: AnalyzerInput = {
      filePath: 'large-fixture.ts',
      language: 'typescript',
      source: LARGE_SOURCE,
    };

    // Warm up (first parse may be slower due to parser initialization)
    await typescriptAnalyzer.analyze(input);

    const times: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await typescriptAnalyzer.analyze(input);
      times.push(performance.now() - start);
    }

    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    // 100ms mean on commodity hardware
    expect(mean).toBeLessThan(100);
  }, 15000);
});

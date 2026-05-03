/**
 * C02 T10 — Determinism + memory tests.
 */

import { describe, it, expect } from 'vitest';
import { typescriptAnalyzer } from '../languages/typescript.js';
import type { AnalyzerInput } from '../types.js';

const FIXTURE_SOURCE = `
export function alpha(x: number, y: number): number {
  if (x > 0) {
    return x + y;
  } else if (y > 0) {
    return y;
  }
  return 0;
}

export const beta = (n: number) => n * 2;

function gamma() {
  return 'internal';
}
`;

const FIXTURE_INPUT: AnalyzerInput = {
  filePath: 'fixture.ts',
  language: 'typescript',
  source: FIXTURE_SOURCE,
};

describe('determinism', () => {
  it('100 runs of analyze(sameInput) produce identical output', async () => {
    const outputs = await Promise.all(
      Array.from({ length: 100 }, () => typescriptAnalyzer.analyze(FIXTURE_INPUT)),
    );
    const first = JSON.stringify(outputs[0]);
    for (let i = 1; i < outputs.length; i++) {
      expect(JSON.stringify(outputs[i])).toBe(first);
    }
  }, 15000);

  it('1000 sequential analyze() calls show no significant memory growth', async () => {
    // Warm up
    await typescriptAnalyzer.analyze(FIXTURE_INPUT);

    // Force GC if available
    if (global.gc) global.gc();

    const before = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      await typescriptAnalyzer.analyze(FIXTURE_INPUT);
    }

    if (global.gc) global.gc();

    const after = process.memoryUsage().heapUsed;
    const deltaMB = (after - before) / (1024 * 1024);

    // Allow up to 50 MB growth (generous — in practice should be near 0)
    expect(deltaMB).toBeLessThan(50);
  }, 30000);
});

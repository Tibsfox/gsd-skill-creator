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
  it('1000-LOC TypeScript file analyzed in <200ms (mean across 10 runs)', async () => {
    const input: AnalyzerInput = {
      filePath: 'large-fixture.ts',
      language: 'typescript',
      source: LARGE_SOURCE,
    };

    // Warm up: discard the first 5 parses so v8 tiers up + tree-sitter parser
    // caches warm before the timed window. Single-call warmup proved insufficient
    // under full-suite contention (observed 211.52ms 10-sample mean at v1.49.650
    // pre-tag-gate; isolated runs land at ~120ms). Pattern follows the v1.49.634
    // m2-short-term canonical fix (411edf9ee) generalized by C3 at v1.49.650.
    for (let _ = 0; _ < 5; _++) {
      await typescriptAnalyzer.analyze(input);
    }

    const times: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await typescriptAnalyzer.analyze(input);
      times.push(performance.now() - start);
    }

    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    // 200ms mean on commodity hardware (generous CI-safe threshold)
    expect(mean).toBeLessThan(200);
  }, 15000);
});

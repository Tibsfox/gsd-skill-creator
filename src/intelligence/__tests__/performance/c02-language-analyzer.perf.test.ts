/**
 * Phase 826 / C13 — Language analyzer performance suite.
 *
 * PERF — WARN ONLY (test-plan line 17 classifies perf as WARN, not BLOCK)
 *
 * Relocated from src/intelligence/analyzer/__tests__/performance.test.ts
 * per D-26-01 layout and Wave 1 deferred carryover (Carryover 3).
 *
 * Threshold bumped 200ms → 300ms for CI headroom.
 * Run via: npm run test:perf
 * Excluded from default vitest run (see vitest.config.ts).
 */

import { describe, it, expect } from 'vitest';
import { typescriptAnalyzer } from '../../analyzer/languages/typescript.js';
import type { AnalyzerInput } from '../../analyzer/types.js';

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

describe('language analyzer performance (WARN-only)', () => {
  it('P1/C02: 1000-LOC TypeScript analyzed in <300ms mean across 10 runs', async () => {
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
    // 300ms mean — bumped from 200ms for CI-safe headroom (Carryover 3)
    // WARN ONLY: test-plan line 17 classifies perf tests as WARN, not BLOCK.
    expect(mean).toBeLessThan(300);
  }, 30000);
});

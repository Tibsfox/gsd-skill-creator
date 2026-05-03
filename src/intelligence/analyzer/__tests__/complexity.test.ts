/**
 * C03 T5 — Complexity outlier detection tests.
 */

import { describe, it, expect } from 'vitest';
import { detectComplexityOutliers } from '../findings/complexity.js';
import type { AnalyzerOutput } from '../types.js';

function makeOutput(filePath: string, ccMax: number): AnalyzerOutput {
  return {
    filePath,
    parseStatus: 'ok',
    findings: [],
    metrics: { loc: 10, functions: 1, exports: 0, cyclomatic_complexity_mean: ccMax, cyclomatic_complexity_max: ccMax },
  };
}

describe('detectComplexityOutliers', () => {
  it('100-file fixture with 1 extreme outlier → outlier finding', () => {
    const perFileResults = Array.from({ length: 99 }, (_, i) => makeOutput(`src/f${i}.ts`, 4));
    perFileResults.push(makeOutput('src/mega.ts', 50));

    const findings = detectComplexityOutliers(perFileResults, 'snap-1');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.kind).toBe('complexity_outlier');
    expect(findings[0]!.source_path).toBe('src/mega.ts');
  });

  it('rationale includes project median', () => {
    const perFileResults = Array.from({ length: 99 }, (_, i) => makeOutput(`src/f${i}.ts`, 4));
    perFileResults.push(makeOutput('src/mega.ts', 50));

    const findings = detectComplexityOutliers(perFileResults, 'snap-2');
    expect(findings[0]!.rationale).toMatch(/median/);
    expect(findings[0]!.rationale).toMatch(/\d+/);
    expect(findings[0]!.rationale).toMatch(/mega\.ts/);
  });

  it('empty list returns empty array', () => {
    expect(detectComplexityOutliers([], 'snap-3')).toHaveLength(0);
  });
});

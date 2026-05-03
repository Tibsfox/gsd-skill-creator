/**
 * C03 T6 — Churn outlier detection tests.
 */

import { describe, it, expect } from 'vitest';
import { detectChurnOutliers } from '../findings/churn.js';
import type { AnalyzerOutput } from '../types.js';
import type { ChurnData } from '../findings/aggregator.js';

function makeOutput(filePath: string): AnalyzerOutput {
  return { filePath, parseStatus: 'ok', findings: [], metrics: { loc: 10, functions: 1, exports: 0, cyclomatic_complexity_mean: 1, cyclomatic_complexity_max: 1 } };
}

function makeChurn(filePath: string, count: number): [string, ChurnData] {
  return [filePath, { filePath, commit_count_90d: count, total_commit_count: count, author_count: 1, last_modified: '2026-05-01T00:00:00.000Z' }];
}

describe('detectChurnOutliers', () => {
  it('file with 30 commits when median=2 → outlier (15x > 5x threshold)', () => {
    const perFileResults = Array.from({ length: 100 }, (_, i) => makeOutput(`src/f${i}.ts`));
    const gitChurn = new Map(perFileResults.map((r, i) => makeChurn(r.filePath, i < 99 ? 2 : 30)));

    const findings = detectChurnOutliers(perFileResults, gitChurn, 'snap-1');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some(f => f.kind === 'churn_outlier')).toBe(true);
    expect(findings[0]!.rationale).toMatch(/\d+.*commits/);
  });

  it('returns empty when no file exceeds 5x median', () => {
    const perFileResults = Array.from({ length: 10 }, (_, i) => makeOutput(`src/f${i}.ts`));
    const gitChurn = new Map(perFileResults.map(r => makeChurn(r.filePath, 3)));
    const findings = detectChurnOutliers(perFileResults, gitChurn, 'snap-2');
    expect(findings).toHaveLength(0);
  });

  it('returns empty when no git data', () => {
    const perFileResults = [makeOutput('src/a.ts')];
    const findings = detectChurnOutliers(perFileResults, new Map(), 'snap-3');
    expect(findings).toHaveLength(0);
  });
});

/**
 * C03 T3 — Hot spot detection tests.
 */

import { describe, it, expect } from 'vitest';
import { detectHotSpots } from '../findings/hot-spots.js';
import type { AnalyzerOutput } from '../types.js';
import type { ChurnData } from '../findings/aggregator.js';

function makeOutput(filePath: string, ccMax: number): AnalyzerOutput {
  return {
    filePath,
    parseStatus: 'ok',
    findings: [],
    metrics: { loc: 10, functions: 1, exports: 0, cyclomatic_complexity_mean: ccMax, cyclomatic_complexity_max: ccMax },
  };
}

function makeChurn(filePath: string, count90d: number): ChurnData {
  return {
    filePath,
    commit_count_90d: count90d,
    total_commit_count: count90d,
    author_count: 1,
    last_modified: '2026-05-01T00:00:00.000Z',
  };
}

describe('detectHotSpots', () => {
  it('top-5% files become hot_spot findings (100-file fixture)', () => {
    // 100 files: 5 with high churn+complexity, 95 with low
    const perFileResults: AnalyzerOutput[] = [];
    const gitChurn = new Map<string, ChurnData>();

    // 5 high hot-spots: commits=50, cc=20 → score = log(51) * 20 ≈ 78
    for (let i = 0; i < 5; i++) {
      const path = `src/hot${i}.ts`;
      perFileResults.push(makeOutput(path, 20));
      gitChurn.set(path, makeChurn(path, 50));
    }

    // 95 low files: commits=2, cc=3 → score = log(3) * 3 ≈ 3.3
    for (let i = 0; i < 95; i++) {
      const path = `src/cold${i}.ts`;
      perFileResults.push(makeOutput(path, 3));
      gitChurn.set(path, makeChurn(path, 2));
    }

    const findings = detectHotSpots(perFileResults, gitChurn, 'proj', 'snap-1');
    // Top 5% of 100 = top 5 files → 5 hot_spot findings
    expect(findings.length).toBe(5);
    // All should reference the hot files
    const hotPaths = new Set(findings.map(f => f.source_path));
    for (let i = 0; i < 5; i++) {
      expect(hotPaths.has(`src/hot${i}.ts`)).toBe(true);
    }
  });

  it('rationale strings match /\\d+ commits.*complexity \\d+/', () => {
    const perFileResults: AnalyzerOutput[] = [];
    const gitChurn = new Map<string, ChurnData>();

    for (let i = 0; i < 20; i++) {
      const path = `src/f${i}.ts`;
      const cc = i < 1 ? 30 : 3;
      const commits = i < 1 ? 40 : 1;
      perFileResults.push(makeOutput(path, cc));
      gitChurn.set(path, makeChurn(path, commits));
    }

    const findings = detectHotSpots(perFileResults, gitChurn, 'proj', 'snap-2');
    for (const f of findings) {
      expect(f.rationale).toMatch(/\d+ commits/);
      expect(f.rationale).toMatch(/complexity \d+/);
    }
  });

  it('files without git data are omitted from hot spot calculation', () => {
    // Only 1 file with git data
    const perFileResults = [makeOutput('src/a.ts', 5), makeOutput('src/b.ts', 5)];
    const gitChurn = new Map<string, ChurnData>();
    gitChurn.set('src/a.ts', makeChurn('src/a.ts', 10));
    // src/b.ts has no churn data → should be omitted

    const findings = detectHotSpots(perFileResults, gitChurn, 'proj', 'snap-3');
    // Only 1 file scored → top 5% of 1 = at least 1 → check it's only from src/a.ts
    expect(findings.every(f => f.source_path === 'src/a.ts')).toBe(true);
  });

  it('empty file list returns empty array', () => {
    const findings = detectHotSpots([], new Map(), 'proj', 'snap-4');
    expect(findings).toHaveLength(0);
  });
});

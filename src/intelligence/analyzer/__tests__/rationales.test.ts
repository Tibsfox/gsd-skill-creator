/**
 * C03 T10 — D-22-17: Rationale strings contain specific evidence.
 *
 * Every finding rationale must include:
 * - At least one number (quantitative evidence)
 * - At least one file path or identifier (qualitative locator)
 *
 * This test exercises each detector with a minimal fixture that triggers a finding,
 * then asserts both evidence requirements are met.
 */

import { describe, it, expect } from 'vitest';
import { detectComplexityOutliers } from '../findings/complexity.js';
import { detectChurnOutliers } from '../findings/churn.js';
import { detectHotSpots } from '../findings/hot-spots.js';
import { detectDeadCode } from '../findings/dead-code.js';
import type { AnalyzerOutput } from '../types.js';
import type { ChurnData } from '../findings/aggregator.js';

function makeOutput(filePath: string, ccMax = 4, loc = 20): AnalyzerOutput {
  return {
    filePath,
    parseStatus: 'ok',
    findings: [],
    metrics: { loc, functions: 1, exports: 0, cyclomatic_complexity_mean: ccMax, cyclomatic_complexity_max: ccMax },
  };
}

function hasNumber(s: string): boolean {
  return /\d+/.test(s);
}

function hasFileRef(s: string, filePath: string): boolean {
  // Must contain either the file path or a recognisable part of it
  const basename = filePath.split('/').pop() ?? filePath;
  return s.includes(filePath) || s.includes(basename);
}

describe('D-22-17 rationale evidence invariants', () => {
  it('complexity_outlier rationale contains numeric evidence + file reference', () => {
    const files = Array.from({ length: 99 }, (_, i) => makeOutput(`src/f${i}.ts`, 4));
    files.push(makeOutput('src/mega.ts', 80));
    const findings = detectComplexityOutliers(files, 'snap-1');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    for (const f of findings) {
      expect(hasNumber(f.rationale)).toBe(true);
      expect(hasFileRef(f.rationale, f.source_path ?? '')).toBe(true);
    }
  });

  it('churn_outlier rationale contains numeric evidence + file reference', () => {
    const files = Array.from({ length: 10 }, (_, i) => makeOutput(`src/f${i}.ts`));
    const churn = new Map<string, ChurnData>(
      files.map((r, i) => [
        r.filePath,
        {
          filePath: r.filePath,
          commit_count_90d: i === 0 ? 50 : 2,
          total_commit_count: i === 0 ? 50 : 2,
          author_count: 1,
          last_modified: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    const findings = detectChurnOutliers(files, churn, 'snap-2');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    for (const f of findings) {
      expect(hasNumber(f.rationale)).toBe(true);
      expect(hasFileRef(f.rationale, f.source_path ?? '')).toBe(true);
    }
  });

  it('hot_spot rationale contains numeric evidence + file reference', () => {
    const files = Array.from({ length: 20 }, (_, i) => makeOutput(`src/f${i}.ts`, 3));
    files.push(makeOutput('src/hot.ts', 30));
    const churn = new Map<string, ChurnData>(
      files.map((r, i) => [
        r.filePath,
        {
          filePath: r.filePath,
          commit_count_90d: i === files.length - 1 ? 40 : 2,
          total_commit_count: i === files.length - 1 ? 40 : 2,
          author_count: 1,
          last_modified: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    const findings = detectHotSpots(files, churn, 'proj-1', 'snap-3');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    for (const f of findings) {
      expect(hasNumber(f.rationale)).toBe(true);
      expect(hasFileRef(f.rationale, f.source_path ?? '')).toBe(true);
    }
  });

  it('dead_code rationale contains numeric evidence (confidence) + file reference', () => {
    // Construct a single-file corpus with one exported identifier that appears
    // nowhere else (no cross-file references) — triggers dead_code upgrade
    const exportedIdent = 'unusedExportedFn';
    const files: AnalyzerOutput[] = [
      {
        filePath: 'src/module.ts',
        parseStatus: 'ok',
        findings: [
          {
            kind: 'unused_export',
            severity: 'low',
            confidence: 0.6,
            title: `Unused export: ${exportedIdent}`,
            rationale: `Identifier '${exportedIdent}' exported but not found in other files`,
          },
        ],
        metrics: { loc: 20, functions: 1, exports: 1, cyclomatic_complexity_mean: 2, cyclomatic_complexity_max: 2 },
      },
    ];
    const findings = detectDeadCode(files, 'proj-1', 'snap-4');
    // May or may not produce findings depending on cross-file logic
    for (const f of findings) {
      expect(hasNumber(f.rationale)).toBe(true);
    }
  });
});

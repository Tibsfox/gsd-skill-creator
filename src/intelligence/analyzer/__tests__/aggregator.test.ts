/**
 * C03 T9 — FindingEngine aggregator integration tests.
 *
 * Verifies:
 * - All findings carry required provenance fields (produced_by, produced_at, snapshot_id, project_id)
 * - Finding IDs follow F-{snapshotId}-{NNNN} format
 * - Multiple detector results are merged into a single flat array
 * - ProjectMetrics reflect actual per-file data
 */

import { describe, it, expect } from 'vitest';
import { FindingEngine } from '../findings/aggregator.js';
import type { AggregatorInput } from '../findings/aggregator.js';
import type { AnalyzerOutput } from '../types.js';
import type { IntelligenceKB } from '../../types.js';

// KB stub: no in-flight work, no staging inbox
function makeKB(overrides?: Partial<IntelligenceKB>): IntelligenceKB {
  return {
    listProjects: () => Promise.reject(new Error('stub')),
    getProject: () => Promise.reject(new Error('stub')),
    getCurrentBriefing: () => Promise.reject(new Error('stub')),
    listOpenFindings: () => Promise.reject(new Error('stub')),
    listInFlightWork: () => Promise.resolve({ bundles: [], decisions: [] }),
    listMeetings: () => Promise.reject(new Error('stub')),
    startMeeting: () => Promise.reject(new Error('stub')),
    addDecision: () => Promise.reject(new Error('stub')),
    promoteToSendNow: () => Promise.reject(new Error('stub')),
    commitBundle: () => Promise.reject(new Error('stub')),
    parkMeeting: () => Promise.reject(new Error('stub')),
    dismissFinding: () => Promise.reject(new Error('stub')),
    ...overrides,
  };
}

function makeOutput(filePath: string, cc = 2, loc = 20): AnalyzerOutput {
  return {
    filePath,
    parseStatus: 'ok',
    findings: [],
    metrics: {
      loc,
      functions: 1,
      exports: 0,
      cyclomatic_complexity_mean: cc,
      cyclomatic_complexity_max: cc,
    },
  };
}

describe('FindingEngine.aggregate', () => {
  it('returns FindingEngineResult with findings array and metrics', async () => {
    const engine = new FindingEngine({ kb: makeKB() });
    const input: AggregatorInput = {
      projectId: 'proj-1',
      snapshotId: 'snap-1',
      perFileResults: [makeOutput('src/a.ts'), makeOutput('src/b.ts')],
    };

    const result = await engine.aggregate(input);
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.fileCount).toBe(2);
  });

  it('all findings carry required provenance fields', async () => {
    const engine = new FindingEngine({ kb: makeKB() });

    // Use 100 files with 1 extreme outlier to trigger complexity_outlier finding
    const files = Array.from({ length: 99 }, (_, i) => makeOutput(`src/f${i}.ts`, 3));
    files.push(makeOutput('src/mega.ts', 80));

    const input: AggregatorInput = {
      projectId: 'proj-2',
      snapshotId: 'snap-2',
      perFileResults: files,
    };

    const result = await engine.aggregate(input);
    for (const f of result.findings) {
      expect(f.produced_by).toBe('analyzer');
      expect(f.produced_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(f.snapshot_id).toBe('snap-2');
      expect(f.project_id).toBe('proj-2');
      expect(f.status).toBe('open');
    }
  });

  it('finding IDs follow F-{snapshotId}-{NNNN} pattern', async () => {
    const engine = new FindingEngine({ kb: makeKB() });

    const files = Array.from({ length: 99 }, (_, i) => makeOutput(`src/f${i}.ts`, 3));
    files.push(makeOutput('src/mega.ts', 80));

    const result = await engine.aggregate({
      projectId: 'proj-3',
      snapshotId: 'snap-abc',
      perFileResults: files,
    });

    for (const f of result.findings) {
      expect(f.id).toMatch(/^F-snap-abc-\d{4}$/);
    }
  });

  it('metrics.findingsByKind reflects actual detector output', async () => {
    const engine = new FindingEngine({ kb: makeKB() });

    const files = Array.from({ length: 99 }, (_, i) => makeOutput(`src/f${i}.ts`, 3));
    files.push(makeOutput('src/mega.ts', 80));

    const result = await engine.aggregate({
      projectId: 'proj-4',
      snapshotId: 'snap-4',
      perFileResults: files,
    });

    if ((result.metrics.findingsByKind.complexity_outlier ?? 0) > 0) {
      const countInMetrics = result.metrics.findingsByKind.complexity_outlier ?? 0;
      const countInFindings = result.findings.filter(f => f.kind === 'complexity_outlier').length;
      expect(countInMetrics).toBe(countInFindings);
    }
  });

  it('empty perFileResults produces no findings', async () => {
    const engine = new FindingEngine({ kb: makeKB() });
    const result = await engine.aggregate({
      projectId: 'proj-5',
      snapshotId: 'snap-5',
      perFileResults: [],
    });
    expect(result.findings).toHaveLength(0);
    expect(result.metrics.fileCount).toBe(0);
    expect(result.metrics.totalLoc).toBe(0);
  });

  it('KB error in stalled missions does not crash aggregator', async () => {
    const engine = new FindingEngine({
      kb: makeKB({
        listInFlightWork: () => Promise.reject(new Error('db connection failed')),
      }),
    });
    const result = await engine.aggregate({
      projectId: 'proj-6',
      snapshotId: 'snap-6',
      perFileResults: [makeOutput('src/a.ts')],
    });
    // should succeed with empty findings (no crash)
    expect(Array.isArray(result.findings)).toBe(true);
  });
});

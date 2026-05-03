/**
 * C03 T11 — Aggregator performance: <30s on 100K-LOC fixture.
 *
 * Constructs a synthetic fixture equivalent to a 100K-LOC codebase
 * (1000 files × 100 LOC each), runs FindingEngine.aggregate, and asserts
 * completion within 30 seconds.
 *
 * All detectors run synchronously over in-memory data — no I/O, no git calls.
 * The stalled-mission detector is given a KB stub that returns empty immediately.
 */

import { describe, it, expect } from 'vitest';
import { FindingEngine } from '../findings/aggregator.js';
import type { AggregatorInput } from '../findings/aggregator.js';
import type { AnalyzerOutput } from '../types.js';
import type { IntelligenceKB } from '../../types.js';

const PERFORMANCE_TIMEOUT_MS = 30_000;
const FILE_COUNT = 1_000;
const LOC_PER_FILE = 100;

function makePerfKB(): IntelligenceKB {
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
  };
}

function makeFixture(): AnalyzerOutput[] {
  return Array.from({ length: FILE_COUNT }, (_, i) => ({
    filePath: `src/module${i}.ts`,
    parseStatus: 'ok' as const,
    findings: [],
    metrics: {
      loc: LOC_PER_FILE,
      functions: 3,
      exports: 2,
      // Vary complexity to exercise outlier detection code paths
      cyclomatic_complexity_mean: 2 + (i % 5),
      cyclomatic_complexity_max: 3 + (i % 8),
    },
  }));
}

describe('FindingEngine aggregator performance', () => {
  it('completes aggregation of 100K-LOC fixture in under 30 seconds', async () => {
    const engine = new FindingEngine({ kb: makePerfKB() });
    const perFileResults = makeFixture();
    expect(perFileResults.length).toBe(FILE_COUNT);
    expect(perFileResults.reduce((s, r) => s + r.metrics.loc, 0)).toBe(FILE_COUNT * LOC_PER_FILE);

    const input: AggregatorInput = {
      projectId: 'perf-proj',
      snapshotId: 'perf-snap',
      perFileResults,
    };

    const start = Date.now();
    const result = await engine.aggregate(input);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(PERFORMANCE_TIMEOUT_MS);
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.metrics.fileCount).toBe(FILE_COUNT);
    expect(result.metrics.totalLoc).toBe(FILE_COUNT * LOC_PER_FILE);
  }, PERFORMANCE_TIMEOUT_MS + 5_000); // vitest timeout slightly above our gate
});

/**
 * @file Behavioral tests for formatBatchReport advisory formatter
 * @description Phase 558-03 Task 2: Tests for the human-readable batch detection
 *              report formatter. Covers all-pass, all-warn, mixed scenarios,
 *              section labels, and adversarial proof.
 */
import { describe, it, expect } from 'vitest';
import { formatBatchReport } from '../../../src/core/validation/batch-detection/batch-report.js';
import type { BatchDetectionResult, BatchHeuristicResult } from '../../../src/core/validation/batch-detection/batch-types.js';

/** Helper to create a BatchHeuristicResult */
function makeHeuristic(detected: boolean, severity: 'info' | 'warn' | 'critical' = 'info', details = 'test details'): BatchHeuristicResult {
  return { detected, severity, details, artifacts: [] };
}

/** Helper to create a BatchDetectionResult with specified overrides */
function makeResult(overrides: Partial<BatchDetectionResult> = {}): BatchDetectionResult {
  return {
    timestampClustering: makeHeuristic(false),
    sessionCompression: makeHeuristic(false),
    contentDepth: makeHeuristic(false),
    templateSimilarity: makeHeuristic(false),
    overallStatus: 'pass',
    advisories: [],
    timestamp: '2026-03-03T12:00:00.000Z',
    ...overrides,
  };
}

describe('formatBatchReport', () => {
  it('includes report header', () => {
    const report = formatBatchReport(makeResult());
    expect(report).toContain('Batch Detection Advisory Report');
  });

  it('shows [PASS] prefix for non-detected heuristics', () => {
    const report = formatBatchReport(makeResult());
    expect(report).toContain('[PASS] Timestamp Clustering');
    expect(report).toContain('[PASS] Session Compression');
    expect(report).toContain('[PASS] Content Depth');
    expect(report).toContain('[PASS] Template Similarity');
  });

  it('shows [WARN] prefix for detected warn heuristics', () => {
    const result = makeResult({
      timestampClustering: makeHeuristic(true, 'warn', 'Timestamp clustering: 5 artifacts within 60s'),
      overallStatus: 'warn',
    });
    const report = formatBatchReport(result);
    expect(report).toContain('[WARN] Timestamp Clustering');
  });

  it('shows [CRITICAL] prefix for detected critical heuristics', () => {
    const result = makeResult({
      sessionCompression: makeHeuristic(true, 'critical', 'Session compression: 20/5 subversions'),
      overallStatus: 'critical',
    });
    const report = formatBatchReport(result);
    expect(report).toContain('[CRITICAL] Session Compression');
  });

  it('includes details message indented below detected heuristic', () => {
    const detailsMsg = 'Timestamp clustering: 5 artifacts created within 60s window';
    const result = makeResult({
      timestampClustering: makeHeuristic(true, 'warn', detailsMsg),
      overallStatus: 'warn',
    });
    const report = formatBatchReport(result);
    expect(report).toContain(detailsMsg);
  });

  it('does NOT include details for non-detected heuristics', () => {
    const result = makeResult({
      timestampClustering: makeHeuristic(false, 'info', 'should not appear indented'),
    });
    const report = formatBatchReport(result);
    const lines = report.split('\n');
    // The detail line would be indented with "  - "
    const indentedDetail = lines.find((l) => l.includes('  - should not appear indented'));
    expect(indentedDetail).toBeUndefined();
  });

  it('all four heuristic sections are always present', () => {
    const report = formatBatchReport(makeResult());
    expect(report).toContain('Timestamp Clustering');
    expect(report).toContain('Session Compression');
    expect(report).toContain('Content Depth');
    expect(report).toContain('Template Similarity');
  });

  it('includes overall PASS summary when all pass', () => {
    const report = formatBatchReport(makeResult({ overallStatus: 'pass' }));
    expect(report).toContain('Overall: PASS');
    expect(report).toContain('No batch production signals detected');
  });

  it('includes overall WARN summary when warnings detected', () => {
    const report = formatBatchReport(makeResult({ overallStatus: 'warn' }));
    expect(report).toContain('Overall: WARN');
    expect(report).toContain('Batch production signals detected');
  });

  it('includes overall CRITICAL summary when critical detected', () => {
    const report = formatBatchReport(makeResult({ overallStatus: 'critical' }));
    expect(report).toContain('Overall: CRITICAL');
    expect(report).toContain('Strong batch production signals detected');
  });

  it('all-pass report produces different output than all-warn report (not constant)', () => {
    const passReport = formatBatchReport(makeResult({ overallStatus: 'pass' }));
    const warnResult = makeResult({
      timestampClustering: makeHeuristic(true, 'warn', 'clustering detected'),
      sessionCompression: makeHeuristic(true, 'warn', 'compression detected'),
      contentDepth: makeHeuristic(true, 'warn', 'shallow content'),
      templateSimilarity: makeHeuristic(true, 'warn', 'template copy'),
      overallStatus: 'warn',
    });
    const warnReport = formatBatchReport(warnResult);
    expect(passReport).not.toBe(warnReport);
  });
});

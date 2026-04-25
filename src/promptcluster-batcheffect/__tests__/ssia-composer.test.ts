/**
 * SSIA Composer tests — Phase 771 (v1.49.573 UIP-19 T2c).
 *
 * Verifies that composeWithSSIA correctly combines v1.49.571 SSIA
 * isotropy-collapse findings with BatchEffect findings without overwriting
 * either sub-report.
 *
 * Reference: Tao et al. arXiv:2604.14441.
 * Cross-link: v1.49.571 SSIA at src/skill-isotropy/.
 */

import { describe, expect, it } from 'vitest';
import { composeWithSSIA } from '../ssia-composer.js';
import { disabledReport } from '../batch-effect-detector.js';
import type { BatchEffectReport } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBatchReport(
  status: BatchEffectReport['status'],
  maxShift = 0,
): BatchEffectReport {
  return {
    status,
    embeddingCount: 40,
    embeddingDim: 16,
    batchKey: { type: 'model-version', value: 'test' },
    significanceLevel: 0.05,
    evidence: status === 'batch-effect-detected'
      ? [
          {
            batchKey: { type: 'model-version', value: 'v2' },
            centroidShiftMagnitude: maxShift,
            welchTStatistic: 4.2,
            pValue: 0.001,
            batchCount: 2,
            batchSizes: { v1: 20, v2: 20 },
            description: 'test evidence',
          },
        ]
      : [],
    maxCentroidShift: maxShift,
    meanCentroidShift: maxShift,
    reportedAt: new Date().toISOString(),
  };
}

function makeSSIAReport(verdict: string): Record<string, unknown> {
  return {
    skillCount: 100,
    embeddingDim: 64,
    config: {},
    findings: verdict === 'collapse-suspected' ? [{ directionIndex: 0 }] : [],
    meanDeviationScore: verdict === 'collapse-suspected' ? 8.5 : 0.3,
    maxDeviationScore: verdict === 'collapse-suspected' ? 12.0 : 0.8,
    verdict,
    runTag: 'anderson-darling|standard-gaussian|M=16|α=0.01|s42',
  };
}

// ---------------------------------------------------------------------------
// Tests: SSIA report is preserved unchanged
// ---------------------------------------------------------------------------

describe('composeWithSSIA — SSIA preservation', () => {
  it('ssiaReport is preserved verbatim in the combined report', () => {
    const ssia = makeSSIAReport('healthy');
    const batch = makeBatchReport('clean');
    const combined = composeWithSSIA(ssia, batch);
    expect(combined.ssiaReport).toBe(ssia); // same reference — not cloned or mutated
  });

  it('batchEffectReport is preserved verbatim in the combined report', () => {
    const ssia = makeSSIAReport('healthy');
    const batch = makeBatchReport('batch-effect-detected', 2.5);
    const combined = composeWithSSIA(ssia, batch);
    expect(combined.batchEffectReport).toBe(batch);
  });

  it('module versions are included in the combined report', () => {
    const combined = composeWithSSIA(null, makeBatchReport('clean'));
    expect(typeof combined.moduleVersions.ssia).toBe('string');
    expect(typeof combined.moduleVersions.batchEffect).toBe('string');
    expect(combined.moduleVersions.ssia).toMatch(/v1\.\d+\.\d+/);
    expect(combined.moduleVersions.batchEffect).toMatch(/v1\.\d+\.\d+/);
  });
});

// ---------------------------------------------------------------------------
// Tests: joint status derivation
// ---------------------------------------------------------------------------

describe('composeWithSSIA — joint status', () => {
  it('healthy + clean → healthy', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('healthy'),
      makeBatchReport('clean'),
    );
    expect(combined.jointStatus).toBe('healthy');
  });

  it('collapse-suspected + clean → degraded', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('collapse-suspected'),
      makeBatchReport('clean'),
    );
    expect(combined.jointStatus).toBe('degraded');
  });

  it('healthy + batch-effect-detected → degraded', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('healthy'),
      makeBatchReport('batch-effect-detected', 3.0),
    );
    expect(combined.jointStatus).toBe('degraded');
  });

  it('collapse-suspected + batch-effect-detected → degraded', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('collapse-suspected'),
      makeBatchReport('batch-effect-detected', 3.0),
    );
    expect(combined.jointStatus).toBe('degraded');
  });

  it('watch + clean → watch', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('watch'),
      makeBatchReport('clean'),
    );
    expect(combined.jointStatus).toBe('watch');
  });

  it('null SSIA (disabled) + clean → healthy', () => {
    const combined = composeWithSSIA(null, makeBatchReport('clean'));
    expect(combined.jointStatus).toBe('healthy');
  });

  it('disabled batch report → disabled joint status', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('healthy'),
      disabledReport({ type: 'model-version', value: 'none' }),
    );
    expect(combined.jointStatus).toBe('disabled');
  });
});

// ---------------------------------------------------------------------------
// Tests: summary string
// ---------------------------------------------------------------------------

describe('composeWithSSIA — summary', () => {
  it('summary string is non-empty and contains joint status', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('healthy'),
      makeBatchReport('clean'),
    );
    expect(typeof combined.summary).toBe('string');
    expect(combined.summary.length).toBeGreaterThan(10);
    expect(combined.summary).toContain('healthy');
  });

  it('summary mentions batch-effect-detected when batch report fires', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('healthy'),
      makeBatchReport('batch-effect-detected', 2.0),
    );
    expect(combined.summary.toLowerCase()).toContain('batch effect');
  });

  it('summary mentions collapse when SSIA fires', () => {
    const combined = composeWithSSIA(
      makeSSIAReport('collapse-suspected'),
      makeBatchReport('clean'),
    );
    expect(combined.summary.toLowerCase()).toContain('collapse');
  });
});

// ---------------------------------------------------------------------------
// Tests: non-overwrite guarantee
// ---------------------------------------------------------------------------

describe('composeWithSSIA — non-overwrite guarantee', () => {
  it('SSIA findings are not lost when batch effect fires', () => {
    const ssia = makeSSIAReport('collapse-suspected');
    const batch = makeBatchReport('batch-effect-detected', 4.0);
    const combined = composeWithSSIA(ssia, batch);
    // SSIA findings array still present in ssiaReport
    const ssiaRec = combined.ssiaReport as Record<string, unknown>;
    expect(Array.isArray(ssiaRec['findings'])).toBe(true);
    expect((ssiaRec['findings'] as unknown[]).length).toBeGreaterThan(0);
    // Batch evidence still present
    expect(combined.batchEffectReport.evidence.length).toBeGreaterThan(0);
  });

  it('combined report does not mutate the original SSIA report', () => {
    const ssia = makeSSIAReport('watch');
    const ssiaVerdictBefore = (ssia as Record<string, unknown>)['verdict'];
    composeWithSSIA(ssia, makeBatchReport('clean'));
    expect((ssia as Record<string, unknown>)['verdict']).toBe(ssiaVerdictBefore);
  });
});

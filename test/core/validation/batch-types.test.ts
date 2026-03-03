/**
 * @file Batch detection type shape tests
 * @description Verifies BatchDetectionConfig, BatchDetectionResult, DepthMarker,
 *              DepthMarkerCategory, BatchHeuristicResult types are importable
 *              and satisfy expected shapes.
 */
import { describe, expect, it } from 'vitest';
import type {
  BatchDetectionConfig,
  BatchDetectionResult,
  DepthMarker,
  DepthMarkerCategory,
  BatchHeuristicResult,
} from '../../../src/core/validation/batch-detection/index.js';
import { DEFAULT_BATCH_DETECTION_CONFIG } from '../../../src/core/validation/batch-detection/index.js';

describe('BatchDetectionConfig type', () => {
  it('should be constructable with all required fields', () => {
    const config: BatchDetectionConfig = {
      timestampClusteringWindowSeconds: 60,
      timestampClusteringMinCount: 3,
      templateSimilarityThreshold: 0.9,
      depthMarkers: [],
      enabled: true,
    };
    expect(config.timestampClusteringWindowSeconds).toBe(60);
    expect(config.timestampClusteringMinCount).toBe(3);
    expect(config.templateSimilarityThreshold).toBe(0.9);
    expect(config.depthMarkers).toEqual([]);
    expect(config.enabled).toBe(true);
  });
});

describe('DepthMarker type', () => {
  it('should accept specific-path category', () => {
    const marker: DepthMarker = {
      category: 'specific-path',
      pattern: '(src/|lib/)\\S+\\.ts',
      description: 'References specific file paths',
      weight: 0.8,
    };
    expect(marker.category).toBe('specific-path');
    expect(marker.weight).toBe(0.8);
  });

  it('should accept struggle-note category', () => {
    const marker: DepthMarker = {
      category: 'struggle-note',
      pattern: '(struggled|difficult)',
      description: 'Contains struggle language',
      weight: 0.7,
    };
    expect(marker.category).toBe('struggle-note');
  });

  it('should accept genuine-question category', () => {
    const marker: DepthMarker = {
      category: 'genuine-question',
      pattern: '(I wonder|why does)',
      description: 'Contains genuine questions',
      weight: 0.9,
    };
    expect(marker.category).toBe('genuine-question');
  });

  it('should accept personalized-observation category', () => {
    const marker: DepthMarker = {
      category: 'personalized-observation',
      pattern: '(I noticed|I found)',
      description: 'Contains first-person observations',
      weight: 0.6,
    };
    expect(marker.category).toBe('personalized-observation');
  });
});

describe('DepthMarkerCategory type', () => {
  it('should accept all four category values', () => {
    const categories: DepthMarkerCategory[] = [
      'specific-path',
      'struggle-note',
      'genuine-question',
      'personalized-observation',
    ];
    expect(categories).toHaveLength(4);
  });
});

describe('BatchHeuristicResult type', () => {
  it('should be constructable with all required fields', () => {
    const result: BatchHeuristicResult = {
      detected: true,
      severity: 'warn',
      details: 'Detected 5 artifacts within 60-second window',
      artifacts: ['file1.md', 'file2.md'],
    };
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('warn');
    expect(result.details).toContain('5 artifacts');
    expect(result.artifacts).toHaveLength(2);
  });

  it('should accept info, warn, and critical severity', () => {
    const info: BatchHeuristicResult = { detected: false, severity: 'info', details: 'ok', artifacts: [] };
    const warn: BatchHeuristicResult = { detected: true, severity: 'warn', details: 'flagged', artifacts: [] };
    const critical: BatchHeuristicResult = { detected: true, severity: 'critical', details: 'bad', artifacts: [] };
    expect(info.severity).toBe('info');
    expect(warn.severity).toBe('warn');
    expect(critical.severity).toBe('critical');
  });
});

describe('BatchDetectionResult type', () => {
  it('should be constructable with all heuristic results', () => {
    const heuristic: BatchHeuristicResult = {
      detected: false,
      severity: 'info',
      details: 'No issues',
      artifacts: [],
    };
    const result: BatchDetectionResult = {
      timestampClustering: heuristic,
      sessionCompression: heuristic,
      contentDepth: heuristic,
      templateSimilarity: heuristic,
      overallStatus: 'pass',
      advisories: [],
      timestamp: '2026-03-02T00:00:00Z',
    };
    expect(result.overallStatus).toBe('pass');
    expect(result.advisories).toEqual([]);
    expect(result.timestampClustering.detected).toBe(false);
  });

  it('should accept warn and critical overall status', () => {
    const heuristic: BatchHeuristicResult = {
      detected: true,
      severity: 'warn',
      details: 'Flagged',
      artifacts: ['a.md'],
    };
    const warnResult: BatchDetectionResult = {
      timestampClustering: heuristic,
      sessionCompression: heuristic,
      contentDepth: heuristic,
      templateSimilarity: heuristic,
      overallStatus: 'warn',
      advisories: ['Warning issued'],
      timestamp: '2026-03-02T00:00:00Z',
    };
    expect(warnResult.overallStatus).toBe('warn');

    const criticalResult: BatchDetectionResult = {
      ...warnResult,
      overallStatus: 'critical',
    };
    expect(criticalResult.overallStatus).toBe('critical');
  });
});

describe('DEFAULT_BATCH_DETECTION_CONFIG', () => {
  it('should be a valid BatchDetectionConfig with sensible defaults', () => {
    const config: BatchDetectionConfig = DEFAULT_BATCH_DETECTION_CONFIG;
    expect(config.timestampClusteringWindowSeconds).toBe(60);
    expect(config.timestampClusteringMinCount).toBe(3);
    expect(config.templateSimilarityThreshold).toBe(0.9);
    expect(config.enabled).toBe(true);
  });

  it('should have depth markers configured', () => {
    expect(DEFAULT_BATCH_DETECTION_CONFIG.depthMarkers.length).toBeGreaterThan(0);
  });

  it('should have all four depth marker categories represented', () => {
    const categories = DEFAULT_BATCH_DETECTION_CONFIG.depthMarkers.map((m) => m.category);
    expect(categories).toContain('specific-path');
    expect(categories).toContain('struggle-note');
    expect(categories).toContain('genuine-question');
    expect(categories).toContain('personalized-observation');
  });

  it('should have all required fields', () => {
    expect(DEFAULT_BATCH_DETECTION_CONFIG).toHaveProperty('timestampClusteringWindowSeconds');
    expect(DEFAULT_BATCH_DETECTION_CONFIG).toHaveProperty('timestampClusteringMinCount');
    expect(DEFAULT_BATCH_DETECTION_CONFIG).toHaveProperty('templateSimilarityThreshold');
    expect(DEFAULT_BATCH_DETECTION_CONFIG).toHaveProperty('depthMarkers');
    expect(DEFAULT_BATCH_DETECTION_CONFIG).toHaveProperty('enabled');
  });
});

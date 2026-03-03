/**
 * @file Behavioral tests for runBatchDetection combined runner
 * @description Phase 558-03 Task 1: Tests for the combined batch detection runner
 *              that orchestrates all four heuristics. Covers overall status logic,
 *              advisory collection, short-circuit behavior, and edge cases.
 */
import { describe, it, expect } from 'vitest';
import { runBatchDetection } from '../../../src/core/validation/batch-detection/batch-runner.js';
import { DEFAULT_BATCH_DETECTION_CONFIG } from '../../../src/core/validation/batch-detection/batch-types.js';
import type { ArtifactTimestamp } from '../../../src/core/validation/pacing-gate/pacing-types.js';
import type { BatchDetectionConfig } from '../../../src/core/validation/batch-detection/batch-types.js';

/** Helper to create ArtifactTimestamp fixtures with offset seconds */
function makeArtifact(path: string, offsetSeconds: number): ArtifactTimestamp {
  const baseMs = new Date('2026-03-01T12:00:00.000Z').getTime();
  return {
    path,
    createdAt: new Date(baseMs + offsetSeconds * 1000).toISOString(),
    sessionId: 'session-1',
    subversionId: 'sv-1',
  };
}

describe('runBatchDetection', () => {
  const config = { ...DEFAULT_BATCH_DETECTION_CONFIG };

  it('returns overallStatus pass when no heuristics detect issues', () => {
    const result = runBatchDetection({
      config,
      artifacts: [makeArtifact('a.md', 0)],
      completedSubversions: 2,
      sessionBudget: 5,
      artifactContents: [{
        path: 'a.md',
        content: 'Looking at src/core/types.ts, I struggled with the import. I wonder why. I noticed a pattern.',
      }],
      templateContent: 'completely different template with no overlap whatsoever',
    });
    expect(result.overallStatus).toBe('pass');
    expect(result.advisories).toEqual([]);
  });

  it('returns overallStatus warn when any heuristic detects at severity warn', () => {
    const result = runBatchDetection({
      config,
      artifacts: [makeArtifact('a.md', 0), makeArtifact('b.md', 10), makeArtifact('c.md', 20)],
      completedSubversions: 2,
      sessionBudget: 5,
      artifactContents: [{
        path: 'a.md',
        content: 'Looking at src/core/types.ts, I struggled with the import. I wonder why. I noticed a pattern.',
      }],
      templateContent: 'completely different template',
    });
    // Timestamp clustering should detect (3 within 60s)
    expect(result.overallStatus).toBe('warn');
  });

  it('populates advisories array with details from detected heuristics', () => {
    const result = runBatchDetection({
      config,
      artifacts: [makeArtifact('a.md', 0), makeArtifact('b.md', 10), makeArtifact('c.md', 20)],
      completedSubversions: 10,
      sessionBudget: 5,
      artifactContents: [{
        path: 'a.md',
        content: 'Generic content without any depth markers.',
      }],
      templateContent: 'completely different template',
    });
    // Should have advisories from: timestamp clustering, session compression, content depth
    expect(result.advisories.length).toBeGreaterThanOrEqual(2);
    expect(result.advisories.some((a) => a.includes('Timestamp clustering'))).toBe(true);
    expect(result.advisories.some((a) => a.includes('Session compression'))).toBe(true);
  });

  it('advisories array is empty when no heuristics detect anything', () => {
    const result = runBatchDetection({
      config,
      artifacts: [makeArtifact('a.md', 0)],
      completedSubversions: 1,
      sessionBudget: 5,
      artifactContents: [{
        path: 'a.md',
        content: 'Looking at src/core/types.ts, I struggled with imports. I wonder why. I noticed a pattern.',
      }],
      templateContent: 'completely different content',
    });
    expect(result.advisories).toEqual([]);
  });

  it('timestamp is a valid ISO string', () => {
    const result = runBatchDetection({
      config,
      artifacts: [],
      completedSubversions: 0,
      sessionBudget: 5,
      artifactContents: [],
      templateContent: '',
    });
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('handles empty artifactContents gracefully', () => {
    const result = runBatchDetection({
      config,
      artifacts: [],
      completedSubversions: 1,
      sessionBudget: 5,
      artifactContents: [],
      templateContent: 'some template',
    });
    expect(result.contentDepth.detected).toBe(false);
    expect(result.contentDepth.severity).toBe('info');
    expect(result.templateSimilarity.detected).toBe(false);
    expect(result.templateSimilarity.severity).toBe('info');
  });

  it('short-circuits when config.enabled is false', () => {
    const disabledConfig: BatchDetectionConfig = { ...config, enabled: false };
    const result = runBatchDetection({
      config: disabledConfig,
      artifacts: [makeArtifact('a.md', 0), makeArtifact('b.md', 10), makeArtifact('c.md', 20)],
      completedSubversions: 100,
      sessionBudget: 1,
      artifactContents: [{ path: 'a.md', content: '' }],
      templateContent: '',
    });
    expect(result.overallStatus).toBe('pass');
    expect(result.advisories).toEqual([]);
    expect(result.timestampClustering.detected).toBe(false);
    expect(result.sessionCompression.detected).toBe(false);
    expect(result.contentDepth.detected).toBe(false);
    expect(result.templateSimilarity.detected).toBe(false);
  });

  it('calls detectTimestampClustering with config and artifacts', () => {
    const artifacts = [makeArtifact('a.md', 0), makeArtifact('b.md', 10), makeArtifact('c.md', 20)];
    const result = runBatchDetection({
      config,
      artifacts,
      completedSubversions: 1,
      sessionBudget: 5,
      artifactContents: [{ path: 'a.md', content: 'full depth: src/types.ts struggled I wonder I noticed' }],
      templateContent: 'different',
    });
    expect(result.timestampClustering.detected).toBe(true);
    expect(result.timestampClustering.artifacts).toContain('a.md');
  });

  it('calls detectSessionCompression with completedSubversions and sessionBudget', () => {
    const result = runBatchDetection({
      config,
      artifacts: [],
      completedSubversions: 10,
      sessionBudget: 5,
      artifactContents: [],
      templateContent: '',
    });
    expect(result.sessionCompression.detected).toBe(true);
    expect(result.sessionCompression.details).toContain('10');
    expect(result.sessionCompression.details).toContain('5');
  });

  it('uses worst content depth result across multiple artifact contents', () => {
    const result = runBatchDetection({
      config,
      artifacts: [],
      completedSubversions: 1,
      sessionBudget: 5,
      artifactContents: [
        { path: 'good.md', content: 'Looking at src/core/types.ts, I struggled. I wonder why. I noticed patterns.' },
        { path: 'bad.md', content: 'Generic content without any markers.' },
      ],
      templateContent: 'different',
    });
    // bad.md should trigger content depth warning (0 categories)
    expect(result.contentDepth.detected).toBe(true);
  });

  it('uses first artifact content for template similarity', () => {
    const templateContent = 'this is the template content for review';
    const result = runBatchDetection({
      config,
      artifacts: [],
      completedSubversions: 1,
      sessionBudget: 5,
      artifactContents: [
        { path: 'a.md', content: templateContent }, // identical to template
        { path: 'b.md', content: 'completely different unique text' },
      ],
      templateContent,
    });
    expect(result.templateSimilarity.detected).toBe(true);
  });

  it('populates all four heuristic fields in the result', () => {
    const result = runBatchDetection({
      config,
      artifacts: [],
      completedSubversions: 1,
      sessionBudget: 5,
      artifactContents: [],
      templateContent: '',
    });
    expect(result).toHaveProperty('timestampClustering');
    expect(result).toHaveProperty('sessionCompression');
    expect(result).toHaveProperty('contentDepth');
    expect(result).toHaveProperty('templateSimilarity');
    expect(result).toHaveProperty('overallStatus');
    expect(result).toHaveProperty('advisories');
    expect(result).toHaveProperty('timestamp');
  });
});

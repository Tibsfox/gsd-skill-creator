/**
 * @file Behavioral tests for checkContentDepth and detectTemplateSimilarity
 * @description Phase 558-02: Tests for the content-analysis batch detection heuristics.
 *              Covers boundary conditions, adversarial proofs, and well-formed result shapes.
 */
import { describe, it, expect } from 'vitest';
import {
  checkContentDepth,
  detectTemplateSimilarity,
} from '../../../src/core/validation/batch-detection/batch-heuristics.js';
import { DEFAULT_BATCH_DETECTION_CONFIG } from '../../../src/core/validation/batch-detection/batch-types.js';
import type { BatchDetectionConfig } from '../../../src/core/validation/batch-detection/batch-types.js';

describe('checkContentDepth', () => {
  const config = { ...DEFAULT_BATCH_DETECTION_CONFIG };

  it('returns detected=true when no depth markers are found (empty content)', () => {
    const result = checkContentDepth(config, 'artifact.md', '');
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('warn');
  });

  it('returns detected=false when all 4 marker categories are found', () => {
    const content = [
      'Looking at the src/core/types.ts file,',          // specific-path
      'I struggled with the import resolution,',          // struggle-note
      'I wonder why does the compiler reject this?,',     // genuine-question
      'I noticed the pattern is consistent.',             // personalized-observation
    ].join('\n');
    const result = checkContentDepth(config, 'artifact.md', content);
    expect(result.detected).toBe(false);
    expect(result.severity).toBe('info');
  });

  it('returns detected=true when only 1 of 4 categories is found (< 50%)', () => {
    const content = 'I was looking at the src/core/types.ts file.';
    const result = checkContentDepth(config, 'artifact.md', content);
    expect(result.detected).toBe(true);
  });

  it('returns detected=false when exactly 2 of 4 categories are found (>= 50%)', () => {
    const content = [
      'The src/core/types.ts file has issues.',     // specific-path
      'I struggled with the configuration.',        // struggle-note
    ].join('\n');
    const result = checkContentDepth(config, 'artifact.md', content);
    expect(result.detected).toBe(false);
  });

  it('details message lists found and missing categories', () => {
    const content = 'Working on src/core/types.ts was difficult and confusing.';
    const result = checkContentDepth(config, 'artifact.md', content);
    expect(result.details).toContain('Content depth');
    expect(result.details).toContain('found');
    expect(result.details).toContain('missing');
  });

  it('artifacts array contains the artifact path', () => {
    const result = checkContentDepth(config, 'my/artifact.md', 'some content');
    expect(result.artifacts).toContain('my/artifact.md');
  });

  it('marker patterns are applied as regex, not literal substrings', () => {
    // The genuine-question pattern is '(I wonder|why does|how does|what if|could this)'
    // This should match "I wonder" as a regex group, not literal "(I wonder|..."
    const content = 'I wonder about the architecture here.';
    const result = checkContentDepth(config, 'artifact.md', content);
    // Should find at least genuine-question category
    expect(result.details).toContain('genuine-question');
  });

  it('custom config with different categories produces different results', () => {
    const customConfig: BatchDetectionConfig = {
      ...config,
      depthMarkers: [
        { category: 'specific-path', pattern: 'CUSTOM_TOKEN', description: 'Custom', weight: 1.0 },
      ],
    };

    // Content that passes default config but fails custom config
    const content = 'Looking at src/core/types.ts with unexpected results. I wonder why.';
    const defaultResult = checkContentDepth(config, 'artifact.md', content);
    const customResult = checkContentDepth(customConfig, 'artifact.md', content);

    // Default: multiple categories found (detected=false)
    // Custom: no 'CUSTOM_TOKEN' found (detected=true since 0/1 < 50%)
    expect(defaultResult.detected).not.toBe(customResult.detected);
  });

  it('returns well-formed BatchHeuristicResult', () => {
    const result = checkContentDepth(config, 'a.md', 'text');
    expect(result).toHaveProperty('detected');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('artifacts');
    expect(typeof result.detected).toBe('boolean');
    expect(typeof result.severity).toBe('string');
    expect(typeof result.details).toBe('string');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });
});

describe('detectTemplateSimilarity', () => {
  it('returns detected=true for identical content (ratio 1.0 > 0.9)', () => {
    const content = 'This is the template content for testing purposes.';
    const result = detectTemplateSimilarity(content, content, 0.9);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('warn');
  });

  it('returns detected=false for completely different content', () => {
    const artifact = 'alpha beta gamma delta epsilon';
    const template = 'one two three four five six seven';
    const result = detectTemplateSimilarity(artifact, template, 0.9);
    expect(result.detected).toBe(false);
    expect(result.severity).toBe('info');
  });

  it('content with added unique tokens lowers ratio below threshold', () => {
    const template = 'review the codebase and document findings';
    // Add enough unique tokens to drop ratio below 0.9
    const artifact = 'review the codebase and document findings plus many additional unique personalized observations about specific patterns discovered during analysis';
    const result = detectTemplateSimilarity(artifact, template, 0.9);
    expect(result.detected).toBe(false);
  });

  it('details message includes computed ratio and threshold', () => {
    const content = 'hello world';
    const template = 'hello world';
    const result = detectTemplateSimilarity(content, template, 0.9);
    expect(result.details).toContain('Template similarity');
    expect(result.details).toContain('threshold');
    expect(result.details).toContain('0.90');
  });

  it('artifacts array is always empty', () => {
    const result = detectTemplateSimilarity('a', 'b', 0.5);
    expect(result.artifacts).toEqual([]);
  });

  it('empty artifact with non-empty template returns ratio 0.0', () => {
    const result = detectTemplateSimilarity('', 'hello world', 0.9);
    expect(result.detected).toBe(false);
    expect(result.details).toContain('0.00');
  });

  it('both empty returns ratio 0.0 (no tokens to compare)', () => {
    const result = detectTemplateSimilarity('', '', 0.9);
    expect(result.detected).toBe(false);
  });

  it('ratio is symmetric (swap artifact and template)', () => {
    const a = 'alpha beta gamma delta';
    const b = 'alpha beta epsilon zeta';
    const result1 = detectTemplateSimilarity(a, b, 0.5);
    const result2 = detectTemplateSimilarity(b, a, 0.5);
    expect(result1.detected).toBe(result2.detected);
    // Extract ratio from details to confirm same value
    const ratio1 = result1.details.match(/(\d+\.\d+)/)?.[1];
    const ratio2 = result2.details.match(/(\d+\.\d+)/)?.[1];
    expect(ratio1).toBe(ratio2);
  });

  it('different thresholds produce different results (not a constant)', () => {
    const content = 'hello world testing one two';
    const template = 'hello world testing three four';
    // Overlap: hello, world, testing (3), Union: hello, world, testing, one, two, three, four (7)
    // Ratio: 3/7 ~ 0.43
    const lowThreshold = detectTemplateSimilarity(content, template, 0.3);
    const highThreshold = detectTemplateSimilarity(content, template, 0.5);
    expect(lowThreshold.detected).toBe(true);   // 0.43 > 0.3
    expect(highThreshold.detected).toBe(false);  // 0.43 <= 0.5
  });

  it('returns well-formed BatchHeuristicResult', () => {
    const result = detectTemplateSimilarity('a', 'b', 0.5);
    expect(result).toHaveProperty('detected');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('artifacts');
    expect(typeof result.detected).toBe('boolean');
    expect(typeof result.severity).toBe('string');
    expect(typeof result.details).toBe('string');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });
});

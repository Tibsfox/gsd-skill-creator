/**
 * Tests for ResearchCompressor service.
 *
 * Validates compression logic, metadata generation, content hash tracking,
 * size targets, section prioritization, and distillation quality.
 */

import { describe, it, expect } from 'vitest';
import { ResearchCompressor } from './research-compressor.js';
import { computeContentHash } from './types.js';

// ============================================================================
// Mock research content (~25KB)
// ============================================================================

function generateMockResearch(): string {
  const sections: string[] = [];

  sections.push(`---
title: Cache Optimization Research
phase: 57
date: 2026-02-08
---`);

  sections.push(`# Cache Optimization Research

This document covers extensive research into prompt cache optimization strategies
for Claude Code skill loading. The research was conducted across multiple sessions
and includes benchmarks, comparisons, and recommendations.`);

  // Key Findings section (~2KB)
  sections.push(`## Key Findings

- **Cache hit rates improve 40-60% when static content precedes dynamic content**
- Anthropic prompt caching uses prefix matching: longer shared prefixes = better cache hits
- Skills loaded in deterministic order achieve 3x better cache performance than random
- Decision: Use three-tier ordering (static > session > dynamic) for cache optimization
- Recommendation: Use content hashing to detect skill staleness without re-reading
- The cache window is approximately 5 minutes for Anthropic's API
- Batch operations with consistent prefixes see the highest cache benefit
- Token savings of 15-25% observed in production workloads with optimized ordering`);

  // Technology Comparison section (~3KB)
  const techLines: string[] = [];
  for (let i = 0; i < 60; i++) {
    techLines.push(`Line ${i}: Detailed comparison data for technology variant ${i} with benchmarks and configuration options that span multiple use cases and deployment scenarios.`);
  }
  sections.push(`## Technology Comparison

${techLines.join('\n')}`);

  // Decisions section (~1.5KB)
  sections.push(`## Decisions

1. **Decision: Three-tier cache system** - Static skills (rarely change) load first, session skills (change per session) load second, dynamic skills (change per request) load last.
2. **Decision: Content hash for staleness** - Use SHA-256 truncated to 16 hex chars for efficient staleness detection.
3. **Decision: Alphabetical tiebreaking** - Within the same cache tier, sort alphabetically for determinism.
4. Avoid using file modification timestamps for cache ordering (unreliable across systems).
5. Use stable prefix ordering to maximize Anthropic prompt cache hits.

### Rationale

The three-tier approach balances simplicity with effectiveness. More granular ordering
provides diminishing returns while increasing complexity. The alphabetical tiebreaker
ensures that any two runs with the same skills produce identical ordering.`);

  // Recommendations section (~2KB)
  sections.push(`## Recommendations

- Use cacheTier metadata field in skill frontmatter with values: static, session, dynamic
- Default to 'dynamic' tier for skills without explicit cacheTier
- Implement as a pipeline stage that runs after scoring but before loading
- Recommendation: Monitor cache hit rates via API response headers
- Consider adding cache warming for frequently used skill combinations
- Avoid reordering within relevance bands (cache is tiebreaker, not primary sort)

### Implementation Guidance

\`\`\`typescript
interface CacheTierConfig {
  static: string[];   // Skills that rarely change
  session: string[];  // Skills that change per session
  dynamic: string[];  // Skills that change per request
}
\`\`\`

When implementing the pipeline stage, ensure that the cache ordering
preserves the relative order of skills within the same relevance band.`);

  // Architecture section (~2KB)
  sections.push(`## Architecture

The cache-aware ordering system integrates into the existing SkillPipeline:

1. ScoreStage assigns relevance scores
2. **CacheOrderStage reorders within equal-score bands**
3. ResolveStage resolves skill content
4. LoadStage applies token budgets

### Pipeline Integration

\`\`\`typescript
class CacheOrderStage implements PipelineStage {
  execute(context: PipelineContext): PipelineContext {
    // Sort within relevance bands by cacheTier
    return context;
  }
}
\`\`\`

The stage reads cacheTier from skill extension metadata and uses it as a
secondary sort key within relevance bands.`);

  // Patterns section (~1.5KB)
  sections.push(`## Patterns

### Prefix Caching Pattern
- Group immutable content at prompt start
- Use skill ordering to maximize prefix overlap between requests
- Avoid interleaving static and dynamic content

### Staleness Detection Pattern
- Hash skill content on load
- Compare against cached hash
- Reload only when hash changes
- Decision: Use content-based invalidation over time-based TTL`);

  // Implementation Details section (~5KB of verbose content)
  const implLines: string[] = [];
  for (let i = 0; i < 100; i++) {
    implLines.push(`Step ${i}: Detailed implementation instruction covering edge case handling, error recovery, retry logic, and configuration management for production deployment scenario ${i}.`);
  }
  sections.push(`## Implementation Details

${implLines.join('\n')}`);

  // References section (~3KB)
  const refLines: string[] = [];
  for (let i = 0; i < 50; i++) {
    refLines.push(`- [Reference ${i}](https://example.com/ref-${i}) - Documentation for component ${i}`);
  }
  sections.push(`## References

See also: Previous research in phases 30-35.
Attribution: Based on analysis by the research team.

${refLines.join('\n')}`);

  // Additional verbose sections to reach ~25KB
  const additionalLines: string[] = [];
  for (let i = 0; i < 80; i++) {
    additionalLines.push(`Benchmark result ${i}: Latency ${Math.random() * 100}ms, throughput ${Math.random() * 1000} req/s, cache hit rate ${Math.random() * 100}%, memory usage ${Math.random() * 512}MB for configuration variant ${i}.`);
  }
  sections.push(`## Benchmarks

${additionalLines.join('\n')}`);

  return sections.join('\n\n');
}

const MOCK_RESEARCH = generateMockResearch();
const MOCK_FILE_PATH = '.planning/phases/57-cache-ordering/research.md';

describe('ResearchCompressor', () => {
  const compressor = new ResearchCompressor();

  // --------------------------------------------------------------------------
  // Test 1: compress() returns CompressedResearch with all required fields
  // --------------------------------------------------------------------------

  it('returns CompressedResearch with all required fields', () => {
    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);

    expect(result).toBeDefined();
    expect(result.skillName).toBeDefined();
    expect(typeof result.skillName).toBe('string');
    expect(result.metadata).toBeDefined();
    expect(result.metadata.name).toBeDefined();
    expect(result.metadata.description).toBeDefined();
    expect(result.body).toBeDefined();
    expect(typeof result.body).toBe('string');
    expect(result.originalSize).toBe(Buffer.byteLength(MOCK_RESEARCH, 'utf-8'));
    expect(result.compressedSize).toBeGreaterThan(0);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
  });

  // --------------------------------------------------------------------------
  // Test 2: output body size is under maxOutputBytes (5000 bytes default)
  // --------------------------------------------------------------------------

  it('output body size is under maxOutputBytes (5000 bytes default)', () => {
    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);

    const bodyBytes = Buffer.byteLength(result.body, 'utf-8');
    expect(bodyBytes).toBeLessThanOrEqual(5000);
  });

  // --------------------------------------------------------------------------
  // Test 3: metadata includes source: 'auto-generated'
  // --------------------------------------------------------------------------

  it('metadata includes source auto-generated', () => {
    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);

    expect(result.metadata.source).toBe('auto-generated');
  });

  // --------------------------------------------------------------------------
  // Test 4: metadata.extensions includes generatedFrom with file and contentHash
  // --------------------------------------------------------------------------

  it('metadata extensions include generatedFrom with file path and contentHash', () => {
    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);

    const ext = result.metadata.metadata.extensions['gsd-skill-creator'];
    expect(ext).toBeDefined();
    expect(ext.generatedFrom).toBeDefined();
    expect(ext.generatedFrom.file).toBe(MOCK_FILE_PATH);
    expect(ext.generatedFrom.contentHash).toBeDefined();
    expect(typeof ext.generatedFrom.contentHash).toBe('string');
    expect(ext.generatedFrom.compressedAt).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // Test 5: contentHash matches computeContentHash(originalContent)
  // --------------------------------------------------------------------------

  it('contentHash matches computeContentHash of original content', () => {
    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);

    const expectedHash = computeContentHash(MOCK_RESEARCH);
    const ext = result.metadata.metadata.extensions['gsd-skill-creator'];
    expect(ext.generatedFrom.contentHash).toBe(expectedHash);
  });

  // --------------------------------------------------------------------------
  // Test 6: compression ratio is at least 5x for a 25KB input
  // --------------------------------------------------------------------------

  it('compression ratio is at least 5x for 25KB input', () => {
    // Verify our mock is approximately 25KB
    const inputSize = Buffer.byteLength(MOCK_RESEARCH, 'utf-8');
    expect(inputSize).toBeGreaterThan(15000);

    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);
    const ratio = result.originalSize / result.compressedSize;
    expect(ratio).toBeGreaterThanOrEqual(5);
  });

  // --------------------------------------------------------------------------
  // Test 7: high-priority sections (Key Findings, Decisions) preserved
  // --------------------------------------------------------------------------

  it('preserves high-priority sections in output', () => {
    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);

    // Key findings content should be present
    expect(result.body).toContain('cache hit rates');
    // Decisions content should be present
    expect(result.body).toContain('Three-tier cache system');
  });

  // --------------------------------------------------------------------------
  // Test 8: low-priority sections truncated or omitted
  // --------------------------------------------------------------------------

  it('truncates or omits low-priority sections', () => {
    const result = compressor.compress(MOCK_FILE_PATH, MOCK_RESEARCH);

    // References URLs should be dropped
    expect(result.body).not.toContain('https://example.com/ref-');
    // Implementation boilerplate should be dropped
    expect(result.body).not.toContain('Step 99:');
  });
});

/**
 * TDD tests for provenance chain builder and inherited tier calculation.
 *
 * Covers buildProvenanceChain upstream tracing, tier metadata handling,
 * getInheritedTier least-familiar calculation, and cycle prevention.
 *
 * @module staging/derived/provenance.test
 */

import { describe, it, expect } from 'vitest';
import type { LineageEntry } from '../../types/observation.js';
import { buildProvenanceChain, getInheritedTier } from './provenance.js';

/**
 * Helper: create a minimal LineageEntry for testing.
 */
function makeEntry(
  artifactId: string,
  artifactType: string,
  inputs: string[] = [],
  metadata: Record<string, unknown> = {},
): LineageEntry {
  return {
    artifactId,
    artifactType: artifactType as LineageEntry['artifactType'],
    stage: 'capture' as LineageEntry['stage'],
    inputs,
    outputs: [],
    metadata,
    timestamp: new Date().toISOString(),
  };
}

describe('buildProvenanceChain', () => {
  it('returns empty chain for unknown artifact', () => {
    const chain = buildProvenanceChain('unknown:id', []);
    expect(chain.artifactId).toBe('unknown:id');
    expect(chain.nodes).toHaveLength(0);
  });

  it('builds single-node chain for artifact with no inputs', () => {
    const entries: LineageEntry[] = [
      makeEntry('skill:test', 'candidate'),
    ];

    const chain = buildProvenanceChain('skill:test', entries);
    expect(chain.nodes).toHaveLength(1);
    expect(chain.nodes[0].artifactId).toBe('skill:test');
    expect(chain.nodes[0].artifactType).toBe('candidate');
    expect(chain.nodes[0].tier).toBe('stranger');
  });

  it('builds multi-node chain with upstream tracing', () => {
    const entries: LineageEntry[] = [
      makeEntry('obs:a', 'observation', []),
      makeEntry('pat:b', 'pattern', ['obs:a']),
      makeEntry('skill:c', 'candidate', ['pat:b']),
    ];

    const chain = buildProvenanceChain('skill:c', entries);
    expect(chain.nodes).toHaveLength(3);

    // Root first, leaf last
    expect(chain.nodes[0].artifactId).toBe('obs:a');
    expect(chain.nodes[0].parent).toBeNull();

    expect(chain.nodes[1].artifactId).toBe('pat:b');
    expect(chain.nodes[1].parent).toBe('obs:a');

    expect(chain.nodes[2].artifactId).toBe('skill:c');
    expect(chain.nodes[2].parent).toBe('pat:b');
  });

  it('handles tier metadata on lineage entries', () => {
    const entries: LineageEntry[] = [
      makeEntry('obs:a', 'observation', [], { familiarityTier: 'home' }),
      makeEntry('skill:b', 'candidate', ['obs:a'], { familiarityTier: 'neighborhood' }),
    ];

    const chain = buildProvenanceChain('skill:b', entries);
    expect(chain.nodes).toHaveLength(2);
    expect(chain.nodes[0].tier).toBe('home');
    expect(chain.nodes[1].tier).toBe('neighborhood');
  });

  it('defaults tier to stranger when metadata is absent', () => {
    const entries: LineageEntry[] = [
      makeEntry('obs:a', 'observation', []),
    ];

    const chain = buildProvenanceChain('obs:a', entries);
    expect(chain.nodes[0].tier).toBe('stranger');
  });

  it('does not loop on circular references', () => {
    const entries: LineageEntry[] = [
      makeEntry('A', 'pattern', ['B']),
      makeEntry('B', 'pattern', ['A']),
    ];

    const chain = buildProvenanceChain('A', entries);

    // Should terminate and contain both nodes
    expect(chain.nodes.length).toBe(2);
    const ids = chain.nodes.map(n => n.artifactId);
    expect(ids).toContain('A');
    expect(ids).toContain('B');
  });
});

describe('getInheritedTier', () => {
  it('returns the least familiar tier in the chain', () => {
    const chain = buildProvenanceChain('skill:c', [
      makeEntry('obs:a', 'observation', [], { familiarityTier: 'home' }),
      makeEntry('pat:b', 'pattern', ['obs:a'], { familiarityTier: 'neighborhood' }),
      makeEntry('skill:c', 'candidate', ['pat:b'], { familiarityTier: 'town' }),
    ]);

    expect(getInheritedTier(chain)).toBe('town');
  });

  it('returns home when all tiers are home', () => {
    const chain = buildProvenanceChain('skill:b', [
      makeEntry('obs:a', 'observation', [], { familiarityTier: 'home' }),
      makeEntry('skill:b', 'candidate', ['obs:a'], { familiarityTier: 'home' }),
    ]);

    expect(getInheritedTier(chain)).toBe('home');
  });

  it('returns stranger when a tier is stranger', () => {
    const chain = buildProvenanceChain('skill:a', [
      makeEntry('skill:a', 'candidate', [], { familiarityTier: 'stranger' }),
    ]);

    expect(getInheritedTier(chain)).toBe('stranger');
  });

  it('returns stranger for empty chain', () => {
    const chain = buildProvenanceChain('unknown:id', []);

    expect(getInheritedTier(chain)).toBe('stranger');
  });
});

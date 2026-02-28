import { describe, it, expect } from 'vitest';
import { computeToolHash, detectHashDrift, detectHashDriftWithTools } from './hash-gate.js';
import type { Tool, HashRecord } from '../../core/types/mcp.js';

// ============================================================================
// Test fixtures
// ============================================================================

function makeTool(name: string, description = 'A test tool'): Tool {
  return {
    name,
    description,
    inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
  };
}

const toolA = makeTool('tool-a', 'First tool');
const toolB = makeTool('tool-b', 'Second tool');
const toolC = makeTool('tool-c', 'Third tool');

/** Modified version of toolA with different description. */
const toolAModified = makeTool('tool-a', 'Modified first tool');

// ============================================================================
// computeToolHash
// ============================================================================

describe('computeToolHash', () => {
  it('returns valid HashRecord with correct serverId and toolCount', () => {
    const result = computeToolHash('server-1', [toolA, toolB]);
    expect(result.serverId).toBe('server-1');
    expect(result.toolCount).toBe(2);
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    expect(result.computedAt).toBeGreaterThan(0);
    expect(result.previousHash).toBeUndefined();
  });

  it('produces deterministic hash for same tools', () => {
    const hash1 = computeToolHash('s1', [toolA, toolB]);
    const hash2 = computeToolHash('s1', [toolA, toolB]);
    expect(hash1.hash).toBe(hash2.hash);
  });

  it('produces same hash regardless of tool order (sorted internally)', () => {
    const hash1 = computeToolHash('s1', [toolA, toolB]);
    const hash2 = computeToolHash('s1', [toolB, toolA]);
    expect(hash1.hash).toBe(hash2.hash);
  });

  it('produces different hash for different tools', () => {
    const hash1 = computeToolHash('s1', [toolA]);
    const hash2 = computeToolHash('s1', [toolB]);
    expect(hash1.hash).not.toBe(hash2.hash);
  });

  it('produces different hash when tool definition changes', () => {
    const hash1 = computeToolHash('s1', [toolA]);
    const hash2 = computeToolHash('s1', [toolAModified]);
    expect(hash1.hash).not.toBe(hash2.hash);
  });

  it('handles empty tool array', () => {
    const result = computeToolHash('s1', []);
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.toolCount).toBe(0);
  });
});

// ============================================================================
// detectHashDrift
// ============================================================================

describe('detectHashDrift', () => {
  it('first connection (no previous record) returns drifted: false', () => {
    const result = detectHashDrift('s1', [toolA, toolB], undefined);
    expect(result.drifted).toBe(false);
    expect(result.previous).toBeUndefined();
    expect(result.current.toolCount).toBe(2);
  });

  it('reconnect with same tools returns drifted: false (SECR-02)', () => {
    const prev = computeToolHash('s1', [toolA, toolB]);
    const result = detectHashDrift('s1', [toolA, toolB], prev);
    expect(result.drifted).toBe(false);
    expect(result.previous).toBe(prev);
  });

  it('changed tool definition returns drifted: true (SECR-01)', () => {
    const prev = computeToolHash('s1', [toolA]);
    const result = detectHashDrift('s1', [toolAModified], prev);
    expect(result.drifted).toBe(true);
    expect(result.current.previousHash).toBe(prev.hash);
  });

  it('added tool returns drifted: true (SECR-03)', () => {
    const prev = computeToolHash('s1', [toolA]);
    const result = detectHashDrift('s1', [toolA, toolB], prev);
    expect(result.drifted).toBe(true);
  });

  it('removed tool returns drifted: true', () => {
    const prev = computeToolHash('s1', [toolA, toolB]);
    const result = detectHashDrift('s1', [toolA], prev);
    expect(result.drifted).toBe(true);
  });
});

// ============================================================================
// detectHashDriftWithTools (full diff support)
// ============================================================================

describe('detectHashDriftWithTools', () => {
  it('first connection returns drifted: false with empty diffs', () => {
    const result = detectHashDriftWithTools('s1', [toolA], undefined, undefined);
    expect(result.drifted).toBe(false);
    expect(result.addedTools).toEqual([]);
    expect(result.removedTools).toEqual([]);
    expect(result.modifiedTools).toEqual([]);
  });

  it('benign reconnect returns drifted: false', () => {
    const prev = computeToolHash('s1', [toolA, toolB]);
    const result = detectHashDriftWithTools('s1', [toolA, toolB], prev, [toolA, toolB]);
    expect(result.drifted).toBe(false);
  });

  it('reports added tools correctly', () => {
    const prev = computeToolHash('s1', [toolA]);
    const result = detectHashDriftWithTools('s1', [toolA, toolB], prev, [toolA]);
    expect(result.drifted).toBe(true);
    expect(result.addedTools).toEqual(['tool-b']);
    expect(result.removedTools).toEqual([]);
    expect(result.modifiedTools).toEqual([]);
  });

  it('reports removed tools correctly', () => {
    const prev = computeToolHash('s1', [toolA, toolB]);
    const result = detectHashDriftWithTools('s1', [toolA], prev, [toolA, toolB]);
    expect(result.drifted).toBe(true);
    expect(result.removedTools).toEqual(['tool-b']);
    expect(result.addedTools).toEqual([]);
  });

  it('reports modified tools correctly', () => {
    const prev = computeToolHash('s1', [toolA]);
    const result = detectHashDriftWithTools('s1', [toolAModified], prev, [toolA]);
    expect(result.drifted).toBe(true);
    expect(result.modifiedTools).toEqual(['tool-a']);
    expect(result.addedTools).toEqual([]);
    expect(result.removedTools).toEqual([]);
  });

  it('reports multiple changes simultaneously', () => {
    const prev = computeToolHash('s1', [toolA, toolB]);
    const result = detectHashDriftWithTools(
      's1',
      [toolAModified, toolC],
      prev,
      [toolA, toolB],
    );
    expect(result.drifted).toBe(true);
    expect(result.addedTools).toEqual(['tool-c']);
    expect(result.removedTools).toEqual(['tool-b']);
    expect(result.modifiedTools).toEqual(['tool-a']);
  });
});

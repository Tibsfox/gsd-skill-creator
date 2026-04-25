/**
 * HB-07 AEL bandit — slow-loop reflection tests. The LLM call is mocked
 * via the injected ReflectionFn — production wires its own model.
 */

import { describe, it, expect } from 'vitest';
import { defaultReflectionFn, runReflection } from '../reflection.js';
import type { ReflectionFn } from '../types.js';
import type { CrossSkillPattern } from '../../roles/types.js';

const PATTERNS: ReadonlyArray<CrossSkillPattern> = Object.freeze([
  Object.freeze({ failureClass: 'unbounded-recursion', occurrences: 4, affectedCandidates: ['c1', 'c2', 'c3'] }),
  Object.freeze({ failureClass: 'silent-truncation', occurrences: 1, affectedCandidates: ['c4'] }),
]);

describe('reflection (slow loop)', () => {
  it('default reflectFn produces insights only for patterns ≥ 2 occurrences', () => {
    const insights = runReflection(defaultReflectionFn, PATTERNS, 'p1', 100);
    // Only the unbounded-recursion pattern should produce an insight.
    expect(insights).toHaveLength(1);
    expect(insights[0]!.failureClass).toBe('unbounded-recursion');
    expect(insights[0]!.confidence).toBeGreaterThan(0);
    expect(insights[0]!.confidence).toBeLessThanOrEqual(1);
  });

  it('mocked LLM ReflectionFn is invoked with frozen-shape input', () => {
    let captured: { patterns: ReadonlyArray<CrossSkillPattern>; currentPolicy: string | null; episode: number } | null = null;
    const mock: ReflectionFn = (input) => {
      captured = { ...input };
      return [
        {
          failureClass: 'silent-truncation',
          rootCausePattern: 'mocked-llm-said-this',
          proposedPolicyChange: 'switch to longer-context retrieval',
          confidence: 0.9,
          producedAt: '2026-04-25T00:00:00Z',
        },
      ];
    };
    const insights = runReflection(mock, PATTERNS, 'p2', 7);
    expect(captured).not.toBeNull();
    expect(captured!.currentPolicy).toBe('p2');
    expect(captured!.episode).toBe(7);
    expect(insights).toHaveLength(1);
    expect(insights[0]!.proposedPolicyChange).toContain('longer-context');
    // runReflection re-freezes returned objects.
    expect(Object.isFrozen(insights[0])).toBe(true);
  });

  it('filters out insights with invalid confidence (≤0, >1, NaN)', () => {
    const mock: ReflectionFn = () => [
      { failureClass: 'a', rootCausePattern: 'r', proposedPolicyChange: 'c', confidence: 0, producedAt: 't' },
      { failureClass: 'b', rootCausePattern: 'r', proposedPolicyChange: 'c', confidence: 1.2, producedAt: 't' },
      { failureClass: 'c', rootCausePattern: 'r', proposedPolicyChange: 'c', confidence: NaN, producedAt: 't' },
      { failureClass: 'd', rootCausePattern: 'r', proposedPolicyChange: 'c', confidence: 0.5, producedAt: 't' },
    ];
    const insights = runReflection(mock, PATTERNS, null, 0);
    expect(insights).toHaveLength(1);
    expect(insights[0]!.failureClass).toBe('d');
  });

  it('returns empty when patterns are empty / non-actionable', () => {
    const insights = runReflection(defaultReflectionFn, [], null, 0);
    expect(insights).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import { LimitationRegistry } from './limitation-registry.js';

describe('LimitationRegistry', () => {
  // ── getLimitations ────────────────────────────────────────────────────────

  it('small has 5 known limitations', () => {
    const registry = new LimitationRegistry();
    const limitations = registry.getLimitations('small');
    expect(limitations).toHaveLength(5);
    expect(limitations).toContain('json-formatting');
    expect(limitations).toContain('context-overflow');
    expect(limitations).toContain('multi-step-reasoning');
    expect(limitations).toContain('instruction-following');
    expect(limitations).toContain('code-generation');
  });

  it('medium has 3 known limitations', () => {
    const registry = new LimitationRegistry();
    expect(registry.getLimitations('medium')).toHaveLength(3);
  });

  it('large has 2 known limitations', () => {
    const registry = new LimitationRegistry();
    expect(registry.getLimitations('large')).toHaveLength(2);
  });

  it('cloud has no known limitations', () => {
    const registry = new LimitationRegistry();
    expect(registry.getLimitations('cloud')).toEqual([]);
  });

  // ── matchFailure ──────────────────────────────────────────────────────────

  it('matches JSON formatting failure on small model', () => {
    const registry = new LimitationRegistry();
    const result = registry.matchFailure('Failed to parse JSON output', 'small');
    expect(result.matched).toBe(true);
    expect(result.limitation).toBe('json-formatting');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('matches context overflow on small model', () => {
    const registry = new LimitationRegistry();
    const result = registry.matchFailure('Response was truncated due to context length exceeded', 'small');
    expect(result.matched).toBe(true);
    expect(result.limitation).toBe('context-overflow');
  });

  it('matches multi-step reasoning failure on small', () => {
    const registry = new LimitationRegistry();
    const result = registry.matchFailure('Failed to follow the reasoning chain step by step', 'small');
    expect(result.matched).toBe(true);
    expect(result.limitation).toBe('multi-step-reasoning');
  });

  it('does not match unrelated error on small', () => {
    const registry = new LimitationRegistry();
    const result = registry.matchFailure('random unrelated error with no keywords', 'small');
    expect(result.matched).toBe(false);
  });

  it('does not match JSON failure on cloud (no limitations)', () => {
    const registry = new LimitationRegistry();
    const result = registry.matchFailure('Failed to parse JSON output', 'cloud');
    expect(result.matched).toBe(false);
  });

  it('matches complex-json on medium', () => {
    const registry = new LimitationRegistry();
    const result = registry.matchFailure('Could not produce valid complex JSON response', 'medium');
    expect(result.matched).toBe(true);
    expect(result.limitation).toBe('complex-json');
  });

  // ── add/remove limitations ────────────────────────────────────────────────

  it('addLimitation adds to registry', () => {
    const registry = new LimitationRegistry();
    registry.addLimitation('cloud', 'new-limitation');
    expect(registry.getLimitations('cloud')).toContain('new-limitation');
  });

  it('removeLimitation removes from registry', () => {
    const registry = new LimitationRegistry();
    registry.removeLimitation('small', 'json-formatting');
    expect(registry.getLimitations('small')).not.toContain('json-formatting');
  });

  // ── confidence ────────────────────────────────────────────────────────────

  it('confidence reflects keyword overlap', () => {
    const registry = new LimitationRegistry();
    // "JSON parse format" should match 3 keywords for json-formatting
    const highMatch = registry.matchFailure('JSON parse format syntax error', 'small');
    // "JSON" alone matches fewer keywords
    const lowMatch = registry.matchFailure('JSON', 'small');
    expect(highMatch.confidence).toBeGreaterThanOrEqual(lowMatch.confidence);
  });
});

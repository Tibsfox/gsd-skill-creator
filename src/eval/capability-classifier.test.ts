import { describe, it, expect } from 'vitest';
import { CapabilityClassifier } from './capability-classifier.js';
import type { ChipCapabilities } from '../chips/types.js';
import type { ModelCapabilityProfile } from './model-aware-grader.js';

// ============================================================================
// Helpers
// ============================================================================

function makeCaps(ctx: number, tools = false): ChipCapabilities {
  return {
    models: ['test-model'],
    maxContextLength: ctx,
    supportsStreaming: false,
    supportsTools: tools,
  };
}

// ============================================================================
// CapabilityClassifier
// ============================================================================

describe('CapabilityClassifier', () => {
  const classifier = new CapabilityClassifier();

  // ── context-based classification ──────────────────────────────────────────

  it('context < 8192, no tools -> small', () => {
    expect(classifier.classify(makeCaps(4096))).toBe('small');
  });

  it('context 16384, no tools -> medium', () => {
    expect(classifier.classify(makeCaps(16384))).toBe('medium');
  });

  it('context 16384, supportsTools -> large (tool modifier)', () => {
    expect(classifier.classify(makeCaps(16384, true))).toBe('large');
  });

  it('context 32768 -> large', () => {
    expect(classifier.classify(makeCaps(32768))).toBe('large');
  });

  it('context 200000 -> cloud', () => {
    expect(classifier.classify(makeCaps(200000))).toBe('cloud');
  });

  // ── boundary tests ────────────────────────────────────────────────────────

  it('context 8192 exact boundary -> medium', () => {
    expect(classifier.classify(makeCaps(8192))).toBe('medium');
  });

  it('context 8191 -> small', () => {
    expect(classifier.classify(makeCaps(8191))).toBe('small');
  });

  it('context 99999 -> large', () => {
    expect(classifier.classify(makeCaps(99999))).toBe('large');
  });

  it('context 100000 exact boundary -> cloud', () => {
    expect(classifier.classify(makeCaps(100000))).toBe('cloud');
  });

  it('context 32767 no tools -> medium', () => {
    expect(classifier.classify(makeCaps(32767))).toBe('medium');
  });

  // ── tool modifier only applies to medium range ────────────────────────────

  it('tool modifier does not affect small (< 8192)', () => {
    expect(classifier.classify(makeCaps(4096, true))).toBe('small');
  });

  it('tool modifier does not affect large (>= 32768)', () => {
    expect(classifier.classify(makeCaps(50000, true))).toBe('large');
  });

  it('tool modifier only applies when context > 16384 in medium range', () => {
    expect(classifier.classify(makeCaps(10000, true))).toBe('medium');
  });

  // ── classifyFromProfile ───────────────────────────────────────────────────

  it('classifyFromProfile works with ModelCapabilityProfile', () => {
    const profile: ModelCapabilityProfile = {
      model: 'test',
      maxContextLength: 4096,
      supportsTools: false,
      supportsStreaming: false,
      modelCount: 1,
      tier: 'local-small',
    };
    expect(classifier.classifyFromProfile(profile)).toBe('small');
  });

  it('classifyFromProfile cloud profile', () => {
    const profile: ModelCapabilityProfile = {
      model: 'claude',
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 1,
      tier: 'cloud',
    };
    expect(classifier.classifyFromProfile(profile)).toBe('cloud');
  });
});

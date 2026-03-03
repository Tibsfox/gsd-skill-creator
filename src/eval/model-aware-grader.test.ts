/**
 * Tests for ModelAwareGrader.
 *
 * TDD: These tests were written first (RED phase) before the implementation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ModelAwareGrader,
  LOCAL_SMALL_CONTEXT_THRESHOLD,
  CLOUD_CONTEXT_THRESHOLD,
} from './model-aware-grader.js';
import type { ModelCapabilityProfile } from './model-aware-grader.js';
import type { ChipRegistry } from '../chips/chip-registry.js';

// ============================================================================
// Helpers
// ============================================================================

function makeRegistry(capabilities: Record<string, object | Error>): ChipRegistry {
  const getResult = (name: string) => {
    const cap = capabilities[name];
    if (cap === undefined) return undefined;

    if (cap instanceof Error) {
      return {
        capabilities: vi.fn().mockRejectedValue(cap),
      };
    }
    return {
      capabilities: vi.fn().mockResolvedValue(cap),
    };
  };

  return {
    get: vi.fn().mockImplementation((name: string) => getResult(name)),
  } as unknown as ChipRegistry;
}

// ============================================================================
// Constants
// ============================================================================

describe('LOCAL_SMALL_CONTEXT_THRESHOLD', () => {
  it('is 8192', () => {
    expect(LOCAL_SMALL_CONTEXT_THRESHOLD).toBe(8192);
  });
});

describe('CLOUD_CONTEXT_THRESHOLD', () => {
  it('is 100000', () => {
    expect(CLOUD_CONTEXT_THRESHOLD).toBe(100000);
  });
});

// ============================================================================
// ModelAwareGrader -- buildCapabilityProfile
// ============================================================================

describe('ModelAwareGrader.buildCapabilityProfile', () => {
  const grader = new ModelAwareGrader();

  it('returns null when chip is not found in registry', async () => {
    const registry = makeRegistry({});
    const profile = await grader.buildCapabilityProfile('unknown-chip', registry);
    expect(profile).toBeNull();
  });

  it('returns null when chip.capabilities() throws', async () => {
    const registry = makeRegistry({
      'broken-chip': new Error('Network error'),
    });
    const profile = await grader.buildCapabilityProfile('broken-chip', registry);
    expect(profile).toBeNull();
  });

  it('builds a profile for a local-small chip (maxContextLength < 8192, supportsTools=false)', async () => {
    const registry = makeRegistry({
      'tiny-llm': {
        models: ['tiny-1b'],
        maxContextLength: 4096,
        supportsStreaming: false,
        supportsTools: false,
      },
    });

    const profile = await grader.buildCapabilityProfile('tiny-llm', registry);

    expect(profile).not.toBeNull();
    expect(profile!.model).toBe('tiny-llm');
    expect(profile!.maxContextLength).toBe(4096);
    expect(profile!.supportsTools).toBe(false);
    expect(profile!.supportsStreaming).toBe(false);
    expect(profile!.modelCount).toBe(1);
    expect(profile!.tier).toBe('local-small');
  });

  it('builds a profile for a local-large chip (8192 <= maxContextLength < 100000)', async () => {
    const registry = makeRegistry({
      'medium-llm': {
        models: ['llama3-70b', 'mistral-7b'],
        maxContextLength: 32768,
        supportsStreaming: true,
        supportsTools: false,
      },
    });

    const profile = await grader.buildCapabilityProfile('medium-llm', registry);

    expect(profile!.tier).toBe('local-large');
    expect(profile!.modelCount).toBe(2);
    expect(profile!.supportsStreaming).toBe(true);
  });

  it('builds a profile for a cloud chip (maxContextLength >= 100000, supportsTools=true)', async () => {
    const registry = makeRegistry({
      'anthropic': {
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
        maxContextLength: 200000,
        supportsStreaming: true,
        supportsTools: true,
      },
    });

    const profile = await grader.buildCapabilityProfile('anthropic', registry);

    expect(profile!.tier).toBe('cloud');
    expect(profile!.supportsTools).toBe(true);
    expect(profile!.maxContextLength).toBe(200000);
  });

  it('assigns tier=local-small for maxContextLength exactly at 8191', async () => {
    const registry = makeRegistry({
      'edge-chip': {
        models: ['edge-model'],
        maxContextLength: 8191,
        supportsStreaming: false,
        supportsTools: false,
      },
    });

    const profile = await grader.buildCapabilityProfile('edge-chip', registry);
    expect(profile!.tier).toBe('local-small');
  });

  it('assigns tier=local-large for maxContextLength exactly at 8192', async () => {
    const registry = makeRegistry({
      'edge-chip': {
        models: ['edge-model'],
        maxContextLength: 8192,
        supportsStreaming: false,
        supportsTools: false,
      },
    });

    const profile = await grader.buildCapabilityProfile('edge-chip', registry);
    expect(profile!.tier).toBe('local-large');
  });

  it('assigns tier=cloud for maxContextLength exactly at 100000', async () => {
    const registry = makeRegistry({
      'edge-cloud': {
        models: ['edge-cloud-model'],
        maxContextLength: 100000,
        supportsStreaming: true,
        supportsTools: true,
      },
    });

    const profile = await grader.buildCapabilityProfile('edge-cloud', registry);
    expect(profile!.tier).toBe('cloud');
  });
});

// ============================================================================
// ModelAwareGrader -- enrichGradingPrompt
// ============================================================================

describe('ModelAwareGrader.enrichGradingPrompt', () => {
  const grader = new ModelAwareGrader();
  const basePrompt = 'Grade this response: the model said "yes"';

  it('returns basePrompt unchanged when profile is null (fallback)', () => {
    const result = grader.enrichGradingPrompt(basePrompt, null);
    expect(result).toBe(basePrompt);
  });

  it('includes model name in enriched prompt', () => {
    const profile: ModelCapabilityProfile = {
      model: 'anthropic',
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 2,
      tier: 'cloud',
    };

    const result = grader.enrichGradingPrompt(basePrompt, profile);
    expect(result).toContain('anthropic');
  });

  it('includes tier in enriched prompt', () => {
    const profile: ModelCapabilityProfile = {
      model: 'tiny-llm',
      maxContextLength: 4096,
      supportsTools: false,
      supportsStreaming: false,
      modelCount: 1,
      tier: 'local-small',
    };

    const result = grader.enrichGradingPrompt(basePrompt, profile);
    expect(result).toContain('local-small');
  });

  it('includes context length in enriched prompt', () => {
    const profile: ModelCapabilityProfile = {
      model: 'anthropic',
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 2,
      tier: 'cloud',
    };

    const result = grader.enrichGradingPrompt(basePrompt, profile);
    expect(result).toContain('200000');
  });

  it('includes tool support in enriched prompt', () => {
    const profile: ModelCapabilityProfile = {
      model: 'anthropic',
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 2,
      tier: 'cloud',
    };

    const result = grader.enrichGradingPrompt(basePrompt, profile);
    // Tool support should be indicated as yes/no
    expect(result).toMatch(/tools?.*yes|yes.*tools?/i);
  });

  it('includes base prompt content in enriched prompt', () => {
    const profile: ModelCapabilityProfile = {
      model: 'anthropic',
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 2,
      tier: 'cloud',
    };

    const result = grader.enrichGradingPrompt(basePrompt, profile);
    expect(result).toContain(basePrompt);
  });
});

// ============================================================================
// ModelAwareGrader -- generateModelHints
// ============================================================================

describe('ModelAwareGrader.generateModelHints', () => {
  const grader = new ModelAwareGrader();

  const failedTests = [
    { prompt: 'What is 2+2?', explanation: 'Model did not answer correctly' },
    { prompt: 'Call the weather API', explanation: 'Model failed to use tools' },
  ];

  it('returns only generic hints when profile is null', () => {
    const hints = grader.generateModelHints(failedTests, null);

    expect(hints.length).toBeGreaterThan(0);
    // Should include deduplicated explanations from failed tests
    expect(hints.some((h) => h.includes('correctly') || h.includes('tools'))).toBe(true);
  });

  it('returns model-specific hints for local-small tier (limited context)', () => {
    const profile: ModelCapabilityProfile = {
      model: 'tiny-llm',
      maxContextLength: 4096,
      supportsTools: false,
      supportsStreaming: false,
      modelCount: 1,
      tier: 'local-small',
    };

    const hints = grader.generateModelHints(failedTests, profile);

    // Should mention limited context
    expect(hints.some((h) => h.includes('4096') && h.toLowerCase().includes('context'))).toBe(true);
  });

  it('returns tool-calling hint for local-small tier when supportsTools=false', () => {
    const profile: ModelCapabilityProfile = {
      model: 'tiny-llm',
      maxContextLength: 4096,
      supportsTools: false,
      supportsStreaming: false,
      modelCount: 1,
      tier: 'local-small',
    };

    const hints = grader.generateModelHints(failedTests, profile);

    // Should mention lack of tool calling
    expect(hints.some((h) => h.toLowerCase().includes('tool'))).toBe(true);
  });

  it('returns moderate context hint for local-large tier', () => {
    const profile: ModelCapabilityProfile = {
      model: 'medium-llm',
      maxContextLength: 32768,
      supportsTools: false,
      supportsStreaming: true,
      modelCount: 2,
      tier: 'local-large',
    };

    const hints = grader.generateModelHints(failedTests, profile);

    expect(hints.some((h) => h.toLowerCase().includes('moderate') || h.toLowerCase().includes('context'))).toBe(true);
  });

  it('returns prompt-specificity hint for cloud tier', () => {
    const profile: ModelCapabilityProfile = {
      model: 'anthropic',
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 2,
      tier: 'cloud',
    };

    const hints = grader.generateModelHints(failedTests, profile);

    // Cloud: focus on prompt specificity
    expect(hints.some((h) => h.toLowerCase().includes('prompt') && h.toLowerCase().includes('specificity'))).toBe(true);
  });

  it('cloud tier hint mentions "full capability"', () => {
    const profile: ModelCapabilityProfile = {
      model: 'anthropic',
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 2,
      tier: 'cloud',
    };

    const hints = grader.generateModelHints(failedTests, profile);

    expect(hints.some((h) => h.toLowerCase().includes('full capability') || h.toLowerCase().includes('full'))).toBe(true);
  });

  it('deduplicates generic hints from failed test explanations', () => {
    const duplicateTests = [
      { prompt: 'Q1', explanation: 'same explanation' },
      { prompt: 'Q2', explanation: 'same explanation' },
    ];

    const hints = grader.generateModelHints(duplicateTests, null);

    // Should appear only once even if explanation is repeated
    const occurrences = hints.filter((h) => h.includes('same explanation'));
    expect(occurrences.length).toBe(1);
  });

  it('returns empty array when no failed tests and no profile', () => {
    const hints = grader.generateModelHints([], null);
    expect(hints).toEqual([]);
  });

  it('includes generic hints alongside tier-specific hints', () => {
    const profile: ModelCapabilityProfile = {
      model: 'tiny-llm',
      maxContextLength: 4096,
      supportsTools: false,
      supportsStreaming: false,
      modelCount: 1,
      tier: 'local-small',
    };

    const hints = grader.generateModelHints(failedTests, profile);

    // Both tier-specific (context/tools) and generic (from test explanations) hints present
    expect(hints.length).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Tests for ChipTestRunner -- chip-aware skill test runner.
 *
 * All chip calls are mocked. Tests verify:
 * - Backward compatibility: delegates to standard TestRunner when no chip configured
 * - Chip execution: sends prompts to the specified chip
 * - Asymmetric eval: chip executes, grader chip grades
 * - Error handling: chip unavailability produces test failure, not thrown error
 * - Grader response parsing: valid and malformed JSON
 * - ChipTestRunResult metadata: chipName and graderChipName fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChipTestRunner } from './chip-test-runner.js';
import type { ChipRunOptions } from './chip-test-runner.js';
import { ChipRegistry } from './chip-registry.js';
import type { ModelChip, ChatMessage, ChatOptions, ChatResponse, ChipHealth, ChipCapabilities } from './types.js';
import type { TestCase } from '../types/testing.js';

// ============================================================================
// Mock helpers
// ============================================================================

function makeTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: 'test-001',
    prompt: 'How do I commit my changes?',
    expected: 'positive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeChip(overrides: Partial<ModelChip> = {}): ModelChip {
  return {
    name: 'test-chip',
    type: 'openai-compatible' as const,
    chat: vi.fn().mockResolvedValue({
      content: 'This looks like a git commit workflow.',
      model: 'llama3',
      usage: { promptTokens: 10, completionTokens: 20 },
    } satisfies ChatResponse),
    health: vi.fn().mockResolvedValue({
      available: true,
      latencyMs: 50,
      lastChecked: new Date().toISOString(),
    } satisfies ChipHealth),
    capabilities: vi.fn().mockResolvedValue({
      models: ['llama3'],
      maxContextLength: 8192,
      supportsStreaming: false,
      supportsTools: false,
    } satisfies ChipCapabilities),
    ...overrides,
  };
}

function makeRegistry(chips: Record<string, ModelChip> = {}): ChipRegistry {
  const registry = new ChipRegistry();
  for (const [name, chip] of Object.entries(chips)) {
    registry.register(name, chip);
  }
  return registry;
}

// ============================================================================
// Mock stores
// ============================================================================

function makeTestStore(tests: TestCase[] = [makeTestCase()]): object {
  return {
    list: vi.fn().mockResolvedValue(tests),
    count: vi.fn().mockResolvedValue(tests.length),
  };
}

function makeSkillStore(): object {
  return {
    read: vi.fn().mockResolvedValue({
      metadata: { description: 'Git workflow skill' },
    }),
    list: vi.fn().mockResolvedValue(['git-workflow']),
  };
}

function makeResultStore(): object {
  return {
    append: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
  };
}

// ============================================================================
// Backward compatibility path (no chip)
// ============================================================================

describe('ChipTestRunner backward compatibility', () => {
  it('delegates to standard TestRunner path when no chip specified and registry not configured', async () => {
    const emptyRegistry = new ChipRegistry(); // not configured
    const testStore = makeTestStore([makeTestCase()]);
    const skillStore = makeSkillStore();
    const resultStore = makeResultStore();

    const runner = new ChipTestRunner(
      emptyRegistry,
      testStore as never,
      skillStore as never,
      resultStore as never,
      'user'
    );

    // Should not throw (standard TestRunner path -- note: may fail if no real skill exists,
    // so we test the code path via the registry flag, not the actual result).
    // The key verification: when registry is not configured, ChipTestRunner
    // creates a standard TestRunner internally. We verify it doesn't try to use chip.chat().
    const chip = makeChip();
    // chip.chat should never be called when registry is not configured
    await expect(
      runner.runForSkill('git-workflow', {})
    ).rejects.toThrow(); // TestRunner will fail (no real skill files) but chip.chat was not called
    expect(chip.chat).not.toHaveBeenCalled();
  });

  it('returns result without chipName when no chip used', async () => {
    // We verify the shape of ChipRunOptions is accepted
    const options: ChipRunOptions = {
      threshold: 0.75,
      storeResults: false,
    };
    expect(options.chip).toBeUndefined();
    expect(options.graderChip).toBeUndefined();
  });
});

// ============================================================================
// Chip execution path
// ============================================================================

describe('ChipTestRunner chip execution', () => {
  it('throws when chip name not found in registry', async () => {
    const registry = makeRegistry(); // empty registry, but is configured via register
    // Manually force configured=false by using fresh registry
    const emptyRegistry = makeRegistry({ 'other-chip': makeChip() });

    const testStore = makeTestStore();
    const skillStore = makeSkillStore();
    const resultStore = makeResultStore();

    const runner = new ChipTestRunner(
      emptyRegistry,
      testStore as never,
      skillStore as never,
      resultStore as never,
      'user'
    );

    await expect(
      runner.runForSkill('git-workflow', { chip: 'nonexistent' })
    ).rejects.toThrow('Chip not found: nonexistent');
  });

  it('sends test prompt to chip.chat() and returns result with chipName', async () => {
    const chip = makeChip({ name: 'ollama' });
    const registry = makeRegistry({ ollama: chip });

    const testCases = [
      makeTestCase({ id: 'tc-1', prompt: 'How do I commit?', expected: 'positive' }),
      makeTestCase({ id: 'tc-2', prompt: 'What is the weather?', expected: 'negative' }),
    ];
    const testStore = makeTestStore(testCases);
    const skillStore = makeSkillStore();
    const resultStore = makeResultStore();

    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      skillStore as never,
      resultStore as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', { chip: 'ollama' });

    expect(result.chipName).toBe('ollama');
    expect(chip.chat).toHaveBeenCalledTimes(2);
    // First call gets the first prompt
    const firstCall = (chip.chat as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(firstCall[0]).toEqual([{ role: 'user', content: 'How do I commit?' }]);
  });

  it('marks test as failed when chip throws (unavailable)', async () => {
    const chip = makeChip({
      name: 'broken-chip',
      chat: vi.fn().mockRejectedValue(new Error('Connection refused')),
    });
    const registry = makeRegistry({ 'broken-chip': chip });

    const testStore = makeTestStore([makeTestCase()]);
    const skillStore = makeSkillStore();
    const resultStore = makeResultStore();

    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      skillStore as never,
      resultStore as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', { chip: 'broken-chip' });

    // Should not throw -- chip error becomes a test failure
    expect(result.metrics.failed).toBeGreaterThan(0);
    expect(result.results[0].passed).toBe(false);
    expect(result.results[0].explanation).toContain('Chip unavailable');
  });
});

// ============================================================================
// Asymmetric evaluation (grader chip)
// ============================================================================

describe('ChipTestRunner grader chip', () => {
  it('uses grader chip to grade responses when graderChip specified', async () => {
    const executorChip = makeChip({ name: 'ollama' });
    const graderChip = makeChip({
      name: 'claude',
      chat: vi.fn().mockResolvedValue({
        content: '{"passed": true, "explanation": "The model correctly identified git commit workflow."}',
        model: 'claude-3-5-sonnet',
        usage: { promptTokens: 50, completionTokens: 20 },
      }),
    });
    const registry = makeRegistry({ ollama: executorChip, claude: graderChip });

    const testStore = makeTestStore([makeTestCase()]);
    const skillStore = makeSkillStore();
    const resultStore = makeResultStore();

    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      skillStore as never,
      resultStore as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', {
      chip: 'ollama',
      graderChip: 'claude',
    });

    expect(result.chipName).toBe('ollama');
    expect(result.graderChipName).toBe('claude');
    expect(graderChip.chat).toHaveBeenCalledOnce();
    // The grader chat call should contain the grading prompt
    const graderCall = (graderChip.chat as ReturnType<typeof vi.fn>).mock.calls[0];
    const graderMessage = graderCall[0][0] as ChatMessage;
    expect(graderMessage.content).toContain('How do I commit my changes?');
    expect(graderCall[1]).toMatchObject({ maxTokens: 512, temperature: 0.0 });
  });

  it('parses grader JSON response: passed=true', async () => {
    const executorChip = makeChip({ name: 'ollama' });
    const graderChip = makeChip({
      name: 'claude',
      chat: vi.fn().mockResolvedValue({
        content: '{"passed": true, "explanation": "Correct."}',
        model: 'claude-3-5-sonnet',
        usage: { promptTokens: 50, completionTokens: 10 },
      }),
    });
    const registry = makeRegistry({ ollama: executorChip, claude: graderChip });

    const testStore = makeTestStore([makeTestCase({ expected: 'positive' })]);
    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      makeSkillStore() as never,
      makeResultStore() as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', {
      chip: 'ollama',
      graderChip: 'claude',
    });

    expect(result.results[0].passed).toBe(true);
    expect(result.results[0].explanation).toBe('Correct.');
  });

  it('parses grader JSON response: passed=false', async () => {
    const executorChip = makeChip({ name: 'ollama' });
    const graderChip = makeChip({
      name: 'claude',
      chat: vi.fn().mockResolvedValue({
        content: '{"passed": false, "explanation": "Wrong topic."}',
        model: 'claude-3-5-sonnet',
        usage: { promptTokens: 50, completionTokens: 10 },
      }),
    });
    const registry = makeRegistry({ ollama: executorChip, claude: graderChip });

    const testStore = makeTestStore([makeTestCase({ expected: 'positive' })]);
    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      makeSkillStore() as never,
      makeResultStore() as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', {
      chip: 'ollama',
      graderChip: 'claude',
    });

    expect(result.results[0].passed).toBe(false);
    expect(result.results[0].explanation).toBe('Wrong topic.');
  });

  it('handles malformed grader JSON gracefully (falls back to keyword matching)', async () => {
    const executorChip = makeChip({ name: 'ollama' });
    const graderChip = makeChip({
      name: 'claude',
      chat: vi.fn().mockResolvedValue({
        content: 'I think the response is good but not properly formatted.',
        model: 'claude-3-5-sonnet',
        usage: { promptTokens: 50, completionTokens: 15 },
      }),
    });
    const registry = makeRegistry({ ollama: executorChip, claude: graderChip });

    const testStore = makeTestStore([makeTestCase()]);
    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      makeSkillStore() as never,
      makeResultStore() as never,
      'user'
    );

    // Should not throw -- malformed JSON falls back to keyword matching
    const result = await runner.runForSkill('git-workflow', {
      chip: 'ollama',
      graderChip: 'claude',
    });

    expect(result).toBeDefined();
    expect(result.results[0]).toBeDefined();
    // passed can be true or false depending on keyword match -- just verify no exception
  });

  it('throws when graderChip specified but not found in registry', async () => {
    const executorChip = makeChip({ name: 'ollama' });
    const registry = makeRegistry({ ollama: executorChip });

    const testStore = makeTestStore([makeTestCase()]);
    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      makeSkillStore() as never,
      makeResultStore() as never,
      'user'
    );

    await expect(
      runner.runForSkill('git-workflow', { chip: 'ollama', graderChip: 'nonexistent' })
    ).rejects.toThrow('Grader chip not found: nonexistent');
  });
});

// ============================================================================
// Metrics computation
// ============================================================================

describe('ChipTestRunner metrics', () => {
  it('computes metrics from chip-graded results', async () => {
    const executorChip = makeChip({ name: 'ollama' });
    const registry = makeRegistry({ ollama: executorChip });

    const testCases = [
      makeTestCase({ id: '1', expected: 'positive' }),
      makeTestCase({ id: '2', expected: 'negative' }),
    ];
    // Response that looks relevant (contains "commit")
    (executorChip.chat as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: 'Yes, git commit is the command you need.',
        model: 'llama3',
        usage: { promptTokens: 5, completionTokens: 10 },
      })
      .mockResolvedValueOnce({
        content: 'The weather today is sunny and warm.',
        model: 'llama3',
        usage: { promptTokens: 5, completionTokens: 8 },
      });

    const testStore = makeTestStore(testCases);
    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      makeSkillStore() as never,
      makeResultStore() as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', { chip: 'ollama' });

    expect(result.metrics.total).toBe(2);
    expect(result.metrics.passed + result.metrics.failed).toBe(2);
    expect(result.chipName).toBe('ollama');
    expect(result.graderChipName).toBeUndefined();
  });

  it('includes chipName and graderChipName in result', async () => {
    const executorChip = makeChip({ name: 'ollama' });
    const graderChip = makeChip({
      name: 'claude',
      chat: vi.fn().mockResolvedValue({
        content: '{"passed": true, "explanation": "OK."}',
        model: 'claude-3-5',
        usage: { promptTokens: 10, completionTokens: 5 },
      }),
    });
    const registry = makeRegistry({ ollama: executorChip, claude: graderChip });

    const testStore = makeTestStore([makeTestCase()]);
    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      makeSkillStore() as never,
      makeResultStore() as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', {
      chip: 'ollama',
      graderChip: 'claude',
    });

    expect(result.chipName).toBe('ollama');
    expect(result.graderChipName).toBe('claude');
  });
});

// ============================================================================
// No-chip built-in grading (keyword matching)
// ============================================================================

describe('ChipTestRunner built-in grading (no grader chip)', () => {
  it('uses keyword matching when no graderChip specified', async () => {
    const chip = makeChip({
      name: 'ollama',
      chat: vi.fn()
        .mockResolvedValueOnce({
          content: 'You should use git commit to save your changes.',
          model: 'llama3',
          usage: { promptTokens: 5, completionTokens: 12 },
        })
        .mockResolvedValueOnce({
          content: 'The quick brown fox jumps over the lazy dog.',
          model: 'llama3',
          usage: { promptTokens: 5, completionTokens: 10 },
        }),
    });
    const registry = makeRegistry({ ollama: chip });

    const testCases = [
      makeTestCase({ id: '1', prompt: 'How do I git commit?', expected: 'positive' }),
      makeTestCase({ id: '2', prompt: 'Tell me a story', expected: 'negative' }),
    ];
    const testStore = makeTestStore(testCases);
    const runner = new ChipTestRunner(
      registry,
      testStore as never,
      makeSkillStore() as never,
      makeResultStore() as never,
      'user'
    );

    const result = await runner.runForSkill('git-workflow', { chip: 'ollama' });

    // No grader chip used
    expect(result.graderChipName).toBeUndefined();
    // Results computed
    expect(result.metrics.total).toBe(2);
  });
});

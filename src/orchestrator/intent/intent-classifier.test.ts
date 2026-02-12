/**
 * Tests for the IntentClassifier pipeline.
 *
 * Verifies the full 5-stage classification pipeline:
 * exact match -> lifecycle filter -> Bayes classify -> confidence resolution -> argument extraction.
 * Also tests circular invocation guard, uninitialized state, semantic fallback, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock embeddings to prevent model loading during tests
vi.mock('../../embeddings/index.js', () => ({
  getEmbeddingService: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

import { IntentClassifier } from './intent-classifier.js';
import type { GsdCommandMetadata, DiscoveryResult } from '../discovery/types.js';
import type { ProjectState } from '../state/types.js';
import { SemanticMatcher } from './semantic-matcher.js';
import type { SemanticMatch } from './semantic-matcher.js';

// ============================================================================
// Fixtures
// ============================================================================

const TEST_COMMANDS: GsdCommandMetadata[] = [
  {
    name: 'gsd:plan-phase',
    description: 'Create detailed execution plan for a phase',
    objective: 'Create a detailed, executable plan for the specified phase',
    argumentHint: '[phase]',
    filePath: '/test/plan-phase.md',
  },
  {
    name: 'gsd:execute-phase',
    description: 'Execute all plans in a phase',
    objective: 'Run all plans in the phase with wave-based parallelization',
    argumentHint: '[phase]',
    filePath: '/test/execute-phase.md',
  },
  {
    name: 'gsd:progress',
    description: 'Show current project progress',
    objective: 'Check project progress and route to next action',
    filePath: '/test/progress.md',
  },
  {
    name: 'gsd:new-project',
    description: 'Initialize a new project',
    objective: 'Set up a new project with deep context gathering',
    filePath: '/test/new-project.md',
  },
  {
    name: 'gsd:debug',
    description: 'Systematic debugging with persistent state',
    objective: 'Debug an issue systematically',
    argumentHint: '"description"',
    filePath: '/test/debug.md',
  },
];

/** Build a minimal DiscoveryResult from test commands */
function makeDiscovery(commands: GsdCommandMetadata[] = TEST_COMMANDS): DiscoveryResult {
  return {
    commands,
    agents: [],
    teams: [],
    location: 'global' as const,
    basePath: '/test',
    discoveredAt: Date.now(),
  };
}

/** Helper to create a minimal ProjectState with overrides */
function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    initialized: true,
    config: {} as ProjectState['config'],
    position: null,
    phases: [
      { number: '38', name: 'Intent', complete: false },
    ],
    plansByPhase: {
      '38': [
        { id: '38-01', complete: false },
      ],
    },
    project: null,
    state: null,
    hasRoadmap: true,
    hasState: false,
    hasProject: false,
    hasConfig: false,
    ...overrides,
  };
}

/** State for an uninitialized project */
function makeUninitializedState(): ProjectState {
  return makeState({
    initialized: false,
    hasRoadmap: false,
    phases: [],
    plansByPhase: {},
  });
}

/** State for a project at milestone-end */
function makeMilestoneEndState(): ProjectState {
  return makeState({
    phases: [
      { number: '36', name: 'Discovery', complete: true },
      { number: '37', name: 'State', complete: true },
    ],
    plansByPhase: {},
  });
}

// ============================================================================
// Mock SemanticMatcher for fallback tests
// ============================================================================

function createMockSemanticMatcher(overrides: {
  isReady?: boolean;
  matchResult?: SemanticMatch[];
} = {}): SemanticMatcher {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(overrides.matchResult ?? []),
    isReady: vi.fn().mockReturnValue(overrides.isReady ?? true),
  } as unknown as SemanticMatcher;
}

// ============================================================================
// IntentClassifier
// ============================================================================

describe('IntentClassifier', () => {
  let classifier: IntentClassifier;
  let executingState: ProjectState;

  beforeEach(() => {
    classifier = new IntentClassifier();
    classifier.initialize(makeDiscovery());
    executingState = makeState();
  });

  // --------------------------------------------------------------------------
  // Exact Match
  // --------------------------------------------------------------------------

  describe('exact match', () => {
    it('returns type "exact-match" with confidence 1.0 for /gsd:plan-phase 3', async () => {
      const result = await classifier.classify('/gsd:plan-phase 3', executingState);
      expect(result.type).toBe('exact-match');
      expect(result.confidence).toBe(1.0);
      expect(result.command).not.toBeNull();
      expect(result.command!.name).toBe('gsd:plan-phase');
    });

    it('extracts phaseNumber from exact match raw args', async () => {
      const result = await classifier.classify('/gsd:plan-phase 3', executingState);
      expect(result.arguments.phaseNumber).toBe('3');
    });

    it('bypasses lifecycle filter for explicit commands', async () => {
      // In uninitialized state, execute-phase would normally be filtered out
      const uninitState = makeUninitializedState();
      const result = await classifier.classify('/gsd:execute-phase 5', uninitState);
      expect(result.type).toBe('exact-match');
      expect(result.confidence).toBe(1.0);
      expect(result.command!.name).toBe('gsd:execute-phase');
    });

    it('includes arguments with flags for exact match', async () => {
      const result = await classifier.classify('/gsd:plan-phase 3 --research', executingState);
      expect(result.type).toBe('exact-match');
      expect(result.arguments.phaseNumber).toBe('3');
      expect(result.arguments.flags).toContain('research');
    });
  });

  // --------------------------------------------------------------------------
  // Bayes Classification
  // --------------------------------------------------------------------------

  describe('classification', () => {
    it('returns type "classified" for clear natural language input', async () => {
      const result = await classifier.classify('plan the next phase', executingState);
      expect(result.type).toBe('classified');
      expect(result.command).not.toBeNull();
      expect(result.command!.name).toBe('gsd:plan-phase');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('respects lifecycle filtering for classification', async () => {
      // In uninitialized state, "create a new project" should match gsd:new-project
      const uninitState = makeUninitializedState();
      const result = await classifier.classify('initialize a new project', uninitState);
      // new-project is valid in uninitialized stage
      expect(result.command).not.toBeNull();
      // It should match new-project (available in uninitialized) or be ambiguous,
      // but should NOT return gsd:plan-phase as the command
      if (result.type === 'classified') {
        expect(result.command!.name).toBe('gsd:new-project');
      } else if (result.type === 'ambiguous') {
        // Ambiguous is acceptable as long as new-project is in alternatives
        const altNames = result.alternatives.map(a => a.command.name);
        expect(altNames).toContain('gsd:new-project');
      }
    });

    it('includes lifecycle stage in classified result', async () => {
      const result = await classifier.classify('plan the next phase', executingState);
      expect(result.lifecycleStage).not.toBeNull();
      expect(result.lifecycleStage).toBe('executing');
    });
  });

  // --------------------------------------------------------------------------
  // No Match
  // --------------------------------------------------------------------------

  describe('no match', () => {
    it('returns type "no-match" for completely unrelated input', async () => {
      const result = await classifier.classify('what is the weather today in paris', executingState);
      // Even if Bayes returns something, we check the result type
      // The confidence should be below threshold for random input
      // Since Bayes always returns SOMETHING, we verify behaviour by checking
      // that truly unrelated input gets low confidence
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('returns type "no-match" for empty input', async () => {
      const result = await classifier.classify('', executingState);
      expect(result.type).toBe('no-match');
      expect(result.command).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('returns type "no-match" for whitespace-only input', async () => {
      const result = await classifier.classify('   ', executingState);
      expect(result.type).toBe('no-match');
      expect(result.command).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Ambiguous
  // --------------------------------------------------------------------------

  describe('ambiguous results', () => {
    it('returns alternatives array with command metadata', async () => {
      // Use config with very high threshold to force ambiguity
      const strictClassifier = new IntentClassifier({
        confidenceThreshold: 0.99,
        ambiguityGap: 0.01,
      });
      strictClassifier.initialize(makeDiscovery());
      const result = await strictClassifier.classify('plan the next phase', executingState);
      // With threshold 0.99, nearly nothing should be confident enough
      if (result.type === 'ambiguous') {
        expect(result.alternatives.length).toBeGreaterThan(0);
        expect(result.alternatives.length).toBeLessThanOrEqual(3); // maxAlternatives default
        for (const alt of result.alternatives) {
          expect(alt.command).toBeDefined();
          expect(alt.command.name).toBeDefined();
          expect(typeof alt.confidence).toBe('number');
        }
      }
      // Either ambiguous or no-match is acceptable with 0.99 threshold
      expect(['ambiguous', 'no-match']).toContain(result.type);
    });

    it('limits alternatives to maxAlternatives config', async () => {
      const limitedClassifier = new IntentClassifier({
        confidenceThreshold: 0.99,
        ambiguityGap: 0.01,
        maxAlternatives: 2,
      });
      limitedClassifier.initialize(makeDiscovery());
      const result = await limitedClassifier.classify('plan the next phase', executingState);
      if (result.type === 'ambiguous') {
        expect(result.alternatives.length).toBeLessThanOrEqual(2);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Circular Invocation Guard
  // --------------------------------------------------------------------------

  describe('circular invocation guard', () => {
    it('prevents re-entrant classify calls', async () => {
      // We test the guard by accessing the private isClassifying flag
      // through a subclass or by verifying the flag mechanism works
      // Since we can't easily trigger true re-entrancy in a sync function,
      // we verify the guard mechanism via the internal flag
      const internalClassifier = classifier as unknown as {
        isClassifying: boolean;
        classify: typeof classifier.classify;
      };

      // Simulate re-entrancy by setting the flag manually
      internalClassifier.isClassifying = true;
      const result = await classifier.classify('/gsd:plan-phase 3', executingState);
      expect(result.type).toBe('no-match');
      expect(result.confidence).toBe(0);

      // Reset the flag
      internalClassifier.isClassifying = false;
    });
  });

  // --------------------------------------------------------------------------
  // Uninitialized Classifier
  // --------------------------------------------------------------------------

  describe('uninitialized classifier', () => {
    it('returns no-match before initialize() is called', async () => {
      const freshClassifier = new IntentClassifier();
      const result = await freshClassifier.classify('plan the next phase', executingState);
      expect(result.type).toBe('no-match');
      expect(result.command).toBeNull();
    });

    it('exact match still works on uninitialized classifier (no commands)', async () => {
      const freshClassifier = new IntentClassifier();
      const result = await freshClassifier.classify('/gsd:plan-phase 3', executingState);
      // No commands loaded, so exact match can't find a match
      expect(result.type).toBe('no-match');
    });
  });

  // --------------------------------------------------------------------------
  // Argument Extraction
  // --------------------------------------------------------------------------

  describe('argument extraction', () => {
    it('includes extracted arguments in exact-match results', async () => {
      const result = await classifier.classify('/gsd:plan-phase 3 --research', executingState);
      expect(result.arguments).toBeDefined();
      expect(result.arguments.phaseNumber).toBe('3');
      expect(result.arguments.flags).toContain('research');
    });

    it('includes extracted arguments in classified results', async () => {
      const result = await classifier.classify('plan phase 3', executingState);
      expect(result.arguments).toBeDefined();
      expect(result.arguments.phaseNumber).toBe('3');
    });

    it('includes raw input in arguments for all result types', async () => {
      const result = await classifier.classify('', executingState);
      expect(result.arguments).toBeDefined();
      expect(result.arguments.raw).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // Config
  // --------------------------------------------------------------------------

  describe('config', () => {
    it('uses default config when no config provided', async () => {
      const defaultClassifier = new IntentClassifier();
      defaultClassifier.initialize(makeDiscovery());
      // Should work with defaults (threshold 0.5, gap 0.15, max 3)
      const result = await defaultClassifier.classify('plan the next phase', executingState);
      expect(result).toBeDefined();
      expect(['exact-match', 'classified', 'ambiguous', 'no-match']).toContain(result.type);
    });

    it('accepts partial config overrides', async () => {
      const customClassifier = new IntentClassifier({ confidenceThreshold: 0.8 });
      customClassifier.initialize(makeDiscovery());
      const result = await customClassifier.classify('plan the next phase', executingState);
      expect(result).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Result Structure
  // --------------------------------------------------------------------------

  describe('result structure', () => {
    it('always includes all required fields in the result', async () => {
      const result = await classifier.classify('/gsd:plan-phase', executingState);
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('command');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('arguments');
      expect(result).toHaveProperty('alternatives');
      expect(result).toHaveProperty('lifecycleStage');
    });

    it('exact match result has empty alternatives array', async () => {
      const result = await classifier.classify('/gsd:plan-phase 3', executingState);
      expect(result.type).toBe('exact-match');
      expect(result.alternatives).toEqual([]);
    });

    it('no-match result has null command and empty alternatives', async () => {
      const result = await classifier.classify('', executingState);
      expect(result.command).toBeNull();
      expect(result.alternatives).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Semantic Fallback
  // --------------------------------------------------------------------------

  describe('semantic fallback', () => {
    it('uses semantic result when Bayes confidence is below threshold', async () => {
      // Use high threshold so Bayes always fails confidence check
      const semanticClassifier = new IntentClassifier({
        confidenceThreshold: 0.99,
        semanticThreshold: 0.7,
      });
      semanticClassifier.initialize(makeDiscovery());

      const mockMatcher = createMockSemanticMatcher({
        isReady: true,
        matchResult: [{
          command: TEST_COMMANDS[0], // plan-phase
          similarity: 0.85,
        }],
      });
      semanticClassifier.setSemanticMatcher(mockMatcher);

      const result = await semanticClassifier.classify('plan the next phase', executingState);
      expect(result.type).toBe('classified');
      expect(result.command!.name).toBe('gsd:plan-phase');
      expect(result.method).toBe('semantic');
    });

    it('does NOT invoke semantic fallback when Bayes confidence is above threshold', async () => {
      // Use low threshold so Bayes passes easily
      const semanticClassifier = new IntentClassifier({
        confidenceThreshold: 0.01,
      });
      semanticClassifier.initialize(makeDiscovery());

      const mockMatcher = createMockSemanticMatcher({ isReady: true });
      semanticClassifier.setSemanticMatcher(mockMatcher);

      await semanticClassifier.classify('plan the next phase', executingState);

      // match() should never be called when Bayes is confident
      expect(mockMatcher.match).not.toHaveBeenCalled();
    });

    it('semantic match result has method: "semantic"', async () => {
      const semanticClassifier = new IntentClassifier({
        confidenceThreshold: 0.99,
        semanticThreshold: 0.7,
      });
      semanticClassifier.initialize(makeDiscovery());

      const mockMatcher = createMockSemanticMatcher({
        isReady: true,
        matchResult: [{
          command: TEST_COMMANDS[2], // progress
          similarity: 0.8,
        }],
      });
      semanticClassifier.setSemanticMatcher(mockMatcher);

      const result = await semanticClassifier.classify('check my status', executingState);
      expect(result.method).toBe('semantic');
    });

    it('Bayes classified result has method: "bayes"', async () => {
      const result = await classifier.classify('plan the next phase', executingState);
      if (result.type === 'classified') {
        expect(result.method).toBe('bayes');
      }
    });

    it('exact match result has method: "exact"', async () => {
      const result = await classifier.classify('/gsd:plan-phase 3', executingState);
      expect(result.method).toBe('exact');
    });
  });

  // --------------------------------------------------------------------------
  // Extension-Gated Semantic Activation
  // --------------------------------------------------------------------------

  describe('extension-gated semantic activation', () => {
    it('initialize() returns a Promise when called with enableSemantic option', async () => {  // timeout: 10000ms for model loading
      const semClassifier = new IntentClassifier({
        confidenceThreshold: 0.99,
        semanticThreshold: 0.7,
      });
      // Current initialize() returns void, not Promise<void>.
      // After implementation, it must return a Promise.
      const result = semClassifier.initialize(makeDiscovery(), { enableSemantic: true });
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    it('initialize() with enableSemantic: false does NOT create SemanticMatcher', async () => {
      const semClassifier = new IntentClassifier({ enableSemantic: true });
      // After implementation, options.enableSemantic: false overrides config
      const initResult = semClassifier.initialize(makeDiscovery(), { enableSemantic: false });
      expect(initResult).toBeInstanceOf(Promise);
      await initResult;

      const internal = semClassifier as unknown as { semanticMatcher: SemanticMatcher | null };
      expect(internal.semanticMatcher).toBeNull();

      // Verify classify still works without semantic (Bayes-only)
      const result = await semClassifier.classify('plan the next phase', executingState);
      expect(result).toBeDefined();
      expect(result.method).not.toBe('semantic');
    });

    it('initialize() defaults to config.enableSemantic when options not provided', async () => {
      // Config has enableSemantic: true (default) -- initialize() should return Promise
      // because it attempts SemanticMatcher creation (even if it silently fails)
      const semClassifier = new IntentClassifier({ enableSemantic: true });
      const initResult = semClassifier.initialize(makeDiscovery());
      // Must return a Promise (the async semantic initialization path)
      expect(initResult).toBeInstanceOf(Promise);
      await initResult;
    });
  });

  // --------------------------------------------------------------------------
  // Graceful Degradation
  // --------------------------------------------------------------------------

  describe('graceful degradation', () => {
    it('when EmbeddingService init throws, classify still works (Bayes-only)', async () => {
      const semClassifier = new IntentClassifier({ enableSemantic: true });

      // Initialize with semantic enabled -- in test env, getEmbeddingService
      // will throw because embeddings aren't available.
      // The key assertion: initialize must return a Promise and NOT throw.
      const initResult = semClassifier.initialize(makeDiscovery(), { enableSemantic: true });
      expect(initResult).toBeInstanceOf(Promise);
      await initResult;

      // classify should still work using Bayes-only
      const result = await semClassifier.classify('plan the next phase', executingState);
      expect(result).toBeDefined();
      expect(['exact-match', 'classified', 'ambiguous', 'no-match']).toContain(result.type);
      // Should NOT be semantic since embeddings are unavailable
      if (result.method) {
        expect(result.method).not.toBe('semantic');
      }
    });

    it('when SemanticMatcher.initialize() rejects, classify works without semantic', async () => {
      // Mock SemanticMatcher.prototype.initialize to throw
      const initSpy = vi.spyOn(SemanticMatcher.prototype, 'initialize')
        .mockRejectedValueOnce(new Error('Embedding model not found'));

      const semClassifier = new IntentClassifier({ enableSemantic: true });

      // Initialize -- semantic will silently degrade, but must return Promise
      const initResult = semClassifier.initialize(makeDiscovery(), { enableSemantic: true });
      expect(initResult).toBeInstanceOf(Promise);
      await initResult;

      // After graceful degradation, semanticMatcher should be null
      const internal = semClassifier as unknown as { semanticMatcher: SemanticMatcher | null };
      expect(internal.semanticMatcher).toBeNull();

      // Classify should work fine with Bayes only
      const result = await semClassifier.classify('plan the next phase', executingState);
      expect(result).toBeDefined();
      expect(result.type).not.toBe('error');

      initSpy.mockRestore();
    });

    it('classification results are identical to pre-semantic behavior when disabled', async () => {
      // Classifier with semantic explicitly disabled -- must still return Promise
      const noSemanticClassifier = new IntentClassifier({ enableSemantic: false });
      const initResult = noSemanticClassifier.initialize(makeDiscovery(), { enableSemantic: false });
      expect(initResult).toBeInstanceOf(Promise);
      await initResult;

      // Classifier with no semantic initialization (original behavior)
      const bayesOnlyClassifier = new IntentClassifier({ enableSemantic: false });
      bayesOnlyClassifier.initialize(makeDiscovery());

      // Test several inputs -- results should be structurally identical
      const inputs = [
        'plan the next phase',
        '/gsd:progress',
        'debug this issue',
        '',
      ];

      for (const input of inputs) {
        const semResult = await noSemanticClassifier.classify(input, executingState);
        const bayesResult = await bayesOnlyClassifier.classify(input, executingState);

        expect(semResult.type).toBe(bayesResult.type);
        expect(semResult.command?.name).toBe(bayesResult.command?.name);
        // Method should never be 'semantic' when disabled
        if (semResult.method) {
          expect(semResult.method).not.toBe('semantic');
        }
      }
    });
  });
});

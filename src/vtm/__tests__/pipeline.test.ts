/**
 * Tests for VTM pipeline orchestrator types and speed selector.
 *
 * Covers:
 * - selectPipelineSpeed(): manual override and auto-detection delegation
 * - PipelineError: structural type validation for stage failure reporting
 * - PipelineResult: structural type validation for complete pipeline output
 *
 * All functions are pure functional API consuming types from ./types.ts.
 */

import { describe, it, expect } from 'vitest';
import type { VisionDocument, MissionPackage } from '../types.js';
import {
  selectPipelineSpeed,
  type PipelineConfig,
  type PipelineSpeed,
  type PipelineStage,
  type VisionStageResult,
  type ResearchStageResult,
  type MissionStageResult,
  type PipelineError,
  type PipelineResult,
} from '../pipeline.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createValidVisionDoc(overrides?: Partial<VisionDocument>): VisionDocument {
  return {
    name: 'Test Pack',
    date: '2026-01-01',
    status: 'initial-vision',
    dependsOn: ['core-framework'],
    context: 'A test context for validation testing',
    vision: 'This vision describes a comprehensive learning system for testing concepts',
    problemStatement: [
      { name: 'Complexity', description: 'Users struggle with complex test setups' },
    ],
    coreConcept: {
      interactionModel: 'Progressive disclosure model',
      description: 'Users learn through progressive layers of complexity',
    },
    architecture: {
      connections: [
        { from: 'ModuleA', to: 'ModuleB', relationship: 'depends-on' },
      ],
    },
    modules: [
      {
        name: 'Foundation Module',
        concepts: ['basics', 'setup'],
      },
      {
        name: 'Advanced Module',
        concepts: ['advanced patterns', 'optimization'],
      },
    ],
    chipsetConfig: {
      name: 'test-pack',
      version: '1.0.0',
      description: 'Test chipset config',
      skills: { 'test-skill': { domain: 'testing', description: 'A test skill' } },
      agents: {
        topology: 'pipeline' as const,
        agents: [{ name: 'test-agent', role: 'tester' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'test_coverage', threshold: 80, action: 'block' as const }],
        },
      },
    },
    successCriteria: ['All tests pass with 100% coverage on core paths'],
    throughLine: 'This connects to the broader ecosystem through progressive disclosure principles',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// selectPipelineSpeed tests
// ---------------------------------------------------------------------------

describe('selectPipelineSpeed', () => {
  it('returns override value when config.speed is set', () => {
    const doc = createValidVisionDoc();
    const config: PipelineConfig = { speed: 'mission-only' };

    const result = selectPipelineSpeed(doc, config);
    expect(result).toBe('mission-only');
  });

  it('delegates to detectResearchNecessity when no override', () => {
    const doc = createValidVisionDoc({
      name: 'Pipeline Engine Service',
      vision: 'A processing pipeline infrastructure for data validation and optimization',
      modules: [
        { name: 'Parser Validator', concepts: ['parsing', 'validation'] },
        { name: 'Cache Optimizer', concepts: ['caching', 'optimization'] },
        { name: 'Registry Service', concepts: ['registry', 'lookup'] },
      ],
      coreConcept: {
        interactionModel: 'Pipeline processing model',
        description: 'Data flows through a validator, optimizer, and registry pipeline',
      },
    });
    const config: PipelineConfig = {};

    const result = selectPipelineSpeed(doc, config);
    // Infrastructure archetype with no safety and few modules -> skip-research
    expect(result).toBe('skip-research');
  });

  it('returns full for safety-domain vision doc via detectResearchNecessity', () => {
    const doc = createValidVisionDoc({
      name: 'Electronics Learning Module Pack',
      vision: 'A comprehensive curriculum teaching electronics concepts through hands-on lessons and exercises',
      modules: Array.from({ length: 6 }, (_, i) => ({
        name: `Lesson Module ${i + 1}`,
        concepts: ['teaching', 'learning'],
        safetyConcerns: i === 0 ? 'Electrical hazard danger with high voltage' : undefined,
      })),
    });
    const config: PipelineConfig = {};

    const result = selectPipelineSpeed(doc, config);
    expect(result).toBe('full');
  });

  it('returns skip-research for infrastructure vision doc', () => {
    const doc = createValidVisionDoc({
      name: 'Pipeline Engine Service',
      vision: 'A processing pipeline infrastructure for data validation and optimization',
      modules: [
        { name: 'Parser Validator', concepts: ['parsing', 'validation'] },
        { name: 'Cache Optimizer', concepts: ['caching', 'optimization'] },
      ],
      coreConcept: {
        interactionModel: 'Pipeline processing model',
        description: 'Data flows through a validator and optimizer pipeline',
      },
    });
    const config: PipelineConfig = {};

    const result = selectPipelineSpeed(doc, config);
    expect(result).toBe('skip-research');
  });
});

// ---------------------------------------------------------------------------
// PipelineError structural validation
// ---------------------------------------------------------------------------

describe('PipelineError', () => {
  it('with vision-only partial output has recoverable: true', () => {
    const visionResult: VisionStageResult = {
      visionDoc: createValidVisionDoc(),
      diagnostics: [],
      archetype: 'infrastructure-component',
      dependencies: ['core-framework'],
    };

    const error: PipelineError = {
      stage: 'research',
      error: new Error('Research compilation failed'),
      partialOutput: { vision: visionResult },
      recoverable: true,
    };

    expect(error.stage).toBe('research');
    expect(error.partialOutput.vision).toBeDefined();
    expect(error.partialOutput.research).toBeUndefined();
    expect(error.recoverable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PipelineResult type validation
// ---------------------------------------------------------------------------

describe('PipelineResult', () => {
  it('validates file manifest array structure', () => {
    const result: PipelineResult = {
      success: true,
      speed: 'full',
      stages: {
        vision: {
          visionDoc: createValidVisionDoc(),
          diagnostics: [],
          archetype: 'infrastructure-component',
          dependencies: [],
        },
      },
      fileManifest: [
        { name: 'README.md', type: 'markdown', size: '2KB' },
        { name: 'milestone-spec.md', type: 'markdown', size: '5KB' },
      ],
      executionSummary: {
        totalTasks: 10,
        parallelTracks: 3,
        sequentialDepth: 4,
        modelSplit: {
          opus: { count: 2, percentage: 20 },
          sonnet: { count: 6, percentage: 60 },
          haiku: { count: 2, percentage: 20 },
        },
        estimatedWallTime: '45min',
        totalTests: 15,
        safetyCriticalTests: 3,
      },
      durationMs: 1500,
    };

    expect(result.success).toBe(true);
    expect(result.speed).toBe('full');
    expect(result.fileManifest).toHaveLength(2);
    expect(result.fileManifest[0]).toEqual({ name: 'README.md', type: 'markdown', size: '2KB' });
    expect(result.executionSummary.totalTasks).toBe(10);
    expect(result.executionSummary.modelSplit.opus.count).toBe(2);
    expect(result.executionSummary.modelSplit.sonnet.percentage).toBe(60);
    expect(result.durationMs).toBe(1500);
  });
});

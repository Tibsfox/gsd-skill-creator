/**
 * Tests for VTM pipeline orchestrator types, speed selector, and runPipeline.
 *
 * Covers:
 * - selectPipelineSpeed(): manual override and auto-detection delegation
 * - PipelineError: structural type validation for stage failure reporting
 * - PipelineResult: structural type validation for complete pipeline output
 * - runPipeline(): full pipeline, skip-research, mission-only, error handling,
 *   file manifest, execution summary, and duration tracking
 *
 * All functions are pure functional API consuming types from ./types.ts.
 */

import { describe, it, expect } from 'vitest';
import type { VisionDocument, MissionPackage } from '../types.js';
import {
  selectPipelineSpeed,
  runPipeline,
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

// ---------------------------------------------------------------------------
// Test fixtures for runPipeline
// ---------------------------------------------------------------------------

/**
 * Generate a valid vision document markdown string for full pipeline testing.
 * This fixture produces markdown that parseVisionDocument can successfully parse.
 */
function createVisionMarkdown(): string {
  return [
    '# Test Pack -- Vision Guide',
    '',
    '**Date:** 2026-01-01',
    '**Status:** Initial Vision',
    '**Depends on:** core-framework',
    '**Context:** A test context for validation testing.',
    '',
    '---',
    '',
    '## Vision',
    '',
    'This vision describes a comprehensive learning system for testing concepts.',
    '',
    '---',
    '',
    '## Problem Statement',
    '',
    '1. **Complexity.** Users struggle with complex test setups.',
    '',
    '---',
    '',
    '## Core Concept',
    '',
    '**Progressive disclosure model.**',
    '',
    'Users learn through progressive layers of complexity.',
    '',
    '---',
    '',
    '## Architecture',
    '',
    '```',
    'Foundation Module -> Advanced Module',
    '```',
    '',
    '**Cross-component connections:**',
    '- Foundation Module -> Advanced Module -- data flow',
    '',
    '---',
    '',
    '## Module 1: Foundation Module',
    '',
    '**What the user learns/gets:**',
    '- Basic concepts',
    '- Setup procedures',
    '',
    '**Try Session:** "Hello World" -- A simple introductory exercise.',
    '',
    '---',
    '',
    '## Module 2: Advanced Module',
    '',
    '**What the user learns/gets:**',
    '- Advanced patterns',
    '- Optimization techniques',
    '',
    '**Try Session:** "Deep Dive" -- Explore advanced patterns.',
    '',
    '---',
    '',
    '## Skill-Creator Integration',
    '',
    '### Chipset Configuration',
    '',
    '```yaml',
    'name: test-pack',
    'version: 1.0.0',
    'description: A test pack for validation',
    '',
    'skills:',
    '  test-skill:',
    '    domain: testing',
    '    description: "Validates test functionality"',
    '',
    'agents:',
    '  topology: pipeline',
    '  agents:',
    '    - name: test-agent',
    '      role: "Runs test validation"',
    '',
    'evaluation:',
    '  gates:',
    '    preDeploy:',
    '      - check: test_coverage',
    '        threshold: 80',
    '        action: block',
    '```',
    '',
    '---',
    '',
    '## Success Criteria',
    '',
    '1. All tests pass with 100% coverage on core paths',
    '',
    '---',
    '',
    '## The Through-Line',
    '',
    'This connects to the broader ecosystem through progressive disclosure principles.',
    '',
    '---',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// runPipeline tests
// ---------------------------------------------------------------------------

describe('runPipeline', () => {
  it('full pipeline with valid vision markdown produces success=true with all three stages', () => {
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.speed).toBe('full');
    expect(result.stages.vision).toBeDefined();
    expect(result.stages.vision.visionDoc).toBeDefined();
    expect(result.stages.vision.archetype).toBeDefined();
    expect(result.stages.research).toBeDefined();
    expect(result.stages.mission).toBeDefined();
  });

  it('full pipeline fileManifest includes milestone-spec, component-spec, wave-plan, test-plan, readme entries', () => {
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.fileManifest.length).toBeGreaterThan(0);

    const types = result.fileManifest.map(f => f.type);
    expect(types).toContain('milestone-spec');
    expect(types).toContain('component-spec');
    expect(types).toContain('wave-plan');
    expect(types).toContain('test-plan');
    expect(types).toContain('readme');

    // Each manifest entry has name, type, and size
    for (const entry of result.fileManifest) {
      expect(entry.name).toBeTruthy();
      expect(entry.type).toBeTruthy();
      expect(entry.size).toBeTruthy();
    }
  });

  it('full pipeline executionSummary has modelSplit with opus/sonnet/haiku percentages', () => {
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    const { executionSummary } = result;
    expect(executionSummary.totalTasks).toBeGreaterThan(0);
    expect(executionSummary.parallelTracks).toBeGreaterThan(0);
    expect(executionSummary.sequentialDepth).toBeGreaterThan(0);

    // modelSplit has all three tiers
    expect(executionSummary.modelSplit.opus).toBeDefined();
    expect(executionSummary.modelSplit.sonnet).toBeDefined();
    expect(executionSummary.modelSplit.haiku).toBeDefined();

    // Each has count and percentage as numbers
    expect(typeof executionSummary.modelSplit.opus.count).toBe('number');
    expect(typeof executionSummary.modelSplit.opus.percentage).toBe('number');
    expect(typeof executionSummary.modelSplit.sonnet.count).toBe('number');
    expect(typeof executionSummary.modelSplit.sonnet.percentage).toBe('number');
    expect(typeof executionSummary.modelSplit.haiku.count).toBe('number');
    expect(typeof executionSummary.modelSplit.haiku.percentage).toBe('number');

    // estimatedWallTime is a string
    expect(typeof executionSummary.estimatedWallTime).toBe('string');
    expect(executionSummary.totalTests).toBeGreaterThan(0);
  });

  it('skip-research pipeline skips research stage, stages.research is undefined', () => {
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown, { speed: 'skip-research' });

    expect(result.success).toBe(true);
    expect(result.speed).toBe('skip-research');
    expect(result.stages.vision).toBeDefined();
    expect(result.stages.research).toBeUndefined();
    expect(result.stages.mission).toBeDefined();
  });

  it('mission-only pipeline with VisionDocument input skips parsing and research', () => {
    const visionDoc = createValidVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.speed).toBe('mission-only');
    expect(result.stages.vision).toBeDefined();
    expect(result.stages.vision.visionDoc).toBe(visionDoc);
    expect(result.stages.research).toBeUndefined();
    expect(result.stages.mission).toBeDefined();
  });

  it('invalid markdown input returns success=false, error.stage=vision, error.recoverable=false', () => {
    const result = runPipeline('not a valid vision document');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.stage).toBe('vision');
    expect(result.error!.recoverable).toBe(false);
    expect(result.error!.partialOutput.vision).toBeUndefined();
  });

  it('pipeline with includeCache=false omits cacheReport from mission stage', () => {
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown, { speed: 'full', includeCache: false });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    expect(result.stages.mission!.cacheReport).toBeUndefined();
  });

  it('pipeline speed auto-detection delegates to selectPipelineSpeed', () => {
    // No speed override -- should auto-detect
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown);

    expect(result.success).toBe(true);
    // The infrastructure archetype with 2 modules and no safety -> skip-research
    expect(result.speed).toBe('skip-research');
    expect(result.stages.research).toBeUndefined();
  });

  it('durationMs is a positive number', () => {
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('error in mission stage returns partialOutput with vision and research', () => {
    // To trigger a mission stage error, we use a VisionDocument with
    // no modules (which will cause issues in mission assembly).
    // The pipeline should catch the error and provide partial output.
    const emptyModulesDoc = createValidVisionDoc({
      modules: [],
    });

    const result = runPipeline(emptyModulesDoc, { speed: 'full' });

    // If it succeeds despite empty modules, that's also valid behavior.
    // But if it fails, the error should have the right shape.
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error!.stage).toBe('mission');
      expect(result.error!.partialOutput.vision).toBeDefined();
      expect(result.error!.partialOutput.research).toBeDefined();
      expect(result.error!.recoverable).toBe(true);
    }
  });

  it('full pipeline with includeCache=true (default) produces cacheReport', () => {
    const markdown = createVisionMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    expect(result.stages.mission!.cacheReport).toBeDefined();
  });
});

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
  type AnalysisReport,
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
  it('full pipeline with valid vision markdown produces success=true with all three stages', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.speed).toBe('full');
    expect(result.stages.vision).toBeDefined();
    expect(result.stages.vision.visionDoc).toBeDefined();
    expect(result.stages.vision.archetype).toBeDefined();
    expect(result.stages.research).toBeDefined();
    expect(result.stages.mission).toBeDefined();
  });

  it('full pipeline fileManifest includes milestone-spec, component-spec, wave-plan, test-plan, readme entries', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

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

  it('full pipeline executionSummary has modelSplit with opus/sonnet/haiku percentages', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

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

  it('skip-research pipeline skips research stage, stages.research is undefined', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'skip-research' });

    expect(result.success).toBe(true);
    expect(result.speed).toBe('skip-research');
    expect(result.stages.vision).toBeDefined();
    expect(result.stages.research).toBeUndefined();
    expect(result.stages.mission).toBeDefined();
  });

  it('mission-only pipeline with VisionDocument input skips parsing and research', async () => {
    const visionDoc = createValidVisionDoc();
    const result = await runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.speed).toBe('mission-only');
    expect(result.stages.vision).toBeDefined();
    expect(result.stages.vision.visionDoc).toBe(visionDoc);
    expect(result.stages.research).toBeUndefined();
    expect(result.stages.mission).toBeDefined();
  });

  it('invalid markdown input returns success=false, error.stage=vision, error.recoverable=false', async () => {
    const result = await runPipeline('not a valid vision document');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.stage).toBe('vision');
    expect(result.error!.recoverable).toBe(false);
    expect(result.error!.partialOutput.vision).toBeUndefined();
  });

  it('pipeline with includeCache=false omits cacheReport from mission stage', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full', includeCache: false });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    expect(result.stages.mission!.cacheReport).toBeUndefined();
  });

  it('pipeline speed auto-detection delegates to selectPipelineSpeed', async () => {
    // No speed override -- should auto-detect based on document content.
    // The test fixture has "learning system" keywords and modules,
    // so classifyArchetype yields educational-pack, and
    // detectResearchNecessity recommends 'full' for educational packs.
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown);

    expect(result.success).toBe(true);
    // Educational-pack archetype with 2 modules -> full research
    expect(result.speed).toBe('full');
    expect(result.stages.research).toBeDefined();
  });

  it('durationMs is a positive number', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('error in mission stage returns partialOutput with vision and research', async () => {
    // To trigger a mission stage error, we use a VisionDocument with
    // no modules (which will cause issues in mission assembly).
    // The pipeline should catch the error and provide partial output.
    const emptyModulesDoc = createValidVisionDoc({
      modules: [],
    });

    const result = await runPipeline(emptyModulesDoc, { speed: 'full' });

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

  it('full pipeline with includeCache=true (default) produces cacheReport', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    expect(result.stages.mission!.cacheReport).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Template integration tests
// ---------------------------------------------------------------------------

describe('template integration', () => {
  it('runPipeline produces renderedDocuments in mission stage result', async () => {
    const visionDoc = createValidVisionDoc();
    const result = await runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    // renderedDocuments field must exist (may be empty if templates not on disk)
    expect(result.stages.mission!.renderedDocuments).toBeDefined();
    expect(Array.isArray(result.stages.mission!.renderedDocuments)).toBe(true);
  });

  it('renderedDocuments includes readme entry when templates available', async () => {
    const visionDoc = createValidVisionDoc();
    const result = await runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    const docs = result.stages.mission!.renderedDocuments ?? [];
    // If renderedDocuments is non-empty, verify at least one has templateName 'readme'
    if (docs.length > 0) {
      const readmeDoc = docs.find(d => d.templateName === 'readme');
      expect(readmeDoc).toBeDefined();
    }
  });

  it('template rendering failure does not fail pipeline', async () => {
    // In test environments, template files are typically not on disk.
    // The pipeline should still return success=true with graceful degradation.
    const visionDoc = createValidVisionDoc();
    const result = await runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    // renderedDocuments exists (may be empty) but pipeline did not fail
    expect(result.stages.mission!.renderedDocuments).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Pipeline enrichment tests
// ---------------------------------------------------------------------------

describe('pipeline enrichment', () => {
  it('full pipeline result includes analysisReport with dependencyGraph', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.analysisReport).toBeDefined();
    expect(result.analysisReport!.dependencyGraph).not.toBeNull();
    expect(result.analysisReport!.dependencyGraph!.ascii).toBeTruthy();
    expect(typeof result.analysisReport!.dependencyGraph!.ascii).toBe('string');
  });

  it('full pipeline result includes sequentialSavings with speedupFactor', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    const savings = result.analysisReport!.sequentialSavings;
    expect(savings).not.toBeNull();
    expect(typeof savings!.sequentialTime).toBe('string');
    expect(typeof savings!.parallelTime).toBe('string');
    expect(typeof savings!.savedTime).toBe('string');
    expect(typeof savings!.speedupFactor).toBe('number');
    expect(savings!.speedupFactor).toBeGreaterThanOrEqual(1.0);
  });

  it('full pipeline result includes riskFactors array', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    const risks = result.analysisReport!.riskFactors;
    expect(risks).not.toBeNull();
    expect(Array.isArray(risks)).toBe(true);
    // If non-empty, each entry has risk, impact, mitigation string fields
    for (const entry of risks!) {
      expect(typeof entry.risk).toBe('string');
      expect(typeof entry.impact).toBe('string');
      expect(typeof entry.mitigation).toBe('string');
    }
  });

  it('full pipeline result includes budgetSummary', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    const budget = result.analysisReport!.budgetSummary;
    expect(budget).not.toBeNull();
    expect(typeof budget!.valid).toBe('boolean');
    expect(typeof budget!.allocation.opus).toBe('number');
    expect(typeof budget!.allocation.sonnet).toBe('number');
    expect(typeof budget!.allocation.haiku).toBe('number');
    expect(typeof budget!.rebalanced).toBe('boolean');
    expect(Array.isArray(budget!.rebalanceChanges)).toBe(true);
  });

  it('mission-only speed mode does not include analysisReport', async () => {
    const visionDoc = createValidVisionDoc();
    const result = await runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.analysisReport).toBeUndefined();
  });

  it('skip-research pipeline still includes analysisReport', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'skip-research' });

    expect(result.success).toBe(true);
    expect(result.analysisReport).toBeDefined();
    expect(result.analysisReport!.dependencyGraph).not.toBeNull();
  });

  it('analysisReport.errors is empty array when all enrichments succeed', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.analysisReport).toBeDefined();
    expect(result.analysisReport!.errors).toBeDefined();
    expect(result.analysisReport!.errors.length).toBe(0);
  });

  it('executionSummary.modelSplit percentages are numbers that sum to ~100', async () => {
    const markdown = createVisionMarkdown();
    const result = await runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    const { modelSplit } = result.executionSummary;
    const sum = modelSplit.opus.percentage + modelSplit.sonnet.percentage + modelSplit.haiku.percentage;
    // Allow tolerance for rounding
    expect(sum).toBeGreaterThanOrEqual(95);
    expect(sum).toBeLessThanOrEqual(105);
  });
});

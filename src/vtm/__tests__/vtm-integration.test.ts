/**
 * Cross-component integration tests for 3 VTM E2E pipeline flows.
 *
 * Goes beyond pipeline.test.ts unit tests by:
 * 1. Verifying intermediate data shapes between stages
 * 2. Testing that upstream outputs are consumed by downstream stages
 * 3. Validating schema compliance of the final MissionPackage using Zod schemas
 *
 * Flows:
 * - Flow 1: vision -> research -> mission (full pipeline)
 * - Flow 2: vision -> mission (skip research)
 * - Flow 3: mission-only from existing VisionDocument
 */

import { describe, it, expect } from 'vitest';
import type { VisionDocument } from '../types.js';
import { MissionPackageSchema } from '../types.js';
import { parseVisionDocument } from '../vision-parser.js';
import { validateVisionDocument, classifyArchetype } from '../vision-validator.js';
import { compileResearch, checkSourceQuality } from '../research-compiler.js';
import { chunkKnowledge, extractSafety } from '../research-utils.js';
import { assembleMissionPackage } from '../mission-assembler.js';
import { validateSelfContainment } from '../mission-assembly.js';
import { generateCacheReport } from '../cache-optimizer.js';
import { validateBudget, type BudgetTask } from '../model-budget.js';
import { runPipeline } from '../pipeline.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Create a valid vision markdown for full pipeline testing.
 * Educational pack with safety concerns to ensure full research path.
 */
function createEducationalMarkdown(): string {
  return [
    '# Electronics Learning Module Pack -- Vision Guide',
    '',
    '**Date:** 2026-02-20',
    '**Status:** Initial Vision',
    '**Depends on:** core-framework',
    '**Context:** A comprehensive educational system teaching electronics from basic circuits through microcontroller programming.',
    '',
    '---',
    '',
    '## Vision',
    '',
    'This vision describes a comprehensive learning system that teaches electronics concepts through hands-on lessons and practical exercises, progressing from basic circuit theory through embedded programming with real hardware.',
    '',
    '---',
    '',
    '## Problem Statement',
    '',
    '1. **Theory Gap.** Learners lack foundational circuit theory needed for practical electronics work.',
    '2. **Safety Risk.** Working with electronics poses electrical shock and burn dangers without training.',
    '',
    '---',
    '',
    '## Core Concept',
    '',
    '**Hands-on discovery model.**',
    '',
    'Learners build real circuits alongside theoretical concepts, using safe low-voltage kits before progressing to mains-level projects.',
    '',
    '---',
    '',
    '## Architecture',
    '',
    '```',
    'Circuit Theory -> Component Lab -> Microcontroller Programming',
    '```',
    '',
    '**Cross-component connections:**',
    '- Circuit Theory -> Component Lab -- foundation knowledge',
    '- Component Lab -> Microcontroller Programming -- hardware skills',
    '',
    '---',
    '',
    '## Module 1: Circuit Theory',
    '',
    '**What the user learns/gets:**',
    '- Ohms law and basic formulas',
    '- Series and parallel circuits',
    '- Capacitors and inductors',
    '',
    '**Try Session:** "LED Circuit" -- Build a simple LED circuit with a current-limiting resistor.',
    '',
    '---',
    '',
    '## Module 2: Component Lab',
    '',
    '**What the user learns/gets:**',
    '- Breadboard prototyping',
    '- Soldering techniques',
    '',
    '**Try Session:** "Solder Kit" -- Solder a simple through-hole PCB kit.',
    '',
    '**Safety considerations:** Soldering iron burn danger hazard with hot surfaces and lead-free solder fumes',
    '',
    '---',
    '',
    '## Module 3: Microcontroller Programming',
    '',
    '**What the user learns/gets:**',
    '- Arduino basics',
    '- Sensor integration',
    '- Serial communication',
    '',
    '**Try Session:** "Blink LED" -- Program an Arduino to blink an LED with variable timing.',
    '',
    '---',
    '',
    '## Skill-Creator Integration',
    '',
    '### Chipset Configuration',
    '',
    '```yaml',
    'name: electronics-pack',
    'version: 1.0.0',
    'description: Electronics educational curriculum',
    '',
    'skills:',
    '  circuit-theory:',
    '    domain: electronics',
    '    description: "Circuit analysis and design fundamentals"',
    '  embedded-programming:',
    '    domain: embedded',
    '    description: "Microcontroller programming and sensor integration"',
    '',
    'agents:',
    '  topology: pipeline',
    '  agents:',
    '    - name: electronics-tutor',
    '      role: "Guides learners through electronics concepts and labs"',
    '',
    'evaluation:',
    '  gates:',
    '    preDeploy:',
    '      - check: safety_review',
    '        threshold: 100',
    '        action: block',
    '```',
    '',
    '---',
    '',
    '## Success Criteria',
    '',
    '1. Learners can calculate voltage, current, and resistance using Ohms law',
    '2. Learners can safely solder a through-hole component onto a PCB',
    '3. Learners can program an Arduino to read sensor data and control outputs',
    '',
    '---',
    '',
    '## The Through-Line',
    '',
    'Electronics education connects to the broader ecosystem through progressive disclosure principles, building from theory to practice.',
    '',
    '---',
  ].join('\n');
}

/**
 * Create an infrastructure-style vision markdown for skip-research flow.
 */
function createInfrastructureMarkdown(): string {
  return [
    '# Config Validator Engine -- Vision Guide',
    '',
    '**Date:** 2026-02-20',
    '**Status:** Initial Vision',
    '**Depends on:** core-framework',
    '**Context:** A configuration validation engine that parses, validates, and transforms config files across formats.',
    '',
    '---',
    '',
    '## Vision',
    '',
    'This vision describes an infrastructure engine for configuration file validation and transformation, supporting JSON, YAML, and TOML formats with extensible schema validation through a plugin-based pipeline processor.',
    '',
    '---',
    '',
    '## Problem Statement',
    '',
    '1. **Format Fragmentation.** Configuration files exist in multiple formats with no unified validation pipeline.',
    '',
    '---',
    '',
    '## Core Concept',
    '',
    '**Pipeline processing model.**',
    '',
    'Configuration files flow through a parser, validator, and transformer pipeline, with format-specific plugins for each stage.',
    '',
    '---',
    '',
    '## Architecture',
    '',
    '```',
    'Format Parser -> Schema Validator -> Config Transformer',
    '```',
    '',
    '**Cross-component connections:**',
    '- Format Parser -> Schema Validator -- parsed AST',
    '- Schema Validator -> Config Transformer -- validated config',
    '',
    '---',
    '',
    '## Module 1: Format Parser',
    '',
    '**What the user learns/gets:**',
    '- Multi-format parsing',
    '- AST generation',
    '',
    '**Try Session:** "Parse Config" -- Parse a YAML config file into an AST.',
    '',
    '---',
    '',
    '## Module 2: Schema Validator',
    '',
    '**What the user learns/gets:**',
    '- Schema definition',
    '- Validation rules',
    '',
    '**Try Session:** "Validate Schema" -- Validate a config against a JSON Schema.',
    '',
    '---',
    '',
    '## Module 3: Config Transformer',
    '',
    '**What the user learns/gets:**',
    '- Format conversion',
    '- Template expansion',
    '',
    '**Try Session:** "Convert Format" -- Convert a YAML config to JSON.',
    '',
    '---',
    '',
    '## Skill-Creator Integration',
    '',
    '### Chipset Configuration',
    '',
    '```yaml',
    'name: config-validator-engine',
    'version: 1.0.0',
    'description: Configuration validation and transformation engine',
    '',
    'skills:',
    '  config-parsing:',
    '    domain: infrastructure',
    '    description: "Multi-format configuration file parsing"',
    '',
    'agents:',
    '  topology: pipeline',
    '  agents:',
    '    - name: config-processor',
    '      role: "Processes and validates configuration files"',
    '',
    'evaluation:',
    '  gates:',
    '    preDeploy:',
    '      - check: type_check',
    '        action: block',
    '```',
    '',
    '---',
    '',
    '## Success Criteria',
    '',
    '1. Engine parses JSON, YAML, and TOML config files into a unified AST',
    '2. Schema validator catches all constraint violations with line-level diagnostics',
    '3. Config transformer converts between supported formats with zero data loss',
    '',
    '---',
    '',
    '## The Through-Line',
    '',
    'Config validation connects to the broader ecosystem through progressive disclosure principles, abstracting format complexity behind a unified interface.',
    '',
    '---',
  ].join('\n');
}

/**
 * Create a VisionDocument object directly for mission-only flow.
 * 3+ modules to meet the flow's requirements.
 */
function createDirectVisionDoc(): VisionDocument {
  return {
    name: 'Data Pipeline Toolkit',
    date: '2026-02-20',
    status: 'initial-vision',
    dependsOn: ['core-framework'],
    context: 'A data pipeline toolkit providing extract-transform-load primitives for batch and stream processing.',
    vision: 'This vision describes an infrastructure toolkit providing data pipeline primitives for building ETL workflows with configurable extractors, transformers, and loaders in a typed processing pipeline.',
    problemStatement: [
      { name: 'Fragmentation', description: 'Data pipelines require assembling disparate tools with no unified type system.' },
    ],
    coreConcept: {
      interactionModel: 'Pipeline processing model',
      description: 'Data flows through a typed extractor, transformer, and loader pipeline with schema validation at each stage boundary.',
    },
    architecture: {
      connections: [
        { from: 'Extractor', to: 'Transformer', relationship: 'feeds-data' },
        { from: 'Transformer', to: 'Loader', relationship: 'outputs-to' },
        { from: 'Extractor', to: 'Schema Registry', relationship: 'validates-against' },
      ],
    },
    modules: [
      {
        name: 'Extractor',
        concepts: ['source connectors', 'schema inference', 'batch reading'],
      },
      {
        name: 'Transformer',
        concepts: ['map operations', 'filter operations', 'aggregation'],
      },
      {
        name: 'Loader',
        concepts: ['sink connectors', 'write strategies', 'error handling'],
      },
      {
        name: 'Schema Registry',
        concepts: ['schema storage', 'compatibility checks'],
      },
    ],
    chipsetConfig: {
      name: 'data-pipeline-toolkit',
      version: '1.0.0',
      description: 'Data pipeline ETL toolkit',
      skills: {
        'data-extraction': { domain: 'data-engineering', description: 'Data source extraction patterns' },
        'data-transformation': { domain: 'data-engineering', description: 'Data transformation operations' },
      },
      agents: {
        topology: 'pipeline',
        agents: [{ name: 'pipeline-agent', role: 'Orchestrates ETL workflow execution' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'type_check', action: 'block' }],
        },
      },
    },
    successCriteria: [
      'Extractors can read from at least 3 source types with schema inference',
      'Transformers support map, filter, and aggregate operations with type preservation',
      'Loaders can write to at least 2 sink types with configurable error handling',
      'Schema Registry validates compatibility between extractor output and transformer input',
    ],
    throughLine: 'The data pipeline toolkit connects to the broader ecosystem through progressive disclosure, letting users start with simple transforms before composing complex workflows.',
  };
}

// ---------------------------------------------------------------------------
// Flow 1: vision -> research -> mission (full pipeline)
// ---------------------------------------------------------------------------

describe('Flow 1: vision -> research -> mission (full pipeline)', () => {
  it('parseVisionDocument produces a valid VisionDocument from educational markdown', () => {
    const markdown = createEducationalMarkdown();
    const result = parseVisionDocument(markdown);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.name.length).toBeGreaterThan(0);
    expect(result.data.modules.length).toBe(3);
  });

  it('validateVisionDocument returns diagnostics array', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const diagnostics = validateVisionDocument(parsed.data);
    expect(Array.isArray(diagnostics)).toBe(true);
  });

  it('classifyArchetype identifies educational-pack archetype', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const archetype = classifyArchetype(parsed.data);
    expect(archetype).toBe('educational-pack');
  });

  it('compileResearch produces topics for each module', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const research = compileResearch(parsed.data);
    expect(research.topics.length).toBe(parsed.data.modules.length);
  });

  it('checkSourceQuality returns an array', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const research = compileResearch(parsed.data);
    const diags = checkSourceQuality(research);
    expect(Array.isArray(diags)).toBe(true);
  });

  it('chunkKnowledge returns all three tiers with content', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const research = compileResearch(parsed.data);
    const tiers = chunkKnowledge(research);

    expect(tiers.summary.content.length).toBeGreaterThan(0);
    expect(tiers.active.content.length).toBeGreaterThan(0);
    expect(tiers.reference.content.length).toBeGreaterThan(0);
  });

  it('extractSafety returns a SafetySection with structure', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const research = compileResearch(parsed.data);
    const safety = extractSafety(research);

    expect(safety.sharedFramework.length).toBeGreaterThan(0);
    expect(typeof safety.hasSafetyCritical).toBe('boolean');
  });

  it('assembleMissionPackage with vision and research produces valid MissionPackage', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const visionDoc = parsed.data;
    const research = compileResearch(visionDoc);
    const missionPackage = assembleMissionPackage(visionDoc, research);

    // Zod schema validation
    const zodResult = MissionPackageSchema.safeParse(missionPackage);
    expect(zodResult.success).toBe(true);
  });

  it('component specs array length matches modules count', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const visionDoc = parsed.data;
    const research = compileResearch(visionDoc);
    const missionPackage = assembleMissionPackage(visionDoc, research);

    expect(missionPackage.componentSpecs.length).toBe(visionDoc.modules.length);
  });

  it('wave execution plan has waves array length > 0', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const visionDoc = parsed.data;
    const research = compileResearch(visionDoc);
    const missionPackage = assembleMissionPackage(visionDoc, research);

    expect(missionPackage.waveExecutionPlan.waves.length).toBeGreaterThan(0);
  });

  it('test plan has tests array length > 0', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const visionDoc = parsed.data;
    const research = compileResearch(visionDoc);
    const missionPackage = assembleMissionPackage(visionDoc, research);

    expect(missionPackage.testPlan.tests.length).toBeGreaterThan(0);
  });

  it('validateSelfContainment runs on component specs', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const visionDoc = parsed.data;
    const research = compileResearch(visionDoc);
    const missionPackage = assembleMissionPackage(visionDoc, research);
    const diags = validateSelfContainment(missionPackage.componentSpecs);

    expect(Array.isArray(diags)).toBe(true);
  });

  it('generateCacheReport produces report with recommendations array', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const visionDoc = parsed.data;
    const research = compileResearch(visionDoc);
    const missionPackage = assembleMissionPackage(visionDoc, research);
    const cacheReport = generateCacheReport(
      missionPackage.waveExecutionPlan,
      missionPackage.componentSpecs,
    );

    expect(cacheReport.recommendations).toBeDefined();
    expect(Array.isArray(cacheReport.recommendations)).toBe(true);
  });

  it('validateBudget returns a budget validation result', () => {
    const markdown = createEducationalMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const visionDoc = parsed.data;
    const research = compileResearch(visionDoc);
    const missionPackage = assembleMissionPackage(visionDoc, research);

    const budgetTasks: BudgetTask[] = missionPackage.componentSpecs.map(spec => ({
      model: spec.modelAssignment,
      estimatedTokens: spec.estimatedTokens,
    }));
    const budgetResult = validateBudget(budgetTasks);

    expect(budgetResult).toBeDefined();
    expect(typeof budgetResult.valid).toBe('boolean');
    expect(Array.isArray(budgetResult.violations)).toBe(true);
  });

  it('end-to-end via runPipeline with full speed passes MissionPackageSchema', () => {
    const markdown = createEducationalMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();

    const zodResult = MissionPackageSchema.safeParse(result.stages.mission!.missionPackage);
    expect(zodResult.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Flow 2: vision -> mission (skip research)
// ---------------------------------------------------------------------------

describe('Flow 2: vision -> mission (skip research)', () => {
  it('assembleMissionPackage succeeds without research input', () => {
    const markdown = createInfrastructureMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const missionPackage = assembleMissionPackage(parsed.data, undefined);
    expect(missionPackage).toBeDefined();
    expect(missionPackage.milestoneSpec).toBeDefined();
    expect(missionPackage.componentSpecs.length).toBeGreaterThan(0);
    expect(missionPackage.waveExecutionPlan).toBeDefined();
    expect(missionPackage.testPlan).toBeDefined();
  });

  it('MissionPackage without research passes Zod schema validation', () => {
    const markdown = createInfrastructureMarkdown();
    const parsed = parseVisionDocument(markdown);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const missionPackage = assembleMissionPackage(parsed.data, undefined);
    const zodResult = MissionPackageSchema.safeParse(missionPackage);
    expect(zodResult.success).toBe(true);
  });

  it('runPipeline with skip-research has undefined research stage and defined mission stage', () => {
    const markdown = createInfrastructureMarkdown();
    const result = runPipeline(markdown, { speed: 'skip-research' });

    expect(result.success).toBe(true);
    expect(result.stages.research).toBeUndefined();
    expect(result.stages.mission).toBeDefined();
  });

  it('skip-research pipeline MissionPackage passes Zod schema validation', () => {
    const markdown = createInfrastructureMarkdown();
    const result = runPipeline(markdown, { speed: 'skip-research' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();

    const zodResult = MissionPackageSchema.safeParse(result.stages.mission!.missionPackage);
    expect(zodResult.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Flow 3: mission-only from existing VisionDocument
// ---------------------------------------------------------------------------

describe('Flow 3: mission-only from existing VisionDocument', () => {
  it('runPipeline with VisionDocument input uses the provided doc without re-parsing', () => {
    const visionDoc = createDirectVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    // The vision stage should use the same reference
    expect(result.stages.vision.visionDoc).toBe(visionDoc);
  });

  it('research stage is skipped in mission-only mode', () => {
    const visionDoc = createDirectVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.stages.research).toBeUndefined();
  });

  it('mission stage completed with missionPackage', () => {
    const visionDoc = createDirectVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    expect(result.stages.mission!.missionPackage).toBeDefined();
  });

  it('MissionPackage passes Zod schema validation', () => {
    const visionDoc = createDirectVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    const zodResult = MissionPackageSchema.safeParse(result.stages.mission!.missionPackage);
    expect(zodResult.success).toBe(true);
  });

  it('executionSummary has non-zero totalTasks', () => {
    const visionDoc = createDirectVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.executionSummary.totalTasks).toBeGreaterThan(0);
  });

  it('assembleMissionPackage called directly produces valid MissionPackage', () => {
    const visionDoc = createDirectVisionDoc();
    const missionPackage = assembleMissionPackage(visionDoc, undefined);

    const zodResult = MissionPackageSchema.safeParse(missionPackage);
    expect(zodResult.success).toBe(true);
  });

  it('validateSelfContainment runs on direct assembly output', () => {
    const visionDoc = createDirectVisionDoc();
    const missionPackage = assembleMissionPackage(visionDoc, undefined);
    const diags = validateSelfContainment(missionPackage.componentSpecs);

    expect(Array.isArray(diags)).toBe(true);
  });

  it('validateBudget runs on direct assembly output', () => {
    const visionDoc = createDirectVisionDoc();
    const missionPackage = assembleMissionPackage(visionDoc, undefined);

    const budgetTasks: BudgetTask[] = missionPackage.componentSpecs.map(spec => ({
      model: spec.modelAssignment,
      estimatedTokens: spec.estimatedTokens,
    }));
    const budgetResult = validateBudget(budgetTasks);

    expect(budgetResult).toBeDefined();
    expect(typeof budgetResult.valid).toBe('boolean');
  });
});

/**
 * Eval harness tests for the 5 VTM evaluation scenarios from evals.json.
 *
 * Tests structural/programmatic properties of runPipeline output for each
 * scenario type. These complement the qualitative LLM-as-judge expectations
 * in evals.json with concrete assertions verifiable in code.
 *
 * Scenarios:
 * - eval-01: Vision from idea (drone pack) — vision stage parsing
 * - eval-02: Mission from vision (music pack) — mission-only pipeline
 * - eval-03: Research compilation (nutrition) — research stage functions
 * - eval-04: Full pipeline (home repair) — all three stages
 * - eval-05: Infrastructure vision (plugin system) — archetype + speed selection
 */

import { describe, it, expect } from 'vitest';
import type { VisionDocument } from '../types.js';
import { parseVisionDocument } from '../vision-parser.js';
import { classifyArchetype } from '../vision-validator.js';
import { compileResearch, checkSourceQuality } from '../research-compiler.js';
import { chunkKnowledge, extractSafety } from '../research-utils.js';
import { selectPipelineSpeed, runPipeline } from '../pipeline.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Create a drone-themed vision document markdown string for eval-01.
 * An educational pack about building and flying drones.
 */
function createDroneVisionMarkdown(): string {
  return [
    '# Educational Drone Pack -- Vision Guide',
    '',
    '**Date:** 2026-01-15',
    '**Status:** Initial Vision',
    '**Depends on:** core-framework',
    '**Context:** A comprehensive learning system teaching drone building and flight from RC basics through autonomous GPS waypoints.',
    '',
    '---',
    '',
    '## Vision',
    '',
    'This vision describes a comprehensive educational system that teaches people how to build and fly drones, progressing from basic RC concepts through autonomous flight with GPS waypoints. The curriculum covers hardware assembly, flight mechanics, safety protocols, and programming autonomous behaviors.',
    '',
    '---',
    '',
    '## Problem Statement',
    '',
    '1. **Complexity Barrier.** Building drones requires knowledge across electronics, aerodynamics, and software that most learners lack.',
    '2. **Safety Gap.** Drone flight poses real physical dangers without proper training and safety protocols.',
    '',
    '---',
    '',
    '## Core Concept',
    '',
    '**Progressive skill-building model.**',
    '',
    'Learners progress from understanding RC fundamentals to autonomous drone flight, building physical and programming skills in parallel through hands-on modules.',
    '',
    '---',
    '',
    '## Architecture',
    '',
    '```',
    'RC Basics -> Flight Mechanics -> Autonomous Navigation',
    '```',
    '',
    '**Cross-component connections:**',
    '- RC Basics -> Flight Mechanics -- prerequisite knowledge',
    '- Flight Mechanics -> Autonomous Navigation -- skill progression',
    '',
    '---',
    '',
    '## Module 1: RC Basics',
    '',
    '**What the user learns/gets:**',
    '- Radio control fundamentals',
    '- Motor and propeller selection',
    '- Battery management',
    '',
    '**Try Session:** "First Hover" -- Get a pre-built drone hovering in a safe indoor space.',
    '',
    '**Safety considerations:** Propeller danger hazard with spinning blades',
    '',
    '---',
    '',
    '## Module 2: Flight Mechanics',
    '',
    '**What the user learns/gets:**',
    '- Aerodynamic principles',
    '- PID controller tuning',
    '- Manual flight maneuvers',
    '',
    '**Try Session:** "Figure Eight" -- Fly a basic figure-eight pattern outdoors.',
    '',
    '---',
    '',
    '## Module 3: Autonomous Navigation',
    '',
    '**What the user learns/gets:**',
    '- GPS waypoint programming',
    '- Sensor integration',
    '- Autonomous flight modes',
    '',
    '**Try Session:** "Waypoint Route" -- Program a 3-point GPS waypoint route.',
    '',
    '---',
    '',
    '## Skill-Creator Integration',
    '',
    '### Chipset Configuration',
    '',
    '```yaml',
    'name: drone-pack',
    'version: 1.0.0',
    'description: Educational drone building and flight curriculum',
    '',
    'skills:',
    '  drone-assembly:',
    '    domain: electronics',
    '    description: "Hardware assembly and component selection"',
    '  flight-control:',
    '    domain: aerodynamics',
    '    description: "Flight mechanics and controller tuning"',
    '',
    'agents:',
    '  topology: pipeline',
    '  agents:',
    '    - name: curriculum-agent',
    '      role: "Sequences learning modules for progressive skill building"',
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
    '1. Learners can identify all major drone components and their functions',
    '2. Learners can safely operate a drone in an open outdoor environment',
    '3. Learners can program at least 3 GPS waypoints for autonomous flight',
    '',
    '---',
    '',
    '## The Through-Line',
    '',
    'Drone education connects to the broader ecosystem through progressive disclosure principles, building skills layer by layer.',
    '',
    '---',
  ].join('\n');
}

/**
 * Create a music-themed VisionDocument object for eval-02.
 * A music production educational pack.
 */
function createMusicVisionDoc(): VisionDocument {
  return {
    name: 'Music Production Pack',
    date: '2026-02-01',
    status: 'initial-vision',
    dependsOn: ['core-framework'],
    context: 'An educational system teaching music production from basic theory to mixing and mastering.',
    vision: 'This vision describes a comprehensive curriculum for learning music production techniques including recording, mixing, mastering, and digital audio workstation usage.',
    problemStatement: [
      { name: 'Skill Gap', description: 'Music production requires knowledge across acoustics, software, and artistic judgment that learners struggle to integrate.' },
    ],
    coreConcept: {
      interactionModel: 'Layered learning model',
      description: 'Learners progress through music theory, recording techniques, and mixing workflows in a guided sequence.',
    },
    architecture: {
      connections: [
        { from: 'Music Theory', to: 'Recording Techniques', relationship: 'foundation-for' },
        { from: 'Recording Techniques', to: 'Mixing and Mastering', relationship: 'prerequisite' },
      ],
    },
    modules: [
      {
        name: 'Music Theory',
        concepts: ['scales', 'harmony', 'rhythm', 'composition'],
      },
      {
        name: 'Recording Techniques',
        concepts: ['microphone placement', 'signal flow', 'DAW basics'],
      },
      {
        name: 'Mixing and Mastering',
        concepts: ['EQ and compression', 'spatial effects', 'final mastering'],
      },
    ],
    chipsetConfig: {
      name: 'music-production-pack',
      version: '1.0.0',
      description: 'Music production educational curriculum',
      skills: {
        'audio-theory': { domain: 'music', description: 'Music theory and composition fundamentals' },
        'mixing-engineering': { domain: 'audio', description: 'Mixing and mastering techniques' },
      },
      agents: {
        topology: 'pipeline',
        agents: [{ name: 'curriculum-agent', role: 'Sequences learning modules' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'content_accuracy', threshold: 90, action: 'block' }],
        },
      },
    },
    successCriteria: [
      'Learners can read and write basic sheet music notation',
      'Learners can record a multi-track session with proper gain staging',
      'Learners can produce a mastered stereo mix from raw tracks',
    ],
    throughLine: 'Music production education connects to the broader ecosystem through progressive disclosure principles.',
  };
}

/**
 * Create a nutrition-themed VisionDocument object for eval-03.
 * A nutrition and cooking educational pack.
 */
function createNutritionVisionDoc(): VisionDocument {
  return {
    name: 'Nutrition and Cooking Pack',
    date: '2026-02-10',
    status: 'initial-vision',
    dependsOn: ['core-framework'],
    context: 'An educational system teaching nutrition science and cooking skills for healthy meal preparation.',
    vision: 'This vision describes a curriculum teaching nutrition fundamentals and cooking techniques to help people prepare healthy, balanced meals while understanding the science behind food choices.',
    problemStatement: [
      { name: 'Nutrition Literacy', description: 'Most people lack understanding of macronutrients, micronutrients, and dietary guidelines.' },
    ],
    coreConcept: {
      interactionModel: 'Theory-to-practice model',
      description: 'Learners study nutrition science then apply knowledge through practical cooking exercises and meal planning.',
    },
    architecture: {
      connections: [
        { from: 'Nutrition Science', to: 'Cooking Techniques', relationship: 'informs' },
        { from: 'Cooking Techniques', to: 'Meal Planning', relationship: 'enables' },
      ],
    },
    modules: [
      {
        name: 'Nutrition Science',
        concepts: ['macronutrients', 'micronutrients', 'dietary guidelines'],
        safetyConcerns: 'Food allergy danger and choking hazard awareness required',
      },
      {
        name: 'Cooking Techniques',
        concepts: ['knife skills', 'heat management', 'food safety'],
        safetyConcerns: 'Sharp instrument and hot surface caution required',
      },
      {
        name: 'Meal Planning',
        concepts: ['balanced meals', 'portion control', 'budget cooking'],
      },
    ],
    chipsetConfig: {
      name: 'nutrition-cooking-pack',
      version: '1.0.0',
      description: 'Nutrition and cooking educational curriculum',
      skills: {
        'nutrition-science': { domain: 'health', description: 'Nutrition science fundamentals' },
        'culinary-skills': { domain: 'cooking', description: 'Practical cooking techniques' },
      },
      agents: {
        topology: 'pipeline',
        agents: [{ name: 'nutrition-agent', role: 'Guides nutrition and cooking learning' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'safety_review', threshold: 100, action: 'block' }],
        },
      },
    },
    successCriteria: [
      'Learners can identify all major macronutrient groups and their dietary roles',
      'Learners can safely prepare a balanced meal using proper kitchen techniques',
      'Learners can create a weekly meal plan within a target calorie budget',
    ],
    throughLine: 'Nutrition education connects to the broader ecosystem through progressive disclosure principles, building knowledge from science to practice.',
  };
}

/**
 * Create a home-repair-themed vision markdown for eval-04.
 * A full pipeline test from raw markdown through all stages.
 */
function createHomeRepairMarkdown(): string {
  return [
    '# Home Repair Basics -- Vision Guide',
    '',
    '**Date:** 2026-02-15',
    '**Status:** Initial Vision',
    '**Depends on:** core-framework',
    '**Context:** A curriculum teaching basic home repair and maintenance skills including plumbing, electrical safety, drywall, painting, and carpentry.',
    '',
    '---',
    '',
    '## Vision',
    '',
    'This vision describes a comprehensive educational system that teaches people basic home repair and maintenance. The curriculum covers plumbing fundamentals, electrical safety, drywall repair, painting techniques, and basic carpentry, giving homeowners the confidence and skill to handle common household repairs safely.',
    '',
    '---',
    '',
    '## Problem Statement',
    '',
    '1. **Cost Barrier.** Professional home repairs are expensive and many common issues can be resolved with basic knowledge.',
    '2. **Safety Ignorance.** Homeowners attempt repairs without understanding electrical and plumbing safety, risking injury.',
    '',
    '---',
    '',
    '## Core Concept',
    '',
    '**Hands-on learning model.**',
    '',
    'Learners progress from understanding tools and safety to completing real repair projects, building practical skills through guided exercises with increasing complexity.',
    '',
    '---',
    '',
    '## Architecture',
    '',
    '```',
    'Tool Safety -> Plumbing Basics -> Electrical Safety -> Surface Repair -> Carpentry',
    '```',
    '',
    '**Cross-component connections:**',
    '- Tool Safety -> Plumbing Basics -- prerequisite',
    '- Tool Safety -> Electrical Safety -- prerequisite',
    '- Tool Safety -> Surface Repair -- prerequisite',
    '- Surface Repair -> Carpentry -- skill progression',
    '',
    '---',
    '',
    '## Module 1: Tool Safety',
    '',
    '**What the user learns/gets:**',
    '- Power tool operation',
    '- Personal protective equipment',
    '',
    '**Try Session:** "Tool Tour" -- Identify and safely handle 10 common repair tools.',
    '',
    '**Safety considerations:** Power tool danger hazard with rotating blades and electrical shock risk',
    '',
    '---',
    '',
    '## Module 2: Plumbing Basics',
    '',
    '**What the user learns/gets:**',
    '- Pipe types and fittings',
    '- Leak repair techniques',
    '',
    '**Try Session:** "Fix a Leak" -- Replace a washer in a dripping faucet.',
    '',
    '**Safety considerations:** Water damage risk if connections are improper',
    '',
    '---',
    '',
    '## Module 3: Electrical Safety',
    '',
    '**What the user learns/gets:**',
    '- Circuit breaker operation',
    '- Outlet and switch replacement',
    '',
    '**Try Session:** "Switch Swap" -- Replace a light switch with power safely disconnected.',
    '',
    '**Safety considerations:** Electrical shock danger hazard with live wiring — always verify power is off',
    '',
    '---',
    '',
    '## Module 4: Surface Repair',
    '',
    '**What the user learns/gets:**',
    '- Drywall patching',
    '- Interior painting',
    '',
    '**Try Session:** "Patch and Paint" -- Repair a small drywall hole and paint over it.',
    '',
    '---',
    '',
    '## Module 5: Carpentry',
    '',
    '**What the user learns/gets:**',
    '- Measuring and cutting',
    '- Joining techniques',
    '',
    '**Try Session:** "Build a Shelf" -- Construct a simple wall shelf from dimensional lumber.',
    '',
    '---',
    '',
    '## Skill-Creator Integration',
    '',
    '### Chipset Configuration',
    '',
    '```yaml',
    'name: home-repair-pack',
    'version: 1.0.0',
    'description: Home repair and maintenance educational curriculum',
    '',
    'skills:',
    '  plumbing-basics:',
    '    domain: plumbing',
    '    description: "Basic plumbing repair techniques"',
    '  electrical-safety:',
    '    domain: electrical',
    '    description: "Safe electrical work practices"',
    '  surface-repair:',
    '    domain: construction',
    '    description: "Drywall and painting techniques"',
    '',
    'agents:',
    '  topology: pipeline',
    '  agents:',
    '    - name: repair-guide-agent',
    '      role: "Guides learners through repair projects safely"',
    '',
    'evaluation:',
    '  gates:',
    '    preDeploy:',
    '      - check: safety_review',
    '        threshold: 100',
    '        action: block',
    '      - check: content_accuracy',
    '        threshold: 90',
    '        action: warn',
    '```',
    '',
    '---',
    '',
    '## Success Criteria',
    '',
    '1. Learners can identify and safely operate common power tools',
    '2. Learners can repair a basic plumbing leak using proper fittings',
    '3. Learners can safely replace an electrical outlet or switch',
    '4. Learners can patch drywall and apply a professional paint finish',
    '5. Learners can measure, cut, and join lumber for basic carpentry projects',
    '',
    '---',
    '',
    '## The Through-Line',
    '',
    'Home repair education connects to the broader ecosystem through progressive disclosure principles, building practical skills from safety fundamentals to project completion.',
    '',
    '---',
  ].join('\n');
}

/**
 * Create a plugin-system-themed VisionDocument object for eval-05.
 * An infrastructure/tooling vision that should auto-select skip-research.
 */
function createPluginSystemVisionDoc(): VisionDocument {
  return {
    name: 'Plugin System Engine',
    date: '2026-02-20',
    status: 'initial-vision',
    dependsOn: ['core-framework'],
    context: 'A plugin system infrastructure for extending the GSD desktop application with installable, sandboxed plugins.',
    vision: 'This vision describes an infrastructure engine for a plugin system that allows installable, registry-sourced, sandboxed plugins to extend the GSD desktop application with custom panels and processing pipelines.',
    problemStatement: [
      { name: 'Extensibility', description: 'The GSD desktop application lacks a mechanism for third-party extensions and custom functionality.' },
    ],
    coreConcept: {
      interactionModel: 'Pipeline processing model',
      description: 'Plugins are loaded from a registry, validated through a sandboxed runtime, and integrated into the application via a typed extension API.',
    },
    architecture: {
      connections: [
        { from: 'Plugin Registry', to: 'Plugin Loader', relationship: 'provides-packages' },
        { from: 'Plugin Loader', to: 'Sandbox Runtime', relationship: 'passes-to' },
      ],
    },
    modules: [
      {
        name: 'Plugin Registry',
        concepts: ['package discovery', 'version resolution'],
      },
      {
        name: 'Plugin Loader',
        concepts: ['module loading', 'dependency injection'],
      },
      {
        name: 'Sandbox Runtime',
        concepts: ['process isolation', 'permission model'],
      },
    ],
    chipsetConfig: {
      name: 'plugin-system-engine',
      version: '1.0.0',
      description: 'Plugin system infrastructure engine',
      skills: {
        'plugin-management': { domain: 'infrastructure', description: 'Plugin lifecycle management' },
        'sandbox-security': { domain: 'security', description: 'Plugin sandboxing and permission enforcement' },
      },
      agents: {
        topology: 'pipeline',
        agents: [{ name: 'plugin-orchestrator', role: 'Manages plugin lifecycle and security' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'security_audit', threshold: 100, action: 'block' }],
        },
      },
    },
    successCriteria: [
      'Plugins can be discovered and installed from the registry via CLI',
      'Loaded plugins run in a sandboxed environment with enforced permissions',
      'Plugins can extend the UI with custom panels via the extension API',
    ],
    throughLine: 'The plugin system connects to the broader ecosystem through progressive disclosure, enabling users to extend capabilities without understanding internal architecture.',
  };
}

// ---------------------------------------------------------------------------
// eval-01: Vision from idea (drone pack)
// ---------------------------------------------------------------------------

describe('eval-01-vision-from-idea', () => {
  it('parseVisionDocument produces a valid VisionDocument from drone vision markdown', () => {
    const markdown = createDroneVisionMarkdown();
    const result = parseVisionDocument(markdown);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const doc = result.data;
    expect(doc.vision.length).toBeGreaterThan(0);
    expect(doc.problemStatement.length).toBeGreaterThan(0);
    expect(doc.coreConcept.interactionModel.length).toBeGreaterThan(0);
    expect(doc.coreConcept.description.length).toBeGreaterThan(0);
    expect(doc.architecture.connections.length).toBeGreaterThan(0);
    expect(doc.modules.length).toBeGreaterThan(0);
    expect(doc.successCriteria.length).toBeGreaterThan(0);
    expect(doc.throughLine.length).toBeGreaterThan(0);
  });

  it('parsed drone VisionDocument has chipsetConfig with skills and agents', () => {
    const markdown = createDroneVisionMarkdown();
    const result = parseVisionDocument(markdown);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const doc = result.data;
    expect(doc.chipsetConfig).toBeDefined();
    expect(Object.keys(doc.chipsetConfig.skills).length).toBeGreaterThan(0);
    expect(doc.chipsetConfig.agents.agents.length).toBeGreaterThan(0);
  });

  it('parsed drone VisionDocument has 3 modules with concepts', () => {
    const markdown = createDroneVisionMarkdown();
    const result = parseVisionDocument(markdown);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const doc = result.data;
    expect(doc.modules).toHaveLength(3);
    for (const mod of doc.modules) {
      expect(mod.name.length).toBeGreaterThan(0);
      expect(mod.concepts.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// eval-02: Mission from vision (music production)
// ---------------------------------------------------------------------------

describe('eval-02-mission-from-vision', () => {
  it('runPipeline with mission-only produces a complete MissionPackage', () => {
    const visionDoc = createMusicVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
  });

  it('MissionPackage has milestoneSpec, componentSpecs, waveExecutionPlan, testPlan', () => {
    const visionDoc = createMusicVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    const mission = result.stages.mission!;
    const pkg = mission.missionPackage;

    expect(pkg.milestoneSpec).toBeDefined();
    expect(pkg.componentSpecs.length).toBeGreaterThan(0);
    expect(pkg.waveExecutionPlan).toBeDefined();
    expect(pkg.testPlan).toBeDefined();
  });

  it('fileManifest includes milestone-spec, component-spec, wave-plan, test-plan, readme types', () => {
    const visionDoc = createMusicVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    const types = result.fileManifest.map(f => f.type);
    expect(types).toContain('milestone-spec');
    expect(types).toContain('component-spec');
    expect(types).toContain('wave-plan');
    expect(types).toContain('test-plan');
    expect(types).toContain('readme');
  });

  it('executionSummary has model split with opus/sonnet/haiku', () => {
    const visionDoc = createMusicVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    const summary = result.executionSummary;
    expect(summary.modelSplit.opus).toBeDefined();
    expect(summary.modelSplit.sonnet).toBeDefined();
    expect(summary.modelSplit.haiku).toBeDefined();
  });

  it('component specs have non-empty modelAssignment', () => {
    const visionDoc = createMusicVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    const specs = result.stages.mission!.missionPackage.componentSpecs;
    for (const spec of specs) {
      expect(spec.modelAssignment).toBeTruthy();
      expect(['opus', 'sonnet', 'haiku']).toContain(spec.modelAssignment);
    }
  });

  it('test plan has tests array with length > 0', () => {
    const visionDoc = createMusicVisionDoc();
    const result = runPipeline(visionDoc, { speed: 'mission-only' });

    expect(result.success).toBe(true);
    const testPlan = result.stages.mission!.missionPackage.testPlan;
    expect(testPlan.tests.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// eval-03: Research compilation (nutrition/cooking)
// ---------------------------------------------------------------------------

describe('eval-03-research-compilation', () => {
  it('compileResearch returns a ResearchReference with topics array length > 0', () => {
    const visionDoc = createNutritionVisionDoc();
    const research = compileResearch(visionDoc);

    expect(research.topics.length).toBeGreaterThan(0);
  });

  it('each research topic has name, foundation (content), and techniques (sources-like content)', () => {
    const visionDoc = createNutritionVisionDoc();
    const research = compileResearch(visionDoc);

    for (const topic of research.topics) {
      expect(topic.name.length).toBeGreaterThan(0);
      expect(topic.foundation.length).toBeGreaterThan(0);
      expect(topic.techniques.length).toBeGreaterThan(0);
    }
  });

  it('chunkKnowledge returns tiers with summary, active, reference content', () => {
    const visionDoc = createNutritionVisionDoc();
    const research = compileResearch(visionDoc);
    const tiers = chunkKnowledge(research);

    expect(tiers.summary.content.length).toBeGreaterThan(0);
    expect(tiers.summary.estimatedTokens).toBeGreaterThan(0);
    expect(tiers.active.content.length).toBeGreaterThan(0);
    expect(tiers.active.estimatedTokens).toBeGreaterThan(0);
    expect(tiers.reference.content.length).toBeGreaterThan(0);
    expect(tiers.reference.estimatedTokens).toBeGreaterThan(0);
  });

  it('extractSafety returns a SafetySection with boundaries for nutrition modules', () => {
    const visionDoc = createNutritionVisionDoc();
    const research = compileResearch(visionDoc);
    const safety = extractSafety(research);

    expect(safety.concerns.length).toBeGreaterThan(0);
    expect(safety.sharedFramework.length).toBeGreaterThan(0);
    // Nutrition has "danger" keyword -> gate boundary -> hasSafetyCritical
    expect(safety.hasSafetyCritical).toBe(true);
  });

  it('checkSourceQuality returns an array (may be empty for professional sources)', () => {
    const visionDoc = createNutritionVisionDoc();
    const research = compileResearch(visionDoc);
    const diagnostics = checkSourceQuality(research);

    expect(Array.isArray(diagnostics)).toBe(true);
    // Professional archetype sources should have zero entertainment warnings
  });
});

// ---------------------------------------------------------------------------
// eval-04: Full pipeline (home repair)
// ---------------------------------------------------------------------------

describe('eval-04-full-pipeline', () => {
  it('runPipeline with full speed executes all three stages', () => {
    const markdown = createHomeRepairMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.speed).toBe('full');
  });

  it('vision stage produces visionDoc, archetype, and diagnostics', () => {
    const markdown = createHomeRepairMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.stages.vision).toBeDefined();
    expect(result.stages.vision.visionDoc).toBeDefined();
    expect(result.stages.vision.archetype).toBeDefined();
    expect(result.stages.vision.diagnostics).toBeDefined();
  });

  it('research stage produces research, knowledgeTiers, and safety', () => {
    const markdown = createHomeRepairMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.stages.research).toBeDefined();
    expect(result.stages.research!.research).toBeDefined();
    expect(result.stages.research!.knowledgeTiers).toBeDefined();
    expect(result.stages.research!.safety).toBeDefined();
  });

  it('mission stage produces missionPackage', () => {
    const markdown = createHomeRepairMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    expect(result.stages.mission!.missionPackage).toBeDefined();
  });

  it('fileManifest has entries and executionSummary has non-zero metrics', () => {
    const markdown = createHomeRepairMarkdown();
    const result = runPipeline(markdown, { speed: 'full' });

    expect(result.success).toBe(true);
    expect(result.fileManifest.length).toBeGreaterThan(0);
    expect(result.executionSummary.totalTasks).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// eval-05: Infrastructure vision (plugin system)
// ---------------------------------------------------------------------------

describe('eval-05-infrastructure-vision', () => {
  it('classifyArchetype returns infrastructure-component for plugin system', () => {
    const visionDoc = createPluginSystemVisionDoc();
    const archetype = classifyArchetype(visionDoc);

    expect(archetype).toBe('infrastructure-component');
  });

  it('selectPipelineSpeed with empty config returns skip-research', () => {
    const visionDoc = createPluginSystemVisionDoc();
    const speed = selectPipelineSpeed(visionDoc, {});

    expect(speed).toBe('skip-research');
  });

  it('runPipeline without speed override skips research stage', () => {
    const visionDoc = createPluginSystemVisionDoc();
    const result = runPipeline(visionDoc);

    expect(result.success).toBe(true);
    expect(result.stages.research).toBeUndefined();
  });

  it('runPipeline produces a mission stage with missionPackage', () => {
    const visionDoc = createPluginSystemVisionDoc();
    const result = runPipeline(visionDoc);

    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();
    expect(result.stages.mission!.missionPackage).toBeDefined();
  });
});

/**
 * Mission assembly generators, self-containment validator, and file count estimator.
 *
 * Provides five pure functions for mission package assembly:
 * - generateMilestoneSpec(): VisionDocument + optional Research -> MilestoneSpec
 * - generateComponentSpecs(): VisionDocument + MilestoneSpec -> ComponentSpec[]
 * - validateSelfContainment(): ComponentSpec[] -> SelfContainmentDiagnostic[]
 * - generateReadme(): VisionDocument + MilestoneSpec + ComponentSpec[] + fileCount -> markdown
 * - estimateFileCount(): VisionDocument -> { count, complexity }
 *
 * These are the building blocks of mission package assembly. The milestone spec
 * creates the master document, component specs create self-contained build
 * instructions per module, the validator ensures no cross-file references leak
 * through, the README generator creates the package overview, and the file count
 * estimator scales output complexity with input scope.
 *
 * @module vtm/mission-assembly
 */

import type {
  VisionDocument,
  ResearchReference,
  MilestoneSpec,
  ComponentSpec,
  ModelAssignment,
} from './types.js';
import { assignModel as classifyModel } from './model-assignment.js';
import type { AssignmentInput } from './model-assignment.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Diagnostic emitted by the self-containment validator. */
export interface SelfContainmentDiagnostic {
  severity: 'error' | 'warning';
  component: string;
  message: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Assign a model tier to a module via Phase 284's signal-based classifier.
 *
 * Bridges the module interface ({ name, concepts, safetyConcerns }) to the
 * AssignmentInput interface ({ objective, produces, context }) expected by
 * the signal-based classifier from model-assignment.ts.
 */
function assignModelForModule(mod: { name: string; concepts: string[]; safetyConcerns?: string }): ModelAssignment {
  const input: AssignmentInput = {
    objective: `Implement ${mod.name} covering ${mod.concepts.join(', ')}`,
    produces: [`${mod.name} implementation`],
    context: [
      ...mod.concepts,
      mod.safetyConcerns ? `safety: ${mod.safetyConcerns}` : '',
    ].filter(Boolean).join(' '),
  };
  const result = classifyModel(input);
  return result.model;
}

/**
 * Estimate tokens for a module: concepts.length * 5000 base.
 */
function estimateModuleTokens(mod: { concepts: string[] }): number {
  return mod.concepts.length * 5000;
}

/**
 * Build wave assignments from architecture connections.
 *
 * Modules with no incoming dependencies are Wave 0 (foundation).
 * Modules that depend on Wave 0 modules are Wave 1, etc.
 */
function buildWaveAssignments(
  modules: VisionDocument['modules'],
  connections: VisionDocument['architecture']['connections'],
): Map<string, number> {
  const waveMap = new Map<string, number>();
  const moduleNames = new Set(modules.map(m => m.name));

  // Build incoming dependency map
  const incomingDeps = new Map<string, string[]>();
  for (const name of moduleNames) {
    incomingDeps.set(name, []);
  }
  for (const conn of connections) {
    // conn.from -> conn.to means conn.to depends on conn.from
    const existing = incomingDeps.get(conn.to);
    if (existing && moduleNames.has(conn.from)) {
      existing.push(conn.from);
    }
  }

  // Assign waves via topological ordering
  const assigned = new Set<string>();
  let currentWave = 0;

  while (assigned.size < moduleNames.size) {
    const waveModules: string[] = [];

    for (const name of moduleNames) {
      if (assigned.has(name)) continue;
      const deps = incomingDeps.get(name) ?? [];
      const allDepsAssigned = deps.every(d => assigned.has(d));
      if (allDepsAssigned) {
        waveModules.push(name);
      }
    }

    // If no modules can be assigned, break to avoid infinite loop (cyclic deps)
    if (waveModules.length === 0) {
      for (const name of moduleNames) {
        if (!assigned.has(name)) {
          waveMap.set(name, currentWave);
          assigned.add(name);
        }
      }
      break;
    }

    for (const name of waveModules) {
      waveMap.set(name, currentWave);
      assigned.add(name);
    }

    currentWave++;
  }

  return waveMap;
}

// ---------------------------------------------------------------------------
// generateMilestoneSpec
// ---------------------------------------------------------------------------

/**
 * Generate a MilestoneSpec from a VisionDocument and optional ResearchReference.
 *
 * Produces a fully valid MilestoneSpec object:
 * - name derived from vision doc name
 * - estimatedExecution calculated from module count
 * - missionObjective from vision statement (first 200 chars)
 * - systemLayers from modules
 * - deliverables from modules with acceptance criteria
 * - componentBreakdown with model assignments and token estimates
 * - modelRationale with computed percentages
 * - crossComponentInterfaces from architecture connections
 * - safetyBoundaries from modules with safetyConcerns
 * - preComputedKnowledge if research provided
 *
 * @param visionDoc - Parsed VisionDocument object
 * @param research - Optional ResearchReference for knowledge tiers
 * @returns Fully valid MilestoneSpec object
 */
export function generateMilestoneSpec(
  visionDoc: VisionDocument,
  research?: ResearchReference,
): MilestoneSpec {
  const modules = visionDoc.modules;
  const moduleCount = modules.length;

  // --- Estimated execution ---
  const contextWindows = moduleCount + 2; // 1 per module + 2 overhead
  const sessions = Math.ceil(contextWindows / 3);
  const hours = sessions * 0.5;

  // --- Mission objective (first 200 chars of vision + ...) ---
  const missionObjective = visionDoc.vision.length > 200
    ? visionDoc.vision.slice(0, 200) + '...'
    : visionDoc.vision;

  // --- Architecture overview ---
  const architectureOverview = visionDoc.architecture.moduleMap
    ?? `Architecture for ${visionDoc.name}: ${moduleCount} modules with ${visionDoc.architecture.connections.length} connections.`;

  // --- System layers ---
  const systemLayers = modules.map(mod => ({
    name: mod.name,
    responsibility: mod.concepts.join(', '),
  }));

  // --- Component breakdown and deliverables ---
  const componentBreakdown = modules.map(mod => ({
    component: mod.name,
    specDocument: `${mod.name.toLowerCase().replace(/\s+/g, '-')}-spec.md`,
    dependencies: visionDoc.architecture.connections
      .filter(c => c.to === mod.name)
      .map(c => c.from),
    model: assignModelForModule(mod),
    estimatedTokens: estimateModuleTokens(mod),
  }));

  const deliverables = modules.map((mod, i) => {
    // Find matching success criteria by module name
    const criteria = visionDoc.successCriteria
      .filter(c => c.toLowerCase().includes(mod.name.toLowerCase()))
      .join('; ');

    return {
      number: i + 1,
      deliverable: mod.name,
      acceptanceCriteria: criteria || `${mod.name} implementation complete and tested`,
      componentSpec: `${mod.name.toLowerCase().replace(/\s+/g, '-')}-spec.md`,
    };
  });

  // --- Model rationale ---
  const totalTokens = componentBreakdown.reduce((sum, c) => sum + c.estimatedTokens, 0);

  const modelGroups: Record<ModelAssignment, { components: string[]; tokens: number }> = {
    opus: { components: [], tokens: 0 },
    sonnet: { components: [], tokens: 0 },
    haiku: { components: [], tokens: 0 },
  };

  for (const comp of componentBreakdown) {
    modelGroups[comp.model].components.push(comp.component);
    modelGroups[comp.model].tokens += comp.estimatedTokens;
  }

  const modelRationale = {
    opus: {
      percentage: totalTokens > 0 ? Math.round((modelGroups.opus.tokens / totalTokens) * 100) : 0,
      components: modelGroups.opus.components,
      reason: 'Judgment, creativity, and safety-critical decisions',
    },
    sonnet: {
      percentage: totalTokens > 0 ? Math.round((modelGroups.sonnet.tokens / totalTokens) * 100) : 0,
      components: modelGroups.sonnet.components,
      reason: 'Structural implementation and standard module building',
    },
    haiku: {
      percentage: totalTokens > 0 ? Math.round((modelGroups.haiku.tokens / totalTokens) * 100) : 0,
      components: modelGroups.haiku.components,
      reason: 'Scaffold, boilerplate, and config generation',
    },
  };

  // --- Cross-component interfaces ---
  let crossComponentInterfaces: MilestoneSpec['crossComponentInterfaces'];
  if (visionDoc.architecture.connections.length > 0) {
    const sharedTypes = visionDoc.architecture.connections
      .map(c => `${c.from} -> ${c.to}: ${c.relationship}`)
      .join('\n');
    crossComponentInterfaces = { sharedTypes };
  }

  // --- Safety boundaries ---
  const modulesWithSafety = modules.filter(m => m.safetyConcerns);
  let safetyBoundaries: MilestoneSpec['safetyBoundaries'];
  if (modulesWithSafety.length > 0) {
    safetyBoundaries = modulesWithSafety.map(m => ({
      boundary: m.safetyConcerns!,
      reason: `Safety constraint for ${m.name}`,
    }));
  }

  // --- Pre-computed knowledge (if research provided) ---
  let preComputedKnowledge: MilestoneSpec['preComputedKnowledge'];
  if (research) {
    preComputedKnowledge = [
      {
        tier: 'summary' as const,
        size: '~2K tokens',
        loadingStrategy: 'Load for all agents as minimal context',
      },
      {
        tier: 'active' as const,
        size: '~10K tokens',
        loadingStrategy: 'Load for implementing agents who need domain details',
      },
      {
        tier: 'reference' as const,
        size: 'Full content',
        loadingStrategy: 'Load on-demand for deep research questions',
      },
    ];
  }

  return {
    name: `${visionDoc.name} -- Milestone Spec`,
    date: visionDoc.date,
    visionDocument: visionDoc.name,
    researchReference: research?.name,
    estimatedExecution: { contextWindows, sessions, hours },
    missionObjective,
    architectureOverview,
    systemLayers,
    deliverables,
    componentBreakdown,
    modelRationale,
    crossComponentInterfaces,
    safetyBoundaries,
    preComputedKnowledge,
  };
}

// ---------------------------------------------------------------------------
// generateComponentSpecs
// ---------------------------------------------------------------------------

/**
 * Generate self-contained ComponentSpec objects from a VisionDocument and MilestoneSpec.
 *
 * Produces one ComponentSpec per module. Each spec is SELF-CONTAINED: all shared
 * types, interface contracts, and architectural context are copied inline into the
 * context field (no file paths, imports, or cross-references).
 *
 * @param visionDoc - Parsed VisionDocument object
 * @param milestoneSpec - Generated MilestoneSpec for model assignments and tokens
 * @param research - Optional ResearchReference for additional context
 * @returns Array of ComponentSpec objects (one per module)
 */
export function generateComponentSpecs(
  visionDoc: VisionDocument,
  milestoneSpec: MilestoneSpec,
  research?: ResearchReference,
): ComponentSpec[] {
  const waveMap = buildWaveAssignments(visionDoc.modules, visionDoc.architecture.connections);

  return visionDoc.modules.map(mod => {
    const waveNumber = waveMap.get(mod.name) ?? 0;
    const breakdown = milestoneSpec.componentBreakdown.find(c => c.component === mod.name);
    const modelAssignment = breakdown?.model ?? 'sonnet';
    const estimatedTokens = breakdown?.estimatedTokens ?? estimateModuleTokens(mod);

    // --- Dependencies and produces ---
    const dependencies = visionDoc.architecture.connections
      .filter(c => c.to === mod.name)
      .map(c => c.from);

    const produces = visionDoc.architecture.connections
      .filter(c => c.from === mod.name)
      .map(c => `${mod.name} artifacts for ${c.to}`);
    if (produces.length === 0) {
      produces.push(`${mod.name} implementation`);
    }

    // --- Objective ---
    const objective = `Implement ${mod.name} covering ${mod.concepts.join(', ')}`;

    // --- Self-contained context (CRITICAL: no external references) ---
    const contextParts: string[] = [];

    // Inline architectural context
    contextParts.push(`Architecture context for ${mod.name}:`);
    contextParts.push(`This component is part of the ${milestoneSpec.name} milestone.`);
    contextParts.push(`${milestoneSpec.architectureOverview}`);
    contextParts.push('');

    // Inline interface contracts from connections involving this module
    const relatedConnections = visionDoc.architecture.connections.filter(
      c => c.from === mod.name || c.to === mod.name,
    );
    if (relatedConnections.length > 0) {
      contextParts.push('Interface contracts:');
      for (const conn of relatedConnections) {
        contextParts.push(`- ${conn.from} provides data to ${conn.to} (${conn.relationship})`);
      }
      contextParts.push('');
    }

    // Inline shared types description (not file references)
    if (milestoneSpec.crossComponentInterfaces?.sharedTypes) {
      contextParts.push('Shared type relationships:');
      contextParts.push(milestoneSpec.crossComponentInterfaces.sharedTypes);
      contextParts.push('');
    }

    // Inline module concepts
    contextParts.push(`${mod.name} concepts: ${mod.concepts.join(', ')}`);

    const context = contextParts.join('\n');

    // --- Technical spec (one entry per concept) ---
    const technicalSpec = mod.concepts.map(concept => ({
      name: concept,
      spec: `Implementation specification for ${concept} within ${mod.name}`,
    }));

    // --- Implementation steps (one per concept + test + verification) ---
    const implementationSteps = [
      ...mod.concepts.map(concept => ({
        name: `Implement ${concept}`,
        description: `Build the ${concept} functionality for ${mod.name}`,
      })),
      {
        name: 'Write tests',
        description: `Create test suite for ${mod.name} covering all concepts`,
      },
      {
        name: 'Verify integration',
        description: `Verify ${mod.name} integrates correctly with dependent components`,
      },
    ];

    // --- Test cases from success criteria ---
    const relevantCriteria = visionDoc.successCriteria.filter(
      c => c.toLowerCase().includes(mod.name.toLowerCase()),
    );

    const testCases = relevantCriteria.length > 0
      ? relevantCriteria.map((criterion, i) => ({
        name: `Test ${mod.name} criterion ${i + 1}`,
        input: `${mod.name} implementation with all concepts`,
        expected: criterion,
      }))
      : [{
        name: `Test ${mod.name} basic functionality`,
        input: `${mod.name} implementation`,
        expected: `${mod.name} concepts (${mod.concepts.join(', ')}) are functional`,
      }];

    // --- Verification gate ---
    const verificationGate = {
      conditions: testCases.map(tc => tc.expected),
      handoff: `Component ${mod.name} ready for integration`,
    };

    // --- Safety boundaries ---
    let safetyBoundaries: ComponentSpec['safetyBoundaries'];
    if (mod.safetyConcerns) {
      safetyBoundaries = {
        must: [`Enforce safety boundaries for ${mod.safetyConcerns}`],
        mustNot: [`Skip safety validation for ${mod.name}`],
        boundaryType: 'gate' as const,
      };
    }

    return {
      name: mod.name,
      milestone: milestoneSpec.name,
      wave: `Wave ${waveNumber}`,
      modelAssignment,
      estimatedTokens,
      dependencies,
      produces,
      objective,
      context,
      technicalSpec,
      implementationSteps,
      testCases,
      verificationGate,
      safetyBoundaries,
    };
  });
}

// ---------------------------------------------------------------------------
// validateSelfContainment
// ---------------------------------------------------------------------------

/**
 * Validate that component specs are self-contained (no external file references).
 *
 * Scans each spec's context, technicalSpec, and implementationSteps for patterns
 * that indicate external file references:
 * - File paths: ./foo, ../bar, src/
 * - Import statements: import ... from
 * - @file references: @file:
 * - Cross-file links: see [file.ts], see [file.md]
 *
 * @param specs - Array of ComponentSpec objects to validate
 * @returns Array of SelfContainmentDiagnostic (empty = all self-contained)
 */
export function validateSelfContainment(specs: ComponentSpec[]): SelfContainmentDiagnostic[] {
  const diagnostics: SelfContainmentDiagnostic[] = [];

  // Patterns ordered by specificity: more specific patterns first so they
  // match before broader ones (e.g. import...from before bare ./ detection)
  const patterns: Array<{ regex: RegExp; code: string; label: string }> = [
    {
      regex: /import\s+.+\s+from/gi,
      code: 'IMPORT_REFERENCE',
      label: 'import statement',
    },
    {
      regex: /@file:/gi,
      code: 'EXTERNAL_FILE_REF',
      label: '@file reference',
    },
    {
      regex: /see\s+\[?\w+\.(?:ts|js|md)\]?/gi,
      code: 'CROSS_FILE_LINK',
      label: 'cross-file link',
    },
    {
      regex: /(?:\.\/|\.\.\/|src\/)/gi,
      code: 'EXTERNAL_FILE_REF',
      label: 'external file path',
    },
  ];

  for (const spec of specs) {
    // Collect all scannable text from the spec
    const textSources: Array<{ field: string; text: string }> = [
      { field: 'context', text: spec.context },
      ...spec.technicalSpec.map(ts => ({ field: 'technicalSpec', text: ts.spec })),
      ...spec.implementationSteps.map(s => ({ field: 'implementationSteps', text: s.description })),
    ];

    for (const source of textSources) {
      let matched = false;
      for (const pattern of patterns) {
        // Reset lastIndex for global regex
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(source.text);
        if (match) {
          diagnostics.push({
            severity: 'error',
            component: spec.name,
            message: `${source.field} contains ${pattern.label}: "${match[0]}"`,
            code: pattern.code,
          });
          matched = true;
          break; // First matching pattern wins per text source
        }
      }
    }
  }

  return diagnostics;
}

// ---------------------------------------------------------------------------
// generateReadme
// ---------------------------------------------------------------------------

/**
 * Generate a README markdown string for the mission package.
 *
 * Includes:
 * - H1 title with date and description
 * - File manifest listing all package files
 * - Execution summary table with task counts, tracks, waves, model splits
 * - Usage instructions for mission agents
 *
 * @param visionDoc - Parsed VisionDocument
 * @param milestoneSpec - Generated MilestoneSpec
 * @param specs - Generated ComponentSpec array
 * @param fileCount - Estimated file count
 * @returns Markdown string for README.md
 */
export function generateReadme(
  visionDoc: VisionDocument,
  milestoneSpec: MilestoneSpec,
  specs: ComponentSpec[],
  fileCount: number,
): string {
  const lines: string[] = [];

  // --- Header ---
  lines.push(`# ${visionDoc.name} -- Mission Package`);
  lines.push('');
  lines.push(`**Date:** ${visionDoc.date}`);
  lines.push(`**Description:** ${visionDoc.context}`);
  lines.push('');

  // --- File Manifest ---
  lines.push('## File Manifest');
  lines.push('');
  lines.push(`This package contains ${fileCount} files:`);
  lines.push('');
  lines.push('| File | Purpose |');
  lines.push('|------|---------|');
  lines.push('| README.md | Package overview and usage instructions |');
  lines.push(`| ${milestoneSpec.name.toLowerCase().replace(/\s+/g, '-')}.md | Milestone specification |`);
  for (const spec of specs) {
    lines.push(`| ${spec.name.toLowerCase().replace(/\s+/g, '-')}-spec.md | Component spec for ${spec.name} |`);
  }
  if (fileCount > specs.length + 2) {
    lines.push('| wave-plan.md | Wave execution plan |');
    lines.push('| test-plan.md | Test plan and verification matrix |');
  }
  lines.push('');

  // --- Execution Summary ---
  lines.push('## Execution Summary');
  lines.push('');

  const totalTasks = specs.reduce((sum, s) => sum + s.implementationSteps.length, 0);
  const waves = new Set(specs.map(s => s.wave));
  const parallelTracks = Math.max(...[...waves].map(w => specs.filter(s => s.wave === w).length));

  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Tasks | ${totalTasks} |`);
  lines.push(`| Parallel Tracks | ${parallelTracks} |`);
  lines.push(`| Sequential Depth (Waves) | ${waves.size} |`);
  lines.push(`| Opus | ${milestoneSpec.modelRationale.opus.percentage}% (${milestoneSpec.modelRationale.opus.components.join(', ') || 'none'}) |`);
  lines.push(`| Sonnet | ${milestoneSpec.modelRationale.sonnet.percentage}% (${milestoneSpec.modelRationale.sonnet.components.join(', ') || 'none'}) |`);
  lines.push(`| Haiku | ${milestoneSpec.modelRationale.haiku.percentage}% (${milestoneSpec.modelRationale.haiku.components.join(', ') || 'none'}) |`);
  lines.push(`| Estimated Context Windows | ${milestoneSpec.estimatedExecution.contextWindows} |`);
  lines.push(`| Estimated Hours | ${milestoneSpec.estimatedExecution.hours} |`);
  lines.push('');

  // --- Usage Instructions ---
  lines.push('## Usage');
  lines.push('');
  lines.push('1. Review the milestone spec for the overall mission objective and architecture');
  lines.push('2. Load the appropriate component spec for your assigned component');
  lines.push('3. Each component spec is self-contained -- no cross-file references needed');
  lines.push('4. Follow the implementation steps in order, running tests at each stage');
  lines.push('5. Complete the verification gate before handing off to the next wave');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// estimateFileCount
// ---------------------------------------------------------------------------

/**
 * Estimate file count and complexity band from a VisionDocument.
 *
 * Complexity bands:
 * - simple (<=3 modules): 4-5 files (README + milestone-spec + component-specs)
 * - medium (4-6 modules): 6-8 files (README + milestone-spec + component-specs)
 * - complex (7+ modules): 8-12 files (README + milestone-spec + component-specs + wave-plan + test-plan)
 *
 * File count = 2 (README + milestone-spec) + min(modules.length, 10) component specs
 * Complex adds +2 for wave-plan and test-plan files.
 *
 * @param visionDoc - Parsed VisionDocument object
 * @returns Object with count and complexity band
 */
export function estimateFileCount(
  visionDoc: VisionDocument,
): { count: number; complexity: 'simple' | 'medium' | 'complex' } {
  const moduleCount = visionDoc.modules.length;

  let complexity: 'simple' | 'medium' | 'complex';
  if (moduleCount <= 3) {
    complexity = 'simple';
  } else if (moduleCount <= 6) {
    complexity = 'medium';
  } else {
    complexity = 'complex';
  }

  // Base: 2 (README + milestone-spec) + component specs (capped at 10)
  let count = 2 + Math.min(moduleCount, 10);

  // Complex gets wave-plan + test-plan
  if (complexity === 'complex') {
    count += 2;
  }

  return { count, complexity };
}

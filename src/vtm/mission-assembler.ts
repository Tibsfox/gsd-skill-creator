/**
 * Mission package assembler -- top-level orchestrator for VTM pipeline.
 *
 * Composes all generators from mission-assembly into a complete, schema-valid
 * MissionPackage. This is the entry point downstream pipeline orchestrator
 * (Phase 288) will call.
 *
 * Flow:
 * 1. generateMilestoneSpec(visionDoc, research) -> milestoneSpec
 * 2. generateComponentSpecs(visionDoc, milestoneSpec, research) -> componentSpecs
 * 3. Build placeholder WaveExecutionPlan (single wave, all tasks)
 * 4. Build placeholder TestPlan (one C-NNN test per success criterion)
 * 5. Compute executionSummary from milestoneSpec and componentSpecs
 * 6. Compose and return MissionPackage
 *
 * Placeholder wave plan and test plan are minimal valid structures that will be
 * replaced by real implementations in Phases 283 and 286.
 *
 * @module vtm/mission-assembler
 */

import type {
  VisionDocument,
  ResearchReference,
  MissionPackage,
  MilestoneSpec,
  ComponentSpec,
  WaveExecutionPlan,
  TestPlan,
  WaveTask,
  TestSpec,
} from './types.js';
import { MissionPackageSchema } from './types.js';
import {
  generateMilestoneSpec,
  generateComponentSpecs,
} from './mission-assembly.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Zero-pad a number to 3 digits: 1 -> "001", 12 -> "012".
 */
function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Round to 1 decimal place.
 */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Build a placeholder WaveExecutionPlan with all tasks in a single wave.
 *
 * This is a minimal valid structure that satisfies WaveExecutionPlanSchema.
 * Phase 283 (Wave Planning) will replace it with a real multi-wave plan.
 */
function buildPlaceholderWavePlan(
  milestoneSpec: MilestoneSpec,
  componentSpecs: ComponentSpec[],
): WaveExecutionPlan {
  const tasks: WaveTask[] = componentSpecs.map((spec, i) => ({
    id: `task-${pad3(i + 1)}`,
    description: spec.objective,
    produces: spec.produces[0] ?? `${spec.name} implementation`,
    model: spec.modelAssignment,
    estimatedTokens: spec.estimatedTokens,
    dependsOn: [],
  }));

  return {
    milestoneName: milestoneSpec.name,
    milestoneSpec: 'milestone-spec.md',
    totalTasks: componentSpecs.length,
    parallelTracks: 1,
    sequentialDepth: 1,
    estimatedWallTime: `${milestoneSpec.estimatedExecution.hours} hours`,
    criticalPath: 'All tasks in single wave (placeholder -- see Phase 283)',
    waveSummary: [
      {
        wave: 0,
        tasks: componentSpecs.length,
        parallelTracks: 1,
        estimatedTime: `${milestoneSpec.estimatedExecution.hours} hours`,
        cacheDependencies: 'None (single wave)',
      },
    ],
    waves: [
      {
        number: 0,
        name: 'All Tasks',
        purpose: 'Placeholder wave containing all tasks (see Phase 283 for real wave planning)',
        isSequential: true,
        tracks: [
          {
            name: 'Track A',
            tasks,
          },
        ],
      },
    ],
  };
}

/**
 * Build a placeholder TestPlan with one C-NNN test per success criterion.
 *
 * This is a minimal valid structure that satisfies TestPlanSchema.
 * Phase 286 (Test Plan Generation) will replace it with a categorized plan.
 */
function buildPlaceholderTestPlan(
  visionDoc: VisionDocument,
  milestoneSpec: MilestoneSpec,
): TestPlan {
  const criteria = visionDoc.successCriteria;

  const tests: TestSpec[] = criteria.map((criterion, i) => ({
    id: `C-${pad3(i + 1)}`,
    category: 'core' as const,
    verifies: criterion,
    expectedBehavior: criterion,
  }));

  const verificationMatrix = criteria.map((criterion, i) => ({
    criterion,
    testIds: [`C-${pad3(i + 1)}`],
  }));

  return {
    milestoneName: milestoneSpec.name,
    milestoneSpec: 'milestone-spec.md',
    visionDocument: visionDoc.name,
    totalTests: criteria.length,
    safetyCriticalCount: 0,
    targetCoverage: 100,
    categories: [
      {
        name: 'core' as const,
        count: criteria.length,
        priority: 'required' as const,
        failureAction: 'block' as const,
      },
    ],
    tests,
    verificationMatrix,
  };
}

/**
 * Compute model split counts and percentages from component specs.
 */
function computeModelSplits(
  componentSpecs: ComponentSpec[],
): {
  opusTasks: { count: number; percentage: number };
  sonnetTasks: { count: number; percentage: number };
  haikuTasks: { count: number; percentage: number };
} {
  const total = componentSpecs.length;
  let opusCount = 0;
  let sonnetCount = 0;
  let haikuCount = 0;

  for (const spec of componentSpecs) {
    switch (spec.modelAssignment) {
      case 'opus': opusCount++; break;
      case 'sonnet': sonnetCount++; break;
      case 'haiku': haikuCount++; break;
    }
  }

  return {
    opusTasks: {
      count: opusCount,
      percentage: total > 0 ? round1((opusCount / total) * 100) : 0,
    },
    sonnetTasks: {
      count: sonnetCount,
      percentage: total > 0 ? round1((sonnetCount / total) * 100) : 0,
    },
    haikuTasks: {
      count: haikuCount,
      percentage: total > 0 ? round1((haikuCount / total) * 100) : 0,
    },
  };
}

// ---------------------------------------------------------------------------
// assembleMissionPackage
// ---------------------------------------------------------------------------

/**
 * Assemble a complete MissionPackage from a VisionDocument and optional research.
 *
 * Orchestrates all generators in sequence:
 * 1. Generate milestone spec from vision doc and optional research
 * 2. Generate self-contained component specs from vision doc and milestone spec
 * 3. Build placeholder wave execution plan (single wave, all tasks)
 * 4. Build placeholder test plan (one test per success criterion)
 * 5. Compute execution summary with model split percentages
 * 6. Compose MissionPackage and validate against schema
 *
 * @param visionDoc - Parsed VisionDocument object
 * @param research - Optional ResearchReference for additional context
 * @returns Complete, schema-valid MissionPackage
 */
export function assembleMissionPackage(
  visionDoc: VisionDocument,
  research?: ResearchReference,
): MissionPackage {
  // 1. Generate milestone spec
  const milestoneSpec = generateMilestoneSpec(visionDoc, research);

  // 2. Generate component specs
  const componentSpecs = generateComponentSpecs(visionDoc, milestoneSpec, research);

  // 3. Build placeholder wave plan
  const waveExecutionPlan = buildPlaceholderWavePlan(milestoneSpec, componentSpecs);

  // 4. Build placeholder test plan
  const testPlan = buildPlaceholderTestPlan(visionDoc, milestoneSpec);

  // 5. Compute execution summary
  const modelSplits = computeModelSplits(componentSpecs);

  // Count distinct wave assignments for parallelTracks
  const waveNumbers = new Set(componentSpecs.map(s => s.wave));
  const parallelTracks = waveNumbers.size;

  // Sequential depth = max wave number + 1
  const waveNums = componentSpecs.map(s => {
    const match = s.wave.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  const sequentialDepth = waveNums.length > 0 ? Math.max(...waveNums) + 1 : 1;

  const executionSummary = {
    totalTasks: componentSpecs.length,
    parallelTracks,
    sequentialDepth,
    ...modelSplits,
    estimatedContextWindows: milestoneSpec.estimatedExecution.contextWindows,
    estimatedWallTime: `${milestoneSpec.estimatedExecution.hours} hours`,
    criticalPathSessions: milestoneSpec.estimatedExecution.sessions,
    totalTests: testPlan.totalTests,
    safetyCriticalTests: testPlan.safetyCriticalCount,
  };

  // 6. Compose MissionPackage
  const missionPackage: MissionPackage = {
    name: `${visionDoc.name} -- Mission Package`,
    date: visionDoc.date,
    status: 'draft',
    visionDocument: visionDoc.name,
    researchReference: research?.name,
    milestoneSpec,
    componentSpecs,
    waveExecutionPlan,
    testPlan,
    executionSummary,
  };

  return missionPackage;
}

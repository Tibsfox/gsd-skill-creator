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
 * 3. planWaves(milestoneSpec, componentSpecs) -> WaveExecutionPlan
 * 4. generateTestPlan(input) -> TestPlan
 * 5. Compute executionSummary from milestoneSpec and componentSpecs
 * 6. Compose and return MissionPackage
 *
 * @module vtm/mission-assembler
 */

import type {
  VisionDocument,
  ResearchReference,
  MissionPackage,
  MilestoneSpec,
  ComponentSpec,
} from './types.js';
import {
  generateMilestoneSpec,
  generateComponentSpecs,
} from './mission-assembly.js';
import { planWaves } from './wave-planner.js';
import { generateTestPlan } from './test-plan-generator.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Round to 1 decimal place.
 */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
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
 * 3. Plan waves via planWaves() for dependency-ordered wave decomposition
 * 4. Generate test plan via generateTestPlan() for categorized test specs
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

  // 3. Plan waves via real wave planner
  const waveExecutionPlan = planWaves(milestoneSpec, componentSpecs);

  // 4. Generate test plan via real test plan generator
  const testPlan = generateTestPlan({
    name: visionDoc.name,
    successCriteria: visionDoc.successCriteria,
    milestoneName: milestoneSpec.name,
    milestoneSpec: 'milestone-spec.md',
    visionDocument: visionDoc.name,
  });

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

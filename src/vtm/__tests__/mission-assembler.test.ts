/**
 * Tests for VTM mission package assembler.
 *
 * Covers:
 * - assembleMissionPackage(): orchestrates all generators into a complete,
 *   schema-valid MissionPackage with placeholder wave plan and test plan
 * - Execution summary model split percentages computed from component assignments
 * - Placeholder wave plan is minimal but schema-valid
 * - Placeholder test plan is minimal but schema-valid
 * - With and without research reference
 * - Safety components assigned to opus
 *
 * @module vtm/__tests__/mission-assembler
 */

import { describe, it, expect } from 'vitest';
import type { VisionDocument, ResearchReference, MissionPackage } from '../types.js';
import { MissionPackageSchema, WaveExecutionPlanSchema, TestPlanSchema } from '../types.js';
import { assembleMissionPackage } from '../mission-assembler.js';

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
    vision: 'This vision describes a comprehensive learning system for testing concepts and practices',
    problemStatement: [
      { name: 'Complexity', description: 'Users struggle with complex test setups' },
    ],
    coreConcept: {
      interactionModel: 'hands-on labs',
      description: 'Learn by doing with immediate feedback',
    },
    architecture: {
      connections: [
        { from: 'Module A', to: 'Module B', relationship: 'provides types' },
        { from: 'Module B', to: 'Module C', relationship: 'provides data' },
      ],
    },
    modules: [
      { name: 'Module A', concepts: ['concept-1', 'concept-2'] },
      { name: 'Module B', concepts: ['concept-3', 'concept-4', 'concept-5'] },
      { name: 'Module C', concepts: ['concept-6'] },
    ],
    chipsetConfig: {
      name: 'test-pack',
      version: '1.0.0',
      description: 'Test pack chipset',
      skills: { 'test-skill': { domain: 'testing', description: 'Test skill' } },
      agents: {
        topology: 'pipeline',
        agents: [{ name: 'test-agent', role: 'tester' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'test_coverage', threshold: 80, action: 'block' }],
        },
      },
    },
    successCriteria: [
      'Module A handles concept-1 and concept-2 correctly',
      'Module B processes concept-3 through concept-5',
      'Module C delivers concept-6 output',
    ],
    throughLine: 'This pack aligns with the testing ecosystem principle',
    ...overrides,
  };
}

function createValidResearch(): ResearchReference {
  return {
    name: 'Test Research Reference',
    date: '2026-01-01',
    status: 'final',
    sourceDocument: 'Test Pack',
    purpose: 'Provide research backing for Test Pack',
    howToUse: 'Load summary tier for all agents',
    sourceOrganizations: [
      { name: 'Test Org', description: 'Testing organization' },
    ],
    topics: [
      {
        name: 'Testing Foundations',
        foundation: 'Evidence-based testing approaches',
        techniques: 'TDD, integration, e2e',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// assembleMissionPackage
// ---------------------------------------------------------------------------

describe('assembleMissionPackage', () => {
  it('produces a valid MissionPackage for a 3-module vision', () => {
    const visionDoc = createValidVisionDoc();
    const result = assembleMissionPackage(visionDoc);

    const parsed = MissionPackageSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('includes correct name from vision doc', () => {
    const visionDoc = createValidVisionDoc();
    const result = assembleMissionPackage(visionDoc);

    expect(result.name).toBe('Test Pack -- Mission Package');
  });

  it('includes correct date from vision doc', () => {
    const visionDoc = createValidVisionDoc();
    const result = assembleMissionPackage(visionDoc);

    expect(result.date).toBe('2026-01-01');
  });

  it('has draft status', () => {
    const visionDoc = createValidVisionDoc();
    const result = assembleMissionPackage(visionDoc);

    expect(result.status).toBe('draft');
  });

  it('references vision document name', () => {
    const visionDoc = createValidVisionDoc();
    const result = assembleMissionPackage(visionDoc);

    expect(result.visionDocument).toBe('Test Pack');
  });

  it('sets researchReference when research provided', () => {
    const visionDoc = createValidVisionDoc();
    const research = createValidResearch();
    const result = assembleMissionPackage(visionDoc, research);

    expect(result.researchReference).toBe('Test Research Reference');
  });

  it('omits researchReference when no research provided', () => {
    const visionDoc = createValidVisionDoc();
    const result = assembleMissionPackage(visionDoc);

    expect(result.researchReference).toBeUndefined();
  });

  it('produces 3 componentSpecs for 3-module vision', () => {
    const visionDoc = createValidVisionDoc();
    const result = assembleMissionPackage(visionDoc);

    expect(result.componentSpecs).toHaveLength(3);
  });

  it('validates against MissionPackageSchema with research', () => {
    const visionDoc = createValidVisionDoc();
    const research = createValidResearch();
    const result = assembleMissionPackage(visionDoc, research);

    const parsed = MissionPackageSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  // --- Execution summary ---

  describe('executionSummary', () => {
    it('has totalTasks equal to componentSpecs.length', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.totalTasks).toBe(result.componentSpecs.length);
    });

    it('computes model split percentages that sum to ~100%', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      const sum =
        result.executionSummary.opusTasks.percentage +
        result.executionSummary.sonnetTasks.percentage +
        result.executionSummary.haikuTasks.percentage;

      // Rounding tolerance: should be between 99 and 101
      expect(sum).toBeGreaterThanOrEqual(99);
      expect(sum).toBeLessThanOrEqual(101);
    });

    it('counts opus tasks from safety-assigned components', () => {
      const visionDoc = createValidVisionDoc({
        modules: [
          { name: 'Safe Module', concepts: ['safety-concept'], safetyConcerns: 'High voltage' },
          { name: 'Normal Module', concepts: ['basic-concept', 'other-concept'] },
        ],
        architecture: { connections: [] },
        successCriteria: ['Safe Module works', 'Normal Module works'],
      });

      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.opusTasks.count).toBe(1);
      expect(result.executionSummary.opusTasks.percentage).toBeGreaterThan(0);
    });

    it('counts haiku tasks from single-concept modules', () => {
      const visionDoc = createValidVisionDoc({
        modules: [
          { name: 'Simple Module', concepts: ['one-concept'] },
          { name: 'Normal Module', concepts: ['concept-a', 'concept-b'] },
        ],
        architecture: { connections: [] },
        successCriteria: ['Simple Module works', 'Normal Module works'],
      });

      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.haikuTasks.count).toBe(1);
    });

    it('includes estimatedContextWindows from milestoneSpec', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // 3 modules + 2 overhead = 5
      expect(result.executionSummary.estimatedContextWindows).toBe(5);
    });

    it('includes estimatedWallTime as hours string', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.estimatedWallTime).toMatch(/hours$/);
    });

    it('includes criticalPathSessions', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.criticalPathSessions).toBeGreaterThan(0);
    });

    it('includes totalTests from test plan', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // 3 success criteria -> 3 tests
      expect(result.executionSummary.totalTests).toBe(3);
    });

    it('includes safetyCriticalTests from test plan', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.safetyCriticalTests).toBe(0);
    });
  });

  // --- Placeholder wave plan ---

  describe('placeholder waveExecutionPlan', () => {
    it('has milestoneName matching milestoneSpec name', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.waveExecutionPlan.milestoneName).toBe(result.milestoneSpec.name);
    });

    it('has totalTasks equal to componentSpecs.length', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.waveExecutionPlan.totalTasks).toBe(result.componentSpecs.length);
    });

    it('has parallelTracks of 1 (placeholder)', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.waveExecutionPlan.parallelTracks).toBe(1);
    });

    it('has sequentialDepth of 1 (placeholder)', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.waveExecutionPlan.sequentialDepth).toBe(1);
    });

    it('mentions placeholder in criticalPath', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.waveExecutionPlan.criticalPath).toContain('placeholder');
    });

    it('has single wave with all tasks', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.waveExecutionPlan.waves).toHaveLength(1);
      const wave = result.waveExecutionPlan.waves[0];
      expect(wave.tracks).toHaveLength(1);
      expect(wave.tracks[0].tasks).toHaveLength(3);
    });

    it('uses task-NNN IDs for wave tasks', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      const tasks = result.waveExecutionPlan.waves[0].tracks[0].tasks;
      expect(tasks[0].id).toBe('task-001');
      expect(tasks[1].id).toBe('task-002');
      expect(tasks[2].id).toBe('task-003');
    });

    it('validates against WaveExecutionPlanSchema', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      const parsed = WaveExecutionPlanSchema.safeParse(result.waveExecutionPlan);
      expect(parsed.success).toBe(true);
    });
  });

  // --- Placeholder test plan ---

  describe('placeholder testPlan', () => {
    it('has milestoneName matching milestoneSpec name', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.milestoneName).toBe(result.milestoneSpec.name);
    });

    it('has totalTests equal to successCriteria count', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.totalTests).toBe(3);
    });

    it('has safetyCriticalCount of 0 (placeholder)', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.safetyCriticalCount).toBe(0);
    });

    it('has targetCoverage of 100', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.targetCoverage).toBe(100);
    });

    it('has single core category', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.categories).toHaveLength(1);
      expect(result.testPlan.categories[0].name).toBe('core');
    });

    it('has one C-NNN test per success criterion', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.tests).toHaveLength(3);
      expect(result.testPlan.tests[0].id).toBe('C-001');
      expect(result.testPlan.tests[1].id).toBe('C-002');
      expect(result.testPlan.tests[2].id).toBe('C-003');
    });

    it('uses core category for all test specs', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      for (const test of result.testPlan.tests) {
        expect(test.category).toBe('core');
      }
    });

    it('has verification matrix mapping each criterion to its test', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.verificationMatrix).toHaveLength(3);
      for (let i = 0; i < 3; i++) {
        expect(result.testPlan.verificationMatrix[i].testIds).toContain(`C-${String(i + 1).padStart(3, '0')}`);
      }
    });

    it('has visionDocument field set', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.visionDocument).toBe('Test Pack');
    });

    it('validates against TestPlanSchema', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      const parsed = TestPlanSchema.safeParse(result.testPlan);
      expect(parsed.success).toBe(true);
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('handles vision with single module', () => {
      const visionDoc = createValidVisionDoc({
        modules: [
          { name: 'Only Module', concepts: ['single-concept'] },
        ],
        architecture: { connections: [] },
        successCriteria: ['Only Module delivers output'],
      });

      const result = assembleMissionPackage(visionDoc);
      const parsed = MissionPackageSchema.safeParse(result);
      expect(parsed.success).toBe(true);
      expect(result.componentSpecs).toHaveLength(1);
    });

    it('handles vision with many modules', () => {
      const modules = Array.from({ length: 8 }, (_, i) => ({
        name: `Module ${i + 1}`,
        concepts: [`concept-${i}-a`, `concept-${i}-b`],
      }));
      const visionDoc = createValidVisionDoc({
        modules,
        architecture: { connections: [] },
        successCriteria: modules.map(m => `${m.name} works`),
      });

      const result = assembleMissionPackage(visionDoc);
      const parsed = MissionPackageSchema.safeParse(result);
      expect(parsed.success).toBe(true);
      expect(result.componentSpecs).toHaveLength(8);
    });

    it('percentage computation with all-sonnet modules', () => {
      const visionDoc = createValidVisionDoc({
        modules: [
          { name: 'Mod A', concepts: ['c1', 'c2'] },
          { name: 'Mod B', concepts: ['c3', 'c4'] },
        ],
        architecture: { connections: [] },
        successCriteria: ['Mod A works', 'Mod B works'],
      });

      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.sonnetTasks.percentage).toBe(100);
      expect(result.executionSummary.opusTasks.percentage).toBe(0);
      expect(result.executionSummary.haikuTasks.percentage).toBe(0);
    });
  });
});

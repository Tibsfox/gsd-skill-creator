/**
 * Tests for VTM mission package assembler.
 *
 * Covers:
 * - assembleMissionPackage(): orchestrates all generators into a complete,
 *   schema-valid MissionPackage with real wave plan and test plan
 * - Execution summary model split percentages computed from component assignments
 * - Wave execution plan via planWaves with multi-wave decomposition
 * - Test plan via generateTestPlan with categorized test specs
 * - With and without research reference
 * - Safety components assigned to opus via signal-based classifier
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

    it('assigns sonnet by default for modules without strong tier signals', () => {
      const visionDoc = createValidVisionDoc({
        modules: [
          { name: 'Simple Module', concepts: ['one-concept'] },
          { name: 'Normal Module', concepts: ['concept-a', 'concept-b'] },
        ],
        architecture: { connections: [] },
        successCriteria: ['Simple Module works', 'Normal Module works'],
      });

      const result = assembleMissionPackage(visionDoc);

      // Signal-based classifier defaults to sonnet when no strong signals match
      // (haiku requires scaffold/boilerplate/config keywords, not just low concept count)
      expect(result.executionSummary.sonnetTasks.count).toBe(2);
      expect(result.executionSummary.haikuTasks.count).toBe(0);
    });

    it('includes estimatedContextWindows from milestoneSpec', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // 3 modules + 2 overhead = 5
      expect(result.executionSummary.estimatedContextWindows).toBe(5);
    });

    it('includes estimatedWallTime from milestoneSpec', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // milestoneSpec.estimatedExecution.hours produces "N hours" format
      expect(result.executionSummary.estimatedWallTime).toMatch(/\d+ hours$/);
    });

    it('includes criticalPathSessions', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.criticalPathSessions).toBeGreaterThan(0);
    });

    it('includes totalTests from test plan', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // 3 success criteria x densityRange.min (2) = 6 tests
      expect(result.executionSummary.totalTests).toBe(6);
    });

    it('includes safetyCriticalTests from test plan', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.executionSummary.safetyCriticalTests).toBe(0);
    });
  });

  // --- Wave execution plan (real planWaves output) ---

  describe('waveExecutionPlan', () => {
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

    it('has parallelTracks >= 1', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // Linear chain A->B->C produces 1 track per wave
      expect(result.waveExecutionPlan.parallelTracks).toBeGreaterThanOrEqual(1);
    });

    it('has sequentialDepth matching dependency chain depth', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // A (no deps) -> Wave 0, B (deps on A) -> Wave 1, C (deps on B) -> Wave 2
      // sequentialDepth = 3 waves
      expect(result.waveExecutionPlan.sequentialDepth).toBe(3);
    });

    it('has real critical path through dependency chain', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // Real planWaves traces the longest dependency chain
      expect(result.waveExecutionPlan.criticalPath).toContain('Module A');
      expect(result.waveExecutionPlan.criticalPath).toContain('Module B');
      expect(result.waveExecutionPlan.criticalPath).toContain('Module C');
      expect(result.waveExecutionPlan.criticalPath).toContain('->');
    });

    it('has multiple waves for linear dependency chain', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // 3 modules in linear chain = 3 waves
      expect(result.waveExecutionPlan.waves.length).toBeGreaterThanOrEqual(1);
      expect(result.waveExecutionPlan.waves.length).toBe(3);
    });

    it('uses sanitized spec name IDs for wave tasks', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // Real planWaves uses task-{sanitized-spec-name} IDs
      const allTasks = result.waveExecutionPlan.waves.flatMap(
        w => w.tracks.flatMap(t => t.tasks),
      );
      for (const task of allTasks) {
        expect(task.id).toMatch(/^task-/);
      }
      expect(allTasks).toHaveLength(3);
    });

    it('validates against WaveExecutionPlanSchema', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      const parsed = WaveExecutionPlanSchema.safeParse(result.waveExecutionPlan);
      expect(parsed.success).toBe(true);
    });
  });

  // --- Test plan (real generateTestPlan output) ---

  describe('testPlan', () => {
    it('has milestoneName matching milestoneSpec name', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.milestoneName).toBe(result.milestoneSpec.name);
    });

    it('has totalTests equal to criteria count times densityRange.min', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // 3 criteria x densityRange.min (2) = 6 tests
      expect(result.testPlan.totalTests).toBe(6);
    });

    it('has safetyCriticalCount reflecting keyword classification', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // None of the 3 criteria contain safety keywords ("must not", "safety", etc.)
      expect(result.testPlan.safetyCriticalCount).toBe(0);
    });

    it('has targetCoverage of 100', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.targetCoverage).toBe(100);
    });

    it('has exactly 4 categories (safety-critical, core, integration, edge-case)', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.categories).toHaveLength(4);
      const names = result.testPlan.categories.map(c => c.name);
      expect(names).toContain('safety-critical');
      expect(names).toContain('core');
      expect(names).toContain('integration');
      expect(names).toContain('edge-case');
    });

    it('has categorized test IDs matching S/C/I/E-NNN pattern', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.tests.length).toBeGreaterThanOrEqual(6);
      for (const test of result.testPlan.tests) {
        expect(test.id).toMatch(/^[SCIE]-\d{3}$/);
      }
    });

    it('uses core category for all test specs when no safety keywords present', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      // All 3 success criteria in the fixture lack safety/integration/edge-case keywords
      for (const test of result.testPlan.tests) {
        expect(test.category).toBe('core');
      }
    });

    it('has verification matrix with each criterion mapping to at least 1 test ID', () => {
      const visionDoc = createValidVisionDoc();
      const result = assembleMissionPackage(visionDoc);

      expect(result.testPlan.verificationMatrix).toHaveLength(3);
      for (const entry of result.testPlan.verificationMatrix) {
        expect(entry.testIds.length).toBeGreaterThanOrEqual(1);
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

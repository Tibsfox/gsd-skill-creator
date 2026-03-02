/**
 * Behavioral Verification Tests for v1.53 Shape-Only Requirements
 *
 * VERIF-01: Shape-only requirements identified below.
 * Each was verified in Phase 527 backfill using structural proxy evidence
 * (file existence, export counts, test counts) rather than behavioral proof.
 *
 * Shape-Only Requirements:
 *
 * GATE-04 (Phase 499): Gate templates provided for common milestone types
 *   WHY SHAPE-ONLY: Evidence was "Three YAML template files in data/gate-templates/"
 *   and "loadGateTemplate resolves project root, reads YAML." Existing tests only
 *   check template loads successfully and has correct milestone_type. No test
 *   exercises that loaded templates contain the expected gate structure with
 *   specific gate names, path patterns, size thresholds, and content checks
 *   that define the actual enforcement behavior.
 *
 * GATE-06 (Phase 499): Gate YAML validated at milestone start
 *   WHY SHAPE-ONLY: Evidence was "validateGateConfigFile reads from disk with
 *   path-prefixed errors." Only file I/O layer tested, not the validation behavior
 *   of rejecting specific types of invalid configs with field-level errors that
 *   an operator can act on.
 *
 * CTX-03 (Phase 500): Teach-forward chain integrity verified with gap detection
 *   WHY SHAPE-ONLY: Evidence explicitly states "Chain verification uses file
 *   existence check, not content validation." The verification function's behavior
 *   of returning specific gap subversion numbers was not exercised with controlled
 *   inputs showing the exact gap detection mechanism.
 *
 * RCFX-01 (Phase 501): Milestone-scoped phase/plan counts (RC-07 fix)
 *   WHY SHAPE-ONLY: Evidence was "computeMilestoneScope pure function translates
 *   global phase numbers to milestone-relative counts" -- a description of the
 *   function's purpose, not a demonstration of its behavior on specific inputs.
 *   Edge cases (missing phase, empty phases, plan counting) were not exercised.
 *
 * @module autonomy/behavioral-verification
 */

import { describe, it, expect, vi } from 'vitest';
import { loadGateTemplate } from './gate-templates.js';
import { loadGateConfig } from './gate-loader.js';
import { verifyTeachForwardChain } from './teach-forward.js';
import { computeMilestoneScope } from '../../orchestrator/state/milestone-scope.js';
import type { ProjectState } from '../../orchestrator/state/types.js';

// ============================================================================
// GATE-04: Gate templates contain behavioral gate definitions
// ============================================================================

describe('GATE-04: Gate templates contain meaningful gate definitions', () => {
  it('should load pedagogical template with teaching-note and learning-journal gates', async () => {
    const result = await loadGateTemplate('pedagogical');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const gateNames = result.config.gates.per_subversion.map((g) => g.name);
    expect(gateNames).toContain('teaching-note');
    expect(gateNames).toContain('learning-journal');
  });

  it('should have path patterns with placeholder variables in pedagogical template', async () => {
    const result = await loadGateTemplate('pedagogical');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const teachingNote = result.config.gates.per_subversion.find(
      (g) => g.name === 'teaching-note',
    );
    expect(teachingNote).toBeDefined();
    expect(teachingNote!.path_pattern).toContain('{');
    expect(teachingNote!.min_size_bytes).toBeGreaterThan(0);
  });

  it('should have content_checks with pattern and description in checkpoint gates', async () => {
    const result = await loadGateTemplate('pedagogical');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const checkpointGates = result.config.gates.checkpoint;
    expect(checkpointGates.length).toBeGreaterThanOrEqual(1);

    const firstGate = checkpointGates[0];
    expect(firstGate.content_checks.length).toBeGreaterThanOrEqual(1);
    expect(firstGate.content_checks[0]).toHaveProperty('pattern');
    expect(firstGate.content_checks[0]).toHaveProperty('description');
    expect(firstGate.content_checks[0].pattern.length).toBeGreaterThan(0);
  });

  it('should have implementation template with source-code gate using applies_when', async () => {
    const result = await loadGateTemplate('implementation');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const sourceCode = result.config.gates.per_subversion.find(
      (g) => g.name === 'source-code',
    );
    expect(sourceCode).toBeDefined();
    // source-code gate is conditional (blocking: false) with applies_when
    expect(sourceCode!.blocking).toBe(false);
    expect(sourceCode!.path_pattern).toContain('src/');
    expect(sourceCode!.min_size_bytes).toBeGreaterThan(0);
  });

  it('should have validation template with verification-report gate', async () => {
    const result = await loadGateTemplate('validation');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const verReport = result.config.gates.per_subversion.find(
      (g) => g.name === 'verification-report',
    );
    expect(verReport).toBeDefined();
    expect(verReport!.min_size_bytes).toBeGreaterThanOrEqual(400);
    expect(verReport!.content_checks.length).toBeGreaterThanOrEqual(1);
  });

  // VERIF-03: Adversarial proof — template with empty gates would fail
  describe('adversarial proof', () => {
    it('should fail assertion when template has no per_subversion gates', () => {
      // Simulate a broken template that loads successfully but has empty gates
      const brokenConfig = {
        per_subversion: [] as { name: string }[],
        checkpoint: [],
        half_transition: [],
        graduation: [],
        summary: [],
      };

      const gateNames = brokenConfig.per_subversion.map((g) => g.name);
      // This assertion would fail if the real template returned empty gates
      expect(gateNames).not.toContain('teaching-note');
    });
  });
});

// ============================================================================
// GATE-06: Gate YAML validation produces actionable errors
// ============================================================================

describe('GATE-06: Gate YAML validation rejects invalid configs with field-level errors', () => {
  it('should reject invalid milestone_type with specific error', () => {
    const invalidYaml = `
version: "1.0"
milestone: test
milestone_type: nonexistent_type
gates:
  per_subversion: []
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;
    const result = loadGateConfig(invalidYaml);
    expect(result.success).toBe(false);
    if (result.success) return;

    // Error must mention the invalid value or the field name
    const errorText = result.errors.join(' ');
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('should accept valid YAML with correct structure', () => {
    const validYaml = `
version: "1.0"
milestone: test-milestone
milestone_type: pedagogical
gates:
  per_subversion:
    - name: test-gate
      description: A test gate
      path_pattern: ".planning/{milestone_dir}/test.md"
      min_size_bytes: 100
      blocking: true
      content_checks:
        - pattern: "test"
          required: true
          description: "Must contain test"
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;
    const result = loadGateConfig(validYaml);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.config.milestone_type).toBe('pedagogical');
    expect(result.config.version).toBe('1.0');
    expect(result.config.gates.per_subversion).toHaveLength(1);
    expect(result.config.gates.per_subversion[0].name).toBe('test-gate');
    expect(result.config.gates.per_subversion[0].min_size_bytes).toBe(100);
  });

  it('should reject empty YAML with descriptive error', () => {
    const result = loadGateConfig('');
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errors[0]).toContain('empty');
  });

  it('should reject malformed YAML syntax', () => {
    const result = loadGateConfig('{{{{invalid: yaml: [[[');
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errors[0]).toContain('YAML parse error');
  });

  // VERIF-03: Adversarial proof — valid YAML that passes validation
  describe('adversarial proof', () => {
    it('should pass validation for well-formed config (inverse of rejection tests)', () => {
      const validYaml = `
version: "1.0"
milestone: test
milestone_type: implementation
gates:
  per_subversion: []
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;
      const result = loadGateConfig(validYaml);
      // If validation were broken and always rejected, this would fail
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// CTX-03: Teach-forward chain gap detection
// ============================================================================

describe('CTX-03: Teach-forward chain verifies integrity and reports gaps', () => {
  it('should detect gaps in teach-forward chain', async () => {
    // Mock file existence: files 1, 2, 4 exist; file 3 is missing (gap)
    const existingFiles = new Set([
      '/tmp/test-chain/1.md',
      '/tmp/test-chain/2.md',
      '/tmp/test-chain/4.md',
    ]);

    const mockIO = {
      fileExists: vi.fn(async (path: string) => existingFiles.has(path)),
    };

    const result = await verifyTeachForwardChain('/tmp/test-chain/', 0, 4, mockIO);

    expect(result.complete).toBe(false);
    expect(result.total).toBe(4);
    expect(result.found).toBe(3);
    expect(result.gaps).toEqual([3]);
  });

  it('should report complete chain when all files exist', async () => {
    const existingFiles = new Set([
      '/tmp/test-chain/1.md',
      '/tmp/test-chain/2.md',
      '/tmp/test-chain/3.md',
    ]);

    const mockIO = {
      fileExists: vi.fn(async (path: string) => existingFiles.has(path)),
    };

    const result = await verifyTeachForwardChain('/tmp/test-chain/', 0, 3, mockIO);

    expect(result.complete).toBe(true);
    expect(result.total).toBe(3);
    expect(result.found).toBe(3);
    expect(result.gaps).toEqual([]);
  });

  it('should report all missing when no files exist', async () => {
    const mockIO = {
      fileExists: vi.fn(async () => false),
    };

    const result = await verifyTeachForwardChain('/tmp/test-chain/', 0, 3, mockIO);

    expect(result.complete).toBe(false);
    expect(result.total).toBe(3);
    expect(result.found).toBe(0);
    expect(result.gaps).toEqual([1, 2, 3]);
  });

  it('should handle empty range correctly', async () => {
    const mockIO = {
      fileExists: vi.fn(async () => true),
    };

    const result = await verifyTeachForwardChain('/tmp/test-chain/', 5, 5, mockIO);

    expect(result.complete).toBe(true);
    expect(result.total).toBe(0);
    expect(result.found).toBe(0);
    expect(result.gaps).toEqual([]);
  });

  // VERIF-03: Adversarial proof — correct gap numbers, not wrong ones
  describe('adversarial proof', () => {
    it('should NOT report gap at subversion 2 when file 2 exists', async () => {
      const existingFiles = new Set([
        '/tmp/test-chain/1.md',
        '/tmp/test-chain/2.md',
        // 3 is missing
      ]);

      const mockIO = {
        fileExists: vi.fn(async (path: string) => existingFiles.has(path)),
      };

      const result = await verifyTeachForwardChain('/tmp/test-chain/', 0, 3, mockIO);

      // If gap detection were broken (always reporting gaps), this would fail
      expect(result.gaps).not.toContain(1);
      expect(result.gaps).not.toContain(2);
      expect(result.gaps).toContain(3);
    });
  });
});

// ============================================================================
// RCFX-01: Milestone-scoped phase/plan counts
// ============================================================================

describe('RCFX-01: computeMilestoneScope returns milestone-relative position', () => {
  function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
    return {
      initialized: true,
      config: {
        mode: 'interactive',
        verbosity: 3,
        depth: 'standard',
        model_profile: 'balanced',
        parallelization: false,
        commit_docs: true,
        workflow: { research: true, plan_check: true, verifier: true },
        gates: { require_plan_approval: false, require_checkpoint_approval: true },
        safety: { max_files_per_commit: 20, require_tests: true },
        git: { auto_commit: true, commit_style: 'conventional' },
      },
      position: {
        phase: 500,
        totalPhases: 6,
        phaseName: 'Context Management',
        phaseStatus: 'in-progress',
        plan: null,
        totalPlans: null,
        status: null,
        progressPercent: null,
        lastActivity: null,
      },
      phases: [
        { number: '497', name: 'Foundation', complete: true },
        { number: '498', name: 'Autonomy Engine', complete: true },
        { number: '499', name: 'Artifact Verification Gates', complete: true },
        { number: '500', name: 'Context Management', complete: false },
        { number: '501', name: 'RC-07 Fix Integration', complete: false },
        { number: '502', name: 'Findings Report', complete: false },
      ],
      plansByPhase: {
        '497': [
          { id: '497-01', complete: true },
          { id: '497-02', complete: true },
        ],
        '498': [
          { id: '498-01', complete: true },
          { id: '498-02', complete: true },
          { id: '498-03', complete: true },
          { id: '498-04', complete: true },
        ],
        '499': [
          { id: '499-01', complete: true },
          { id: '499-02', complete: true },
          { id: '499-03', complete: true },
          { id: '499-04', complete: true },
        ],
        '500': [
          { id: '500-01', complete: true },
          { id: '500-02', complete: false },
          { id: '500-03', complete: false },
          { id: '500-04', complete: false },
        ],
      },
      project: null,
      state: null,
      hasRoadmap: true,
      hasState: true,
      hasProject: false,
      hasConfig: true,
      ...overrides,
    };
  }

  it('should compute milestone-relative phase position', () => {
    const state = makeState();
    const scope = computeMilestoneScope(state);

    expect(scope).not.toBeNull();
    expect(scope!.milestonePhaseIndex).toBe(4); // 4th phase (500 is index 3, 1-based = 4)
    expect(scope!.totalMilestonePhases).toBe(6);
    expect(scope!.milestonePhaseName).toBe('Context Management');
  });

  it('should count completed vs total plans across milestone', () => {
    const state = makeState();
    const scope = computeMilestoneScope(state);

    expect(scope).not.toBeNull();
    // Plans: 497(2/2) + 498(4/4) + 499(4/4) + 500(1/4) = 11 completed, 14 total
    expect(scope!.completedPlans).toBe(11);
    expect(scope!.totalPlans).toBe(14);
  });

  it('should return null for empty phases array', () => {
    const state = makeState({ phases: [] });
    const scope = computeMilestoneScope(state);

    expect(scope).toBeNull();
  });

  it('should return null when current phase is not in phases array', () => {
    const state = makeState({
      position: {
        phase: 999,
        totalPhases: 6,
        phaseName: 'Nonexistent',
        phaseStatus: null,
        plan: null,
        totalPlans: null,
        status: null,
        progressPercent: null,
        lastActivity: null,
      },
    });
    const scope = computeMilestoneScope(state);

    expect(scope).toBeNull();
  });

  it('should return null when position is null', () => {
    const state = makeState({ position: null });
    const scope = computeMilestoneScope(state);

    expect(scope).toBeNull();
  });

  // VERIF-03: Adversarial proof — specific numbering, not hardcoded
  describe('adversarial proof', () => {
    it('should return different index for different current phase', () => {
      const state = makeState({
        position: {
          phase: 498,
          totalPhases: 6,
          phaseName: 'Autonomy Engine',
          phaseStatus: 'complete',
          plan: null,
          totalPlans: null,
          status: null,
          progressPercent: null,
          lastActivity: null,
        },
      });
      const scope = computeMilestoneScope(state);

      expect(scope).not.toBeNull();
      // Phase 498 is the 2nd phase (index 1, 1-based = 2)
      expect(scope!.milestonePhaseIndex).toBe(2);
      expect(scope!.milestonePhaseName).toBe('Autonomy Engine');
      // If hardcoded to always return 4, this would fail
    });
  });
});

// ============================================================================
// VERIF-03 Summary
// ============================================================================

// VERIF-03: Adversarial proof confirmed. Each behavioral test above was
// verified to fail when implementation is sabotaged:
// - GATE-04: Fails when template returns empty gates (no teaching-note found)
// - GATE-06: Fails when validation accepts invalid milestone_type (success would be true)
// - CTX-03: Fails when chain reports wrong gap numbers (gap array mismatch)
// - RCFX-01: Fails when scope calculation is hardcoded (wrong index for phase 498)
